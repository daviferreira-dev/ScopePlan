from datetime import datetime, timezone
from app import db


class Comentario(db.Model):
    """RF08: comentário em requisito, com suporte a respostas aninhadas (até 3 níveis)."""
    __tablename__ = 'comentarios'
    __table_args__ = (
        db.Index('ix_comentarios_requisito_ativo', 'requisito_id', 'ativo'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    requisito_id = db.Column(db.Integer, db.ForeignKey('requisitos.id', ondelete='CASCADE'), nullable=False, index=True)
    autor_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True, index=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('comentarios.id', ondelete='CASCADE'), nullable=True, index=True)
    texto = db.Column(db.Text, nullable=False)
    oculto = db.Column(db.Boolean, nullable=False, default=False)  # RF08-A2
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    editado_em = db.Column(db.DateTime, nullable=True)

    autor = db.relationship('User', foreign_keys=[autor_id], lazy='joined')

    def to_dict(self):
        return {
            'id': self.id,
            'requisito_id': self.requisito_id,
            'autor_id': self.autor_id,
            'autor': self.autor.to_dict() if self.autor else None,
            'parent_id': self.parent_id,
            'texto': '[comentário ocultado]' if self.oculto else self.texto,
            'oculto': self.oculto,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
            'editado_em': self.editado_em.isoformat() if self.editado_em else None,
        }
