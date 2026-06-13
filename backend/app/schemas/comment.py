from marshmallow import Schema, fields, validate


class ComentarioCreateSchema(Schema):
    texto = fields.String(required=True, validate=validate.Length(min=1, max=5000))
    parent_id = fields.Integer(required=False, allow_none=True)


class ComentarioUpdateSchema(Schema):
    texto = fields.String(required=True, validate=validate.Length(min=1, max=5000))
