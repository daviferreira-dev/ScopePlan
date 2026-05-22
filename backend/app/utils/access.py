"""Shared access control helpers for the ScopePlan backend."""
from app import db
from app.models import User, Project, Requirement


def get_user_project_ids(user):
    """Return list of project IDs the user has access to based on their role."""
    if user.perfil == 'cliente':
        projects = Project.query.filter_by(cliente_id=user.id, ativo=True).with_entities(Project.id).all()
    elif user.perfil in ('analista', 'gestor'):
        projects = Project.query.filter_by(gestor_id=user.id, ativo=True).with_entities(Project.id).all()
    elif user.perfil == 'desenvolvedor':
        projects = db.session.query(Requirement.projeto_id).filter_by(
            autor_id=user.id, ativo=True
        ).distinct().all()
        projects = [(p[0],) for p in projects]
    else:
        projects = []
    return [p[0] for p in projects]


def check_user_project_access(user, projeto_id):
    """Verify that the user has access to the given project.
    Returns (project, error_response). If error_response is set, access is denied."""
    project = Project.query.filter_by(id=projeto_id, ativo=True).first()
    if not project:
        return None, ({'message': 'Projeto não encontrado'}, 404)

    if user.perfil == 'cliente':
        if project.cliente_id != user.id:
            return None, ({'message': 'Acesso negado a este projeto'}, 403)
    elif user.perfil in ('analista', 'gestor'):
        if project.gestor_id != user.id:
            return None, ({'message': 'Acesso negado a este projeto'}, 403)
    elif user.perfil == 'desenvolvedor':
        has_reqs = Requirement.query.filter_by(
            projeto_id=project.id, autor_id=user.id, ativo=True
        ).first()
        if not has_reqs:
            return None, ({'message': 'Acesso negado a este projeto'}, 403)

    return project, None


def check_user_requirement_access(user, requirement):
    """Verify that the user has access to the project of this requirement.
    Returns error_response or None."""
    project = Project.query.filter_by(id=requirement.projeto_id, ativo=True).first()
    if not project:
        return {'message': 'Projeto do requisito não encontrado'}, 404

    if user.perfil == 'cliente':
        if project.cliente_id != user.id:
            return {'message': 'Acesso negado a este requisito'}, 403
    elif user.perfil in ('analista', 'gestor'):
        if project.gestor_id != user.id:
            return {'message': 'Acesso negado a este requisito'}, 403
    elif user.perfil == 'desenvolvedor':
        has_reqs = Requirement.query.filter_by(
            projeto_id=project.id, autor_id=user.id, ativo=True
        ).first()
        if not has_reqs:
            return {'message': 'Acesso negado a este requisito'}, 403

    return None
