from datetime import datetime, timezone
from app import db


class Validacao(db.Model):
    __tablename__ = 'validacoes'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    requisito_id = db.Column(db.Integer, db.ForeignKey('requisitos.id'), nullable=False)
    validador_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    resultado = db.Column(db.String(30), nullable=False, default='pendente')  # pendente, aprovado, aprovado_com_ressalvas, rejeitado
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
