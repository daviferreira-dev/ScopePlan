import os
from datetime import timedelta


def _env_bool(name, default):
    val = os.environ.get(name)
    if val is None:
        return default
    return val.strip().lower() in ('1', 'true', 'yes', 'on')


def _get_database_uri():
    """Build the database URI, fixing postgres:// → postgresql:// for SQLAlchemy."""
    uri = os.environ.get('DATABASE_URL') or 'sqlite:///scopeplan.db'
    if uri.startswith('postgres://'):
        uri = uri.replace('postgres://', 'postgresql://', 1)
    return uri



# Known weak/placeholder values that must never be used in production
_WEAK_SECRETS = {
    'dev-secret-key-scopeplan-2026',
    'jwt-secret-key-scopeplan-2026',
    'dev-only-fallback-do-not-use-in-prod',
    'dev-only-jwt-fallback-do-not-use-in-prod',
    'your-secret-key-here',
    'your-jwt-secret-key-here',
    'changeme',
    'change-me',
    'secret',
    'jwt-secret',
    'CHANGE-ME-GENERATE-A-SECURE-RANDOM-KEY',
    'scopeplan-dev-secret-2024',
    'scopeplan-jwt-secret-2024',
    'dev-docker-secret-key-change-in-prod',
    'dev-docker-jwt-key-change-in-prod',
}


def _get_engine_options():
    uri = _get_database_uri()
    opts = {'pool_pre_ping': True, 'pool_recycle': 3600}
    if uri.startswith('sqlite'):
        opts['connect_args'] = {'timeout': 20}
    return opts


class Config:
    SQLALCHEMY_DATABASE_URI = _get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = _get_engine_options()

    # JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    # Refresh token via HttpOnly cookie — access token stays in Authorization header
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_REFRESH_COOKIE_NAME = 'refresh_token_cookie'
    JWT_COOKIE_CSRF_PROTECT = False  # Using SameSite instead
    JWT_COOKIE_SAMESITE = 'Lax'

    # Rate limiting
    RATE_LIMIT_AUTH = os.environ.get('RATE_LIMIT_AUTH', '5/minute')
    RATE_LIMIT_REGISTER = os.environ.get('RATE_LIMIT_REGISTER', '3/minute')
    RATE_LIMIT_STORAGE_URI = os.environ.get('RATE_LIMIT_STORAGE_URI', 'memory://')

    # Valida domínio (MX) do e-mail no cadastro — desligável p/ testes/offline
    VALIDATE_EMAIL_DOMAIN = _env_bool('VALIDATE_EMAIL_DOMAIN', True)

    # Password reset (RF01-A5)
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    # EXPOSE_RESET_LINK retorna o link na resposta da API — APENAS em dev/teste
    EXPOSE_RESET_LINK = False


class DevelopmentConfig(Config):
    DEBUG = True
    # dev: por padrão expõe o código na resposta; defina EXPOSE_RESET_LINK=false
    # no .env para testar o envio de e-mail real (o código só chega pela caixa de entrada).
    EXPOSE_RESET_LINK = _env_bool('EXPOSE_RESET_LINK', True)
    # Dev requires .env — no hardcoded fallbacks
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')

    @classmethod
    def validate(cls):
        """Warn (not fail) if secrets are missing in development."""
        import warnings
        if not cls.SECRET_KEY:
            cls.SECRET_KEY = 'dev-only-fallback-do-not-use-in-prod'
            warnings.warn(
                'SECRET_KEY not set — using insecure dev fallback. '
                'Set SECRET_KEY in .env for any non-local usage.',
                stacklevel=2,
            )
        if not cls.JWT_SECRET_KEY:
            cls.JWT_SECRET_KEY = 'dev-only-jwt-fallback-do-not-use-in-prod'
            warnings.warn(
                'JWT_SECRET_KEY not set — using insecure dev fallback. '
                'Set JWT_SECRET_KEY in .env for any non-local usage.',
                stacklevel=2,
            )


class ProductionConfig(Config):
    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    RATE_LIMIT_STORAGE_URI = os.environ.get('RATE_LIMIT_STORAGE_URI', 'memory://')

    @classmethod
    def validate(cls):
        """Validate production config — called by create_app('production')."""
        if not cls.SECRET_KEY:
            raise RuntimeError('SECRET_KEY environment variable is required in production')
        if not cls.JWT_SECRET_KEY:
            raise RuntimeError('JWT_SECRET_KEY environment variable is required in production')
        if cls.SECRET_KEY in _WEAK_SECRETS:
            raise RuntimeError('SECRET_KEY is too weak — use a secure random value')
        if cls.JWT_SECRET_KEY in _WEAK_SECRETS:
            raise RuntimeError('JWT_SECRET_KEY is too weak — use a secure random value')
        if not os.environ.get('FERNET_KEY'):
            raise RuntimeError('FERNET_KEY is required in production')
        if not os.environ.get('HMAC_KEY'):
            raise RuntimeError('HMAC_KEY is required in production')

    @classmethod
    def get_sqlalchemy_database_uri(cls):
        """Production requires DATABASE_URL — no SQLite fallback."""
        uri = os.environ.get('DATABASE_URL')
        if not uri:
            raise RuntimeError(
                'DATABASE_URL is required in production. '
                'Set it to a PostgreSQL connection string.'
            )
        if uri.startswith('postgres://'):
            uri = uri.replace('postgres://', 'postgresql://', 1)
        return uri


class TestingConfig(Config):
    TESTING = True
    VALIDATE_EMAIL_DOMAIN = False  # testes usam domínios fictícios (@test.com)
    EXPOSE_RESET_LINK = True
    SECRET_KEY = 'test-secret-key'
    JWT_SECRET_KEY = 'test-jwt-secret-key'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    RATE_LIMIT_STORAGE_URI = 'memory://'

    @classmethod
    def validate(cls):
        pass  # No validation needed for testing


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig,
}
