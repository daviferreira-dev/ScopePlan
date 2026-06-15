from datetime import datetime, timezone
from app import db
from app.utils.time_utils import utc_iso


class Requirement(db.Model):
    __tablename__ = 'requisitos'
    __table_args__ = (
        db.CheckConstraint(
            "tipo IN ('funcional', 'nao_funcional', 'negocio', 'restricao')",
            name='ck_requisitos_tipo'
        ),
        db.CheckConstraint(
            "prioridade IN ('baixa', 'media', 'alta', 'critica')",
            name='ck_requisitos_prioridade'
        ),
        db.CheckConstraint(
            "status IN ('rascunho', 'em_revisao', 'aprovado', 'rejeitado', 'aprovado_com_ressalvas')",
            name='ck_requisitos_status'
        ),
        db.UniqueConstraint('projeto_id', 'codigo', name='uq_requisito_projeto_codigo'),
        db.Index('ix_requisitos_projeto_ativo', 'projeto_id', 'ativo'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id', ondelete='CASCADE'), nullable=False, index=True)
    autor_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True, index=True)
    codigo = db.Column(db.String(20), nullable=False, default='', server_default='')
    titulo = db.Column(db.String(300), nullable=False)
    descricao = db.Column(db.Text)
    tipo = db.Column(db.String(30))
    categoria = db.Column(db.String(100))
    prioridade = db.Column(db.String(20))
    status = db.Column(db.String(30), nullable=False, default='rascunho', index=True)
    numero_versao = db.Column(db.SmallInteger, nullable=False, default=1)
    ativo = db.Column(db.Boolean, nullable=False, default=True, index=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    atualizado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    validacoes = db.relationship('Validacao', backref='requisito', lazy='select', cascade='all, delete-orphan')

    def incrementar_versao(self, user_id=None):
        """RN003: Snapshot current state and increment version number."""
        from app.models.requirement_version import RequirementVersion
        RequirementVersion.snapshot(self, user_id)
        self.numero_versao += 1

    def to_dict(self, include_validacoes=False):
        """Convert requirement to dictionary"""
        data = {
            'id': self.id,
            'projeto_id': self.projeto_id,
            'autor_id': self.autor_id,
            'autor': self.autor.to_dict() if self.autor else None,
            'codigo': self.codigo,
            'titulo': self.titulo,
            'descricao': self.descricao,
            'tipo': self.tipo,
            'categoria': self.categoria,
            'prioridade': self.prioridade,
            'status': self.status,
            'numero_versao': self.numero_versao,
            'ativo': self.ativo,
            'criado_em': utc_iso(self.criado_em),
            'atualizado_em': utc_iso(self.atualizado_em),
        }
        if include_validacoes:
            data['validacoes'] = [v.to_dict() for v in self.validacoes]
        return data
