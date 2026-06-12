from datetime import datetime, timezone
from app import db


class Validacao(db.Model):
    __tablename__ = 'validacoes'
    __table_args__ = (
        db.CheckConstraint(
            "resultado IN ('aprovado', 'rejeitado', 'aprovado_com_ressalvas')",
            name='ck_validacoes_resultado'
        ),
        db.UniqueConstraint('requisito_id', 'validador_id', name='uq_validacao_requisito_validador'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    requisito_id = db.Column(db.Integer, db.ForeignKey('requisitos.id', ondelete='CASCADE'), nullable=False, index=True)
    validador_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True, index=True)
    resultado = db.Column(db.String(30), nullable=False)
    comentario = db.Column(db.Text)
    validado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        """Convert validacao to dictionary"""
        return {
            'id': self.id,
            'requisito_id': self.requisito_id,
            'validador_id': self.validador_id,
            'validador': self.validador.to_dict() if self.validador else None,
            'resultado': self.resultado,
            'comentario': self.comentario,
            'validado_em': self.validado_em.isoformat() if self.validado_em else None
        }
