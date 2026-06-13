"""Camada de e-mail desacoplada (adapter plugável).

Dev:  ConsoleMailer — loga a mensagem, custo e setup zero.
Prod: SmtpMailer  — usa smtplib da stdlib (sem dependência paga).

Seleção via env MAIL_BACKEND=console|smtp. Trocar de dev→prod é só mudar a env;
as rotas chamam sempre get_mailer().send(...).
"""
import os
import smtplib
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


def get_mailer():
    backend = os.environ.get('MAIL_BACKEND', 'console').lower()
    return SmtpMailer() if backend == 'smtp' else ConsoleMailer()
