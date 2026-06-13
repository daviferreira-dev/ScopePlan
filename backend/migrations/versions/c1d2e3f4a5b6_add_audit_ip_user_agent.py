"""add ip and user_agent columns to audit_logs (RF09)

Revision ID: c1d2e3f4a5b6
Revises: f1a2b3c4d5e6
Create Date: 2026-06-13

Adds origin-tracking fields to the audit trail so every logged action records
the source IP and user-agent (RF09 — registro de histórico).
"""
from alembic import op
import sqlalchemy as sa


revision = 'c1d2e3f4a5b6'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def _column_exists(table, column):
    conn = op.get_bind()
    if conn.dialect.name == 'sqlite':
        rows = conn.execute(sa.text(f"PRAGMA table_info({table})")).fetchall()
        return any(r[1] == column for r in rows)
    rows = conn.execute(
        sa.text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name=:t AND column_name=:c"
        ),
        {'t': table, 'c': column},
    ).fetchone()
    return rows is not None


def upgrade():
    if not _column_exists('audit_logs', 'ip'):
        op.add_column('audit_logs', sa.Column('ip', sa.String(length=45), nullable=True))
    if not _column_exists('audit_logs', 'user_agent'):
        op.add_column('audit_logs', sa.Column('user_agent', sa.String(length=300), nullable=True))


def downgrade():
    if _column_exists('audit_logs', 'user_agent'):
        op.drop_column('audit_logs', 'user_agent')
    if _column_exists('audit_logs', 'ip'):
        op.drop_column('audit_logs', 'ip')
