from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, AuditLog
from app.utils.access import get_user_project_ids

audit_bp = Blueprint('audit', __name__, url_prefix='/api/audit')


@audit_bp.route('', methods=['GET'])
@jwt_required()
def list_audit_logs():
    """List audit logs with optional filters, filtered by user's projects"""
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 401

    # Query params
    projeto_id = request.args.get('projeto_id', type=int)
    acao = request.args.get('acao', type=str)
    entidade_tipo = request.args.get('entidade_tipo', type=str)
    usuario_id = request.args.get('usuario_id', type=int)
    ip = request.args.get('ip', type=str)
    data_inicio = request.args.get('data_inicio', type=str)
    data_fim = request.args.get('data_fim', type=str)
    search = request.args.get('search', type=str)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Limit per_page
    per_page = min(per_page, 100)

    # Filter by user's accessible projects
    user_project_ids = get_user_project_ids(user)
    query = AuditLog.query

    if projeto_id:
        # User can only filter to projects they have access to
        if projeto_id not in user_project_ids:
            return {'message': 'Acesso negado a este projeto'}, 403
        query = query.filter(AuditLog.projeto_id == projeto_id)
    else:
        if user_project_ids:
            # Include logs for user's projects AND user's own logs without projeto_id
            # (login, logout, user creation, etc. have projeto_id=NULL)
            # Security: only show NULL-project logs belonging to the current user
            query = query.filter(
                db.or_(
                    AuditLog.projeto_id.in_(user_project_ids),
                    db.and_(
                        AuditLog.projeto_id.is_(None),
                        AuditLog.usuario_id == current_user_id
                    )
                )
            )
        else:
            # No projects — only show own non-project logs
            query = query.filter(
                AuditLog.usuario_id == current_user_id,
                AuditLog.projeto_id.is_(None)
            )

    # Apply additional filters
    if acao:
        query = query.filter(AuditLog.acao == acao)
    if entidade_tipo:
        query = query.filter(AuditLog.entidade_tipo == entidade_tipo)
    if ip:
        query = query.filter(AuditLog.ip == ip)
    if search:
        # Escape LIKE wildcards to prevent pattern injection
        escaped = search.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
        search_term = f'%{escaped}%'

        # For client users, also search in project name (nome_cliente)
        from app.models import Project
        client_project_ids = []
        if user.perfil == 'cliente':
            client_projects = Project.query.filter_by(cliente_id=current_user_id, ativo=True).all()
            client_project_ids = [p.id for p in client_projects]

        if client_project_ids:
            # Client searching - include project name in search
            query = query.filter(
                db.or_(
                    AuditLog.acao.ilike(search_term, escape='\\'),
                    AuditLog.entidade_tipo.ilike(search_term, escape='\\'),
                    AuditLog.detalhes.ilike(search_term, escape='\\'),
                    AuditLog.projeto_id.in_(client_project_ids)
                )
            )
        else:
            query = query.filter(
                db.or_(
                    AuditLog.acao.ilike(search_term, escape='\\'),
                    AuditLog.entidade_tipo.ilike(search_term, escape='\\'),
                    AuditLog.detalhes.ilike(search_term, escape='\\'),
                )
            )
    if usuario_id:
        # Security: only allow filtering by usuario_id within accessible projects
        # This prevents enumerating other users' activity across inaccessible projects
        if usuario_id != current_user_id:
            # Restrict to project-scoped logs only (not null-project logs of other users)
            query = query.filter(AuditLog.projeto_id.isnot(None))
        query = query.filter(AuditLog.usuario_id == usuario_id)
    if data_inicio:
        try:
            inicio = datetime.fromisoformat(data_inicio)
            if inicio.tzinfo is None:
                inicio = inicio.replace(tzinfo=timezone.utc)
            query = query.filter(AuditLog.criado_em >= inicio)
        except (ValueError, TypeError):
            return {'message': 'Formato de data_inicio inválido. Use ISO 8601 (ex: 2024-01-01T00:00:00)'}, 400
    if data_fim:
        try:
            fim = datetime.fromisoformat(data_fim)
            if fim.tzinfo is None:
                fim = fim.replace(tzinfo=timezone.utc)
            query = query.filter(AuditLog.criado_em <= fim)
        except (ValueError, TypeError):
            return {'message': 'Formato de data_fim inválido. Use ISO 8601 (ex: 2024-01-31T23:59:59)'}, 400

    # Order by most recent first
    query = query.order_by(AuditLog.criado_em.desc())

    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    logs = pagination.items

    return {
        'audit_logs': [log.to_dict() for log in logs],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }
