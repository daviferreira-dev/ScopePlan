from datetime import datetime, timezone
from app import db
from app.utils.time_utils import utc_iso


class RequirementVersion(db.Model):
    """Stores historical snapshots of requirement data.
    Each time an approved requirement is edited, a snapshot is saved
    before the changes are applied, enabling full version traceability (RN003)."""
    __tablename__ = 'requirement_versions'
    __table_args__ = (
        db.Index('ix_req_version_req_num', 'requisito_id', 'numero_versao'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    requisito_id = db.Column(db.Integer, db.ForeignKey('requisitos.id', ondelete='CASCADE'), nullable=False, index=True)
    numero_versao = db.Column(db.Integer, nullable=False)
    # Aligned with Requirement model field lengths to prevent truncation
    titulo = db.Column(db.String(300), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    tipo = db.Column(db.String(30), nullable=False, default='funcional')
    categoria = db.Column(db.String(100), nullable=True)
    prioridade = db.Column(db.String(20), nullable=False, default='media')
    codigo = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(30), nullable=False)
    alterado_por = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=True, index=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'requisito_id': self.requisito_id,
            'numero_versao': self.numero_versao,
            'titulo': self.titulo,
            'descricao': self.descricao,
            'tipo': self.tipo,
            'categoria': self.categoria,
            'prioridade': self.prioridade,
            'codigo': self.codigo,
            'status': self.status,
            'alterado_por': self.alterado_por,
            'criado_em': utc_iso(self.criado_em),
        }

    @staticmethod
    def snapshot(requirement, user_id=None):
        """Create a version snapshot from the current state of a requirement.
        Returns the new RequirementVersion entry (not yet committed)."""
        version = RequirementVersion(
            requisito_id=requirement.id,
            numero_versao=requirement.numero_versao,
            titulo=requirement.titulo,
            descricao=requirement.descricao,
            tipo=requirement.tipo,
            categoria=requirement.categoria,
            prioridade=requirement.prioridade,
            codigo=requirement.codigo,
            status=requirement.status,
            alterado_por=user_id,
        )
        db.session.add(version)
        return version
