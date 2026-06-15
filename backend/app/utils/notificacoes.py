"""Notificações por e-mail disparadas em eventos do ciclo de vida de requisitos."""
import os
from flask import current_app
from app.utils.mailer import get_mailer

_FRONTEND = lambda: os.environ.get('FRONTEND_URL', 'http://localhost:5173')

_STATUS_LABELS = {
    'aprovado': 'Aprovado',
    'aprovado_com_ressalvas': 'Aprovado com Ressalvas',
    'rejeitado': 'Rejeitado',
}

_STATUS_COLORS = {
    'aprovado': '#16a34a',
    'aprovado_com_ressalvas': '#eab308',
    'rejeitado': '#dc2626',
}


def _html(titulo_email: str, subtitulo: str, corpo_html: str, btn_label: str, btn_href: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:16px;overflow:hidden;
               box-shadow:0 4px 24px rgba(26,102,52,0.10);border:1px solid #bbf7d0;">
        <tr>
          <td style="background:#1a6634;padding:24px 36px;text-align:center;">
            <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">ScopePlan</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px 24px;">
            <h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a;">{titulo_email}</h1>
            <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">{subtitulo}</p>
            {corpo_html}
            <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
              <tr>
                <td style="background:#1a6634;border-radius:10px;">
                  <a href="{btn_href}"
                    style="display:inline-block;padding:13px 28px;font-size:14px;
                           font-weight:700;color:#ffffff;text-decoration:none;">
                    {btn_label}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:14px 36px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">© 2026 ScopePlan · Todos os direitos reservados.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _req_card(req, projeto_nome: str) -> str:
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;margin-bottom:20px;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#166534;
                    text-transform:uppercase;letter-spacing:.08em;">Projeto</p>
          <p style="margin:0 0 10px;font-size:14px;color:#0f172a;">{projeto_nome}</p>
          <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#166534;
                    text-transform:uppercase;letter-spacing:.08em;">Requisito</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">
            {req.codigo or ''} {req.titulo}
          </p>
        </td>
      </tr>
    </table>"""


# ── Analista submete para revisão → notifica cliente ─────────────────────────

def notificar_cliente_revisao(requirement, projeto, cliente):
    """Dispara e-mail ao cliente quando um requisito entra em revisão."""
    if not cliente or not getattr(cliente, 'email', None):
        return
    try:
        link = f"{_FRONTEND()}/login"
        corpo = _req_card(requirement, projeto.nome) + f"""
        <p style="font-size:14px;color:#374151;line-height:1.6;margin:0;">
          Um requisito foi submetido para sua revisão e aguarda sua aprovação no projeto
          <strong>{projeto.nome}</strong>.
        </p>"""
        html = _html(
            titulo_email='Requisito aguardando sua revisão',
            subtitulo=f'Ação necessária em {projeto.nome}',
            corpo_html=corpo,
            btn_label='Revisar agora',
            btn_href=link,
        )
        texto = (
            f"Olá!\n\n"
            f"O requisito '{requirement.codigo or ''} {requirement.titulo}' "
            f"foi submetido para revisão no projeto '{projeto.nome}'.\n\n"
            f"Acesse o sistema para aprovar ou rejeitar:\n{link}\n\n"
            f"— Equipe ScopePlan"
        )
        get_mailer().send(
            cliente.email,
            f'[ScopePlan] Requisito aguardando revisão — {projeto.nome}',
            texto,
            html=html,
        )
    except Exception:
        current_app.logger.exception('Falha ao notificar cliente sobre revisão')


# ── Cliente valida → notifica analista autor ─────────────────────────────────

def notificar_analista_validacao(requirement, projeto, autor, resultado: str, comentario: str | None, cliente_nome: str):
    """Dispara e-mail ao analista autor quando o cliente valida um requisito."""
    if not autor or not getattr(autor, 'email', None):
        return
    try:
        link = f"{_FRONTEND()}/login"
        status_label = _STATUS_LABELS.get(resultado, resultado)
        status_color = _STATUS_COLORS.get(resultado, '#6b7280')

        comentario_html = ''
        if comentario:
            comentario_html = f"""
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#fef9f0;border:1.5px solid #fde68a;border-radius:10px;margin:16px 0 0;">
              <tr>
                <td style="padding:12px 16px;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#92400e;
                            text-transform:uppercase;letter-spacing:.08em;">Comentário do cliente</p>
                  <p style="margin:0;font-size:13px;color:#374151;line-height:1.5;">{comentario}</p>
                </td>
              </tr>
            </table>"""

        corpo = _req_card(requirement, projeto.nome) + f"""
        <p style="margin:0;font-size:13px;color:#6b7280;">
          <strong>{cliente_nome}</strong> avaliou o requisito com o status:
        </p>
        <p style="margin:8px 0 0;font-size:18px;font-weight:800;color:{status_color};">
          {status_label}
        </p>
        {comentario_html}"""

        html = _html(
            titulo_email=f'Requisito {status_label.lower()}',
            subtitulo=f'Validação registrada em {projeto.nome}',
            corpo_html=corpo,
            btn_label='Ver no projeto',
            btn_href=link,
        )
        texto = (
            f"Olá!\n\n"
            f"{cliente_nome} avaliou o requisito '{requirement.codigo or ''} {requirement.titulo}' "
            f"no projeto '{projeto.nome}' com o resultado: {status_label}.\n"
            + (f"Comentário: {comentario}\n" if comentario else '')
            + f"\nAcesse o projeto:\n{link}\n\n— Equipe ScopePlan"
        )
        get_mailer().send(
            autor.email,
            f'[ScopePlan] Requisito {status_label.lower()} — {projeto.nome}',
            texto,
            html=html,
        )
    except Exception:
        current_app.logger.exception('Falha ao notificar analista sobre validação')
