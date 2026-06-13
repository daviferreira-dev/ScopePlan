from datetime import datetime, timezone
from app import db


class Anexo(db.Model):
    __tablename__ = 'anexos'

    id = db.Column(db.Integer, primary_key=True)
    requisito_id = db.Column(db.Integer, db.ForeignKey('requisitos.id', ondelete='CASCADE'), nullable=False, index=True)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id', ondelete='CASCADE'), nullable=False, index=True)
    nome = db.Column(db.String(255), nullable=False)
    tipo_mime = db.Column(db.String(100), nullable=False)
    dados = db.Column(db.LargeBinary, nullable=False)
    tamanho = db.Column(db.Integer, nullable=False, default=0)
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    requisito = db.relationship('Requirement', backref=db.backref('anexos', lazy='select', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'requisito_id': self.requisito_id,
            'projeto_id': self.projeto_id,
            'nome': self.nome,
            'tipo_mime': self.tipo_mime,
            'tamanho': self.tamanho,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
        }
