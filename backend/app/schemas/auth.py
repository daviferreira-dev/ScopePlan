from marshmallow import Schema, fields, validate, RAISE


class UserRegistrationSchema(Schema):
    nome = fields.String(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    senha = fields.String(required=True, validate=validate.Length(min=6, max=128))
    perfil = fields.String(required=True, validate=validate.OneOf(['analista', 'desenvolvedor', 'cliente']))


class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    senha = fields.String(required=True)


class UserUpdateSchema(Schema):
    class Meta:
        unknown = RAISE

    nome = fields.String(validate=validate.Length(min=2, max=120))
    senha = fields.String(validate=validate.Length(min=6, max=128))
    senha_atual = fields.String(validate=validate.Length(min=1, max=128))
    ativo = fields.Boolean()
