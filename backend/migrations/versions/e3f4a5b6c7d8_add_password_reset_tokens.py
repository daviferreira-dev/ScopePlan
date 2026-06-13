"""add password_reset_tokens table (RF01-A5)

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-06-13
"""
from alembic import op
import sqlalchemy as sa


revision = 'e3f4a5b6c7d8'
down_revision = 'd2e3f4a5b6c7'
branch_labels = None
depends_on = None


def _table_exists(name):
    conn = op.get_bind()
    if conn.dialect.name == 'sqlite':
        row = conn.execute(
            sa.text("SELECT name FROM sqlite_master WHERE type='table' AND name=:n"),
            {'n': name},
        ).fetchone()
        return row is not None
    row = conn.execute(sa.text("SELECT to_regclass(:n)"), {'n': name}).fetchone()
    return row is not None and row[0] is not None


def upgrade():
    if _table_exists('password_reset_tokens'):
        return
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('criado_em', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_prt_usuario_id', 'password_reset_tokens', ['usuario_id'])
    op.create_index('ix_prt_token_hash', 'password_reset_tokens', ['token_hash'], unique=True)


def downgrade():
    if _table_exists('password_reset_tokens'):
        op.drop_table('password_reset_tokens')
