"""add_requirement_versions_table

Revision ID: 37c98cc99bfc
Revises: e977c2fdbda0
Create Date: 2026-05-24 15:44:33.440372

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '37c98cc99bfc'
down_revision = 'e977c2fdbda0'
branch_labels = None
depends_on = None


def _table_exists(table_name):
    """Check if a table already exists (idempotent migration)."""
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=:name"
    ), {'name': table_name}).fetchone()
    return result is not None


def upgrade():
    # --- Create requirement_versions table if not exists ---
    if not _table_exists('requirement_versions'):
        op.create_table(
            'requirement_versions',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('requisito_id', sa.Integer(), sa.ForeignKey('requisitos.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('numero_versao', sa.Integer(), nullable=False),
            sa.Column('titulo', sa.String(200), nullable=False),
            sa.Column('descricao', sa.Text(), nullable=True),
            sa.Column('tipo', sa.String(20), nullable=False, server_default='funcional'),
            sa.Column('categoria', sa.String(50), nullable=True),
            sa.Column('prioridade', sa.String(20), nullable=False, server_default='media'),
            sa.Column('codigo', sa.String(20), nullable=True),
            sa.Column('status', sa.String(30), nullable=False),
            sa.Column('alterado_por', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
            sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.func.now()),
        )
        op.create_index('ix_requirement_versions_requisito_id', 'requirement_versions', ['requisito_id'])
        op.create_index('ix_requirement_versions_alterado_por', 'requirement_versions', ['alterado_por'])


def downgrade():
    if _table_exists('requirement_versions'):
        op.drop_table('requirement_versions')
