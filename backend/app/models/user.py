from datetime import datetime, timezone
import bcrypt
from app import db
from app.utils.crypto import EncryptedString, email_lookup_hash


class User(db.Model):
    __tablename__ = 'usuarios'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    # nome is encrypted at rest; String(200) accommodates Fernet token overhead
    nome = db.Column(EncryptedString(200), nullable=False)
    # email stores the encrypted value; uniqueness is enforced via email_lookup
    email = db.Column(EncryptedString(500), nullable=False)
    # Deterministic HMAC hash — the actual column used in WHERE clauses
    email_lookup = db.Column(db.String(64), unique=True, nullable=True, index=True)
    senha_hash = db.Column(db.String(255), nullable=False)
    perfil = db.Column(db.String(20), nullable=False, default='analista')
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    atualizado_em = db.Column(db.DateTime, nullable=False,
                              default=lambda: datetime.now(timezone.utc),
                              onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    projetos = db.relationship('Project', backref='gestor', lazy='select', foreign_keys='Project.gestor_id')
    requisitos_criados = db.relationship('Requirement', backref='autor', lazy='select',
                                         foreign_keys='Requirement.autor_id')
    validacoes = db.relationship('Validacao', backref='validador', lazy='select',
                                  foreign_keys='Validacao.validador_id')

    __table_args__ = (
        db.CheckConstraint(
            "perfil IN ('analista', 'desenvolvedor', 'cliente', 'gestor')",
            name='ck_usuarios_perfil'
        ),
    )

    # ── Credential helpers ─────────────────────────────────────────────────────

    def set_password(self, password: str):
        self.senha_hash = bcrypt.hashpw(
            password.encode('utf-8'), bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), self.senha_hash.encode('utf-8'))

    def set_email(self, email: str):
        """Set the email field (encrypted) and its deterministic lookup hash."""
        self.email = email  # EncryptedString handles encryption
        self.email_lookup = email_lookup_hash(email)

    # ── Serialisation ─────────────────────────────────────────────────────────

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,   # auto-decrypted by EncryptedString
            'email': self.email, # auto-decrypted by EncryptedString
            'perfil': self.perfil,
            'ativo': self.ativo,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
            'atualizado_em': self.atualizado_em.isoformat() if self.atualizado_em else None,
        }
