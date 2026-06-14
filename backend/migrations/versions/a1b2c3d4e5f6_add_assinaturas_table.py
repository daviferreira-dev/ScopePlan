"""add assinaturas table — assinatura digital de requisitos aprovados

Revision ID: a1b2c3d4e5f6
Revises: 6d583dbd0a21
Create Date: 2026-06-14

"""
from alembic import op
import sqlalchemy as sa


revision = 'a1b2c3d4e5f6'
down_revision = '6d583dbd0a21'
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
        row = conn.execute(sa.text("SELECT to_regclass(:n)"), {'n': name}).fetchone()
        return row is not None and row[0] is not None
    return row is not None


def upgrade():
    if _table_exists('assinaturas'):
        return
    op.create_table(
        'assinaturas',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('requisito_id', sa.Integer(), nullable=False),
        sa.Column('signatario_id', sa.Integer(), nullable=True),
        sa.Column('declaracao', sa.Text(), nullable=True),
        sa.Column('assinado_em', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['requisito_id'], ['requisitos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['signatario_id'], ['usuarios.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('requisito_id', 'signatario_id', name='uq_assinatura_req_signatario'),
    )
    op.create_index('ix_assinaturas_requisito_id', 'assinaturas', ['requisito_id'])
    op.create_index('ix_assinaturas_signatario_id', 'assinaturas', ['signatario_id'])


def downgrade():
    if _table_exists('assinaturas'):
        op.drop_index('ix_assinaturas_signatario_id', 'assinaturas')
        op.drop_index('ix_assinaturas_requisito_id', 'assinaturas')
        op.drop_table('assinaturas')
