from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Requirement, RequirementVersion, Project, User, Validacao, Assinatura, AuditLog
from sqlalchemy.orm import joinedload
from app.schemas import RequirementCreateSchema, RequirementUpdateSchema, ValidacaoCreateSchema
from app.utils.decorators import validate_json
from app.utils.access import check_user_project_access, check_user_requirement_access
from app import db

# Nested CRUD routes live under /api/projetos (matches frontend URL pattern)
project_reqs_bp = Blueprint('project_requirements', __name__, url_prefix='/api/projetos')

# Validation, submit-review and version history live under /api/requisitos
requirements_bp = Blueprint('requirements', __name__, url_prefix='/api/requisitos')


# ── Shared helpers ─────────────────────────────────────────────────────────────

def _parse_per_page():
    """Accept either ?per_page= or ?size= (frontend sends 'size')."""
    raw = request.args.get('per_page') or request.args.get('size')
    try:
        return min(int(raw), 100) if raw else 20
    except (ValueError, TypeError):
        return 20


def _auto_codigo(projeto_id, tipo):
    prefix = {'funcional': 'RF', 'nao_funcional': 'RNF', 'negocio': 'RN', 'restricao': 'RT'}.get(tipo, 'RF')
    # Count only requirements of the same type to keep numbering per-type
    count = Requirement.query.filter_by(projeto_id=projeto_id, tipo=tipo).count()
    candidate = f"{prefix}-{str(count + 1).zfill(3)}"
    # If candidate is taken, keep incrementing until free
    offset = 1
    while Requirement.query.filter_by(projeto_id=projeto_id, codigo=candidate).first():
        offset += 1
        candidate = f"{prefix}-{str(count + offset).zfill(3)}"
    return candidate


def _compute_consensus(requirement_id, latest_result):
    """Compute requirement status based on all validations (strict majority model).

    A strict majority (> 50%) is required to change status.
    Ties stay in em_revisao waiting for more votes.
    """
    all_validacoes = Validacao.query.filter_by(requisito_id=requirement_id).all()
    total = len(all_validacoes)
    if total < 2:
        return 'em_revisao'

    aprovados = sum(1 for v in all_validacoes if v.resultado == 'aprovado')
    rejeitados = sum(1 for v in all_validacoes if v.resultado == 'rejeitado')
    ressalvas = sum(1 for v in all_validacoes if v.resultado == 'aprovado_com_ressalvas')

    majority = total / 2  # strict: must exceed half
    if rejeitados > majority:
        return 'rejeitado'
    if aprovados > majority:
        return 'aprovado'
    if ressalvas > 0 and rejeitados == 0:
        return 'aprovado_com_ressalvas'
    return 'em_revisao'


# ── Nested CRUD under /api/projetos/<id>/requisitos ───────────────────────────

@project_reqs_bp.route('/<int:project_id>/requisitos', methods=['POST'])
@jwt_required()
def create_nested_requirement(project_id):
    from marshmallow import ValidationError
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas e gestores podem criar requisitos'}, 403

    project = db.session.get(Project, project_id)
    if not project or not project.ativo:
        return {'message': 'Projeto não encontrado'}, 404

    _, access_error = check_user_project_access(user, project_id)
    if access_error:
        return access_error

    # Inject project_id from URL so the schema can validate it
    json_data = request.get_json() or {}
    json_data['projeto_id'] = project_id

    schema = RequirementCreateSchema()
    try:
        data = schema.load(json_data)
    except ValidationError as err:
        return {'message': 'Erro de validação', 'errors': err.messages}, 400

    codigo = data.get('codigo') or _auto_codigo(project_id, data.get('tipo', 'funcional'))

    requirement = Requirement(
        titulo=data['titulo'],
        descricao=data.get('descricao'),
        projeto_id=project_id,
        autor_id=user_id,
        codigo=codigo,
        tipo=data.get('tipo'),
        categoria=data.get('categoria'),
        prioridade=data.get('prioridade'),
        status=data.get('status', 'rascunho'),
    )
    db.session.add(requirement)
    db.session.flush()

    AuditLog.log(user_id, 'criacao', 'requisito', requirement.id, project.id,
                 {'titulo': requirement.titulo, 'tipo': requirement.tipo})

    db.session.commit()

    return {'message': 'Requisito criado com sucesso', 'requisito': requirement.to_dict()}, 201


@project_reqs_bp.route('/<int:project_id>/requisitos', methods=['GET'])
@jwt_required()
def list_nested_requirements(project_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    _, access_error = check_user_project_access(user, project_id)
    if access_error:
        return access_error

    page = request.args.get('page', 1, type=int)
    per_page = _parse_per_page()
    status_filter = request.args.get('status')
    tipo_filter = request.args.get('tipo')
    prioridade_filter = request.args.get('prioridade')
    search = request.args.get('search')

    query = Requirement.query.options(
        joinedload(Requirement.autor), joinedload(Requirement.validacoes)
    ).filter_by(ativo=True, projeto_id=project_id)

    if status_filter:
        query = query.filter_by(status=status_filter)
    if tipo_filter:
        query = query.filter_by(tipo=tipo_filter)
    if prioridade_filter:
        query = query.filter_by(prioridade=prioridade_filter)
    if search:
        escaped = search.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
        query = query.filter(
            db.or_(
                Requirement.titulo.ilike(f'%{escaped}%', escape='\\'),
                Requirement.descricao.ilike(f'%{escaped}%', escape='\\'),
                Requirement.codigo.ilike(f'%{escaped}%', escape='\\'),
            )
        )

    pagination = query.order_by(Requirement.criado_em.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return {
        'requisitos': [r.to_dict() for r in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
    }


@project_reqs_bp.route('/<int:project_id>/requisitos/<int:req_id>', methods=['GET'])
@jwt_required()
def get_nested_requirement(project_id, req_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    requirement = Requirement.query.filter_by(id=req_id, ativo=True).first()
    if not requirement or requirement.projeto_id != project_id:
        return {'message': 'Requisito não encontrado'}, 404

    _, access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    return {'requisito': requirement.to_dict(include_validacoes=True)}


@project_reqs_bp.route('/<int:project_id>/requisitos/<int:req_id>', methods=['PUT'])
@jwt_required()
@validate_json(RequirementUpdateSchema)
def update_nested_requirement(project_id, req_id):
    data = request.validated_data
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    if user.perfil != 'analista':
        return {'message': 'Apenas analistas podem editar requisitos'}, 403

    requirement = Requirement.query.filter_by(id=req_id, ativo=True).first()
    if not requirement or requirement.projeto_id != project_id:
        return {'message': 'Requisito não encontrado'}, 404

    _, access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    was_approved = requirement.status in ('aprovado', 'aprovado_com_ressalvas')
    titulo_changed = 'titulo' in data and data['titulo'] != requirement.titulo
    descricao_changed = 'descricao' in data and data.get('descricao') != requirement.descricao

    for field in ['titulo', 'descricao', 'codigo', 'tipo', 'categoria', 'prioridade']:
        if field in data:
            setattr(requirement, field, data[field])

    if was_approved and (titulo_changed or descricao_changed):
        requirement.status = 'em_revisao'
        requirement.incrementar_versao()

    AuditLog.log(user_id, 'atualizacao', 'requisito', requirement.id, requirement.projeto_id,
                 {'titulo': requirement.titulo, 'status': requirement.status})
    db.session.commit()

    return {'message': 'Requisito atualizado com sucesso', 'requisito': requirement.to_dict()}


@project_reqs_bp.route('/<int:project_id>/requisitos/<int:req_id>', methods=['DELETE'])
@jwt_required()
def delete_nested_requirement(project_id, req_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas ou gestores podem excluir requisitos'}, 403

    requirement = Requirement.query.filter_by(id=req_id, ativo=True).first()
    if not requirement or requirement.projeto_id != project_id:
        return {'message': 'Requisito não encontrado'}, 404

    _, access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    requirement.ativo = False
    AuditLog.log(user_id, 'exclusao', 'requisito', requirement.id, requirement.projeto_id,
                 {'titulo': requirement.titulo})
    db.session.commit()

    return {'message': 'Requisito removido com sucesso'}


@project_reqs_bp.route('/<int:project_id>/requisitos/<int:req_id>/mover', methods=['PATCH'])
@jwt_required()
def move_kanban_requirement(project_id, req_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas e gestores podem mover requisitos'}, 403

    requirement = Requirement.query.filter_by(id=req_id, ativo=True).first()
    if not requirement or requirement.projeto_id != project_id:
        return {'message': 'Requisito não encontrado'}, 404

    _, access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    data = request.get_json() or {}
    new_status = data.get('status')
    valid_statuses = ('rascunho', 'em_revisao', 'aprovado', 'aprovado_com_ressalvas', 'rejeitado')
    if new_status not in valid_statuses:
        return {'message': f'Status inválido. Use: {", ".join(valid_statuses)}'}, 400

    requirement.status = new_status
    AuditLog.log(user_id, 'atualizacao', 'requisito', requirement.id, requirement.projeto_id,
                 {'status': new_status, 'acao': 'kanban_move'})
    db.session.commit()

    return {'message': 'Status atualizado', 'requisito': requirement.to_dict()}


@project_reqs_bp.route('/<int:project_id>/requisitos/<int:req_id>/assinaturas', methods=['GET'])
@jwt_required()
def list_assinaturas(project_id, req_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    requirement = Requirement.query.filter_by(id=req_id, ativo=True).first()
    if not requirement or requirement.projeto_id != project_id:
        return {'message': 'Requisito não encontrado'}, 404

    _, access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    assinaturas = Assinatura.query.filter_by(requisito_id=req_id).order_by(Assinatura.assinado_em).all()
    return {'assinaturas': [a.to_dict() for a in assinaturas]}


@project_reqs_bp.route('/<int:project_id>/requisitos/<int:req_id>/assinar', methods=['POST'])
@jwt_required()
def assinar_requisito(project_id, req_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas e gestores podem assinar requisitos'}, 403

    requirement = Requirement.query.filter_by(id=req_id, ativo=True).first()
    if not requirement or requirement.projeto_id != project_id:
        return {'message': 'Requisito não encontrado'}, 404

    _, access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    if requirement.status not in ('aprovado', 'aprovado_com_ressalvas'):
        return {'message': 'Apenas requisitos aprovados podem ser assinados'}, 400

    existing = Assinatura.query.filter_by(requisito_id=req_id, signatario_id=user_id).first()
    if existing:
        return {'message': 'Você já assinou este requisito'}, 409

    data = request.get_json() or {}
    declaracao = (data.get('declaracao') or '').strip() or None

    assinatura = Assinatura(
        requisito_id=req_id,
        signatario_id=user_id,
        declaracao=declaracao,
    )
    db.session.add(assinatura)

    AuditLog.log(user_id, 'assinatura', 'requisito', requirement.id, requirement.projeto_id,
                 {'titulo': requirement.titulo, 'declaracao': declaracao})

    db.session.commit()

    return {'message': 'Requisito assinado com sucesso', 'assinatura': assinatura.to_dict()}, 201


# ── Flat endpoints under /api/requisitos ──────────────────────────────────────

@requirements_bp.route('/<int:requirement_id>/submit-review', methods=['POST'])
@jwt_required()
def submit_review(requirement_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    if user.perfil != 'analista':
        return {'message': 'Apenas analistas podem submeter requisitos para revisão'}, 403

    requirement = Requirement.query.filter_by(id=requirement_id, ativo=True).first()
    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404

    _, access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    if requirement.status != 'rascunho':
        return {'message': 'Apenas requisitos em rascunho podem ser submetidos para revisão'}, 400

    requirement.status = 'em_revisao'
    AuditLog.log(user_id, 'submissao_revisao', 'requisito', requirement.id, requirement.projeto_id,
                 {'status_anterior': 'rascunho', 'status_atual': 'em_revisao'})
    db.session.commit()

    return {'message': 'Requisito submetido para revisão', 'requisito': requirement.to_dict()}


@requirements_bp.route('/<int:requirement_id>/validacoes', methods=['POST'])
@jwt_required()
@validate_json(ValidacaoCreateSchema)
def create_validacao(requirement_id):
    data = request.validated_data
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    if user.perfil != 'cliente':
        return {'message': 'Apenas clientes podem aprovar ou reprovar requisitos'}, 403

    requirement = Requirement.query.filter_by(id=requirement_id, ativo=True).first()
    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404

    _, access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    if requirement.status != 'em_revisao':
        return {'message': 'Apenas requisitos enviados para revisão podem ser avaliados'}, 400

    # Substitui validação anterior do mesmo cliente (permitindo reavaliar)
    existing = Validacao.query.filter_by(requisito_id=requirement_id, validador_id=user_id).first()
    if existing:
        existing.resultado = data['resultado']
        existing.comentario = data.get('comentario')
    else:
        validacao = Validacao(
            requisito_id=requirement_id,
            validador_id=user_id,
            resultado=data['resultado'],
            comentario=data.get('comentario'),
        )
        db.session.add(validacao)

    # Voto do cliente define o status diretamente
    status_anterior = requirement.status
    resultado = data['resultado']
    requirement.status = resultado  # 'aprovado' | 'rejeitado' | 'aprovado_com_ressalvas'

    AuditLog.log(user_id, 'validacao', 'requisito', requirement.id, requirement.projeto_id,
                 {'resultado': resultado, 'status_anterior': status_anterior,
                  'status_atual': requirement.status})
    db.session.commit()

    return {
        'message': 'Validação registrada com sucesso',
        'validacao': validacao.to_dict(),
        'requirement_status': requirement.status,
    }, 201


@requirements_bp.route('/<int:requirement_id>/validacoes', methods=['GET'])
@jwt_required()
def list_validacoes(requirement_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    page = request.args.get('page', 1, type=int)
    per_page = _parse_per_page()

    requirement = Requirement.query.filter_by(id=requirement_id, ativo=True).first()
    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404

    _, access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    pagination = Validacao.query.filter_by(requisito_id=requirement_id).order_by(
        Validacao.validado_em.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return {
        'validacoes': [v.to_dict() for v in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
    }


@requirements_bp.route('/<int:requirement_id>/versions', methods=['GET'])
@jwt_required()
def version_history(requirement_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    requirement = Requirement.query.filter_by(id=requirement_id, ativo=True).first()
    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404

    _, access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    versions = RequirementVersion.query.filter_by(requisito_id=requirement_id).order_by(
        RequirementVersion.numero_versao.desc()
    ).all()

    validacoes = Validacao.query.filter_by(requisito_id=requirement_id).order_by(
        Validacao.validado_em.desc()
    ).all()

    return {
        'requirement': requirement.to_dict(),
        'validacoes': [v.to_dict() for v in validacoes],
        'versions': [{
            'numero_versao': v.numero_versao,
            'titulo': v.titulo,
            'descricao': v.descricao,
            'status': v.status,
            'criado_em': v.criado_em.isoformat() if v.criado_em else None,
        } for v in versions],
    }
