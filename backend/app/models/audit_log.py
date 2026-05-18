from datetime import datetime, timezone
from app import db


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    acao = db.Column(db.String(50), nullable=False)  # criacao, atualizacao, aprovacao, rejeicao, observacao, download, exclusao
    entidade_tipo = db.Column(db.String(50), nullable=False)  # projeto, requisito, validacao
    entidade_id = db.Column(db.Integer, nullable=False)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id'), nullable=True)
    detalhes = db.Column(db.Text)  # JSON string with extra info
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

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
            'detalhes': self.detalhes,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
        }

    @staticmethod
    def log(usuario_id, acao, entidade_tipo, entidade_id, projeto_id=None, detalhes=None):
        """Create an audit log entry"""
        import json
        entry = AuditLog(
            usuario_id=usuario_id,
            acao=acao,
            entidade_tipo=entidade_tipo,
            entidade_id=entidade_id,
            projeto_id=projeto_id,
            detalhes=json.dumps(detalhes) if detalhes and isinstance(detalhes, dict) else detalhes,
        )
        db.session.add(entry)
        return entry
