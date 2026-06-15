from datetime import datetime, timezone
from app import db
from app.utils.time_utils import utc_iso


class Assinatura(db.Model):
    __tablename__ = 'assinaturas'
    __table_args__ = (
        db.UniqueConstraint('requisito_id', 'signatario_id', name='uq_assinatura_req_signatario'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    requisito_id = db.Column(db.Integer, db.ForeignKey('requisitos.id', ondelete='CASCADE'), nullable=False, index=True)
    signatario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True, index=True)
    declaracao = db.Column(db.Text)
    assinado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    signatario = db.relationship('User', foreign_keys=[signatario_id])

    def to_dict(self):
        return {
            'id': self.id,
            'requisito_id': self.requisito_id,
            'signatario_id': self.signatario_id,
            'signatario': self.signatario.to_dict() if self.signatario else None,
            'declaracao': self.declaracao,
            'assinado_em': utc_iso(self.assinado_em),
        }
