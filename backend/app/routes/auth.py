import os
from flask import Blueprint, request, make_response, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt, decode_token
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from app import db
from app.models import User, AuditLog, TokenBlocklist
from sqlalchemy.exc import IntegrityError
from app.schemas import UserRegistrationSchema, UserLoginSchema, UserUpdateSchema
from app.schemas.auth import PASSWORD_REGEX, PASSWORD_MESSAGE
from app.schemas.auth import ForgotPasswordSchema, ResetPasswordSchema, VerifyResetCodeSchema
from app.models import PasswordResetToken
from app.utils.mailer import get_mailer
from app.utils.decorators import validate_json
from app.utils.crypto import email_lookup_hash

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

limiter = None


def init_limiter(app):
    global limiter
    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri=app.config.get('RATE_LIMIT_STORAGE_URI', 'memory://'),
        default_limits=[],
    )
    limiter.init_app(app)

    register_limit = app.config.get('RATE_LIMIT_REGISTER', '3/minute')
    login_limit = app.config.get('RATE_LIMIT_AUTH', '5/minute')

    limiter.limit(register_limit)(register)
    limiter.limit(login_limit)(login)
    limiter.limit('3/minute')(forgot_password)
    limiter.limit('10/minute')(verify_reset_code)
    limiter.limit('5/minute')(reset_password)


def _set_refresh_cookie(response, refresh_token):
    """Set the refresh token as an HttpOnly cookie on the response."""
    is_prod = current_app.config.get('ENV') == 'production' or os.environ.get('FLASK_ENV') == 'production'
    response.set_cookie(
        'refresh_token_cookie',
        value=refresh_token,
        httponly=True,
        secure=is_prod,
        samesite='Strict' if is_prod else 'Lax',
        max_age=30 * 24 * 60 * 60,  # 30 days in seconds (matches JWT_REFRESH_TOKEN_EXPIRES)
        path='/api/auth',  # Covers both /refresh and /logout
    )
    return response


def _clear_refresh_cookie(response):
    """Clear the refresh token cookie on the response."""
    response.delete_cookie('refresh_token_cookie', path='/api/auth')
    return response


@auth_bp.route('/register', methods=['POST'])
@validate_json(UserRegistrationSchema)
def register():
    data = request.validated_data

    if User.query.filter_by(email_lookup=email_lookup_hash(data['email'])).first():
        return {'message': 'Email ja cadastrado'}, 409

    user = User(
        nome=data['nome'],
        perfil=data['perfil'],
        ativo=True
    )
    user.set_email(data['email'])
    user.set_password(data['senha'])

    db.session.add(user)
    try:
        db.session.flush()
    except IntegrityError:
        db.session.rollback()
        return {'message': 'Email ja cadastrado'}, 409

    AuditLog.log(user.id, 'criacao', 'usuario', user.id, None, {'email': user.email, 'perfil': user.perfil})

    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    # Set refresh token as HttpOnly cookie; return only access_token in JSON
    response = make_response(jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 201)
    _set_refresh_cookie(response, refresh_token)
    return response


@auth_bp.route('/login', methods=['POST'])
@validate_json(UserLoginSchema)
def login():
    data = request.validated_data

    user = User.query.filter_by(email_lookup=email_lookup_hash(data['email'])).first()
    if not user or not user.check_password(data['senha']):
        return {'message': 'Credenciais invalidas'}, 401

    if not user.ativo:
        return {'message': 'Conta desativada'}, 403

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    AuditLog.log(user.id, 'login', 'usuario', user.id, None, {'email': user.email})

    db.session.commit()

    # Set refresh token as HttpOnly cookie; return only access_token in JSON
    response = make_response(jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 200)
    _set_refresh_cookie(response, refresh_token)
    return response


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using the refresh token from the HttpOnly cookie.

    The refresh token is sent automatically by the browser via cookie
    (path=/api/auth). jwt_required(refresh=True) validates it.
    Token rotation: a new refresh token cookie is set on the response.
    """
    identity = int(get_jwt_identity())

    # Verify user is still active
    user = db.session.get(User, identity)
    if not user or not user.ativo:
        return {'message': 'Usuário desativado'}, 403

    access_token = create_access_token(identity=str(identity))
    new_refresh_token = create_refresh_token(identity=str(identity))

    # Token rotation: set new refresh token cookie
    response = make_response(jsonify({
        'access_token': access_token
    }), 200)
    _set_refresh_cookie(response, new_refresh_token)

    # Block the old refresh token (rotation)
    old_token = get_jwt()
    if old_token:
        old_jti = old_token.get('jti')
        old_exp = old_token.get('exp')
        if old_jti:
            TokenBlocklist.revoke(old_jti, expires_at=old_exp)

    return response


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout: block the refresh token from the cookie and clear it.

    The access token is used to authenticate (identify the user).
    The refresh token comes from the HttpOnly cookie (path=/api/auth).
    """
    # Block the current access token
    access_token_data = get_jwt()
    access_jti = access_token_data['jti']
    access_exp = access_token_data.get('exp')
    TokenBlocklist.revoke(access_jti, expires_at=access_exp)

    # Read refresh token from cookie and block it too
    refresh_token_str = request.cookies.get('refresh_token_cookie')
    if refresh_token_str:
        try:
            decoded = decode_token(refresh_token_str)
            refresh_jti = decoded.get('jti')
            refresh_exp = decoded.get('exp')
            if refresh_jti:
                TokenBlocklist.revoke(refresh_jti, expires_at=refresh_exp)
        except Exception:
            pass  # Token may be invalid/expired — just skip blocking it

    # Clear the refresh token cookie
    response = make_response(jsonify({'message': 'Logout realizado'}), 200)
    _clear_refresh_cookie(response)
    return response


def _build_reset_email(code):
    """Retorna (texto, html) no mesmo padrão visual do e-mail de convite."""
    body_text = (
        f'Seu código de recuperação de senha do ScopePlan é:\n\n'
        f'    {code}\n\n'
        f'Digite-o na tela de recuperação para definir uma nova senha.\n'
        f'O código expira em 15 minutos. Se não foi você, ignore este e-mail.'
    )

    body_html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,102,52,0.10);border:1px solid #bbf7d0;">

        <!-- Header -->
        <tr>
          <td style="background:#1a6634;padding:28px 36px;text-align:center;">
            <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">ScopePlan</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 28px;">
            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Recuperação de senha</p>
            <h1 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">Seu código de acesso</h1>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px;text-align:center;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.08em;">Código de recuperação</p>
                  <p style="margin:0;font-size:32px;font-weight:800;color:#166534;letter-spacing:0.3em;">{code}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
              Digite o código acima na tela de recuperação para definir uma nova senha.
              O código expira em <strong>15 minutos</strong>.
            </p>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin-bottom:20px;">

            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              Se você não solicitou a recuperação de senha, pode ignorar este e-mail com segurança.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:16px 36px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">© 2026 ScopePlan · Todos os direitos reservados.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

    return body_text, body_html


@auth_bp.route('/forgot-password', methods=['POST'])
@validate_json(ForgotPasswordSchema)
def forgot_password():
    """RF01-A5: envia um código de 6 dígitos para o e-mail cadastrado.

    Informa explicitamente quando o e-mail não está cadastrado e só envia o
    código para contas existentes e ativas.
    """
    email = request.validated_data['email']
    user = User.query.filter_by(email_lookup=email_lookup_hash(email)).first()

    if not user or not user.ativo:
        return {'message': 'E-mail não cadastrado no sistema.'}, 404

    code, _ = PasswordResetToken.issue(user.id)
    AuditLog.log(user.id, 'reset_solicitado', 'usuario', user.id, None, {'email': user.email})
    db.session.commit()

    try:
        reset_text, reset_html = _build_reset_email(code)
        get_mailer().send(user.email, 'Código de recuperação de senha — ScopePlan',
                          reset_text, html=reset_html)
    except Exception:
        current_app.logger.exception('Falha ao enviar e-mail de reset')
        return {'message': 'Não foi possível enviar o e-mail de recuperação. Tente novamente.'}, 502

    response = {'message': 'Enviamos um código de recuperação para o seu e-mail.'}
    # Dev/teste: devolve o código direto na resposta (nunca em produção)
    if current_app.config.get('EXPOSE_RESET_LINK'):
        response['reset_code'] = code

    return response, 200


@auth_bp.route('/verify-reset-code', methods=['POST'])
@validate_json(VerifyResetCodeSchema)
def verify_reset_code():
    """RF01-A5: confere o código sem consumi-lo (libera a etapa de nova senha)."""
    data = request.validated_data
    user = User.query.filter_by(email_lookup=email_lookup_hash(data['email'])).first()

    prt = PasswordResetToken.verify(user.id, data['code']) if user and user.ativo else None
    db.session.commit()  # persiste contagem de tentativas / queima do código

    if not prt:
        return {'message': 'Código inválido ou expirado.'}, 400
    return {'message': 'Código verificado.'}, 200


@auth_bp.route('/reset-password', methods=['POST'])
@validate_json(ResetPasswordSchema)
def reset_password():
    """RF01-A5: valida o código e redefine a senha (single-use, expira em 15 min)."""
    data = request.validated_data
    user = User.query.filter_by(email_lookup=email_lookup_hash(data['email'])).first()

    prt = PasswordResetToken.verify(user.id, data['code']) if user and user.ativo else None
    if not prt:
        db.session.commit()  # persiste tentativa malsucedida
        return {'message': 'Código inválido ou expirado.'}, 400

    user.set_password(data['senha'])
    from datetime import datetime, timezone
    prt.used_at = datetime.now(timezone.utc)
    AuditLog.log(user.id, 'reset_concluido', 'usuario', user.id, None, {'email': user.email})
    db.session.commit()

    return {'message': 'Senha redefinida com sucesso'}, 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    identity = int(get_jwt_identity())
    user = db.session.get(User, identity)
    if not user:
        return {'message': 'Usuario nao encontrado'}, 404
    return {'user': user.to_dict()}, 200


@auth_bp.route('/clientes', methods=['GET'])
@jwt_required()
def list_clientes():
    """List all active users with perfil='cliente' — used in project creation."""
    identity = int(get_jwt_identity())
    current_user = db.session.get(User, identity)
    if not current_user or current_user.perfil not in ('analista', 'gestor'):
        return {'message': 'Acesso negado'}, 403
    clientes = User.query.filter_by(perfil='cliente', ativo=True).all()
    return {'clientes': [{'id': c.id, 'nome': c.nome, 'email': c.email} for c in clientes]}, 200


@auth_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    identity = int(get_jwt_identity())
    current_user = db.session.get(User, identity)
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuario nao encontrado'}, 404
    if identity != user_id and (not current_user or current_user.perfil != 'gestor'):
        return {'message': 'Acesso negado'}, 403
    return {'user': user.to_dict()}, 200


@auth_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    identity = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuario nao encontrado'}, 404
    if identity != user_id and user.perfil != 'admin':
        return {'message': 'Acesso negado'}, 403

    data = request.get_json()
    if not data:
        return {'message': 'Dados invalidos'}, 400

    # User cannot change their own active status (only admins can change others')
    if identity == user_id:
        data.pop('ativo', None)

    if 'nome' in data:
        user.nome = data['nome']
    if 'email' in data:
        existing = User.query.filter(
            User.email_lookup == email_lookup_hash(data['email']),
            User.id != user_id
        ).first()
        if existing:
            return {'message': 'Email ja cadastrado'}, 409
        user.set_email(data['email'])
    if 'perfil' in data and identity != user_id:
        user.perfil = data['perfil']
    if 'ativo' in data and identity != user_id:
        user.ativo = data['ativo']
    if 'senha' in data and data['senha']:
        # Users changing their own password must provide senha_atual
        if identity == user_id:
            senha_atual = data.get('senha_atual')
            if not senha_atual:
                return {'message': 'senha_atual é obrigatória para alterar a senha'}, 400
            if not user.check_password(senha_atual):
                return {'message': 'senha_atual incorreta'}, 401
        # RF01-A1: a nova senha também deve atender à política de senha forte
        if not PASSWORD_REGEX.match(data['senha']):
            return {'message': PASSWORD_MESSAGE}, 400
        user.set_password(data['senha'])

    AuditLog.log(identity, 'atualizacao', 'usuario', user_id, None, {'email': user.email})

    db.session.commit()
    return {'user': user.to_dict()}, 200
