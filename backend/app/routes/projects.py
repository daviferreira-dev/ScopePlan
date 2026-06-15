from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from app.models import Project, User, Requirement, AuditLog, Validacao
from app.schemas import ProjectCreateSchema, ProjectUpdateSchema
from app.utils.decorators import validate_json
from app.utils.access import check_user_project_access, get_user_project_ids
from app import db
import io

projects_bp = Blueprint('projects', __name__, url_prefix='/api/projetos')


@projects_bp.route('', methods=['POST'])
@jwt_required()
@validate_json(ProjectCreateSchema)
def create_project():
    data = request.validated_data
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuario nao encontrado'}, 404

    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas ou gestores podem criar projetos'}, 403

    if data.get('custo_estimado') is not None:
        data['custo_estimado'] = float(data['custo_estimado'])

    cliente_id = data.get('cliente_id')
    nome_cliente = data.get('nome_cliente')
    if cliente_id:
        cliente = db.session.get(User, cliente_id)
        if cliente and cliente.perfil == 'cliente':
            nome_cliente = cliente.nome
        else:
            return {'message': 'Cliente nao encontrado ou usuario nao e cliente'}, 400

    project = Project(
        nome=data['nome'],
        descricao=data.get('descricao'),
        status=data.get('status', 'planejamento'),
        custo_estimado=data.get('custo_estimado'),
        gestor_id=user_id,
        cliente_id=cliente_id,
        nome_cliente=nome_cliente,
    )

    db.session.add(project)
    db.session.flush()

    AuditLog.log(user_id, 'criacao', 'projeto', project.id, project.id,
                 {'nome': project.nome, 'cliente_id': cliente_id})

    db.session.commit()

    return {'message': 'Projeto criado com sucesso', 'projeto': project.to_dict()}, 201


@projects_bp.route('', methods=['GET'])
@jwt_required()
def list_projects():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuario nao encontrado'}, 404

    page = request.args.get('page', 1, type=int)
    _s = request.args.get('per_page') or request.args.get('size')
    try:
        per_page = min(int(_s), 100) if _s else 20
    except (ValueError, TypeError):
        per_page = 20

    query = Project.query.options(joinedload(Project.gestor), joinedload(Project.cliente)).filter_by(ativo=True)
    user_project_ids = get_user_project_ids(user)
    query = query.filter(Project.id.in_(user_project_ids))

    search = request.args.get('search')
    if search:
        escaped = search.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
        query = query.filter(
            db.or_(
                Project.nome.ilike(f'%{escaped}%', escape='\\'),
                Project.descricao.ilike(f'%{escaped}%', escape='\\')
            )
        )

    pagination = query.order_by(Project.criado_em.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return {
        'projetos': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages
    }


@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuario nao encontrado'}, 404

    project = Project.query.filter_by(id=project_id, ativo=True).first()
    if not project:
        return {'message': 'Projeto nao encontrado'}, 404

    _, access_error = check_user_project_access(user, project_id)
    if access_error:
        return access_error

    return {'project': project.to_dict()}, 200


@projects_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
@validate_json(ProjectUpdateSchema)
def update_project(project_id):
    data = request.validated_data
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuario nao encontrado'}, 404

    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas ou gestores podem editar projetos'}, 403

    project = Project.query.filter_by(id=project_id, ativo=True).first()
    if not project:
        return {'message': 'Projeto nao encontrado'}, 404

    _, access_error = check_user_project_access(user, project_id)
    if access_error:
        return access_error

    if 'cliente_id' in data and data['cliente_id'] is not None:
        cliente = db.session.get(User, data['cliente_id'])
        if cliente and cliente.perfil == 'cliente' and cliente.ativo:
            data['nome_cliente'] = cliente.nome
        else:
            return {'message': 'Cliente nao encontrado ou invalido'}, 400
    elif 'cliente_id' in data and data['cliente_id'] is None:
        data['nome_cliente'] = None

    for field in ['nome', 'descricao', 'status', 'custo_estimado', 'cliente_id', 'nome_cliente']:
        if field in data:
            setattr(project, field, data[field])

    if 'custo_estimado' in data and data['custo_estimado'] is not None:
        project.custo_estimado = float(data['custo_estimado'])

    AuditLog.log(user_id, 'atualizacao', 'projeto', project.id, project.id,
                 {'nome': project.nome})

    db.session.commit()

    return {'message': 'Projeto atualizado com sucesso', 'project': project.to_dict()}, 200


@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuario nao encontrado'}, 404

    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas ou gestores podem excluir projetos'}, 403

    project = Project.query.filter_by(id=project_id, ativo=True).first()
    if not project:
        return {'message': 'Projeto nao encontrado'}, 404

    _, access_error = check_user_project_access(user, project_id)
    if access_error:
        return access_error

    project.ativo = False
    Requirement.query.filter_by(projeto_id=project.id, ativo=True).update({'ativo': False})

    AuditLog.log(user_id, 'exclusao', 'projeto', project.id, project.id,
                 {'nome': project.nome})

    db.session.commit()

    return {'message': 'Projeto removido com sucesso'}, 200


@projects_bp.route('/<int:project_id>/metrics', methods=['GET'])
@jwt_required()
def project_metrics(project_id):
    """RF07: métricas agregadas do projeto para o painel de monitoramento."""
    from collections import Counter
    from datetime import datetime, timezone, timedelta

    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuario nao encontrado'}, 404

    project = Project.query.filter_by(id=project_id, ativo=True).first()
    if not project:
        return {'message': 'Projeto nao encontrado'}, 404

    _, access_error = check_user_project_access(user, project_id)
    if access_error:
        return access_error

    requirements = Requirement.query.filter_by(projeto_id=project_id, ativo=True).all()

    por_status = Counter(r.status for r in requirements)
    por_tipo = Counter(r.tipo or 'indefinido' for r in requirements)
    por_prioridade = Counter(r.prioridade or 'indefinida' for r in requirements)
    por_categoria = Counter(r.categoria for r in requirements if r.categoria)

    total = len(requirements)
    aprovados = por_status.get('aprovado', 0) + por_status.get('aprovado_com_ressalvas', 0)

    # Tempo médio até a aprovação: da criação do requisito à validação que o aprovou.
    req_by_id = {r.id: r for r in requirements}
    ultima_aprovacao = {}
    if req_by_id:
        validacoes = Validacao.query.filter(
            Validacao.requisito_id.in_(list(req_by_id.keys())),
            Validacao.resultado.in_(('aprovado', 'aprovado_com_ressalvas')),
        ).all()
        for v in validacoes:
            if not v.validado_em:
                continue
            atual = ultima_aprovacao.get(v.requisito_id)
            if atual is None or v.validado_em > atual:
                ultima_aprovacao[v.requisito_id] = v.validado_em

    def _naive(dt):
        return dt.replace(tzinfo=None) if dt and dt.tzinfo else dt

    duracoes = []
    for rid, aprovado_em in ultima_aprovacao.items():
        r = req_by_id.get(rid)
        if not r or not r.criado_em:
            continue
        delta = (_naive(aprovado_em) - _naive(r.criado_em)).total_seconds()
        if delta >= 0:
            duracoes.append(delta)

    tempo_medio_aprovacao_horas = round(sum(duracoes) / len(duracoes) / 3600, 1) if duracoes else None

    # Evolução: requisitos criados por semana nas últimas 8 semanas (ISO week)
    hoje = datetime.now(timezone.utc).date()
    inicio_semana_atual = hoje - timedelta(days=hoje.weekday())
    semanas = [inicio_semana_atual - timedelta(weeks=i) for i in range(7, -1, -1)]
    evolucao = []
    for ini in semanas:
        fim = ini + timedelta(days=7)
        qtd = sum(
            1 for r in requirements
            if r.criado_em and ini <= r.criado_em.date() < fim
        )
        evolucao.append({'semana': ini.isoformat(), 'total': qtd})

    return {
        'total': total,
        'aprovados': aprovados,
        'taxa_aprovacao': round(aprovados / total * 100, 1) if total else 0,
        'por_status': dict(por_status),
        'por_tipo': dict(por_tipo),
        'por_prioridade': dict(por_prioridade),
        'por_categoria': dict(por_categoria.most_common(8)),
        'evolucao_semanal': evolucao,
        'tempo_medio_aprovacao_horas': tempo_medio_aprovacao_horas,
        'aprovacao_amostras': len(duracoes),
    }, 200


@projects_bp.route('/<int:project_id>/membros', methods=['GET'])
@jwt_required()
def list_membros(project_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuario nao encontrado'}, 404

    project = Project.query.filter_by(id=project_id, ativo=True).first()
    if not project:
        return {'message': 'Projeto nao encontrado'}, 404

    _, access_error = check_user_project_access(user, project_id)
    if access_error:
        return access_error

    from app.models.membro_projeto import MembroProjeto

    membros = []

    # Gestor (criador do projeto)
    if project.gestor:
        membros.append({
            'id': project.gestor.id,
            'nome': project.gestor.nome,
            'email': project.gestor.email,
            'perfil': project.gestor.perfil,
            'origem': 'gestor',
        })

    # Cliente vinculado
    if project.cliente:
        membros.append({
            'id': project.cliente.id,
            'nome': project.cliente.nome,
            'email': project.cliente.email,
            'perfil': 'cliente',
            'origem': 'cliente',
        })

    # Membros adicionados via convite (analistas, devs, gestores extras)
    ids_ja_incluidos = {m['id'] for m in membros}
    registros = MembroProjeto.query.filter_by(projeto_id=project_id).all()
    for r in registros:
        if r.usuario_id not in ids_ja_incluidos:
            u = r.usuario
            if u and u.ativo:
                membros.append({
                    'id': u.id,
                    'nome': u.nome,
                    'email': u.email,
                    'perfil': u.perfil,
                    'origem': 'convite',
                })
                ids_ja_incluidos.add(u.id)

    return {'membros': membros}, 200


@projects_bp.route('/<int:project_id>/ers.<string:formato>', methods=['POST'])
@jwt_required()
def download_ers(project_id, formato):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuario nao encontrado'}, 404

    project = Project.query.filter_by(id=project_id, ativo=True).first()
    if not project:
        return {'message': 'Projeto nao encontrado'}, 404

    _, access_error = check_user_project_access(user, project_id)
    if access_error:
        return access_error

    body = request.get_json(silent=True) or {}
    topic_ids = body.get('topic_ids') or body.get('topicIds') or []
    requirement_ids = body.get('requirement_ids') or body.get('requirementIds') or []
    incluir_nao_aprovados = bool(body.get('incluir_nao_aprovados') or body.get('includeNaoAprovados'))
    incluir_diagramas = bool(body.get('incluir_diagramas', True))
    # formato comes from the URL path (ers.pdf / ers.docx)

    query = Requirement.query.filter_by(projeto_id=project_id, ativo=True)

    if topic_ids:
        query = query.filter(Requirement.tipo.in_(topic_ids))
    elif requirement_ids:
        query = query.filter(Requirement.id.in_(requirement_ids))

    # RN002: a ERS só inclui requisitos aprovados, salvo confirmação explícita (RF05-A2)
    if not incluir_nao_aprovados:
        query = query.filter(Requirement.status.in_(('aprovado', 'aprovado_com_ressalvas')))

    requirements = query.order_by(Requirement.tipo, Requirement.codigo).all()

    if not requirements:
        message = (
            'Nenhum requisito encontrado para os filtros selecionados'
            if incluir_nao_aprovados
            else 'Nenhum requisito aprovado encontrado. Aprove requisitos ou '
                 'inclua não-aprovados explicitamente para exportar.'
        )
        return {'message': message}, 404

    # Fetch diagrams if requested
    diagramas_data = None
    if incluir_diagramas:
        from app.models.diagrama import Diagrama
        diagramas_objs = Diagrama.query.filter_by(projeto_id=project_id).order_by(Diagrama.criado_em).all()
        if diagramas_objs:
            diagramas_data = [{'nome': d.nome, 'dados': d.dados, 'tipo_mime': d.tipo_mime} for d in diagramas_objs]

    # Fetch custom blocks to build label map
    from app.models.bloco_personalizado import BlocoPersonalizado
    blocos = BlocoPersonalizado.query.filter_by(projeto_id=project_id).all()
    custom_labels = {b.tipo_chave: b.nome for b in blocos}

    if formato == 'pdf':
        from app.utils.ers_generator import generate_ers_pdf
        _filename, content = generate_ers_pdf(
            project.to_dict(), [r.to_dict(include_validacoes=True) for r in requirements],
            diagramas=diagramas_data, custom_labels=custom_labels)
        mimetype = 'application/pdf'
        filename = f'ERS_{project.nome.replace(" ", "_")}.pdf'
    else:
        from app.utils.ers_generator import generate_ers_docx
        _filename, content = generate_ers_docx(
            project.to_dict(), [r.to_dict(include_validacoes=True) for r in requirements],
            diagramas=diagramas_data, custom_labels=custom_labels)
        mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        filename = f'ERS_{project.nome.replace(" ", "_")}.docx'

    AuditLog.log(user_id, 'download_ers', 'projeto', project.id, project.id,
                 {'formato': formato, 'total_requisitos': len(requirements),
                  'incluir_nao_aprovados': incluir_nao_aprovados})

    db.session.commit()

    return send_file(
        io.BytesIO(content),
        mimetype=mimetype,
        as_attachment=True,
        download_name=filename
    )
