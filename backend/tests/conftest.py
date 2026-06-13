import pytest
from app import create_app, db
from app.models import User, Project, Requirement, Validacao, AuditLog, TokenBlocklist


@pytest.fixture
def app():
    """Create application for testing with in-memory SQLite."""
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Test client."""
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    """Register a user and return auth headers."""
    resp = client.post('/api/auth/register', json={
        'nome': 'Test Analista',
        'email': 'analista@test.com',
        'senha': 'Senha@123',
        'perfil': 'analista'
    })
    data = resp.get_json()
    token = data.get('access_token')
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def analista_user(client):
    """Create and return an analista user with auth headers."""
    resp = client.post('/api/auth/register', json={
        'nome': 'Analista Test',
        'email': 'analista@test.com',
        'senha': 'Senha@123',
        'perfil': 'analista'
    })
    data = resp.get_json()
    return {
        'id': data['user']['id'],
        'token': data['access_token'],
        'headers': {'Authorization': f"Bearer {data['access_token']}"}
    }


@pytest.fixture
def cliente_user(client):
    """Create and return a cliente user with auth headers."""
    resp = client.post('/api/auth/register', json={
        'nome': 'Cliente Test',
        'email': 'cliente@test.com',
        'senha': 'Senha@123',
        'perfil': 'cliente'
    })
    data = resp.get_json()
    return {
        'id': data['user']['id'],
        'token': data['access_token'],
        'headers': {'Authorization': f"Bearer {data['access_token']}"}
    }
