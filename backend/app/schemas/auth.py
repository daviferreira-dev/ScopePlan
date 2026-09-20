import re
from marshmallow import Schema, fields, validate, ValidationError, RAISE
from app.utils.email_validation import is_email_deliverable


def validate_email_domain(value):
    """Valida que o e-mail tem formato correto e domínio que aceita e-mails (MX).

    Pode ser desligado via config VALIDATE_EMAIL_DOMAIN=False (usado em testes).
    """
    from flask import current_app
    if not current_app.config.get('VALIDATE_EMAIL_DOMAIN', True):
        return
    if not is_email_deliverable(value):
        raise ValidationError('E-mail inválido ou domínio inexistente. Verifique o endereço.')

# RF01-A1: senha forte — mín. 8 caracteres, 1 maiúscula, 1 número, 1 especial
PASSWORD_REGEX = re.compile(r'^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$')
PASSWORD_MESSAGE = (
    'A senha deve ter no mínimo 8 caracteres, incluindo ao menos '
    '1 letra maiúscula, 1 número e 1 caractere especial.'
)


def validate_password_strength(value):
    """Valida a força da senha conforme RF01-A1 da ERS."""
    if not value or not PASSWORD_REGEX.match(value):
        raise ValidationError(PASSWORD_MESSAGE)


class UserRegistrationSchema(Schema):
    nome = fields.String(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True, validate=validate_email_domain)
    senha = fields.String(required=True, validate=validate_password_strength)
    perfil = fields.String(required=True, validate=validate.OneOf(['analista', 'desenvolvedor', 'cliente']))


class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    senha = fields.String(required=True)


class ForgotPasswordSchema(Schema):
    email = fields.Email(required=True)


# Código OTP de exatamente 6 dígitos
CODE_VALIDATOR = validate.Regexp(r'^\d{6}$', error='O código deve ter 6 dígitos.')


class VerifyResetCodeSchema(Schema):
    email = fields.Email(required=True)
    code = fields.String(required=True, validate=CODE_VALIDATOR)


class ResetPasswordSchema(Schema):
    email = fields.Email(required=True)
    code = fields.String(required=True, validate=CODE_VALIDATOR)
    senha = fields.String(required=True, validate=validate_password_strength)


class UserUpdateSchema(Schema):
    class Meta:
        unknown = RAISE

    nome = fields.String(validate=validate.Length(min=2, max=120))
    senha = fields.String(validate=validate_password_strength)
    senha_atual = fields.String(validate=validate.Length(min=1, max=128))
    ativo = fields.Boolean()
