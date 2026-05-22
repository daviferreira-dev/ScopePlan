from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from marshmallow import ValidationError

from app.models import User, AuditLog
from app.schemas import UserRegistrationSchema, UserLoginSchema, UserUpdateSchema, UserSchema
from app.utils.decorators import validate_json

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Token blocklist (in-memory, for logout)
# Maps jti -> expiry timestamp so we can prune expired entries
from datetime import datetime, timezone
_token_blocklist = {}  # {jti: exp_timestamp}


def _prune_expired_tokens():
    """Remove expired tokens from blocklist to prevent unbounded growth."""
    now = datetime.now(timezone.utc).timestamp()
    expired = [jti for jti, exp in _token_blocklist.items() if exp and exp < now]
    for jti in expired:
        del _token_blocklist[jti]


@auth_bp.route('/register', methods=['POST'])
@validate_json(UserRegistrationSchema)
def register():
    data = request.validated_data
    data['senha'] = str(data['senha'])

    if User.query.filter_by(email=data['email']).first():
        return {'message': 'Email já cadastrado'}, 409

    user = User(
        nome=data['nome'],
        email=data['email'],
        perfil=data['perfil'],
        ativo=True
    )
    user.set_password(data['senha'])

    from app import db
    db.session.add(user)
    db.session.commit()

    AuditLog.log(user.id, 'criacao', 'usuario', user.id, None, {'email': user.email, 'perfil': user.perfil})
    db.session.commit()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return {
        'message': 'Usuário registrado com sucesso',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }, 201


@auth_bp.route('/login', methods=['POST'])
@validate_json(UserLoginSchema)
def login():
    data = request.validated_data
    data['senha'] = str(data['senha'])

    user = User.query.filter_by(email=data['email']).first()

    if not user or not user.check_password(data['senha']):
        return {'message': 'Email ou senha inválidos'}, 401

    if not user.ativo:
        return {'message': 'Conta desativada. Contate o administrador.'}, 403

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    AuditLog.log(user.id, 'login', 'usuario', user.id, None, {'email': user.email})
    from app import db
    db.session.commit()

    return {
        'message': 'Login realizado com sucesso',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }, 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = get_jwt_identity()
    jti = get_jwt()['jti']
    exp = get_jwt().get('exp')
    _token_blocklist[jti] = exp
    _prune_expired_tokens()

    AuditLog.log(user_id, 'logout', 'usuario', user_id, None)
    from app import db
    db.session.commit()

    return {'message': 'Logout realizado com sucesso'}, 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)
    return {'access_token': access_token}, 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    from app import db
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    return {'user': user.to_dict()}, 200


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
@validate_json(UserUpdateSchema)
def update_me():
    user_id = get_jwt_identity()
    from app import db
    user = db.session.get(User, user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    data = request.validated_data
    changed_fields = []

    # Require current password to change password
    if 'senha' in data:
        raw_json = request.get_json()
        senha_atual = data.get('senha_atual') or (raw_json.get('senha_atual') if raw_json else None)
        if not senha_atual:
            return {'message': 'Senha atual é obrigatória para alterar a senha'}, 400
        if not user.check_password(str(senha_atual)):
            return {'message': 'Senha atual incorreta'}, 401
        user.set_password(str(data['senha']))
        changed_fields.append('senha')

    # Prevent self-deactivation
    if 'ativo' in data and data['ativo'] is False:
        return {'message': 'Não é possível desativar a própria conta. Contate um administrador.'}, 400

    if 'nome' in data:
        user.nome = data['nome']
        changed_fields.append('nome')

    db.session.commit()

    if changed_fields:
        AuditLog.log(user_id, 'atualizacao', 'usuario', user.id, None, {'campos_alterados': changed_fields})
        db.session.commit()

    return {'message': 'Perfil atualizado com sucesso', 'user': user.to_dict()}, 200


@auth_bp.route('/clientes', methods=['GET'])
@jwt_required()
def list_clientes():
    """List all active users with perfil='cliente'. Used when creating/editing projects.
    Only analistas and gestores can access this endpoint."""
    from app import db
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user or user.perfil not in ('analista', 'gestor'):
        return {'message': 'Acesso não autorizado'}, 403

    clientes = User.query.filter_by(perfil='cliente', ativo=True).order_by(User.nome).all()
    return {'clientes': [c.to_dict() for c in clientes]}, 200
