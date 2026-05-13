from marshmallow import Schema, fields, validate


class UserRegistrationSchema(Schema):
    email = fields.Email(required=True)
    senha = fields.String(required=True, validate=validate.Length(min=6, max=128))
    nome = fields.String(required=True, validate=validate.Length(min=2, max=120))
    perfil = fields.String(required=True, validate=validate.OneOf(['analista', 'desenvolvedor', 'cliente', 'gestor']))


class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    senha = fields.String(required=True)


class UserUpdateSchema(Schema):
    nome = fields.String(validate=validate.Length(min=2, max=120))
    senha = fields.String(validate=validate.Length(min=6, max=128))
    ativo = fields.Boolean()


class UserSchema(Schema):
    id = fields.Integer(dump_only=True)
    email = fields.Email()
    nome = fields.String()
    perfil = fields.String()
    ativo = fields.Boolean()
    criado_em = fields.DateTime(dump_only=True)
    atualizado_em = fields.DateTime(dump_only=True)
