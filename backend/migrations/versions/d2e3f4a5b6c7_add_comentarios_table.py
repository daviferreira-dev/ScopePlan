"""add comentarios table (RF08 — canal de colaboração)

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-06-13

Cria a tabela de comentários em requisitos, com auto-referência (parent_id)
para respostas aninhadas e flag de ocultação (RF08-A2).
"""
from alembic import op
import sqlalchemy as sa


revision = 'd2e3f4a5b6c7'
down_revision = 'c1d2e3f4a5b6'
branch_labels = None
depends_on = None


def _table_exists(name):
    conn = op.get_bind()
    if conn.dialect.name == 'sqlite':
        row = conn.execute(
            sa.text("SELECT name FROM sqlite_master WHERE type='table' AND name=:n"),
            {'n': name},
        ).fetchone()
    else:
        row = conn.execute(
            sa.text("SELECT to_regclass(:n)"), {'n': name}
        ).fetchone()
        return row is not None and row[0] is not None
    return row is not None


def upgrade():
    if _table_exists('comentarios'):
        return
    op.create_table(
        'comentarios',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('requisito_id', sa.Integer(), nullable=False),
        sa.Column('autor_id', sa.Integer(), nullable=True),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('texto', sa.Text(), nullable=False),
        sa.Column('oculto', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('ativo', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('criado_em', sa.DateTime(), nullable=False),
        sa.Column('editado_em', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['requisito_id'], ['requisitos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['autor_id'], ['usuarios.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['parent_id'], ['comentarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_comentarios_requisito_id', 'comentarios', ['requisito_id'])
    op.create_index('ix_comentarios_autor_id', 'comentarios', ['autor_id'])
    op.create_index('ix_comentarios_parent_id', 'comentarios', ['parent_id'])
    op.create_index('ix_comentarios_requisito_ativo', 'comentarios', ['requisito_id', 'ativo'])


def downgrade():
    if _table_exists('comentarios'):
        op.drop_table('comentarios')
