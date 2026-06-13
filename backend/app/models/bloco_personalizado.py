from datetime import datetime, timezone
from app import db


class BlocoPersonalizado(db.Model):
    __tablename__ = 'blocos_personalizados'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id', ondelete='CASCADE'), nullable=False, index=True)
    nome = db.Column(db.String(200), nullable=False)
    tipo_chave = db.Column(db.String(100), nullable=False)  # e.g. "custom_abc123"
    ordem = db.Column(db.Integer, nullable=False, default=0)
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    projeto = db.relationship('Project', backref=db.backref('blocos_personalizados', lazy='select', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'projeto_id': self.projeto_id,
            'nome': self.nome,
            'tipo_chave': self.tipo_chave,
            'ordem': self.ordem,
        }
