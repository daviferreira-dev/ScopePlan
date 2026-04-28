from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from marshmallow import ValidationError
from app import db
from app.models import User
from app.schemas import UserRegistrationSchema, UserLoginSchema, UserSchema

auth_bp = Blueprint('auth', __name__)

# Token blocklist for logout
token_blocklist = set()


def user_identity_lookup(user_id):
    """Convert user ID to string for JWT identity"""
    return str(user_id)


def parse_user_id(identity):
    """Convert JWT identity back to user ID"""
    return int(identity)


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    ---
    Body:
        - email: string (required)
        - password: string (required, min 6 characters)
        - name: string (required)
        - role: 'analista' or 'cliente' (required)
    """
    try:
        schema = UserRegistrationSchema()
        data = schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({'message': 'Erro de validação', 'errors': err.messages}), 400

    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email já cadastrado'}), 409

    # Create new user
    user = User(
        email=data['email'],
        name=data['name'],
        role=data['role']
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    # Generate tokens with string identity
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'message': 'Usuário registrado com sucesso',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user
    ---
    Body:
        - email: string (required)
        - password: string (required)
    """
    try:
        schema = UserLoginSchema()
        data = schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({'message': 'Erro de validação', 'errors': err.messages}), 400

    # Find user
    user = User.query.filter_by(email=data['email']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'message': 'Email ou senha incorretos'}), 401

    # Generate tokens with string identity
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'message': 'Login realizado com sucesso',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user (invalidate token)
    """
    jti = get_jwt()['jti']
    token_blocklist.add(jti)

    return jsonify({'message': 'Logout realizado com sucesso'}), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token
    """
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)

    return jsonify({
        'access_token': access_token
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current user profile
    """
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'message': 'Usuário não encontrado'}), 404

    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """
    Update current user profile
    ---
    Body (all optional):
        - name: string
        - password: string (min 6 characters)
    """
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'message': 'Usuário não encontrado'}), 404

    data = request.get_json() or {}

    if 'name' in data:
        user.name = data['name']

    if 'password' in data:
        if len(data['password']) < 6:
            return jsonify({'message': 'Senha deve ter no mínimo 6 caracteres'}), 400
        user.set_password(data['password'])

    db.session.commit()

    return jsonify({
        'message': 'Perfil atualizado com sucesso',
        'user': user.to_dict()
    }), 200
