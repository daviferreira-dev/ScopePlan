from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, ProjetoVisaoGeral
from app.utils.access import check_user_project_access

visao_geral_bp = Blueprint('visao_geral', __name__)

CAMPOS = ['o_que', 'por_que', 'quem', 'onde', 'quando', 'como', 'quanto']


@visao_geral_bp.route('/api/projetos/<int:project_id>/visao-geral', methods=['GET'])
@jwt_required()
def get_visao_geral(project_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    _, error = check_user_project_access(user, project_id)
    if error:
        return error
    vg = ProjetoVisaoGeral.query.filter_by(projeto_id=project_id).first()
    return {'visao_geral': vg.to_dict() if vg else None}, 200


@visao_geral_bp.route('/api/projetos/<int:project_id>/visao-geral', methods=['PUT'])
@jwt_required()
def upsert_visao_geral(project_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas ou gestores podem editar a visão geral'}, 403
    _, error = check_user_project_access(user, project_id)
    if error:
        return error

    body = request.get_json(force=True, silent=True) or {}
    vg = ProjetoVisaoGeral.query.filter_by(projeto_id=project_id).first()
    if not vg:
        vg = ProjetoVisaoGeral(projeto_id=project_id)
        db.session.add(vg)

    for campo in CAMPOS:
        if campo in body:
            setattr(vg, campo, body[campo] or None)

    db.session.commit()
    return {'visao_geral': vg.to_dict()}, 200
