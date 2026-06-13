from datetime import datetime, timezone
from app import db


class Diagrama(db.Model):
    __tablename__ = 'diagramas'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id', ondelete='CASCADE'), nullable=False, index=True)
    nome = db.Column(db.String(255), nullable=False)
    tipo_mime = db.Column(db.String(100), nullable=False, default='image/png')
    dados = db.Column(db.LargeBinary, nullable=False)
    tamanho = db.Column(db.Integer, nullable=False, default=0)
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    projeto = db.relationship('Project', backref=db.backref('diagramas', lazy='select', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'projeto_id': self.projeto_id,
            'nome': self.nome,
            'tipo_mime': self.tipo_mime,
            'tamanho': self.tamanho,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
        }