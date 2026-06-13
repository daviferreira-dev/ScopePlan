from datetime import datetime, timezone
from app import db


class Project(db.Model):
    __tablename__ = 'projetos'
    __table_args__ = (
        db.CheckConstraint(
            "status IN ('planejamento', 'em_andamento', 'em_revisao', 'concluido', 'cancelado')",
            name='ck_projetos_status'
        ),
        db.Index('ix_projetos_gestor_ativo', 'gestor_id', 'ativo'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default='planejamento')
    custo_estimado = db.Column(db.Numeric(12, 2))
    gestor_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False, index=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=True, index=True)
    nome_cliente = db.Column(db.String(200))
    ativo = db.Column(db.Boolean, nullable=False, default=True, index=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    atualizado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    requisitos = db.relationship('Requirement', backref='projeto', lazy='select', cascade='all, delete-orphan')
    cliente = db.relationship('User', backref='projetos_como_cliente', lazy='select', foreign_keys=[cliente_id])

    def _requisito_counts(self):
        """(total, aprovados) de requisitos ativos — base do progresso da ERS.

        'aprovados' inclui 'aprovado' e 'aprovado_com_ressalvas', consistente com
        a métrica do projeto e a regra de exportação RN002.
        """
        from sqlalchemy import func
        from app import db
        from app.models.requirement import Requirement

        total = db.session.query(func.count(Requirement.id)).filter(
            Requirement.projeto_id == self.id,
            Requirement.ativo.is_(True),
        ).scalar() or 0
        aprovados = db.session.query(func.count(Requirement.id)).filter(
            Requirement.projeto_id == self.id,
            Requirement.ativo.is_(True),
            Requirement.status.in_(('aprovado', 'aprovado_com_ressalvas')),
        ).scalar() or 0
        return total, aprovados

    def to_dict(self):
        """Convert project to dictionary"""
        total, aprovados = self._requisito_counts()
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
            'requisitos_count': total,
            'aprovados_count': aprovados,
            'ativo': self.ativo,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
            'atualizado_em': self.atualizado_em.isoformat() if self.atualizado_em else None,
        }
        return data
