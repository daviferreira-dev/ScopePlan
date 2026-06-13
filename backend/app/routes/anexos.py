from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, Requirement, Anexo
from app.utils.access import check_user_project_access
from app import db
import io

anexos_bp = Blueprint('anexos', __name__)

MAX_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


@anexos_bp.route('/api/requisitos/<int:req_id>/anexos', methods=['GET'])
@jwt_required()
def list_anexos(req_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    requirement = db.session.get(Requirement, req_id)
    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404
    _, error = check_user_project_access(user, requirement.projeto_id)
    if error:
        return error
    anexos = Anexo.query.filter_by(requisito_id=req_id).order_by(Anexo.criado_em.desc()).all()
    return {'anexos': [a.to_dict() for a in anexos]}, 200


@anexos_bp.route('/api/requisitos/<int:req_id>/anexos', methods=['POST'])
@jwt_required()
def upload_anexo(req_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    requirement = db.session.get(Requirement, req_id)
    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404
    _, error = check_user_project_access(user, requirement.projeto_id)
    if error:
        return error

    if 'arquivo' not in request.files:
        return {'message': 'Nenhum arquivo enviado'}, 400

    arquivo = request.files['arquivo']
    if not arquivo.filename:
        return {'message': 'Nome de arquivo inválido'}, 400

    dados = arquivo.read()
    if len(dados) > MAX_SIZE_BYTES:
        return {'message': 'Arquivo muito grande (máximo 20 MB)'}, 413

    tipo_mime = arquivo.content_type or 'application/octet-stream'
    nome = arquivo.filename

    anexo = Anexo(
        requisito_id=req_id,
        projeto_id=requirement.projeto_id,
        nome=nome,
        tipo_mime=tipo_mime,
        dados=dados,
        tamanho=len(dados),
    )
    db.session.add(anexo)
    db.session.commit()
    return {'anexo': anexo.to_dict()}, 201


@anexos_bp.route('/api/requisitos/<int:req_id>/anexos/<int:anexo_id>/arquivo', methods=['GET'])
@jwt_required()
def download_anexo(req_id, anexo_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    requirement = db.session.get(Requirement, req_id)
    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404
    _, error = check_user_project_access(user, requirement.projeto_id)
    if error:
        return error

    anexo = Anexo.query.filter_by(id=anexo_id, requisito_id=req_id).first()
    if not anexo:
        return {'message': 'Anexo não encontrado'}, 404

    return send_file(
        io.BytesIO(anexo.dados),
        mimetype=anexo.tipo_mime,
        as_attachment=True,
        download_name=anexo.nome,
    )


@anexos_bp.route('/api/requisitos/<int:req_id>/anexos/<int:anexo_id>', methods=['DELETE'])
@jwt_required()
def delete_anexo(req_id, anexo_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    requirement = db.session.get(Requirement, req_id)
    if not requirement:
        return {'message': 'Requisito não encontrado'}, 404
    _, error = check_user_project_access(user, requirement.projeto_id)
    if error:
        return error

    anexo = Anexo.query.filter_by(id=anexo_id, requisito_id=req_id).first()
    if not anexo:
        return {'message': 'Anexo não encontrado'}, 404

    db.session.delete(anexo)
    db.session.commit()
    return {'message': 'Anexo excluído'}, 200
