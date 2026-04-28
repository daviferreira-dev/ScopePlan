from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from app import db
from app.models import Requirement, Project, User
from app.schemas import (
    RequirementCreateSchema,
    RequirementUpdateSchema,
    RequirementValidationSchema,
    RequirementSchema
)
from app.utils import validate_json

requirements_bp = Blueprint('requirements', __name__)


@requirements_bp.route('', methods=['POST'])
@jwt_required()
@validate_json(RequirementCreateSchema)
def create_requirement():
    """
    Create a new requirement
    ---
    Body:
        - title: string (required)
        - description: string (optional)
        - project_id: int (required)
        - type: string (optional)
        - priority: string (optional)
        - complexity: string (optional)
        - status: string (optional, default: 'draft')
    """
    current_user_id = int(get_jwt_identity())
    data = request.validated_data

    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'message': 'Usuário não encontrado'}), 404

    # Only analysts can create requirements
    if user.role != 'analista':
        return jsonify({'message': 'Apenas analistas podem criar requisitos'}), 403

    # Verify project exists
    project = Project.query.get(data['project_id'])
    if not project:
        return jsonify({'message': 'Projeto não encontrado'}), 404

    # Create requirement
    requirement = Requirement(
        title=data['title'],
        description=data.get('description'),
        project_id=data['project_id'],
        author_id=current_user_id,
        type=data.get('type'),
        priority=data.get('priority'),
        complexity=data.get('complexity'),
        status=data.get('status', 'draft'),
        version='1.0'
    )

    db.session.add(requirement)
    db.session.commit()

    return jsonify({
        'message': 'Requisito criado com sucesso',
        'requirement': requirement.to_dict()
    }), 201


@requirements_bp.route('', methods=['GET'])
@jwt_required()
def list_requirements():
    """
    List all requirements (with pagination and filters)
    ---
    Query params:
        - page: int (default: 1)
        - per_page: int (default: 20, max: 100)
        - project_id: filter by project
        - status: filter by status
        - validated: filter by validation status
        - type: filter by type
        - priority: filter by priority
        - author_id: filter by author
        - search: search in title/description
    """
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    project_id = request.args.get('project_id', type=int)
    status = request.args.get('status')
    validated = request.args.get('validated')
    req_type = request.args.get('type')
    priority = request.args.get('priority')
    author_id = request.args.get('author_id', type=int)
    search = request.args.get('search')

    # Base query
    query = Requirement.query

    # Apply filters
    if project_id:
        query = query.filter_by(project_id=project_id)

    if status:
        query = query.filter_by(status=status)

    if validated is not None:
        validated_bool = validated.lower() == 'true'
        query = query.filter_by(validated=validated_bool)

    if req_type:
        query = query.filter_by(type=req_type)

    if priority:
        query = query.filter_by(priority=priority)

    if author_id:
        query = query.filter_by(author_id=author_id)

    if search:
        search_term = f'%{search}%'
        query = query.filter(
            db.or_(
                Requirement.title.ilike(search_term),
                Requirement.description.ilike(search_term)
            )
        )

    # Order by most recent
    query = query.order_by(Requirement.updated_at.desc())

    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'requirements': [r.to_dict() for r in pagination.items],
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    }), 200


@requirements_bp.route('/<int:requirement_id>', methods=['GET'])
@jwt_required()
def get_requirement(requirement_id):
    """
    Get requirement details
    ---
    Path params:
        - requirement_id: int (required)
    Query params:
        - include_project: boolean (default: false)
    """
    requirement = Requirement.query.get(requirement_id)

    if not requirement:
        return jsonify({'message': 'Requisito não encontrado'}), 404

    include_project = request.args.get('include_project', 'false').lower() == 'true'

    return jsonify({
        'requirement': requirement.to_dict(include_project=include_project)
    }), 200


@requirements_bp.route('/<int:requirement_id>', methods=['PUT'])
@jwt_required()
@validate_json(RequirementUpdateSchema)
def update_requirement(requirement_id):
    """
    Update requirement
    ---
    Path params:
        - requirement_id: int (required)
    Body (all optional):
        - title: string
        - description: string
        - type: string
        - priority: string
        - complexity: string
        - status: string
    """
    current_user_id = int(get_jwt_identity())
    requirement = Requirement.query.get(requirement_id)

    if not requirement:
        return jsonify({'message': 'Requisito não encontrado'}), 404

    # Only author can update
    if requirement.author_id != current_user_id:
        return jsonify({'message': 'Apenas o autor do requisito pode editá-lo'}), 403

    data = request.validated_data

    # Track version changes
    old_version = requirement.version

    if 'title' in data and data['title']:
        requirement.title = data['title']
    if 'description' in data:
        requirement.description = data['description']
    if 'type' in data:
        requirement.type = data['type']
    if 'priority' in data:
        requirement.priority = data['priority']
    if 'complexity' in data:
        requirement.complexity = data['complexity']
    if 'status' in data and data['status']:
        requirement.status = data['status']

    # Increment version if content changed
    if any(key in data for key in ['title', 'description']):
        requirement.increment_version()
        requirement.add_version_history_entry(
            old_version,
            requirement.version,
            current_user_id,
            {k: v for k, v in data.items() if k in ['title', 'description']}
        )

    db.session.commit()

    return jsonify({
        'message': 'Requisito atualizado com sucesso',
        'requirement': requirement.to_dict()
    }), 200


@requirements_bp.route('/<int:requirement_id>', methods=['DELETE'])
@jwt_required()
def delete_requirement(requirement_id):
    """
    Delete requirement
    ---
    Path params:
        - requirement_id: int (required)
    """
    current_user_id = int(get_jwt_identity())
    requirement = Requirement.query.get(requirement_id)

    if not requirement:
        return jsonify({'message': 'Requisito não encontrado'}), 404

    # Only author can delete
    if requirement.author_id != current_user_id:
        return jsonify({'message': 'Apenas o autor do requisito pode excluí-lo'}), 403

    db.session.delete(requirement)
    db.session.commit()

    return jsonify({'message': 'Requisito excluído com sucesso'}), 200


@requirements_bp.route('/<int:requirement_id>/validate', methods=['POST'])
@jwt_required()
@validate_json(RequirementValidationSchema)
def validate_requirement(requirement_id):
    """
    Validate or reject a requirement (client only)
    ---
    Path params:
        - requirement_id: int (required)
    Body:
        - approved: boolean (required) - true to approve, false to reject
        - comments: string (optional)
    """
    current_user_id = int(get_jwt_identity())
    requirement = Requirement.query.get(requirement_id)

    if not requirement:
        return jsonify({'message': 'Requisito não encontrado'}), 404

    # Verify user is a client
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'message': 'Usuário não encontrado'}), 404

    if user.role != 'cliente':
        return jsonify({'message': 'Apenas clientes podem validar requisitos'}), 403

    data = request.validated_data

    if data['approved']:
        requirement.validate_requirement(current_user_id, data.get('comments'))
        message = 'Requisito aprovado com sucesso'
    else:
        requirement.reject_requirement(current_user_id, data.get('comments'))
        message = 'Requisito rejeitado'

    db.session.commit()

    return jsonify({
        'message': message,
        'requirement': requirement.to_dict()
    }), 200


@requirements_bp.route('/<int:requirement_id>/submit-review', methods=['POST'])
@jwt_required()
def submit_for_review(requirement_id):
    """
    Submit requirement for client review
    ---
    Path params:
        - requirement_id: int (required)
    """
    current_user_id = int(get_jwt_identity())
    requirement = Requirement.query.get(requirement_id)

    if not requirement:
        return jsonify({'message': 'Requisito não encontrado'}), 404

    # Only author can submit for review
    if requirement.author_id != current_user_id:
        return jsonify({'message': 'Apenas o autor pode submeter para revisão'}), 403

    if requirement.status != 'draft':
        return jsonify({'message': 'Apenas requisitos em rascunho podem ser submetidos'}), 400

    requirement.status = 'in_review'
    db.session.commit()

    return jsonify({
        'message': 'Requisito submetido para revisão',
        'requirement': requirement.to_dict()
    }), 200


@requirements_bp.route('/<int:requirement_id>/version-history', methods=['GET'])
@jwt_required()
def get_version_history(requirement_id):
    """
    Get requirement version history
    ---
    Path params:
        - requirement_id: int (required)
    """
    requirement = Requirement.query.get(requirement_id)

    if not requirement:
        return jsonify({'message': 'Requisito não encontrado'}), 404

    return jsonify({
        'requirement_id': requirement.id,
        'current_version': requirement.version,
        'version_history': requirement._parse_version_history()
    }), 200
