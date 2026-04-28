from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from app import db
from app.models import Project, User
from app.schemas import ProjectCreateSchema, ProjectUpdateSchema, ProjectSchema
from app.utils import validate_json

projects_bp = Blueprint('projects', __name__)


@projects_bp.route('', methods=['POST'])
@jwt_required()
@validate_json(ProjectCreateSchema)
def create_project():
    """
    Create a new project
    ---
    Body:
        - name: string (required)
        - description: string (optional)
        - version: string (optional, default: '1.0')
        - status: string (optional, default: 'draft')
    """
    current_user_id = int(get_jwt_identity())
    data = request.validated_data

    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'message': 'Usuário não encontrado'}), 404

    # Create project
    project = Project(
        name=data['name'],
        description=data.get('description'),
        version=data.get('version', '1.0'),
        status=data.get('status', 'draft'),
        owner_id=current_user_id
    )

    db.session.add(project)
    db.session.commit()

    return jsonify({
        'message': 'Projeto criado com sucesso',
        'project': project.to_dict()
    }), 201


@projects_bp.route('', methods=['GET'])
@jwt_required()
def list_projects():
    """
    List all projects (with pagination and filters)
    ---
    Query params:
        - page: int (default: 1)
        - per_page: int (default: 20, max: 100)
        - status: filter by status
        - search: search in name/description
    """
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    status = request.args.get('status')
    search = request.args.get('search')

    # Base query
    query = Project.query

    # Apply filters
    if status:
        query = query.filter_by(status=status)

    if search:
        search_term = f'%{search}%'
        query = query.filter(
            db.or_(
                Project.name.ilike(search_term),
                Project.description.ilike(search_term)
            )
        )

    # Order by most recent
    query = query.order_by(Project.updated_at.desc())

    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'projects': [p.to_dict() for p in pagination.items],
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    }), 200


@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    """
    Get project details
    ---
    Path params:
        - project_id: int (required)
    Query params:
        - include_requirements: boolean (default: false)
    """
    project = Project.query.get(project_id)

    if not project:
        return jsonify({'message': 'Projeto não encontrado'}), 404

    include_requirements = request.args.get('include_requirements', 'false').lower() == 'true'

    return jsonify({
        'project': project.to_dict(include_requirements=include_requirements)
    }), 200


@projects_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
@validate_json(ProjectUpdateSchema)
def update_project(project_id):
    """
    Update project
    ---
    Path params:
        - project_id: int (required)
    Body (all optional):
        - name: string
        - description: string
        - version: string
        - status: string
    """
    current_user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)

    if not project:
        return jsonify({'message': 'Projeto não encontrado'}), 404

    # Only owner can update
    if project.owner_id != current_user_id:
        return jsonify({'message': 'Apenas o dono do projeto pode editá-lo'}), 403

    data = request.validated_data

    if 'name' in data and data['name']:
        project.name = data['name']
    if 'description' in data:
        project.description = data['description']
    if 'version' in data and data['version']:
        project.version = data['version']
    if 'status' in data and data['status']:
        project.status = data['status']

    db.session.commit()

    return jsonify({
        'message': 'Projeto atualizado com sucesso',
        'project': project.to_dict()
    }), 200


@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    """
    Delete project
    ---
    Path params:
        - project_id: int (required)
    """
    current_user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)

    if not project:
        return jsonify({'message': 'Projeto não encontrado'}), 404

    # Only owner can delete
    if project.owner_id != current_user_id:
        return jsonify({'message': 'Apenas o dono do projeto pode excluí-lo'}), 403

    db.session.delete(project)
    db.session.commit()

    return jsonify({'message': 'Projeto excluído com sucesso'}), 200


@projects_bp.route('/<int:project_id>/increment-version', methods=['POST'])
@jwt_required()
def increment_project_version(project_id):
    """
    Increment project version
    ---
    Path params:
        - project_id: int (required)
    """
    current_user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)

    if not project:
        return jsonify({'message': 'Projeto não encontrado'}), 404

    # Only owner can update
    if project.owner_id != current_user_id:
        return jsonify({'message': 'Apenas o dono do projeto pode atualizá-lo'}), 403

    project.increment_version()
    db.session.commit()

    return jsonify({
        'message': 'Versão incrementada com sucesso',
        'project': project.to_dict()
    }), 200
