from datetime import datetime, timezone, timedelta
from uuid import uuid4
from app import db


class ConviteProjeto(db.Model):
    __tablename__ = 'convites_projeto'
    __table_args__ = (
        db.CheckConstraint(
            "perfil IN ('analista', 'cliente', 'desenvolvedor', 'gestor')",
            name='ck_convites_perfil'
        ),
        db.CheckConstraint(
            "status IN ('pendente', 'aceito', 'cancelado')",
            name='ck_convites_status'
        ),
        db.Index('ix_convites_token', 'token', unique=True),
        db.Index('ix_convites_projeto', 'projeto_id', 'status'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id'), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    perfil = db.Column(db.String(20), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False,
                      default=lambda: uuid4().hex)
    status = db.Column(db.String(20), nullable=False, default='pendente')
    convidado_por_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    aceito_por_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=True)
    criado_em = db.Column(db.DateTime, nullable=False,
                          default=lambda: datetime.now(timezone.utc))
    expira_em = db.Column(db.DateTime, nullable=False,
                          default=lambda: datetime.now(timezone.utc) + timedelta(days=7))

    projeto = db.relationship('Project', backref='convites', lazy='select')
    convidado_por = db.relationship('User', foreign_keys=[convidado_por_id], lazy='select')
    aceito_por = db.relationship('User', foreign_keys=[aceito_por_id], lazy='select')

    @property
    def expirado(self):
        return datetime.now(timezone.utc) > self.expira_em.replace(tzinfo=timezone.utc)

    def to_dict(self):
        return {
            'id': self.id,
            'projeto_id': self.projeto_id,
            'email': self.email,
            'perfil': self.perfil,
            'token': self.token,
            'status': self.status,
            'expirado': self.expirado,
            'convidado_por': self.convidado_por.to_dict() if self.convidado_por else None,
            'aceito_por': self.aceito_por.to_dict() if self.aceito_por else None,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
            'expira_em': self.expira_em.isoformat() if self.expira_em else None,
        }
