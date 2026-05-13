from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Project, User, Requirement, Validacao
from app.schemas import ProjectCreateSchema, ProjectUpdateSchema, ProjectSchema
from app.utils.decorators import validate_json, role_required
from app import db
import io
import os

projects_bp = Blueprint('projects', __name__, url_prefix='/api/projects')


@projects_bp.route('', methods=['POST'])
@jwt_required()
@validate_json(ProjectCreateSchema)
def create_project():
    data = request.validated_data
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas ou gestores podem criar projetos'}, 403

    if data.get('custo_estimado') is not None:
        data['custo_estimado'] = float(data['custo_estimado'])

    project = Project(
        nome=data['nome'],
        descricao=data.get('descricao'),
        status=data.get('status', 'planejamento'),
        custo_estimado=data.get('custo_estimado'),
        gestor_id=user_id,
        nome_cliente=data.get('nome_cliente')
    )
    db.session.add(project)
    db.session.commit()

    return {'message': 'Projeto criado com sucesso', 'project': project.to_dict()}, 201


@projects_bp.route('', methods=['GET'])
@jwt_required()
def list_projects():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status_filter = request.args.get('status')
    search = request.args.get('search')

    # Only show active projects (RN004)
    query = Project.query.filter_by(ativo=True)

    if status_filter:
        query = query.filter_by(status=status_filter)

    if search:
        query = query.filter(
            db.or_(
                Project.nome.ilike(f'%{search}%'),
                Project.nome_cliente.ilike(f'%{search}%')
            )
        )

    query = query.order_by(Project.criado_em.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    projects = pagination.items

    return {
        'projetos': [p.to_dict() for p in projects],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages
    }


@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    include_requirements = request.args.get('include_requirements', 'false').lower() == 'true'
    project = Project.query.filter_by(id=project_id, ativo=True).first()

    if not project:
        return {'message': 'Projeto não encontrado'}, 404

    return {'project': project.to_dict(include_requisitos=include_requirements)}


@projects_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
@validate_json(ProjectUpdateSchema)
def update_project(project_id):
    data = request.validated_data
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas ou gestores podem editar projetos'}, 403

    project = Project.query.filter_by(id=project_id, ativo=True).first()

    if not project:
        return {'message': 'Projeto não encontrado'}, 404

    # Update fields
    for field in ['nome', 'descricao', 'status', 'custo_estimado', 'nome_cliente']:
        if field in data:
            if field == 'custo_estimado' and data[field] is not None:
                setattr(project, field, float(data[field]))
            else:
                setattr(project, field, data[field])

    db.session.commit()

    return {'message': 'Projeto atualizado com sucesso', 'project': project.to_dict()}


@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas ou gestores podem excluir projetos'}, 403

    project = Project.query.filter_by(id=project_id, ativo=True).first()

    if not project:
        return {'message': 'Projeto não encontrado'}, 404

    # RN004: Logical deletion instead of physical deletion
    project.ativo = False

    # Also logically delete all requirements in this project
    Requirement.query.filter_by(projeto_id=project_id, ativo=True).update({'ativo': False})

    db.session.commit()

    return {'message': 'Projeto removido com sucesso'}


@projects_bp.route('/<int:project_id>/ers/download', methods=['POST'])
@jwt_required()
def download_ers(project_id):
    format_type = request.args.get('format', 'pdf')
    project = Project.query.filter_by(id=project_id, ativo=True).first()

    if not project:
        return {'message': 'Projeto não encontrado'}, 404

    # RN002: Only include approved requirements in ERS
    requisitos = Requirement.query.filter_by(
        projeto_id=project_id,
        status='aprovado',
        ativo=True
    ).order_by(Requirement.codigo, Requirement.criado_em).all()

    if not requisitos:
        return {'message': 'Nenhum requisito aprovado encontrado para gerar a ERS'}, 404

    if format_type == 'pdf':
        return _generate_pdf(project, requisitos)
    elif format_type == 'docx':
        return _generate_docx(project, requisitos)
    else:
        return {'message': 'Formato não suportado. Use pdf ou docx.'}, 400


def _generate_pdf(project, requisitos):
    """Generate PDF ERS document"""
    try:
        from weasyprint import HTML
    except ImportError:
        return {'message': 'Geração de PDF não disponível'}, 500

    html_content = _build_ers_html(project, requisitos)
    pdf_buffer = io.BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)

    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'ERS_{project.nome.replace(" ", "_")}.pdf'
    )


def _generate_docx(project, requisitos):
    """Generate DOCX ERS document"""
    try:
        from docx import Document
        from docx.shared import Inches, Pt
        from docx.enum.text import WD_ALIGN_PARAGRAPH
    except ImportError:
        return {'message': 'Geração de DOCX não disponível'}, 500

    doc = Document()

    # Title
    title = doc.add_heading(f'Especificação de Requisitos de Software', level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_heading(f'Projeto: {project.nome}', level=1)

    if project.nome_cliente:
        doc.add_paragraph(f'Cliente: {project.nome_cliente}')

    if project.descricao:
        doc.add_paragraph(f'Descrição: {project.descricao}')

    doc.add_paragraph('')

    # Group requirements by type/category
    categorias = {}
    for req in requisitos:
        cat = req.categoria or req.tipo or 'Geral'
        if cat not in categorias:
            categorias[cat] = []
        categorias[cat].append(req)

    for categoria, reqs in categorias.items():
        doc.add_heading(categoria, level=2)

        table = doc.add_table(rows=1, cols=4)
        table.style = 'Light Grid Accent 1'

        # Table header
        header_cells = table.rows[0].cells
        header_cells[0].text = 'Código'
        header_cells[1].text = 'Título'
        header_cells[2].text = 'Prioridade'
        header_cells[3].text = 'Status'

        for req in reqs:
            row_cells = table.add_row().cells
            row_cells[0].text = req.codigo or ''
            row_cells[1].text = req.titulo
            row_cells[2].text = req.prioridade or ''
            row_cells[3].text = req.status

        doc.add_paragraph('')

        for req in reqs:
            doc.add_heading(f'{req.codigo or ""} - {req.titulo}', level=3)
            if req.descricao:
                doc.add_paragraph(req.descricao)
            doc.add_paragraph(f'Prioridade: {req.prioridade or "N/A"}')
            doc.add_paragraph(f'Tipo: {req.tipo or "N/A"}')
            doc.add_paragraph('')

    docx_buffer = io.BytesIO()
    doc.save(docx_buffer)
    docx_buffer.seek(0)

    return send_file(
        docx_buffer,
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        as_attachment=True,
        download_name=f'ERS_{project.nome.replace(" ", "_")}.docx'
    )


def _build_ers_html(project, requisitos):
    """Build HTML content for PDF ERS"""
    categorias = {}
    for req in requisitos:
        cat = req.categoria or req.tipo or 'Geral'
        if cat not in categorias:
            categorias[cat] = []
        categorias[cat].append(req)

    requisitos_html = ''
    for categoria, reqs in categorias.items():
        requisitos_html += f'<h2>{categoria}</h2>'
        requisitos_html += '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">'
        requisitos_html += '<tr style="background:#2d7a40;color:#fff"><th>Código</th><th>Título</th><th>Descrição</th><th>Prioridade</th></tr>'
        for req in reqs:
            descricao = (req.descricao or '').replace('\n', '<br>')
            requisitos_html += f'<tr><td>{req.codigo or ""}</td><td>{req.titulo}</td><td>{descricao}</td><td>{req.prioridade or ""}</td></tr>'
        requisitos_html += '</table>'

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; color: #333; }}
            h1 {{ color: #1a5c2a; text-align: center; border-bottom: 2px solid #2d7a40; padding-bottom: 10px; }}
            h2 {{ color: #2d7a40; margin-top: 30px; }}
            h3 {{ color: #1a5c2a; }}
            table {{ margin: 10px 0 20px; }}
            th {{ background: #2d7a40; color: white; padding: 8px; }}
            td {{ padding: 8px; border: 1px solid #ddd; }}
            .info {{ margin: 20px 0; }}
        </style>
    </head>
    <body>
        <h1>Especificação de Requisitos de Software</h1>
        <div class="info">
            <h2>Informações do Projeto</h2>
            <p><strong>Projeto:</strong> {project.nome}</p>
            {"<p><strong>Cliente:</strong> " + project.nome_cliente + "</p>" if project.nome_cliente else ""}
            {"<p><strong>Descrição:</strong> " + project.descricao + "</p>" if project.descricao else ""}
        </div>
        <h2>Requisitos Aprovados</h2>
        {requisitos_html}
    </body>
    </html>
    """
    return html
