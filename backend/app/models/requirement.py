from datetime import datetime, timezone
from app import db


class Requirement(db.Model):
    __tablename__ = 'requisitos'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id'), nullable=False)
    autor_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    codigo = db.Column(db.String(20))  # e.g. "RF-001"
    titulo = db.Column(db.String(300), nullable=False)
    descricao = db.Column(db.Text)
    tipo = db.Column(db.String(30))  # funcional, nao_funcional, negocio, restricao
    categoria = db.Column(db.String(100))  # e.g. "Requisitos Funcionais", "Regras de Negócio"
    prioridade = db.Column(db.String(20))  # baixa, media, alta, critica
    status = db.Column(db.String(30), nullable=False, default='rascunho')  # rascunho, em_revisao, aprovado, rejeitado, implementado
    numero_versao = db.Column(db.SmallInteger, nullable=False, default=1)
    ativo = db.Column(db.Boolean, nullable=False, default=True)  # RN004: deleção lógica
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    atualizado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    validacoes = db.relationship('Validacao', backref='requisito', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_projeto=False, include_validacoes=False):
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
            'validacoes_count': self.validacoes.count(),
            'ultima_validacao': self._get_ultima_validacao(),
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
            'atualizado_em': self.atualizado_em.isoformat() if self.atualizado_em else None
        }

        if include_projeto and self.projeto:
            data['projeto'] = self.projeto.to_dict()

        if include_validacoes:
            from app.models import Validacao
            data['validacoes'] = [v.to_dict() for v in self.validacoes.order_by(Validacao.validado_em.desc()).all()]

        return data

    def _get_ultima_validacao(self):
        """Get the most recent validation result"""
        from app.models import Validacao
        ultima = self.validacoes.order_by(Validacao.validado_em.desc()).first()
        return ultima.to_dict() if ultima else None

    def incrementar_versao(self):
        """Increment requirement version"""
        self.numero_versao = (self.numero_versao or 0) + 1
