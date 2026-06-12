import json
from datetime import datetime, timezone
from app import db


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    __table_args__ = (
        db.Index('ix_audit_entity', 'entidade_tipo', 'entidade_id'),
        db.Index('ix_audit_project_created', 'projeto_id', 'criado_em'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True, index=True)
    acao = db.Column(db.String(50), nullable=False, index=True)
    entidade_tipo = db.Column(db.String(50), nullable=False)
    entidade_id = db.Column(db.Integer, nullable=False)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id', ondelete='SET NULL'), nullable=True, index=True)
    detalhes = db.Column(db.Text)
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)

    usuario = db.relationship("User", backref="audit_logs", lazy="joined")

    def to_dict(self):
        """Convert audit log to dictionary"""
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'usuario': self.usuario.to_dict() if self.usuario else None,
            'acao': self.acao,
            'entidade_tipo': self.entidade_tipo,
            'entidade_id': self.entidade_id,
            'projeto_id': self.projeto_id,
            'detalhes': json.loads(self.detalhes) if self.detalhes else None,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
        }

    @staticmethod
    def log(usuario_id, acao, entidade_tipo, entidade_id, projeto_id=None, detalhes=None):
        """Create an audit log entry"""
        entry = AuditLog(
            usuario_id=usuario_id,
            acao=acao,
            entidade_tipo=entidade_tipo,
            entidade_id=entidade_id,
            projeto_id=projeto_id,
            detalhes=json.dumps(detalhes) if isinstance(detalhes, dict) else detalhes
        )
        db.session.add(entry)
        return entry
