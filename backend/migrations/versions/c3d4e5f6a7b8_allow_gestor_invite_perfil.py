"""allow 'gestor' in convites_projeto.perfil check constraint

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f6
Create Date: 2026-06-14

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'c3d4e5f6a7b8'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # SQLite não altera CHECK in-place: batch_alter_table recria a tabela.
    with op.batch_alter_table('convites_projeto', schema=None) as batch_op:
        batch_op.drop_constraint('ck_convites_perfil', type_='check')
        batch_op.create_check_constraint(
            'ck_convites_perfil',
            "perfil IN ('cliente', 'desenvolvedor', 'gestor')",
        )


def downgrade():
    with op.batch_alter_table('convites_projeto', schema=None) as batch_op:
        batch_op.drop_constraint('ck_convites_perfil', type_='check')
        batch_op.create_check_constraint(
            'ck_convites_perfil',
            "perfil IN ('cliente', 'desenvolvedor')",
        )
