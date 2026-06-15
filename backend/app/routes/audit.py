from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, AuditLog
from app.utils.access import get_user_project_ids

audit_bp = Blueprint('audit', __name__, url_prefix='/api/audit')

# Espelha ACTION_LABELS do frontend para permitir busca pelo label traduzido
ACTION_LABELS = {
    'criacao': 'requisito criado',
    'edicao': 'requisito editado',
    'atualizacao': 'registro atualizado',
    'aprovacao': 'requisito aprovado',
    'reprovacao': 'requisito reprovado',
    'comentario': 'comentário adicionado',
    'anexo': 'documento anexado',
    'autenticacao': 'novo utilizador autenticado',
    'permissao': 'permissão alterada',
    'exclusao': 'exclusão realizada',
    'status': 'status atualizado',
    'validacao': 'requisito validado',
    'submissao_revisao': 'submetido para revisão',
    'upload_diagrama': 'diagrama adicionado',
    'exclusao_diagrama': 'diagrama excluído',
}


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
    per_page = request.args.get('per_page') or request.args.get('size', 20, type=int)
    per_page = int(per_page)

    # Limit per_page
    per_page = min(per_page, 1000)

    # A auditoria é EXCLUSIVAMENTE sobre projetos: logs sem projeto
    # (login, logout, reset de senha, criação/edição de usuário) nunca aparecem.
    user_project_ids = get_user_project_ids(user)

    # Sem projetos acessíveis → nenhuma entrada de auditoria
    if not user_project_ids:
        return {
            'audit_logs': [],
            'total': 0,
            'page': page,
            'per_page': per_page,
            'pages': 0,
        }

    query = AuditLog.query

    if projeto_id:
        # User can only filter to projects they have access to
        if projeto_id not in user_project_ids:
            return {'message': 'Acesso negado a este projeto'}, 403
        query = query.filter(AuditLog.projeto_id == projeto_id)
    else:
        # Apenas logs vinculados aos projetos acessíveis (IN nunca casa com NULL)
        query = query.filter(AuditLog.projeto_id.in_(user_project_ids))

    # Apply additional filters
    if acao:
        query = query.filter(AuditLog.acao == acao)
    if entidade_tipo:
        query = query.filter(AuditLog.entidade_tipo == entidade_tipo)
    if ip:
        query = query.filter(AuditLog.ip == ip)
    if search:
        import unicodedata
        def _norm(s):
            return unicodedata.normalize('NFD', (s or '').lower()).encode('ascii', 'ignore').decode()

        q = search.strip().lower()
        q_norm = _norm(q)
        search_term = f'%{q}%'

        # 1. Busca por label de ação traduzido (ex: "Requisito criado" → "criacao"), sem acento
        matched_acoes = [key for key, label in ACTION_LABELS.items() if q_norm in _norm(label)]

        # 2. Busca por nome de autor (nome é criptografado — compara em memória), sem acento
        matched_user_ids = [
            u.id for u in db.session.query(User).all()
            if u.nome and q_norm in _norm(str(u.nome))
        ]

        conditions = [
            AuditLog.acao.ilike(search_term),
            AuditLog.entidade_tipo.ilike(search_term),
            AuditLog.detalhes.ilike(search_term),
        ]
        if matched_acoes:
            conditions.append(AuditLog.acao.in_(matched_acoes))
        if matched_user_ids:
            conditions.append(AuditLog.usuario_id.in_(matched_user_ids))

        query = query.filter(db.or_(*conditions))
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
