"""RF08 — Canal de Colaboração: comentários em requisitos com respostas aninhadas."""
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Comentario, Requirement, User, AuditLog
from app.schemas.comment import ComentarioCreateSchema, ComentarioUpdateSchema
from app.utils.decorators import validate_json
from app.utils.access import check_user_requirement_access

# Criação/listagem aninhadas sob /api/requisitos/<id>/comentarios
req_comments_bp = Blueprint('requirement_comments', __name__, url_prefix='/api/requisitos')
# Edição/ocultação sob /api/comentarios/<id>
comments_bp = Blueprint('comments', __name__, url_prefix='/api/comentarios')

MAX_DEPTH = 3          # RF08-A3: até 3 níveis de aninhamento
EDIT_WINDOW_MIN = 15   # RF08-A1: edição permitida por 15 minutos


def _depth(comment):
    """Profundidade (1-based) de um comentário percorrendo a cadeia de pais."""
    depth = 1
    current = comment
    while current.parent_id:
        depth += 1
        current = db.session.get(Comentario, current.parent_id)
        if current is None or depth > 10:  # guarda contra ciclos
            break
    return depth


@req_comments_bp.route('/<int:req_id>/comentarios', methods=['POST'])
@jwt_required()
@validate_json(ComentarioCreateSchema)
def create_comment(req_id):
    data = request.validated_data
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    requirement = Requirement.query.filter_by(id=req_id, ativo=True).first()
    _, access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    parent_id = data.get('parent_id')
    if parent_id:
        parent = Comentario.query.filter_by(id=parent_id, ativo=True).first()
        if not parent or parent.requisito_id != req_id:
            return {'message': 'Comentário pai não encontrado neste requisito'}, 400
        if _depth(parent) >= MAX_DEPTH:
            return {'message': f'Profundidade máxima de {MAX_DEPTH} níveis atingida'}, 400

    comment = Comentario(
        requisito_id=req_id,
        autor_id=user_id,
        parent_id=parent_id,
        texto=data['texto'],
    )
    db.session.add(comment)
    db.session.flush()

    AuditLog.log(user_id, 'comentario', 'requisito', req_id, requirement.projeto_id,
                 {'comentario_id': comment.id, 'resposta': bool(parent_id)})
    db.session.commit()

    return {'message': 'Comentário adicionado', 'comentario': comment.to_dict()}, 201


@req_comments_bp.route('/<int:req_id>/comentarios', methods=['GET'])
@jwt_required()
def list_comments(req_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    requirement = Requirement.query.filter_by(id=req_id, ativo=True).first()
    _, access_error = check_user_requirement_access(user, requirement)
    if access_error:
        return access_error

    comments = Comentario.query.filter_by(requisito_id=req_id, ativo=True).order_by(
        Comentario.criado_em.asc()
    ).all()

    return {
        'comentarios': [c.to_dict() for c in comments],
        'total': len(comments),
    }


@comments_bp.route('/<int:comment_id>', methods=['PUT'])
@jwt_required()
@validate_json(ComentarioUpdateSchema)
def update_comment(comment_id):
    data = request.validated_data
    user_id = int(get_jwt_identity())

    comment = Comentario.query.filter_by(id=comment_id, ativo=True).first()
    if not comment:
        return {'message': 'Comentário não encontrado'}, 404

    # RF08-A1: apenas o autor pode editar, dentro de 15 minutos
    if comment.autor_id != user_id:
        return {'message': 'Apenas o autor pode editar o comentário'}, 403
    criado = comment.criado_em
    if criado.tzinfo is None:
        criado = criado.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) - criado > timedelta(minutes=EDIT_WINDOW_MIN):
        return {'message': f'Edição permitida apenas nos primeiros {EDIT_WINDOW_MIN} minutos'}, 403

    comment.texto = data['texto']
    comment.editado_em = datetime.now(timezone.utc)
    db.session.commit()

    return {'message': 'Comentário atualizado', 'comentario': comment.to_dict()}


@comments_bp.route('/<int:comment_id>/ocultar', methods=['POST'])
@jwt_required()
def hide_comment(comment_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    # RF08-A2: apenas analista/gestor podem ocultar
    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas ou gestores podem ocultar comentários'}, 403

    comment = Comentario.query.filter_by(id=comment_id, ativo=True).first()
    if not comment:
        return {'message': 'Comentário não encontrado'}, 404

    comment.oculto = True
    requirement = db.session.get(Requirement, comment.requisito_id)
    AuditLog.log(user_id, 'ocultacao', 'comentario', comment.id,
                 requirement.projeto_id if requirement else None,
                 {'requisito_id': comment.requisito_id})
    db.session.commit()

    return {'message': 'Comentário ocultado', 'comentario': comment.to_dict()}
