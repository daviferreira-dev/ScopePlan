"""add_indexes_and_token_blocklist

Revision ID: e977c2fdbda0
Revises: 68f3cc569fbd
Create Date: 2026-05-24 12:23:45.507676

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e977c2fdbda0'
down_revision = '68f3cc569fbd'
branch_labels = None
depends_on = None


def _index_exists(index_name):
    """Check if an index already exists (idempotent migration)."""
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT name FROM sqlite_master WHERE type='index' AND name=:name"
    ), {'name': index_name}).fetchone()
    return result is not None


def _table_exists(table_name):
    """Check if a table already exists (idempotent migration)."""
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=:name"
    ), {'name': table_name}).fetchone()
    return result is not None


def upgrade():
    # --- Create token_blocklist table if not exists ---
    if not _table_exists('token_blocklist'):
        op.create_table(
            'token_blocklist',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('jti', sa.String(36), nullable=False, unique=True),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        )
        op.create_index('ix_token_blocklist_jti', 'token_blocklist', ['jti'], unique=True)

    # --- Create indexes idempotently ---
    indexes = [
        ('audit_logs', 'ix_audit_logs_acao', ['acao']),
        ('audit_logs', 'ix_audit_logs_criado_em', ['criado_em']),
        ('audit_logs', 'ix_audit_logs_entidade_tipo', ['entidade_tipo']),
        ('audit_logs', 'ix_audit_logs_projeto_id', ['projeto_id']),
        ('audit_logs', 'ix_audit_logs_usuario_id', ['usuario_id']),
        ('projetos', 'ix_projetos_ativo', ['ativo']),
        ('projetos', 'ix_projetos_cliente_id', ['cliente_id']),
        ('projetos', 'ix_projetos_gestor_id', ['gestor_id']),
        ('requisitos', 'ix_requisitos_ativo', ['ativo']),
        ('requisitos', 'ix_requisitos_autor_id', ['autor_id']),
        ('requisitos', 'ix_requisitos_codigo', ['codigo']),
        ('requisitos', 'ix_requisitos_projeto_id', ['projeto_id']),
        ('requisitos', 'ix_requisitos_status', ['status']),
        ('validacoes', 'ix_validacoes_requisito_id', ['requisito_id']),
        ('validacoes', 'ix_validacoes_validador_id', ['validador_id']),
    ]

    for table, idx_name, columns in indexes:
        if not _index_exists(idx_name):
            with op.batch_alter_table(table) as batch_op:
                batch_op.create_index(batch_op.f(idx_name), columns, unique=False)


def downgrade():
    with op.batch_alter_table('validacoes', schema=None) as batch_op:
        if _index_exists('ix_validacoes_validador_id'):
            batch_op.drop_index(batch_op.f('ix_validacoes_validador_id'))
        if _index_exists('ix_validacoes_requisito_id'):
            batch_op.drop_index(batch_op.f('ix_validacoes_requisito_id'))

    with op.batch_alter_table('requisitos', schema=None) as batch_op:
        for idx in ['ix_requisitos_status', 'ix_requisitos_projeto_id', 'ix_requisitos_codigo',
                     'ix_requisitos_autor_id', 'ix_requisitos_ativo']:
            if _index_exists(idx):
                batch_op.drop_index(batch_op.f(idx))

    with op.batch_alter_table('projetos', schema=None) as batch_op:
        for idx in ['ix_projetos_gestor_id', 'ix_projetos_cliente_id', 'ix_projetos_ativo']:
            if _index_exists(idx):
                batch_op.drop_index(batch_op.f(idx))

    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        for idx in ['ix_audit_logs_usuario_id', 'ix_audit_logs_projeto_id',
                     'ix_audit_logs_entidade_tipo', 'ix_audit_logs_criado_em', 'ix_audit_logs_acao']:
            if _index_exists(idx):
                batch_op.drop_index(batch_op.f(idx))

    if _table_exists('token_blocklist'):
        op.drop_table('token_blocklist')
