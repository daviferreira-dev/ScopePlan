"""Tests for authentication endpoints."""
from app import db
from app.models import TokenBlocklist


class TestAuthRegister:
    def test_register_success(self, client):
        resp = client.post('/api/auth/register', json={
            'nome': 'Novo Usuario', 'email': 'novo@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert 'access_token' in data
        assert 'refresh_token' in data
        assert data['user']['email'] == 'novo@test.com'
        assert data['user']['perfil'] == 'analista'

    def test_register_gestor_blocked(self, client):
        """P0 fix: gestor role must not be self-assignable."""
        resp = client.post('/api/auth/register', json={
            'nome': 'Gestor Fraud', 'email': 'gestor@test.com',
            'senha': 'senha123', 'perfil': 'gestor'
        })
        assert resp.status_code == 400

    def test_register_duplicate_email(self, client):
        client.post('/api/auth/register', json={
            'nome': 'User1', 'email': 'dup@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        resp = client.post('/api/auth/register', json={
            'nome': 'User2', 'email': 'dup@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        assert resp.status_code == 400

    def test_register_short_password(self, client):
        resp = client.post('/api/auth/register', json={
            'nome': 'User', 'email': 'short@test.com',
            'senha': '123', 'perfil': 'analista'
        })
        assert resp.status_code == 400


class TestAuthLogin:
    def test_login_success(self, client):
        client.post('/api/auth/register', json={
            'nome': 'Login User', 'email': 'login@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        resp = client.post('/api/auth/login', json={
            'email': 'login@test.com', 'senha': 'senha123'
        })
        assert resp.status_code == 200
        assert 'access_token' in resp.get_json()

    def test_login_wrong_password(self, client):
        client.post('/api/auth/register', json={
            'nome': 'Login User', 'email': 'wrong@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        resp = client.post('/api/auth/login', json={
            'email': 'wrong@test.com', 'senha': 'errada'
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        resp = client.post('/api/auth/login', json={
            'email': 'noone@test.com', 'senha': 'senha123'
        })
        assert resp.status_code == 401


class TestAuthRefresh:
    def test_refresh_active_user(self, client):
        resp = client.post('/api/auth/register', json={
            'nome': 'Refresh User', 'email': 'refresh@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        refresh_token = resp.get_json()['refresh_token']
        resp2 = client.post('/api/auth/refresh', headers={
            'Authorization': f'Bearer {refresh_token}'
        })
        assert resp2.status_code == 200
        assert 'access_token' in resp2.get_json()

    def test_refresh_deactivated_user(self, client, app):
        """P1 fix: deactivated users cannot refresh tokens."""
        resp = client.post('/api/auth/register', json={
            'nome': 'Deact User', 'email': 'deact@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        data = resp.get_json()
        uid = data['user']['id']
        refresh_token = data['refresh_token']

        from app.models import User
        with app.app_context():
            user = db.session.get(User, uid)
            user.ativo = False
            db.session.commit()

        resp2 = client.post('/api/auth/refresh', headers={
            'Authorization': f'Bearer {refresh_token}'
        })
        assert resp2.status_code == 403

    def test_refresh_token_rotation(self, client, app):
        """Old refresh token must be revoked after rotation."""
        resp = client.post('/api/auth/register', json={
            'nome': 'Rotate User', 'email': 'rotate@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        old_refresh = resp.get_json()['refresh_token']

        # Use the refresh token — should get new tokens back
        resp2 = client.post('/api/auth/refresh', headers={
            'Authorization': f'Bearer {old_refresh}'
        })
        assert resp2.status_code == 200
        data2 = resp2.get_json()
        assert 'access_token' in data2
        assert 'refresh_token' in data2
        new_refresh = data2['refresh_token']

        # The new refresh token must differ from the old one
        assert new_refresh != old_refresh

        # Reusing the old refresh token should fail (it was revoked)
        resp3 = client.post('/api/auth/refresh', headers={
            'Authorization': f'Bearer {old_refresh}'
        })
        assert resp3.status_code in (401, 422)

        # The new refresh token should still work
        resp4 = client.post('/api/auth/refresh', headers={
            'Authorization': f'Bearer {new_refresh}'
        })
        assert resp4.status_code == 200


class TestAuthLogout:
    def test_logout_revokes_tokens(self, client, app):
        """Logout should revoke both access and refresh tokens."""
        resp = client.post('/api/auth/register', json={
            'nome': 'Logout User', 'email': 'logout@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        data = resp.get_json()
        access_token = data['access_token']
        refresh_token = data['refresh_token']

        # Logout with both tokens
        resp2 = client.post('/api/auth/logout', json={
            'refresh_token': refresh_token
        }, headers={'Authorization': f'Bearer {access_token}'})
        assert resp2.status_code == 200

        # Access token should now be revoked
        resp3 = client.get('/api/auth/me', headers={
            'Authorization': f'Bearer {access_token}'
        })
        assert resp3.status_code == 401

        # Refresh token should also be revoked
        resp4 = client.post('/api/auth/refresh', headers={
            'Authorization': f'Bearer {refresh_token}'
        })
        assert resp4.status_code in (401, 422)


class TestAuthProfile:
    def test_get_profile(self, client, auth_headers):
        resp = client.get('/api/auth/me', headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()['user']['email'] == 'analista@test.com'

    def test_profile_without_token(self, client):
        resp = client.get('/api/auth/me')
        assert resp.status_code in (401, 422)

    def test_update_password_requires_current(self, client):
        """Changing password requires senha_atual."""
        resp = client.post('/api/auth/register', json={
            'nome': 'Pw User', 'email': 'pw@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        token = resp.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # Without senha_atual — should fail
        resp2 = client.put('/api/auth/me', json={
            'senha': 'nova_senha456'
        }, headers=headers)
        assert resp2.status_code == 400

        # With wrong senha_atual — should fail
        resp3 = client.put('/api/auth/me', json={
            'senha': 'nova_senha456', 'senha_atual': 'wrong_password'
        }, headers=headers)
        assert resp3.status_code == 401

        # With correct senha_atual — should succeed
        resp4 = client.put('/api/auth/me', json={
            'senha': 'nova_senha456', 'senha_atual': 'senha123'
        }, headers=headers)
        assert resp4.status_code == 200

        # Login with new password should work
        resp5 = client.post('/api/auth/login', json={
            'email': 'pw@test.com', 'senha': 'nova_senha456'
        })
        assert resp5.status_code == 200

    def test_cannot_self_deactivate(self, client):
        """Users cannot deactivate their own account."""
        resp = client.post('/api/auth/register', json={
            'nome': 'Deact Self', 'email': 'deactself@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        token = resp.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        resp2 = client.put('/api/auth/me', json={
            'ativo': False
        }, headers=headers)
        assert resp2.status_code == 400


class TestHealthCheck:
    def test_health_no_auth(self, client):
        resp = client.get('/api/health')
        assert resp.status_code == 200
        assert resp.get_json()['status'] == 'ok'
