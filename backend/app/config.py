import os
from datetime import timedelta


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
}


class Config:
    SQLALCHEMY_DATABASE_URI = _get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,
    }

    # JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    # Refresh token via HttpOnly cookie — access token stays in Authorization header
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_REFRESH_COOKIE_NAME = 'refresh_token_cookie'
    JWT_COOKIE_CSRF_PROTECT = False  # Using SameSite instead

    # Rate limiting
    RATE_LIMIT_AUTH = os.environ.get('RATE_LIMIT_AUTH', '5/minute')
    RATE_LIMIT_REGISTER = os.environ.get('RATE_LIMIT_REGISTER', '3/minute')
    RATE_LIMIT_STORAGE_URI = os.environ.get('RATE_LIMIT_STORAGE_URI', 'memory://')


class DevelopmentConfig(Config):
    DEBUG = True
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
