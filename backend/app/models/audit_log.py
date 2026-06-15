import json
from datetime import datetime, timezone
from app import db
from app.utils.time_utils import utc_iso


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
    # RF09: rastreabilidade de origem da ação
    ip = db.Column(db.String(45))           # IPv4/IPv6
    user_agent = db.Column(db.String(300))
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)

    usuario = db.relationship("User", backref="audit_logs", lazy="joined")
    projeto = db.relationship("Project", lazy="joined", foreign_keys=[projeto_id])

    def to_dict(self):
        """Convert audit log to dictionary"""
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'usuario_nome': self.usuario.nome if self.usuario else None,
            'usuario_email': self.usuario.email if self.usuario else None,
            'usuario': self.usuario.to_dict() if self.usuario else None,
            'acao': self.acao,
            'entidade_tipo': self.entidade_tipo,
            'entidade_id': self.entidade_id,
            'projeto_id': self.projeto_id,
            'projeto_nome': self.projeto.nome if self.projeto else None,
            'detalhes': json.loads(self.detalhes) if self.detalhes else None,
            'ip': self.ip,
            'user_agent': self.user_agent,
            'criado_em': utc_iso(self.criado_em),
        }

    @staticmethod
    def log(usuario_id, acao, entidade_tipo, entidade_id, projeto_id=None, detalhes=None):
        """Create an audit log entry. Captura IP/user-agent quando há request HTTP (RF09)."""
        ip = None
        user_agent = None
        try:
            from flask import request, has_request_context
            if has_request_context():
                # respeita proxy reverso (Render/NGINX) via X-Forwarded-For
                fwd = request.headers.get('X-Forwarded-For', '')
                ip = (fwd.split(',')[0].strip() if fwd else request.remote_addr)
                user_agent = (request.headers.get('User-Agent') or '')[:300]
        except Exception:
            pass

        # Deduplica: ignora se já existe entrada idêntica nos últimos 5 segundos
        from datetime import timedelta
        from sqlalchemy import and_
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=5)
        duplicate = db.session.query(AuditLog).filter(
            and_(
                AuditLog.usuario_id == usuario_id,
                AuditLog.acao == acao,
                AuditLog.entidade_tipo == entidade_tipo,
                AuditLog.entidade_id == entidade_id,
                AuditLog.criado_em >= cutoff,
            )
        ).first()
        if duplicate:
            return duplicate

        entry = AuditLog(
            usuario_id=usuario_id,
            acao=acao,
            entidade_tipo=entidade_tipo,
            entidade_id=entidade_id,
            projeto_id=projeto_id,
            detalhes=json.dumps(detalhes) if isinstance(detalhes, dict) else detalhes,
            ip=ip,
            user_agent=user_agent,
        )
        db.session.add(entry)
        return entry
