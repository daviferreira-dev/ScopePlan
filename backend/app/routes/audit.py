from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, AuditLog
from app.utils.access import get_user_project_ids

audit_bp = Blueprint('audit', __name__, url_prefix='/api/audit')


@audit_bp.route('', methods=['GET'])
@jwt_required()
def list_audit_logs():
    """List audit logs with optional filters, filtered by user's projects"""
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)

    if not user:
        return {'message': 'Usuário não encontrado'}, 404

    # Query params
    projeto_id = request.args.get('projeto_id', type=int)
    acao = request.args.get('acao', type=str)
    entidade_tipo = request.args.get('entidade_tipo', type=str)
    usuario_id = request.args.get('usuario_id', type=int)
    data_inicio = request.args.get('data_inicio', type=str)
    data_fim = request.args.get('data_fim', type=str)
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
            # Include logs for user's projects AND logs without projeto_id
            # (login, logout, user creation, etc. have projeto_id=NULL)
            query = query.filter(
                db.or_(
                    AuditLog.projeto_id.in_(user_project_ids),
                    AuditLog.projeto_id.is_(None)
                )
            )
        else:
            # User has no projects — still show system-level logs (no projeto_id)
            query = query.filter(AuditLog.projeto_id.is_(None))

    # Only show logs from the user themselves for non-project logs
    # Project-scoped logs are visible to anyone with project access
    if acao:
        query = query.filter(AuditLog.acao == acao)
    if entidade_tipo:
        query = query.filter(AuditLog.entidade_tipo == entidade_tipo)
    if usuario_id:
        query = query.filter(AuditLog.usuario_id == usuario_id)
    if data_inicio:
        from datetime import datetime
        try:
            start = datetime.fromisoformat(data_inicio)
            query = query.filter(AuditLog.criado_em >= start)
        except ValueError:
            pass
    if data_fim:
        from datetime import datetime
        try:
            end = datetime.fromisoformat(data_fim)
            query = query.filter(AuditLog.criado_em <= end)
        except ValueError:
            pass

    # Order by most recent first
    query = query.order_by(AuditLog.criado_em.desc())

    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'audit_logs': [log.to_dict() for log in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
    }), 200
