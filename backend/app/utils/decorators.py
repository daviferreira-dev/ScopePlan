from functools import wraps
from flask import request


def validate_json(schema_class):
    """
    Decorator to validate request JSON against a schema.
    Usage: @validate_json(ProjectCreateSchema)
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            from marshmallow import ValidationError
            schema = schema_class()
            try:
                data = schema.load(request.get_json() or {})
                request.validated_data = data
            except ValidationError as err:
                return {'message': 'Erro de validação', 'errors': err.messages}, 400
            return fn(*args, **kwargs)
        return wrapper
    return decorator
