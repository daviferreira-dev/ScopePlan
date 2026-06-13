"""Tests for RF01-A5 — recuperação de senha via código OTP (6 dígitos, 15 min)."""


def _register(client, email='reset@test.com', senha='Senha@123'):
    return client.post('/api/auth/register', json={
        'nome': 'Reset User', 'email': email, 'senha': senha, 'perfil': 'analista'
    })


def _request_code(client, email='reset@test.com'):
    return client.post('/api/auth/forgot-password', json={'email': email}).get_json()['reset_code']


class TestPasswordReset:
    def test_forgot_returns_code_in_dev(self, client):
        _register(client)
        resp = client.post('/api/auth/forgot-password', json={'email': 'reset@test.com'})
        assert resp.status_code == 200
        assert 'reset_code' in resp.get_json()  # EXPOSE_RESET_LINK em testing

    def test_forgot_unknown_email_returns_404(self, client):
        """E-mail inexistente é informado explicitamente (decisão de produto)."""
        resp = client.post('/api/auth/forgot-password', json={'email': 'naoexiste@test.com'})
        assert resp.status_code == 404
        assert 'reset_code' not in resp.get_json()

    def test_verify_code_ok(self, client):
        _register(client)
        code = _request_code(client)
        resp = client.post('/api/auth/verify-reset-code',
                           json={'email': 'reset@test.com', 'code': code})
        assert resp.status_code == 200

    def test_verify_wrong_code_rejected(self, client):
        _register(client)
        _request_code(client)
        resp = client.post('/api/auth/verify-reset-code',
                           json={'email': 'reset@test.com', 'code': '000000'})
        assert resp.status_code == 400

    def test_full_reset_flow(self, client):
        _register(client)
        code = _request_code(client)

        resp = client.post('/api/auth/reset-password', json={
            'email': 'reset@test.com', 'code': code, 'senha': 'NovaSenha@456'})
        assert resp.status_code == 200

        ok = client.post('/api/auth/login', json={'email': 'reset@test.com', 'senha': 'NovaSenha@456'})
        assert ok.status_code == 200
        old = client.post('/api/auth/login', json={'email': 'reset@test.com', 'senha': 'Senha@123'})
        assert old.status_code == 401

    def test_invalid_code_rejected(self, client):
        _register(client)
        _request_code(client)
        resp = client.post('/api/auth/reset-password', json={
            'email': 'reset@test.com', 'code': '999999', 'senha': 'NovaSenha@456'})
        assert resp.status_code == 400

    def test_code_is_single_use(self, client):
        _register(client)
        code = _request_code(client)
        client.post('/api/auth/reset-password', json={
            'email': 'reset@test.com', 'code': code, 'senha': 'NovaSenha@456'})
        again = client.post('/api/auth/reset-password', json={
            'email': 'reset@test.com', 'code': code, 'senha': 'OutraSenha@789'})
        assert again.status_code == 400

    def test_code_burns_after_max_attempts(self, client):
        """5 tentativas erradas queimam o código, mesmo o correto deixa de valer."""
        _register(client)
        code = _request_code(client)
        for _ in range(5):
            client.post('/api/auth/verify-reset-code',
                        json={'email': 'reset@test.com', 'code': '000000'})
        resp = client.post('/api/auth/reset-password', json={
            'email': 'reset@test.com', 'code': code, 'senha': 'NovaSenha@456'})
        assert resp.status_code == 400

    def test_reset_enforces_strong_password(self, client):
        _register(client)
        code = _request_code(client)
        resp = client.post('/api/auth/reset-password', json={
            'email': 'reset@test.com', 'code': code, 'senha': 'fraca1'})
        assert resp.status_code == 400
