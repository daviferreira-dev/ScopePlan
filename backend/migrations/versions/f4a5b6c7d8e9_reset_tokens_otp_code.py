"""reset tokens viram código OTP: add tentativas + token_hash não-único (RF01-A5)

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
Create Date: 2026-06-13
"""
from alembic import op
import sqlalchemy as sa


revision = 'f4a5b6c7d8e9'
down_revision = 'e3f4a5b6c7d8'
branch_labels = None
depends_on = None


def _columns(table):
    conn = op.get_bind()
    insp = sa.inspect(conn)
    return {c['name'] for c in insp.get_columns(table)}


def _indexes(table):
    conn = op.get_bind()
    insp = sa.inspect(conn)
    return {i['name'] for i in insp.get_indexes(table)}


def upgrade():
    cols = _columns('password_reset_tokens')
    if 'tentativas' not in cols:
        op.add_column('password_reset_tokens',
                      sa.Column('tentativas', sa.Integer(), nullable=False, server_default='0'))

    # token_hash deixa de ser único (códigos curtos colidem entre usuários)
    idx = _indexes('password_reset_tokens')
    with op.batch_alter_table('password_reset_tokens') as batch:
        if 'ix_prt_token_hash' in idx:
            batch.drop_index('ix_prt_token_hash')
    idx = _indexes('password_reset_tokens')
    if 'ix_prt_token_hash' not in idx:
        op.create_index('ix_prt_token_hash', 'password_reset_tokens', ['token_hash'], unique=False)


def downgrade():
    cols = _columns('password_reset_tokens')
    if 'tentativas' in cols:
        op.drop_column('password_reset_tokens', 'tentativas')
