"""add PII encryption: email_lookup column + expand email/nome columns

Revision ID: f1a2b3c4d5e6
Revises: a0d9dc7243c5
Create Date: 2026-06-09

Changes:
  - usuarios.email   : String(180) → String(500)  (accommodates Fernet token)
  - usuarios.nome    : String(120) → String(200)   (accommodates Fernet token)
  - usuarios.email_lookup : new String(64) unique   (HMAC hash for lookups)

Note: existing plaintext email/nome values remain readable — EncryptedString
falls back to returning the raw value when decryption fails (handles legacy rows).
New registrations will store encrypted values when FERNET_KEY is set.
"""
from alembic import op
import sqlalchemy as sa


revision = 'f1a2b3c4d5e6'
down_revision = 'a0d9dc7243c5'
branch_labels = None
depends_on = None


def _index_exists(name):
    conn = op.get_bind()
    if conn.dialect.name == 'sqlite':
        row = conn.execute(
            sa.text("SELECT name FROM sqlite_master WHERE type='index' AND name=:n"),
            {'n': name}
        ).fetchone()
    else:
        row = conn.execute(
            sa.text("SELECT indexname FROM pg_indexes WHERE indexname=:n"),
            {'n': name}
        ).fetchone()
    return row is not None


def upgrade():
    with op.batch_alter_table('usuarios', schema=None) as batch_op:
        # Expand columns to fit Fernet ciphertext (base64-encoded, ~200+ chars per token)
        batch_op.alter_column('email',
            existing_type=sa.String(180),
            type_=sa.String(500),
            existing_nullable=False,
        )
        batch_op.alter_column('nome',
            existing_type=sa.String(120),
            type_=sa.String(200),
            existing_nullable=False,
        )
        # Add deterministic hash column for SQL WHERE lookups on the encrypted email field
        batch_op.add_column(sa.Column('email_lookup', sa.String(64), nullable=True))

    if not _index_exists('ix_usuarios_email_lookup'):
        op.create_index('ix_usuarios_email_lookup', 'usuarios', ['email_lookup'], unique=True)


def downgrade():
    if _index_exists('ix_usuarios_email_lookup'):
        op.drop_index('ix_usuarios_email_lookup', table_name='usuarios')

    with op.batch_alter_table('usuarios', schema=None) as batch_op:
        batch_op.drop_column('email_lookup')
        batch_op.alter_column('nome',
            existing_type=sa.String(200),
            type_=sa.String(120),
            existing_nullable=False,
        )
        batch_op.alter_column('email',
            existing_type=sa.String(500),
            type_=sa.String(180),
            existing_nullable=False,
        )
