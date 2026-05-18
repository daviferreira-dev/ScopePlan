from datetime import datetime, timezone
from app import db


class Project(db.Model):
    __tablename__ = 'projetos'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default='planejamento')  # planejamento, em_andamento, em_revisao, concluido, cancelado
    custo_estimado = db.Column(db.Numeric(12, 2))
    gestor_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    cliente_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=True)
    nome_cliente = db.Column(db.String(200))  # client name for the project (denormalized for display)
    ativo = db.Column(db.Boolean, nullable=False, default=True)  # RN004: deleção lógica
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    atualizado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    requisitos = db.relationship('Requirement', backref='projeto', lazy='dynamic', cascade='all, delete-orphan')
    cliente = db.relationship('User', backref='projetos_como_cliente', lazy='select', foreign_keys=[cliente_id])

    def to_dict(self, include_requisitos=False):
        """Convert project to dictionary"""
        data = {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'status': self.status,
            'custo_estimado': float(self.custo_estimado) if self.custo_estimado else None,
            'gestor_id': self.gestor_id,
            'gestor': self.gestor.to_dict() if self.gestor else None,
            'cliente_id': self.cliente_id,
            'nome_cliente': self.nome_cliente or (self.cliente.nome if self.cliente else None),
            'ativo': self.ativo,
            'requisitos_count': self.requisitos.filter_by(ativo=True).count(),
            'aprovados_count': self.requisitos.filter_by(status='aprovado', ativo=True).count(),
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
            'atualizado_em': self.atualizado_em.isoformat() if self.atualizado_em else None
        }

        if include_requisitos:
            data['requisitos'] = [req.to_dict() for req in self.requisitos.filter_by(ativo=True).all()]

        return data
