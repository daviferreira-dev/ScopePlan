from datetime import datetime, timezone
from app import db


class MembroProjeto(db.Model):
    """Tracks developer membership on projects (granted via invite)."""
    __tablename__ = 'membros_projeto'
    __table_args__ = (
        db.UniqueConstraint('projeto_id', 'usuario_id', name='uq_membro_projeto'),
        db.Index('ix_membros_usuario', 'usuario_id'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    adicionado_em = db.Column(db.DateTime, nullable=False,
                              default=lambda: datetime.now(timezone.utc))

    projeto = db.relationship('Project', backref='membros', lazy='select')
    usuario = db.relationship('User', backref='membros_projetos', lazy='select')
