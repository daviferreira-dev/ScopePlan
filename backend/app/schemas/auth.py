from marshmallow import Schema, fields, validate, validates, ValidationError


class UserRegistrationSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=6, max=128))
    name = fields.String(required=True, validate=validate.Length(min=2, max=100))
    role = fields.String(required=True, validate=validate.OneOf(['analista', 'cliente']))


class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)


class UserSchema(Schema):
    id = fields.Integer(dump_only=True)
    email = fields.Email()
    name = fields.String()
    role = fields.String()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
