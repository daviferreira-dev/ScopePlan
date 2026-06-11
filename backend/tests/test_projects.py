"""Tests for project endpoints — access control, soft-delete cascade."""
from app import db


class TestProjectAccess:
    def test_create_project_analista(self, client, analista_user):
        resp = client.post('/api/projects', json={
            'nome': 'Projeto Teste',
            'descricao': 'Desc',
            'cliente_id': None
        }, headers=analista_user['headers'])
        assert resp.status_code == 201

    def test_create_project_cliente_blocked(self, client, cliente_user):
        """Clientes cannot create projects."""
        resp = client.post('/api/projects', json={
            'nome': 'Projeto Bloqueado',
            'descricao': 'Desc'
        }, headers=cliente_user['headers'])
        assert resp.status_code == 403

    def test_list_projects_isolation(self, client, analista_user, cliente_user, app):
        """P0 fix: users only see their own projects."""
        from app.models import User, Project
        with app.app_context():
            analista = db.session.get(User, analista_user['id'])
            cliente = db.session.get(User, cliente_user['id'])
            p1 = Project(nome='Proj A', gestor_id=analista.id, cliente_id=cliente.id, ativo=True)
            p2 = Project(nome='Proj B', gestor_id=9999, cliente_id=9999, ativo=True)
            db.session.add_all([p1, p2])
            db.session.commit()

        # Analista sees only their own
        resp = client.get('/api/projects', headers=analista_user['headers'])
        assert resp.status_code == 200
        projetos = resp.get_json()['projetos']
        assert all(p['gestor_id'] == analista_user['id'] for p in projetos)

    def test_soft_delete_cascades_to_requirements(self, client, analista_user, app):
        """P2 fix: soft-deleting project also soft-deletes requirements."""
        from app.models import Requirement
        # Create project
        resp = client.post('/api/projects', json={
            'nome': 'Cascade Project',
            'descricao': 'Testing cascade'
        }, headers=analista_user['headers'])
        project_id = resp.get_json()['project']['id']

        # Create requirement
        resp2 = client.post('/api/requirements', json={
            'titulo': 'Req Test',
            'projeto_id': project_id,
            'tipo': 'funcional'
        }, headers=analista_user['headers'])
        req_id = resp2.get_json()['requirement']['id']

        # Delete project
        resp3 = client.delete(f'/api/projects/{project_id}', headers=analista_user['headers'])
        assert resp3.status_code == 200

        # Requirement should be soft-deleted
        with app.app_context():
            req = db.session.get(Requirement, req_id)
            assert req.ativo is False

    def test_access_other_user_project_blocked(self, client, app):
        """IDOR: user cannot access another user's project."""
        # Register two analistas
        r1 = client.post('/api/auth/register', json={
            'nome': 'Analista A', 'email': 'a@a.com', 'senha': 'senha123', 'perfil': 'analista'
        })
        r2 = client.post('/api/auth/register', json={
            'nome': 'Analista B', 'email': 'b@b.com', 'senha': 'senha123', 'perfil': 'analista'
        })
        headers_a = {'Authorization': f"Bearer {r1.get_json()['access_token']}"}
        headers_b = {'Authorization': f"Bearer {r2.get_json()['access_token']}"}

        # A creates project
        resp = client.post('/api/projects', json={'nome': 'A Project'}, headers=headers_a)
        project_id = resp.get_json()['project']['id']

        # B tries to access A's project
        resp2 = client.get(f'/api/projects/{project_id}', headers=headers_b)
        assert resp2.status_code == 403
