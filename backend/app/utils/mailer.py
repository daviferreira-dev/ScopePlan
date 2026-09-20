"""Camada de e-mail desacoplada (adapter plugável).

Dev:  ConsoleMailer — loga a mensagem, custo e setup zero.
Prod: BrevoMailer — API HTTPS da Brevo (plano free, sem domínio próprio).
      SmtpMailer  — usa smtplib da stdlib; hosts free (ex.: Render) bloqueiam
                    as portas SMTP, então lá use brevo.

Seleção via env MAIL_BACKEND=console|smtp|brevo. Trocar de dev→prod é só mudar a env;
as rotas chamam sempre get_mailer().send(...).
"""
import json
import os
import smtplib
import urllib.error
import urllib.request
from email.message import EmailMessage
from flask import current_app


class ConsoleMailer:
    def send(self, to: str, subject: str, body: str, html: str | None = None) -> None:
        current_app.logger.info(f"[MAIL→{to}] {subject}\n{body}")


class SmtpMailer:
    def __init__(self):
        self.host = os.environ.get('SMTP_HOST', 'localhost')
        self.port = int(os.environ.get('SMTP_PORT', '587'))
        self.user = os.environ.get('SMTP_USER')
        # App passwords do Gmail são exibidas em blocos com espaços — removê-los.
        pwd = os.environ.get('SMTP_PASSWORD') or ''
        self.password = pwd.replace(' ', '') or None
        self.sender = os.environ.get('MAIL_FROM', 'no-reply@scopeplan.app')

    def send(self, to: str, subject: str, body: str, html: str | None = None) -> None:
        msg = EmailMessage()
        msg['From'] = self.sender
        msg['To'] = to
        msg['Subject'] = subject
        msg.set_content(body)
        if html:
            msg.add_alternative(html, subtype='html')
        with smtplib.SMTP(self.host, self.port) as server:
            server.starttls()
            if self.user and self.password:
                server.login(self.user, self.password)
            server.send_message(msg)


class BrevoMailer:
    """Envio via API HTTPS da Brevo — funciona onde as portas SMTP são bloqueadas."""
    URL = 'https://api.brevo.com/v3/smtp/email'

    def __init__(self):
        self.api_key = os.environ.get('BREVO_API_KEY')
        if not self.api_key:
            raise RuntimeError('BREVO_API_KEY é obrigatório com MAIL_BACKEND=brevo')
        # MAIL_FROM precisa ser um remetente verificado na Brevo.
        self.sender = os.environ.get('MAIL_FROM', 'no-reply@scopeplan.app')

    def send(self, to: str, subject: str, body: str, html: str | None = None) -> None:
        payload = {
            'sender': {'name': 'ScopePlan', 'email': self.sender},
            'to': [{'email': to}],
            'subject': subject,
            'textContent': body,
        }
        if html:
            payload['htmlContent'] = html
        req = urllib.request.Request(
            self.URL,
            data=json.dumps(payload).encode('utf-8'),
            headers={'api-key': self.api_key, 'content-type': 'application/json',
                     'accept': 'application/json'},
            method='POST',
        )
        try:
            with urllib.request.urlopen(req, timeout=15):
                pass
        except urllib.error.HTTPError as e:
            raise RuntimeError(f'Brevo recusou o envio ({e.code}): {e.read().decode("utf-8", "replace")}') from e


def get_mailer():
    backend = os.environ.get('MAIL_BACKEND', 'console').lower()
    if backend == 'brevo':
        return BrevoMailer()
    return SmtpMailer() if backend == 'smtp' else ConsoleMailer()
