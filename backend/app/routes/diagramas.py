from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Project, Diagrama, User, AuditLog
from app.utils.access import check_user_project_access
from app import db
import io

diagramas_bp = Blueprint('diagramas', __name__)

ALLOWED_MIMES = {'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@diagramas_bp.route('/api/projetos/<int:project_id>/diagramas', methods=['GET'])
@jwt_required()
def list_diagramas(project_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    _, error = check_user_project_access(user, project_id)
    if error:
        return error
    diagramas = Diagrama.query.filter_by(projeto_id=project_id).order_by(Diagrama.criado_em.desc()).all()
    return {'diagramas': [d.to_dict() for d in diagramas]}, 200


@diagramas_bp.route('/api/projetos/<int:project_id>/diagramas', methods=['POST'])
@jwt_required()
def upload_diagrama(project_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    _, error = check_user_project_access(user, project_id)
    if error:
        return error

    if 'arquivo' not in request.files:
        return {'message': 'Nenhum arquivo enviado'}, 400

    arquivo = request.files['arquivo']
    if not arquivo.filename:
        return {'message': 'Nome de arquivo inválido'}, 400

    dados = arquivo.read()
    if len(dados) > MAX_SIZE_BYTES:
        return {'message': 'Arquivo muito grande (máximo 10 MB)'}, 413

    tipo_mime = arquivo.content_type or 'image/png'
    if tipo_mime not in ALLOWED_MIMES:
        return {'message': 'Tipo de arquivo não suportado. Use PNG, JPEG, GIF, WEBP, SVG ou PDF.'}, 415

    nome = request.form.get('nome') or arquivo.filename

    diagrama = Diagrama(
        projeto_id=project_id,
        nome=nome,
        tipo_mime=tipo_mime,
        dados=dados,
        tamanho=len(dados),
    )
    db.session.add(diagrama)
    db.session.flush()

    AuditLog.log(user_id, 'upload_diagrama', 'diagrama', diagrama.id, project_id,
                 {'nome': nome, 'tipo_mime': tipo_mime, 'tamanho': len(dados)})

    db.session.commit()
    return {'diagrama': diagrama.to_dict()}, 201


@diagramas_bp.route('/api/projetos/<int:project_id>/diagramas/<int:diagrama_id>/imagem', methods=['GET'])
@jwt_required()
def get_imagem(project_id, diagrama_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    _, error = check_user_project_access(user, project_id)
    if error:
        return error

    diagrama = Diagrama.query.filter_by(id=diagrama_id, projeto_id=project_id).first()
    if not diagrama:
        return {'message': 'Diagrama não encontrado'}, 404

    return send_file(
        io.BytesIO(diagrama.dados),
        mimetype=diagrama.tipo_mime,
        as_attachment=False,
        download_name=diagrama.nome,
    )


@diagramas_bp.route('/api/projetos/<int:project_id>/diagramas/<int:diagrama_id>', methods=['DELETE'])
@jwt_required()
def delete_diagrama(project_id, diagrama_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    _, error = check_user_project_access(user, project_id)
    if error:
        return error

    diagrama = Diagrama.query.filter_by(id=diagrama_id, projeto_id=project_id).first()
    if not diagrama:
        return {'message': 'Diagrama não encontrado'}, 404

    AuditLog.log(user_id, 'exclusao_diagrama', 'diagrama', diagrama.id, project_id,
                 {'nome': diagrama.nome, 'tipo_mime': diagrama.tipo_mime})

    db.session.delete(diagrama)
    db.session.commit()
    return {'message': 'Diagrama excluído'}, 200
