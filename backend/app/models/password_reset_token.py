import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from app import db

# RF01-A5: código de recuperação (OTP) de 6 dígitos, válido por 15 minutos
RESET_TTL_MINUTES = 15
MAX_ATTEMPTS = 5


def hash_code(raw: str) -> str:
    """SHA-256 do código — só o hash é persistido (o código em claro nunca toca o banco)."""
    return hashlib.sha256(raw.encode()).hexdigest()


def _aware(dt):
    """Garante datetime tz-aware em UTC (SQLite devolve naive)."""
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'),
                           nullable=False, index=True)
    token_hash = db.Column(db.String(64), nullable=False, index=True)  # hash do código de 6 dígitos
    tentativas = db.Column(db.Integer, nullable=False, default=0)
    expires_at = db.Column(db.DateTime, nullable=False)
    used_at = db.Column(db.DateTime, nullable=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    @staticmethod
    def issue(user_id):
        """Invalida códigos anteriores e gera um novo de 6 dígitos.

        Retorna o código em claro (uma única vez, para envio por e-mail).
        """
        now = datetime.now(timezone.utc)
        # invalida qualquer código ativo anterior deste usuário
        PasswordResetToken.query.filter_by(usuario_id=user_id, used_at=None).update(
            {'used_at': now}, synchronize_session=False)

        code = f"{secrets.randbelow(1_000_000):06d}"
        entry = PasswordResetToken(
            usuario_id=user_id,
            token_hash=hash_code(code),
            expires_at=now + timedelta(minutes=RESET_TTL_MINUTES),
        )
        db.session.add(entry)
        return code, entry

    @staticmethod
    def _active_for(user_id):
        """Código mais recente ainda válido (não usado, não expirado) do usuário."""
        prt = (PasswordResetToken.query
               .filter_by(usuario_id=user_id, used_at=None)
               .order_by(PasswordResetToken.id.desc())
               .first())
        if not prt:
            return None
        if _aware(prt.expires_at) < datetime.now(timezone.utc):
            return None
        return prt

    @staticmethod
    def verify(user_id, code):
        """Valida o código sem consumi-lo. Conta tentativas e queima após o limite.

        Retorna o token válido ou None. NÃO faz commit — quem chama decide.
        """
        prt = PasswordResetToken._active_for(user_id)
        if not prt:
            return None
        if prt.tentativas >= MAX_ATTEMPTS:
            prt.used_at = datetime.now(timezone.utc)  # queima por excesso de tentativas
            return None
        if prt.token_hash != hash_code(code):
            prt.tentativas += 1
            if prt.tentativas >= MAX_ATTEMPTS:
                prt.used_at = datetime.now(timezone.utc)
            return None
        return prt
