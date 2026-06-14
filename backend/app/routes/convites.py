import os
from datetime import datetime, timezone
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app import db
from app.models import User, AuditLog
from app.models.convite_projeto import ConviteProjeto
from app.models.membro_projeto import MembroProjeto
from app.models.project import Project
from app.utils.access import check_user_project_access
from app.utils.mailer import get_mailer

convites_bp = Blueprint('convites', __name__)

PERFIS_PERMITIDOS = ('cliente', 'desenvolvedor', 'gestor')
PERFIL_LABELS = {'cliente': 'Cliente', 'desenvolvedor': 'Desenvolvedor', 'gestor': 'Gestor'}


def _frontend_url():
    return os.environ.get('FRONTEND_URL', 'http://localhost:5173')


# ── Verificar se email já tem conta ──────────────────────────────────────────

@convites_bp.route('/api/convites/verificar-email', methods=['POST'])
@jwt_required()
def verificar_email():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.perfil not in ('analista', 'gestor'):
        return {'message': 'Acesso não autorizado'}, 403

    body = request.get_json(silent=True) or {}
    email = (body.get('email') or '').strip().lower()
    if not email:
        return {'message': 'E-mail obrigatório'}, 400

    from app.utils.crypto import email_lookup_hash
    found = User.query.filter_by(email_lookup=email_lookup_hash(email)).first()
    if not found:
        return {'existe': False}, 200

    return {
        'existe': True,
        'perfil': found.perfil,
        'nome': found.nome,
    }, 200


# ── Listar convites do projeto ────────────────────────────────────────────────

@convites_bp.route('/api/projetos/<int:project_id>/convites', methods=['GET'])
@jwt_required()
def listar_convites(project_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas e gestores podem gerenciar convites'}, 403

    _, error = check_user_project_access(user, project_id)
    if error:
        return error

    convites = ConviteProjeto.query.filter_by(projeto_id=project_id).order_by(
        ConviteProjeto.criado_em.desc()
    ).all()
    return {'convites': [c.to_dict() for c in convites]}, 200


# ── Criar/enviar convite ──────────────────────────────────────────────────────

@convites_bp.route('/api/projetos/<int:project_id>/convites', methods=['POST'])
@jwt_required()
def criar_convite(project_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas e gestores podem enviar convites'}, 403

    project, error = check_user_project_access(user, project_id)
    if error:
        return error

    body = request.get_json(silent=True) or {}
    email = (body.get('email') or '').strip().lower()
    perfil = (body.get('perfil') or '').strip()

    if not email:
        return {'message': 'E-mail obrigatório'}, 400
    if perfil not in PERFIS_PERMITIDOS:
        return {'message': f'Perfil deve ser: {", ".join(PERFIS_PERMITIDOS)}'}, 400

    # Cancela convite pendente anterior para o mesmo email/projeto/perfil
    existing = ConviteProjeto.query.filter_by(
        projeto_id=project_id, email=email, perfil=perfil, status='pendente'
    ).first()
    if existing:
        existing.status = 'cancelado'

    convite = ConviteProjeto(
        projeto_id=project_id,
        email=email,
        perfil=perfil,
        convidado_por_id=user_id,
    )
    db.session.add(convite)
    db.session.flush()  # get convite.token

    # Send invite email
    link = f'{_frontend_url()}/convite/{convite.token}'
    cadastro_link = f'{_frontend_url()}/cadastro'
    perfil_label = PERFIL_LABELS.get(perfil, perfil.capitalize())

    body_text = (
        f'Olá!\n\n'
        f'{user.nome} convidou você para participar do projeto '
        f'"{project.nome}" no ScopePlan como {perfil_label}.\n\n'
        f'Acesse o link abaixo para aceitar o convite:\n'
        f'{link}\n\n'
        f'O link expira em 7 dias.\n\n'
        f'Caso ainda não tenha uma conta, crie uma em:\n'
        f'{cadastro_link}\n\n'
        f'— Equipe ScopePlan'
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
            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Você recebeu um convite de <strong style="color:#1a6634;">{user.nome}</strong></p>
            <h1 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">{project.nome}</h1>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.08em;">Seu perfil no projeto</p>
                  <p style="margin:0;font-size:16px;font-weight:700;color:#166534;">{perfil_label}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
              Clique no botão abaixo para aceitar o convite e acessar o projeto.
              O link expira em <strong>7 dias</strong>.
            </p>

            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#1a6634;border-radius:10px;">
                  <a href="{link}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                    Aceitar convite
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">Ou copie e cole o link no navegador:</p>
            <p style="margin:0 0 24px;font-size:11px;color:#1a6634;word-break:break-all;">{link}</p>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin-bottom:20px;">

            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              Ainda não tem uma conta? <a href="{cadastro_link}" style="color:#1a6634;font-weight:600;">Cadastre-se aqui</a> e depois acesse o link do convite.<br>
              Se você não esperava este convite, pode ignorar este e-mail com segurança.
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

    try:
        get_mailer().send(
            email,
            f'Convite para o projeto "{project.nome}" — ScopePlan',
            body_text,
            html=body_html,
        )
    except Exception as exc:
        current_app.logger.exception('Falha ao enviar e-mail de convite')
        db.session.rollback()
        return {'message': f'Erro ao enviar e-mail: {exc}'}, 500

    AuditLog.log(user_id, 'convite_enviado', 'projeto', project_id, project_id,
                 {'email': email, 'perfil': perfil})

    db.session.commit()
    return {'message': 'Convite enviado com sucesso', 'convite': convite.to_dict()}, 201


# ── Cancelar convite ──────────────────────────────────────────────────────────

@convites_bp.route('/api/projetos/<int:project_id>/convites/<int:convite_id>', methods=['DELETE'])
@jwt_required()
def cancelar_convite(project_id, convite_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404
    if user.perfil not in ('analista', 'gestor'):
        return {'message': 'Apenas analistas e gestores podem cancelar convites'}, 403

    _, error = check_user_project_access(user, project_id)
    if error:
        return error

    convite = ConviteProjeto.query.filter_by(id=convite_id, projeto_id=project_id).first()
    if not convite:
        return {'message': 'Convite não encontrado'}, 404
    if convite.status != 'pendente':
        return {'message': 'Apenas convites pendentes podem ser cancelados'}, 400

    convite.status = 'cancelado'
    AuditLog.log(user_id, 'convite_cancelado', 'projeto', project_id, project_id,
                 {'email': convite.email, 'perfil': convite.perfil})
    db.session.commit()
    return {'message': 'Convite cancelado'}, 200


# ── Info pública do convite (sem auth) ───────────────────────────────────────

@convites_bp.route('/api/convites/<string:token>', methods=['GET'])
def info_convite(token):
    convite = ConviteProjeto.query.filter_by(token=token).first()
    if not convite:
        return {'message': 'Convite não encontrado'}, 404

    from app.utils.crypto import email_lookup_hash
    email_existe = User.query.filter_by(
        email_lookup=email_lookup_hash(convite.email)
    ).first() is not None

    project = db.session.get(Project, convite.projeto_id)
    return {
        'convite': convite.to_dict(),
        'projeto': {
            'id': project.id,
            'nome': project.nome,
            'descricao': project.descricao,
        } if project else None,
        'email_existe': email_existe,
    }, 200


# ── Aceitar convite ───────────────────────────────────────────────────────────

@convites_bp.route('/api/convites/<string:token>/aceitar', methods=['POST'])
@jwt_required()
def aceitar_convite(token):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    convite = ConviteProjeto.query.filter_by(token=token).first()
    if not convite:
        return {'message': 'Convite não encontrado'}, 404
    if convite.status == 'aceito':
        return {'message': 'Este convite já foi aceito'}, 400
    if convite.status == 'cancelado':
        return {'message': 'Este convite foi cancelado'}, 400
    if convite.expirado:
        convite.status = 'cancelado'
        db.session.commit()
        return {'message': 'Este convite expirou'}, 400
    if user.perfil != convite.perfil:
        return {
            'message': (
                f'Este convite é para um {convite.perfil}. '
                f'Sua conta é do tipo {user.perfil}.'
            )
        }, 403

    project = db.session.get(Project, convite.projeto_id)
    if not project or not project.ativo:
        return {'message': 'Projeto não encontrado'}, 404

    if convite.perfil in ('desenvolvedor', 'gestor'):
        # Gestor convidado entra como membro do projeto (não substitui o dono/gestor_id)
        already = MembroProjeto.query.filter_by(
            projeto_id=convite.projeto_id, usuario_id=user_id
        ).first()
        if not already:
            db.session.add(MembroProjeto(
                projeto_id=convite.projeto_id,
                usuario_id=user_id,
            ))

    elif convite.perfil == 'cliente':
        project.cliente_id = user_id
        project.nome_cliente = user.nome

    convite.status = 'aceito'
    convite.aceito_por_id = user_id

    AuditLog.log(user_id, 'convite_aceito', 'projeto', project.id, project.id,
                 {'email': convite.email, 'perfil': convite.perfil})

    db.session.commit()
    return {
        'message': 'Convite aceito com sucesso! Você agora tem acesso ao projeto.',
        'projeto_id': project.id,
        'perfil': convite.perfil,
    }, 200
