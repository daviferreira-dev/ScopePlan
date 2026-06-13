"""Shared access control helpers for the ScopePlan backend."""
from app import db
from app.models import Project, Requirement


def get_user_project_ids(user):
    """Return list of project IDs the user has access to based on their role."""
    if user.perfil == 'cliente':
        projects = Project.query.filter_by(cliente_id=user.id, ativo=True).with_entities(Project.id).all()
        return [p[0] for p in projects]

    elif user.perfil in ('analista', 'gestor'):
        projects = Project.query.filter_by(gestor_id=user.id, ativo=True).with_entities(Project.id).all()
        return [p[0] for p in projects]

    elif user.perfil == 'desenvolvedor':
        from app.models.membro_projeto import MembroProjeto
        # Projects where invited as member
        membro_ids = [m[0] for m in db.session.query(MembroProjeto.projeto_id).filter_by(
            usuario_id=user.id
        ).all()]
        # Projects where they authored requirements (legacy access)
        req_ids = [pid[0] for pid in db.session.query(Requirement.projeto_id).filter(
            Requirement.autor_id == user.id, Requirement.ativo == True
        ).distinct().all()]
        return list(set(membro_ids + req_ids))

    return []


def check_user_project_access(user, projeto_id):
    """Verify that the user has access to the given project.
    Returns (project, error_response). If error_response is set, access is denied."""
    project = Project.query.filter_by(id=projeto_id, ativo=True).first()
    if not project:
        return None, ({'message': 'Projeto não encontrado'}, 404)

    if user.perfil == 'cliente':
        if project.cliente_id != user.id:
            return project, ({'message': 'Acesso não autorizado a este projeto'}, 403)

    elif user.perfil in ('analista', 'gestor'):
        if project.gestor_id != user.id:
            return project, ({'message': 'Acesso não autorizado a este projeto'}, 403)

    elif user.perfil == 'desenvolvedor':
        from app.models.membro_projeto import MembroProjeto
        is_member = MembroProjeto.query.filter_by(
            projeto_id=projeto_id, usuario_id=user.id
        ).first()
        has_req = Requirement.query.filter_by(
            projeto_id=projeto_id, autor_id=user.id, ativo=True
        ).first()
        if not is_member and not has_req:
            return project, ({'message': 'Acesso não autorizado a este projeto'}, 403)

    return project, None


def check_user_requirement_access(user, requirement):
    """Verify that the user has access to the given requirement through its project.
    Returns (requirement, error_response). If error_response is set, access is denied."""
    if not requirement:
        return None, ({'message': 'Requisito não encontrado'}, 404)

    project_id = requirement.projeto_id
    project = Project.query.filter_by(id=project_id, ativo=True).first()
    if not project:
        return requirement, ({'message': 'Projeto não encontrado'}, 404)

    if user.perfil == 'cliente':
        if project.cliente_id != user.id:
            return requirement, ({'message': 'Acesso não autorizado a este requisito'}, 403)
    elif user.perfil == 'gestor':
        if project.gestor_id != user.id:
            return requirement, ({'message': 'Acesso não autorizado a este requisito'}, 403)
    elif user.perfil == 'desenvolvedor':
        from app.models.membro_projeto import MembroProjeto
        is_member = MembroProjeto.query.filter_by(
            projeto_id=project_id, usuario_id=user.id
        ).first()
        if not is_member and requirement.autor_id != user.id:
            return requirement, ({'message': 'Acesso não autorizado a este requisito'}, 403)

    return requirement, None
