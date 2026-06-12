"""initial schema

Revision ID: 68f3cc569fbd
Revises:
Create Date: 2026-05-23 19:28:03.391090

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '68f3cc569fbd'
down_revision = None
branch_labels = None
depends_on = None


def _index_exists(index_name):
    """Check if an index already exists (idempotent, works on SQLite and PostgreSQL)."""
    conn = op.get_bind()
    dialect = conn.dialect.name
    if dialect == 'sqlite':
        result = conn.execute(sa.text(
            "SELECT name FROM sqlite_master WHERE type='index' AND name=:name"
        ), {'name': index_name}).fetchone()
    else:
        result = conn.execute(sa.text(
            "SELECT indexname FROM pg_indexes WHERE indexname=:name"
        ), {'name': index_name}).fetchone()
    return result is not None


def upgrade():
    # --- usuarios ---
    op.create_table(
        'usuarios',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('nome', sa.String(120), nullable=False),
        sa.Column('email', sa.String(180), nullable=False, unique=True),
        sa.Column('senha_hash', sa.String(255), nullable=False),
        sa.Column('perfil', sa.String(20), nullable=False, server_default='analista'),
        sa.Column('ativo', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('criado_em', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('atualizado_em', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    with op.batch_alter_table('usuarios', schema=None) as batch_op:
        batch_op.create_index('ix_usuarios_email', ['email'], unique=False)

    # --- projetos ---
    op.create_table(
        'projetos',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('nome', sa.String(200), nullable=False),
        sa.Column('descricao', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='planejamento'),
        sa.Column('custo_estimado', sa.Numeric(12, 2), nullable=True),
        sa.Column('gestor_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('cliente_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
        sa.Column('nome_cliente', sa.String(200), nullable=True),
        sa.Column('ativo', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('criado_em', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('atualizado_em', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    with op.batch_alter_table('projetos', schema=None) as batch_op:
        batch_op.create_index('ix_projetos_gestor_id', ['gestor_id'], unique=False)
        batch_op.create_index('ix_projetos_cliente_id', ['cliente_id'], unique=False)
        batch_op.create_index('ix_projetos_ativo', ['ativo'], unique=False)

    # --- requisitos ---
    op.create_table(
        'requisitos',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('projeto_id', sa.Integer(), sa.ForeignKey('projetos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('autor_id', sa.Integer(), sa.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True),
        sa.Column('codigo', sa.String(20), nullable=True),
        sa.Column('titulo', sa.String(300), nullable=False),
        sa.Column('descricao', sa.Text(), nullable=True),
        sa.Column('tipo', sa.String(30), nullable=True),
        sa.Column('categoria', sa.String(100), nullable=True),
        sa.Column('prioridade', sa.String(20), nullable=True),
        sa.Column('status', sa.String(30), nullable=False, server_default='rascunho'),
        sa.Column('numero_versao', sa.SmallInteger(), nullable=False, server_default=sa.text('1')),
        sa.Column('ativo', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('criado_em', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('atualizado_em', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    with op.batch_alter_table('requisitos', schema=None) as batch_op:
        batch_op.create_index('ix_requisitos_projeto_id', ['projeto_id'], unique=False)
        batch_op.create_index('ix_requisitos_autor_id', ['autor_id'], unique=False)
        batch_op.create_index('ix_requisitos_codigo', ['codigo'], unique=False)
        batch_op.create_index('ix_requisitos_status', ['status'], unique=False)
        batch_op.create_index('ix_requisitos_ativo', ['ativo'], unique=False)

    # --- validacoes ---
    op.create_table(
        'validacoes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('requisito_id', sa.Integer(), sa.ForeignKey('requisitos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('validador_id', sa.Integer(), sa.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True),
        sa.Column('resultado', sa.String(30), nullable=False),
        sa.Column('comentario', sa.Text(), nullable=True),
        sa.Column('validado_em', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    with op.batch_alter_table('validacoes', schema=None) as batch_op:
        batch_op.create_index('ix_validacoes_requisito_id', ['requisito_id'], unique=False)
        batch_op.create_index('ix_validacoes_validador_id', ['validador_id'], unique=False)

    # --- audit_logs ---
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('usuario_id', sa.Integer(), sa.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True),
        sa.Column('acao', sa.String(50), nullable=False),
        sa.Column('entidade_tipo', sa.String(50), nullable=False),
        sa.Column('entidade_id', sa.Integer(), nullable=False),
        sa.Column('projeto_id', sa.Integer(), sa.ForeignKey('projetos.id', ondelete='SET NULL'), nullable=True),
        sa.Column('detalhes', sa.Text(), nullable=True),
        sa.Column('criado_em', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        batch_op.create_index('ix_audit_logs_acao', ['acao'], unique=False)
        batch_op.create_index('ix_audit_logs_criado_em', ['criado_em'], unique=False)
        batch_op.create_index('ix_audit_logs_entidade_tipo', ['entidade_tipo'], unique=False)
        batch_op.create_index('ix_audit_logs_projeto_id', ['projeto_id'], unique=False)
        batch_op.create_index('ix_audit_logs_usuario_id', ['usuario_id'], unique=False)


def downgrade():
    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        for idx in ['ix_audit_logs_usuario_id', 'ix_audit_logs_projeto_id', 'ix_audit_logs_entidade_tipo', 'ix_audit_logs_criado_em', 'ix_audit_logs_acao']:
            if _index_exists(idx):
                batch_op.drop_index(idx)

    with op.batch_alter_table('validacoes', schema=None) as batch_op:
        for idx in ['ix_validacoes_validador_id', 'ix_validacoes_requisito_id']:
            if _index_exists(idx):
                batch_op.drop_index(idx)

    with op.batch_alter_table('requisitos', schema=None) as batch_op:
        for idx in ['ix_requisitos_ativo', 'ix_requisitos_status', 'ix_requisitos_codigo', 'ix_requisitos_autor_id', 'ix_requisitos_projeto_id']:
            if _index_exists(idx):
                batch_op.drop_index(idx)

    with op.batch_alter_table('projetos', schema=None) as batch_op:
        for idx in ['ix_projetos_ativo', 'ix_projetos_cliente_id', 'ix_projetos_gestor_id']:
            if _index_exists(idx):
                batch_op.drop_index(idx)

    with op.batch_alter_table('usuarios', schema=None) as batch_op:
        if _index_exists('ix_usuarios_email'):
            batch_op.drop_index('ix_usuarios_email')

    op.drop_table('audit_logs')
    op.drop_table('validacoes')
    op.drop_table('requisitos')
    op.drop_table('projetos')
    op.drop_table('usuarios')
