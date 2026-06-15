import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_socketio import SocketIO
from dotenv import load_dotenv
from datetime import datetime, timezone

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()
socketio = SocketIO()


def create_app(config_name=None):
    # Load .env before any config is read
    load_dotenv()

    app = Flask(__name__)

    # Load config
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    from app.config import config
    app.config.from_object(config[config_name])

    # For production, resolve DATABASE_URI lazily (requires DATABASE_URL)
    config_cls = config[config_name]
    if hasattr(config_cls, 'get_sqlalchemy_database_uri'):
        app.config['SQLALCHEMY_DATABASE_URI'] = config_cls.get_sqlalchemy_database_uri()

    # Validate config (strict for production, warning for development)
    config_cls.validate()

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # CORS — restrict by env var in all environments
    allowed_origins = [o.strip() for o in os.environ.get('CORS_ORIGINS', '').split(',') if o.strip()]
    if not allowed_origins and config_name != 'production':
        allowed_origins = ['http://localhost:5173', 'http://localhost:3000']

    if allowed_origins:
        CORS(app, supports_credentials=True, origins=allowed_origins)
    elif config_name == 'production':
        CORS(app, supports_credentials=True, origins=[])
    else:
        CORS(app, supports_credentials=True, origins=['http://localhost:5173', 'http://localhost:3000'])

    # Flask-SocketIO — WebSocket layer for collaborative editing
    socketio.init_app(
        app,
        cors_allowed_origins=allowed_origins or ['http://localhost:5173', 'http://localhost:3000'],
        async_mode='eventlet',
        logger=False,
        engineio_logger=False,
        manage_session=False,
    )
    from . import sockets as _socket_events  # noqa: F401 — registers event handlers

    # Security headers (LGPD / OWASP) via Flask-Talisman
    from flask_talisman import Talisman
    if config_name == 'production':
        Talisman(
            app,
            force_https=True,
            strict_transport_security=True,
            strict_transport_security_max_age=31536000,
            strict_transport_security_include_subdomains=True,
            content_security_policy={
                'default-src': "'self'",
                'script-src': ["'self'"],
                'style-src': ["'self'", "'unsafe-inline'"],
                'img-src': ["'self'", 'data:', 'blob:'],
                'connect-src': ["'self'"],
                'font-src': ["'self'", 'data:'],
                'frame-ancestors': "'none'",
                'base-uri': "'self'",
                'form-action': "'self'",
            },
            referrer_policy='strict-origin-when-cross-origin',
        )
    else:
        # Dev: enable safe headers without HTTPS forcing or strict CSP
        # (strict CSP blocks Vite HMR and React DevTools)
        Talisman(
            app,
            force_https=False,
            strict_transport_security=False,
            content_security_policy=False,
            x_content_type_options=True,
            frame_options='SAMEORIGIN',
            referrer_policy='strict-origin-when-cross-origin',
        )

    # JWT blocklist check — uses database-backed TokenBlocklist
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        from app.models import TokenBlocklist
        return TokenBlocklist.is_revoked(jwt_payload['jti'])

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'Token expirado'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'message': 'Token invalido'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'message': 'Token de acesso necessario'}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'Token revogado'}), 401

    # Global JSON error handler — preserves HTTPException status codes (404, 405, etc.)
    from werkzeug.exceptions import HTTPException

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        return jsonify({'message': error.description}), error.code

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        from flask import current_app
        current_app.logger.error(f"Unhandled exception: {error}", exc_info=True)
        return jsonify({'message': 'Erro interno do servidor'}), 500

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.projects import projects_bp
    from app.routes.requirements import requirements_bp, project_reqs_bp
    from app.routes.comments import req_comments_bp, comments_bp
    from app.routes.audit import audit_bp
    from app.routes.diagramas import diagramas_bp
    from app.routes.blocos import blocos_bp
    from app.routes.anexos import anexos_bp
    from app.routes.convites import convites_bp
    from app.routes.visao_geral import visao_geral_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(project_reqs_bp)
    app.register_blueprint(requirements_bp)
    app.register_blueprint(req_comments_bp)
    app.register_blueprint(comments_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(diagramas_bp)
    app.register_blueprint(blocos_bp)
    app.register_blueprint(anexos_bp)
    app.register_blueprint(convites_bp)
    app.register_blueprint(visao_geral_bp)

    # Health check endpoint — no auth required
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok'}, 200

    # Initialize rate limiter
    from app.routes.auth import init_limiter
    init_limiter(app)

    # Prune expired blocklist tokens periodically (every 100 requests)
    _request_counter = {'count': 0}

    @app.after_request
    def prune_blocklist_periodically(response):
        _request_counter['count'] += 1
        if _request_counter['count'] % 100 == 0:
            try:
                from app.models import TokenBlocklist
                now = datetime.now(timezone.utc)
                TokenBlocklist.query.filter(TokenBlocklist.expires_at < now).delete()
                db.session.commit()
            except Exception:
                db.session.rollback()
        return response

    # Auto-run migrations (replaces db.create_all — ensures schema matches migration history)
    if config_name != 'production':
        with app.app_context():
            from flask_migrate import upgrade
            upgrade()

    return app
