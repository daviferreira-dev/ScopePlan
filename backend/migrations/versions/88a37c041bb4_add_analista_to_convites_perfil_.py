"""add_analista_to_convites_perfil_constraint

Revision ID: 88a37c041bb4
Revises: c3d4e5f6a7b8
Create Date: 2026-06-15 01:23:48.269509

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '88a37c041bb4'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('convites_projeto', recreate='always') as batch_op:
        batch_op.drop_constraint('ck_convites_perfil', type_='check')
        batch_op.create_check_constraint(
            'ck_convites_perfil',
            "perfil IN ('analista', 'cliente', 'desenvolvedor', 'gestor')"
        )


def downgrade():
    with op.batch_alter_table('convites_projeto', recreate='always') as batch_op:
        batch_op.drop_constraint('ck_convites_perfil', type_='check')
        batch_op.create_check_constraint(
            'ck_convites_perfil',
            "perfil IN ('cliente', 'desenvolvedor', 'gestor')"
        )
