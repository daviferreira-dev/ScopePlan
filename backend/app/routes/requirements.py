from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Requirement, Project, User, Validacao, AuditLog
from app.schemas import RequirementCreateSchema, RequirementUpdateSchema, ValidacaoCreateSchema, RequirementSchema
from app.utils.decorators import validate_json, role_required
from app.utils.access import get_user_project_ids, check_user_project_access, check_user_requirement_access
from app import db

requirements_bp = Blueprint('requirements', __name__, url_prefix='/api/requirements')


@requirements_bp.route('', methods=['POST'])
@jwt_required()
@validate_json(RequirementCreateSchema)
def create_requirement():
    data = request.validated_data
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    if user.perfil not in ('analista', 'desenvolvedor'):
        return {'message': 'Apenas analistas ou desenvolvedores podem criar requisitos'}, 403

    # Check user access to this project
    _, access_error = check_user_project_access(user, data['projeto_id'])
    if access_error:
        return access_error

    project = db.session.get(Project, data['projeto_id'])
    if not project:
        return {'message': 'Projeto não encontrado'}, 404

    # Auto-generate codigo if not provided
    codigo = data.get('codigo')
    if not codigo:
        existing_count = Requirement.query.filter_by(projeto_id=data['projeto_id']).count()
        tipo_prefix = {
            'funcional': 'RF',
            'nao_funcional': 'RNF',
            'negocio': 'RN',
            'restricao': 'RT'
        }.get(data.get('tipo', 'funcional'), 'RF')
        codigo = f"{tipo_prefix}-{str(existing_count + 1).zfill(3)}"

    requirement = Requirement(
        titulo=data['titulo'],
        descricao=data.get('descricao'),
        projeto_id=data['projeto_id'],
        autor_id=user_id,
        codigo=codigo,
        tipo=data.get('tipo'),
        categoria=data.get('categoria'),
        prioridade=data.get('prioridade'),
        status=data.get('status', 'rascunho')
    )
    db.session.add(requirement)
    db.session.commit()

    AuditLog.log(user_id, 'criacao', 'requisito', requirement.id, project.id, {'titulo': requirement.titulo, 'tipo': requirement.tipo})
    db.session.commit()

    return {'message': 'Requisito criado com sucesso', 'requirement': requirement.to_dict()}, 201


@requirements_bp.route('', methods=['GET'])
@jwt_required()
def list_requirements():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    projeto_id = request.args.get('projeto_id', type=int)
    status_filter = request.args.get('status')
    tipo_filter = request.args.get('tipo')
    prioridade_filter = request.args.get('prioridade')
    search = request.args.get('search')

    query = Requirement.query.filter_by(ativo=True)

    if projeto_id:
        # Verify user access to this project
        _, access_error = check_user_project_access(user, projeto_id)
        if access_error:
            return access_error
        query = query.filter_by(projeto_id=projeto_id)
    else:
        # Filter by user's accessible projects
        user_project_ids = get_user_project_ids(user)
        query = query.filter(Requirement.projeto_id.in_(user_project_ids))

    if status_filter:
        query = query.filter_by(status=status_filter)

    if tipo_filter:
        query = query.filter_by(tipo=tipo_filter)

    if prioridade_filter:
        query = query.filter_by(prioridade=prioridade_filter)

    if search:
        # Escape LIKE wildcards to prevent pattern injection
        escaped = search.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
        query = query.filter(
            db.or_(
                Requirement.titulo.ilike(f'%{escaped}%', escape='\\'),
                Requirement.descricao.ilike(f'%{escaped}%', escape='\\'),
                Requirement.codigo.ilike(f'%{escaped}%', escape='\\')
            )
        )

    query = query.order_by(Requirement.criado_em.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    requirements = pagination.items

    return {
        'requisitos': [req.to_dict() for req in requirements],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages
    }


@requirements_bp.route('/<int:requirement_id>', methods=['GET'])
@jwt_required()
def get_requirement(requirement_id):
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    requirement = Requirement.query.filter_by(id=requirement_id, ativo=True).first()

    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404

    access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    return {'requirement': requirement.to_dict(include_validacoes=True)}


@requirements_bp.route('/<int:requirement_id>', methods=['PUT'])
@jwt_required()
@validate_json(RequirementUpdateSchema)
def update_requirement(requirement_id):
    data = request.validated_data
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    if user.perfil not in ('analista', 'desenvolvedor'):
        return {'message': 'Apenas analistas ou desenvolvedores podem editar requisitos'}, 403

    requirement = Requirement.query.filter_by(id=requirement_id, ativo=True).first()

    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404

    access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    # RN003: If requirement is approved and titulo/descricao changed, reset status
    was_approved = requirement.status == 'aprovado'
    titulo_changed = 'titulo' in data and data['titulo'] != requirement.titulo
    descricao_changed = 'descricao' in data and data.get('descricao') != requirement.descricao

    # Update fields
    for field in ['titulo', 'descricao', 'codigo', 'tipo', 'categoria', 'prioridade', 'status']:
        if field in data:
            setattr(requirement, field, data[field])

    # RN003: Reset status to em_revisao when editing an approved requirement
    if was_approved and (titulo_changed or descricao_changed):
        requirement.status = 'em_revisao'
        requirement.incrementar_versao()

    db.session.commit()

    AuditLog.log(user_id, 'atualizacao', 'requisito', requirement.id, requirement.projeto_id, {'titulo': requirement.titulo, 'status': requirement.status})
    db.session.commit()

    return {'message': 'Requisito atualizado com sucesso', 'requirement': requirement.to_dict()}


@requirements_bp.route('/<int:requirement_id>', methods=['DELETE'])
@jwt_required()
def delete_requirement(requirement_id):
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas ou gestores podem excluir requisitos'}, 403

    requirement = Requirement.query.filter_by(id=requirement_id, ativo=True).first()

    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404

    access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    # RN004: Logical deletion instead of physical deletion
    requirement.ativo = False
    db.session.commit()

    AuditLog.log(user_id, 'exclusao', 'requisito', requirement.id, requirement.projeto_id, {'titulo': requirement.titulo})
    db.session.commit()

    return {'message': 'Requisito removido com sucesso'}


@requirements_bp.route('/<int:requirement_id>/submit-review', methods=['POST'])
@jwt_required()
def submit_review(requirement_id):
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    if user.perfil not in ('analista', 'desenvolvedor'):
        return {'message': 'Apenas analistas ou desenvolvedores podem submeter para revisão'}, 403

    requirement = Requirement.query.filter_by(id=requirement_id, ativo=True).first()

    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404

    access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    if requirement.status != 'rascunho':
        return {'message': 'Apenas requisitos em rascunho podem ser submetidos para revisão'}, 400

    requirement.status = 'em_revisao'
    db.session.commit()

    AuditLog.log(user_id, 'submissao_revisao', 'requisito', requirement.id, requirement.projeto_id, {'status_anterior': 'rascunho', 'status_atual': 'em_revisao'})
    db.session.commit()

    return {'message': 'Requisito submetido para revisão', 'requirement': requirement.to_dict()}


@requirements_bp.route('/<int:requirement_id>/validacoes', methods=['POST'])
@jwt_required()
@validate_json(ValidacaoCreateSchema)
def create_validacao(requirement_id):
    data = request.validated_data
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    if user.perfil not in ('cliente', 'analista', 'gestor'):
        return {'message': 'Apenas clientes, analistas ou gestores podem validar requisitos'}, 403

    requirement = Requirement.query.filter_by(id=requirement_id, ativo=True).first()

    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404

    access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    if requirement.status != 'em_revisao':
        return {'message': 'Apenas requisitos em revisão podem ser validados'}, 400

    validacao = Validacao(
        requisito_id=requirement_id,
        validador_id=user_id,
        resultado=data['resultado'],
        comentario=data.get('comentario')
    )
    db.session.add(validacao)

    # Update requirement status based on validation result
    status_anterior = requirement.status
    if data['resultado'] == 'aprovado':
        requirement.status = 'aprovado'
    elif data['resultado'] == 'rejeitado':
        requirement.status = 'rejeitado'
    elif data['resultado'] == 'aprovado_com_ressalvas':
        requirement.status = 'aprovado'

    db.session.commit()

    AuditLog.log(user_id, 'validacao', 'requisito', requirement.id, requirement.projeto_id, {'resultado': data['resultado'], 'status_anterior': status_anterior, 'status_atual': requirement.status})
    db.session.commit()

    return {'message': 'Validação registrada com sucesso', 'validacao': validacao.to_dict()}, 201


@requirements_bp.route('/<int:requirement_id>/validacoes', methods=['GET'])
@jwt_required()
def list_validacoes(requirement_id):
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    requirement = Requirement.query.filter_by(id=requirement_id, ativo=True).first()

    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404

    access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    query = Validacao.query.filter_by(requisito_id=requirement_id).order_by(Validacao.validado_em.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    validacoes = pagination.items

    return {
        'validacoes': [v.to_dict() for v in validacoes],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages
    }


@requirements_bp.route('/<int:requirement_id>/version-history', methods=['GET'])
@jwt_required()
def version_history(requirement_id):
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    requirement = Requirement.query.filter_by(id=requirement_id, ativo=True).first()

    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404

    access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    validacoes = Validacao.query.filter_by(requisito_id=requirement_id).order_by(Validacao.validado_em.desc()).all()

    return {
        'requirement': requirement.to_dict(),
        'validacoes': [v.to_dict() for v in validacoes],
        'versions': [{
            'numero_versao': requirement.numero_versao,
            'status': requirement.status,
            'criado_em': requirement.criado_em.isoformat() if requirement.criado_em else None,
            'atualizado_em': requirement.atualizado_em.isoformat() if requirement.atualizado_em else None
        }]
    }
