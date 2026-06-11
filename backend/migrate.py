"""Runs Alembic migrations without the Flask CLI (avoids eventlet import order issues)."""
import os

os.environ.setdefault('FLASK_ENV', os.environ.get('FLASK_ENV', 'production'))

from app import create_app
from flask_migrate import upgrade

app = create_app(os.environ['FLASK_ENV'])
with app.app_context():
    upgrade()
    print("Migrations applied successfully.")
