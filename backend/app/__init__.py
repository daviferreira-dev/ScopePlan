import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


def create_app(config_name=None):
    app = Flask(__name__)

    # Load config
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    from app.config import config
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app, supports_credentials=True)

    # JWT blocklist check
    from app.routes.auth import _token_blocklist

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return jwt_payload['jti'] in _token_blocklist

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'Token expirado', 'error': 'token_expired'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'message': 'Token inválido', 'error': 'invalid_token'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'message': 'Token de acesso necessário', 'error': 'authorization_required'}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'Token revogado', 'error': 'token_revoked'}), 401

    # Register blueprints
    from app.routes import auth_bp, projects_bp, requirements_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(requirements_bp)

    # Health check
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'service': 'ScopePlan API'}

    # Create tables
    with app.app_context():
        from app.models import User, Project, Requirement, Validacao
        db.create_all()

    return app
