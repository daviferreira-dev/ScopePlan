from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate

from .config import config

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Disable CSRF for API (API uses JWT tokens)
    app.config['WTF_CSRF_ENABLED'] = False

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.projects import projects_bp
    from .routes.requirements import requirements_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(requirements_bp, url_prefix='/api/requirements')

    # Create tables
    with app.app_context():
        db.create_all()

    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'message': 'Token expirado', 'error': 'token_expired'}, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        # Log the actual error for debugging
        import sys
        print(f"JWT Invalid Token Error: {error}", file=sys.stderr)
        return {'message': 'Token inválido', 'error': 'invalid_token', 'details': str(error)}, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'message': 'Token de acesso necessário', 'error': 'authorization_required'}, 401

    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'service': 'ScopePlan API'}

    return app
