from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity


def role_required(*roles):
    """
    Decorator to restrict access to users with specific roles.
    Usage: @role_required('admin', 'manager')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            from app.models import User
            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if not user:
                return {'message': 'Usuário não encontrado'}, 404

            if user.role not in roles:
                return {'message': 'Acesso não autorizado para este tipo de usuário'}, 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def analyst_required(fn):
    """Decorator to restrict access to analysts only"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        from app.models import User
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return {'message': 'Usuário não encontrado'}, 404

        if user.role != 'analista':
            return {'message': 'Apenas analistas podem realizar esta ação'}, 403

        return fn(*args, **kwargs)
    return wrapper


def client_required(fn):
    """Decorator to restrict access to clients only"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        from app.models import User
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return {'message': 'Usuário não encontrado'}, 404

        if user.role != 'cliente':
            return {'message': 'Apenas clientes podem realizar esta ação'}, 403

        return fn(*args, **kwargs)
    return wrapper


def validate_json(schema_class):
    """
    Decorator to validate request JSON against a schema
    Usage: @validate_json(ProjectCreateSchema)
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            from flask import request
            from marshmallow import ValidationError

            schema = schema_class()
            try:
                data = schema.load(request.get_json() or {})
                # Store validated data in request context
                request.validated_data = data
            except ValidationError as err:
                return {'message': 'Erro de validação', 'errors': err.messages}, 400

            return fn(*args, **kwargs)
        return wrapper
    return decorator
