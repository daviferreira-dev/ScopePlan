from uuid import uuid4
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, BlocoPersonalizado
from app.utils.access import check_user_project_access
from app import db

blocos_bp = Blueprint('blocos', __name__)


@blocos_bp.route('/api/projetos/<int:project_id>/blocos', methods=['GET'])
@jwt_required()
def list_blocos(project_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    _, error = check_user_project_access(user, project_id)
    if error:
        return error
    blocos = BlocoPersonalizado.query.filter_by(projeto_id=project_id).order_by(BlocoPersonalizado.ordem, BlocoPersonalizado.criado_em).all()
    return {'blocos': [b.to_dict() for b in blocos]}, 200


@blocos_bp.route('/api/projetos/<int:project_id>/blocos', methods=['POST'])
@jwt_required()
def create_bloco(project_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas ou gestores podem criar blocos personalizados'}, 403
    _, error = check_user_project_access(user, project_id)
    if error:
        return error
    body = request.get_json(silent=True) or {}
    nome = (body.get('nome') or '').strip()
    if not nome:
        return {'message': 'Nome do bloco é obrigatório'}, 400
    tipo_chave = f'custom_{uuid4().hex[:8]}'
    max_ordem = db.session.query(db.func.max(BlocoPersonalizado.ordem)).filter_by(projeto_id=project_id).scalar() or 0
    bloco = BlocoPersonalizado(
        projeto_id=project_id,
        nome=nome,
        tipo_chave=tipo_chave,
        ordem=max_ordem + 1,
    )
    db.session.add(bloco)
    db.session.commit()
    return {'bloco': bloco.to_dict()}, 201


@blocos_bp.route('/api/projetos/<int:project_id>/blocos/<int:bloco_id>', methods=['DELETE'])
@jwt_required()
def delete_bloco(project_id, bloco_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas ou gestores podem excluir blocos personalizados'}, 403
    _, error = check_user_project_access(user, project_id)
    if error:
        return error
    bloco = BlocoPersonalizado.query.filter_by(id=bloco_id, projeto_id=project_id).first()
    if not bloco:
        return {'message': 'Bloco não encontrado'}, 404
    db.session.delete(bloco)
    db.session.commit()
    return {'message': 'Bloco excluído'}, 200
