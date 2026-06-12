"""Tests for requirement endpoints — state machine, validation consensus, RN003."""
from app import db


class TestRequirementStateMachine:
    def test_create_requirement_starts_as_rascunho(self, client, analista_user):
        resp = client.post('/api/projetos', json={'nome': 'State Project'}, headers=analista_user['headers'])
        project_id = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{project_id}/requisitos', json={
            'titulo': 'Req Rascunho', 'tipo': 'funcional'
        }, headers=analista_user['headers'])
        assert resp.status_code == 201
        assert resp.get_json()['requisito']['status'] == 'rascunho'

    def test_status_cannot_be_set_via_put(self, client, analista_user):
        """P0 fix: status field removed from RequirementUpdateSchema.
        Sending status via PUT must cause a validation error (unknown field)."""
        resp = client.post('/api/projetos', json={'nome': 'Schema Project'}, headers=analista_user['headers'])
        project_id = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{project_id}/requisitos', json={
            'titulo': 'Req Schema'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']

        resp2 = client.put(f'/api/projetos/{project_id}/requisitos/{req_id}', json={
            'status': 'aprovado'
        }, headers=analista_user['headers'])
        assert resp2.status_code == 400

        resp3 = client.get(f'/api/projetos/{project_id}/requisitos/{req_id}', headers=analista_user['headers'])
        assert resp3.get_json()['requisito']['status'] == 'rascunho'

    def test_valid_transition_rascunho_to_em_revisao(self, client, analista_user):
        """Valid: rascunho -> em_revisao via submit_review."""
        resp = client.post('/api/projetos', json={'nome': 'Valid Trans'}, headers=analista_user['headers'])
        project_id = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{project_id}/requisitos', json={
            'titulo': 'Req Valid'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']

        resp2 = client.post(f'/api/requisitos/{req_id}/submit-review', headers=analista_user['headers'])
        assert resp2.status_code == 200
        assert resp2.get_json()['requisito']['status'] == 'em_revisao'

    def test_submit_review_from_aprovado_blocked(self, client, analista_user):
        """Cannot submit already-approved requirement for review."""
        r_c = client.post('/api/auth/register', json={
            'nome': 'Cliente Val1', 'email': 'cli_val1_aprov@test.com',
            'senha': 'senha123', 'perfil': 'cliente'
        })
        headers_c = {'Authorization': f"Bearer {r_c.get_json()['access_token']}"}
        c_id = r_c.get_json()['user']['id']

        resp = client.post('/api/projetos', json={'nome': 'Block Sub', 'cliente_id': c_id}, headers=analista_user['headers'])
        project_id = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{project_id}/requisitos', json={
            'titulo': 'Req Block'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']

        client.post(f'/api/requisitos/{req_id}/submit-review', headers=analista_user['headers'])

        client.post(f'/api/requisitos/{req_id}/validacoes', json={'resultado': 'aprovado'}, headers=headers_c)
        r_a2 = client.post('/api/auth/register', json={
            'nome': 'Analista Val2', 'email': 'analista_val2_aprov@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        headers_a2 = {'Authorization': f"Bearer {r_a2.get_json()['access_token']}"}
        client.post(f'/api/requisitos/{req_id}/validacoes', json={'resultado': 'aprovado'}, headers=headers_a2)

        resp2 = client.post(f'/api/requisitos/{req_id}/submit-review', headers=analista_user['headers'])
        assert resp2.status_code == 400

    def test_rascunho_cannot_be_validated(self, client, analista_user):
        """Requirements in rascunho cannot receive validacoes."""
        r_c = client.post('/api/auth/register', json={
            'nome': 'Cliente RVal', 'email': 'cli_rval@test.com',
            'senha': 'senha123', 'perfil': 'cliente'
        })
        headers_c = {'Authorization': f"Bearer {r_c.get_json()['access_token']}"}
        c_id = r_c.get_json()['user']['id']

        resp = client.post('/api/projetos', json={'nome': 'Rascunho Val', 'cliente_id': c_id}, headers=analista_user['headers'])
        project_id = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{project_id}/requisitos', json={
            'titulo': 'Req Rascunho Val'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']

        resp2 = client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'aprovado'
        }, headers=headers_c)
        assert resp2.status_code == 400


class TestValidationConsensus:
    def test_single_approval_stays_em_revisao_with_quorum(self, client, analista_user):
        """With quorum=2, a single approval keeps requirement in em_revisao."""
        r_c = client.post('/api/auth/register', json={
            'nome': 'Cliente App', 'email': 'cli_app@test.com',
            'senha': 'senha123', 'perfil': 'cliente'
        })
        headers_c = {'Authorization': f"Bearer {r_c.get_json()['access_token']}"}
        c_id = r_c.get_json()['user']['id']

        resp = client.post('/api/projetos', json={
            'nome': 'Approval Project', 'cliente_id': c_id
        }, headers=analista_user['headers'])
        pid = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{pid}/requisitos', json={
            'titulo': 'Approval Req'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']
        client.post(f'/api/requisitos/{req_id}/submit-review', headers=analista_user['headers'])

        resp = client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'aprovado'
        }, headers=headers_c)
        assert resp.status_code == 201
        assert resp.get_json()['requirement_status'] == 'em_revisao'

    def test_tie_one_approval_one_rejection_stays_em_revisao(self, client, analista_user):
        """Tie scenario: 1 approved + 1 rejected = stays in em_revisao (no majority)."""
        r_c1 = client.post('/api/auth/register', json={
            'nome': 'Cli Tie1', 'email': 'cli_tie1@test.com',
            'senha': 'senha123', 'perfil': 'cliente'
        })
        headers_c1 = {'Authorization': f"Bearer {r_c1.get_json()['access_token']}"}
        c_id = r_c1.get_json()['user']['id']

        r_a2 = client.post('/api/auth/register', json={
            'nome': 'Analista Tie2', 'email': 'analista_tie2@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        headers_a2 = {'Authorization': f"Bearer {r_a2.get_json()['access_token']}"}

        resp = client.post('/api/projetos', json={
            'nome': 'Tie Project', 'cliente_id': c_id
        }, headers=analista_user['headers'])
        pid = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{pid}/requisitos', json={
            'titulo': 'Tie Req'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']
        client.post(f'/api/requisitos/{req_id}/submit-review', headers=analista_user['headers'])

        client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'aprovado'
        }, headers=headers_c1)

        resp2 = client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'rejeitado', 'comentario': 'Não atende'
        }, headers=headers_a2)
        assert resp2.status_code == 201
        assert resp2.get_json()['requirement_status'] == 'em_revisao'

    def test_single_rejection_stays_em_revisao_with_quorum(self, client, analista_user):
        """With quorum=2, a single rejection keeps requirement in em_revisao."""
        r_c = client.post('/api/auth/register', json={
            'nome': 'Cliente Rej', 'email': 'cli_rej@test.com',
            'senha': 'senha123', 'perfil': 'cliente'
        })
        headers_c = {'Authorization': f"Bearer {r_c.get_json()['access_token']}"}
        c_id = r_c.get_json()['user']['id']

        resp = client.post('/api/projetos', json={
            'nome': 'Rejection Project', 'cliente_id': c_id
        }, headers=analista_user['headers'])
        pid = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{pid}/requisitos', json={
            'titulo': 'Rejection Req'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']
        client.post(f'/api/requisitos/{req_id}/submit-review', headers=analista_user['headers'])

        resp = client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'rejeitado', 'comentario': 'Não atende'
        }, headers=headers_c)
        assert resp.status_code == 201
        assert resp.get_json()['requirement_status'] == 'em_revisao'

    def test_quorum_all_approvals_sets_aprovado(self, client, analista_user):
        """Two approvals with quorum=2 should set status to aprovado."""
        r_c1 = client.post('/api/auth/register', json={
            'nome': 'Cli Approv1', 'email': 'cli_approv1@test.com',
            'senha': 'senha123', 'perfil': 'cliente'
        })
        headers_c1 = {'Authorization': f"Bearer {r_c1.get_json()['access_token']}"}
        c_id = r_c1.get_json()['user']['id']

        r_a2 = client.post('/api/auth/register', json={
            'nome': 'Analista Approv2', 'email': 'analista_approv2@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        headers_a2 = {'Authorization': f"Bearer {r_a2.get_json()['access_token']}"}

        resp = client.post('/api/projetos', json={
            'nome': 'QApprov Project', 'cliente_id': c_id
        }, headers=analista_user['headers'])
        pid = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{pid}/requisitos', json={
            'titulo': 'QApprov Req'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']
        client.post(f'/api/requisitos/{req_id}/submit-review', headers=analista_user['headers'])

        client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'aprovado'
        }, headers=headers_c1)

        resp2 = client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'aprovado'
        }, headers=headers_a2)
        assert resp2.status_code == 201
        assert resp2.get_json()['requirement_status'] == 'aprovado'

    def test_quorum_any_rejection_sets_rejeitado(self, client, analista_user):
        """With majority-rules, majority rejections outvote approvals."""
        r_c1 = client.post('/api/auth/register', json={
            'nome': 'Cli Mix1', 'email': 'cli_mix1@test.com',
            'senha': 'senha123', 'perfil': 'cliente'
        })
        headers_c1 = {'Authorization': f"Bearer {r_c1.get_json()['access_token']}"}
        c_id = r_c1.get_json()['user']['id']

        r_a2 = client.post('/api/auth/register', json={
            'nome': 'Analista Mix2', 'email': 'analista_mix2@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        headers_a2 = {'Authorization': f"Bearer {r_a2.get_json()['access_token']}"}

        resp = client.post('/api/projetos', json={
            'nome': 'Mixed Project', 'cliente_id': c_id
        }, headers=analista_user['headers'])
        pid = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{pid}/requisitos', json={
            'titulo': 'Mixed Req'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']
        client.post(f'/api/requisitos/{req_id}/submit-review', headers=analista_user['headers'])

        client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'rejeitado', 'comentario': 'Não atende'
        }, headers=headers_c1)

        resp2 = client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'rejeitado', 'comentario': 'Também reprova'
        }, headers=headers_a2)
        assert resp2.status_code == 201
        assert resp2.get_json()['requirement_status'] == 'rejeitado'

    def test_quorum_ressalvas_sets_aprovado_com_ressalvas(self, client, analista_user):
        """Two aprovado_com_ressalvas with quorum=2 = aprovado_com_ressalvas."""
        r_c1 = client.post('/api/auth/register', json={
            'nome': 'Cli Res1', 'email': 'cli_res1q@test.com',
            'senha': 'senha123', 'perfil': 'cliente'
        })
        headers_c1 = {'Authorization': f"Bearer {r_c1.get_json()['access_token']}"}
        c_id = r_c1.get_json()['user']['id']

        r_a2 = client.post('/api/auth/register', json={
            'nome': 'Analista Res2', 'email': 'analista_res2q@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        headers_a2 = {'Authorization': f"Bearer {r_a2.get_json()['access_token']}"}

        resp = client.post('/api/projetos', json={
            'nome': 'Ressalvas Project', 'cliente_id': c_id
        }, headers=analista_user['headers'])
        pid = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{pid}/requisitos', json={
            'titulo': 'Ressalvas Req'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']
        client.post(f'/api/requisitos/{req_id}/submit-review', headers=analista_user['headers'])

        client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'aprovado_com_ressalvas', 'comentario': 'Quase lá'
        }, headers=headers_c1)

        resp2 = client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'aprovado_com_ressalvas', 'comentario': 'Quase lá'
        }, headers=headers_a2)
        assert resp2.status_code == 201
        assert resp2.get_json()['requirement_status'] == 'aprovado_com_ressalvas'

    def test_quorum_one_ressalva_one_approval(self, client, analista_user):
        """One aprovado + one aprovado_com_ressalvas = aprovado_com_ressalvas."""
        r_c1 = client.post('/api/auth/register', json={
            'nome': 'Cli MixR1', 'email': 'cli_mixr1@test.com',
            'senha': 'senha123', 'perfil': 'cliente'
        })
        headers_c1 = {'Authorization': f"Bearer {r_c1.get_json()['access_token']}"}
        c_id = r_c1.get_json()['user']['id']

        r_a2 = client.post('/api/auth/register', json={
            'nome': 'Analista MixR2', 'email': 'analista_mixr2@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        headers_a2 = {'Authorization': f"Bearer {r_a2.get_json()['access_token']}"}

        resp = client.post('/api/projetos', json={
            'nome': 'MixR Project', 'cliente_id': c_id
        }, headers=analista_user['headers'])
        pid = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{pid}/requisitos', json={
            'titulo': 'MixR Req'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']
        client.post(f'/api/requisitos/{req_id}/submit-review', headers=analista_user['headers'])

        client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'aprovado'
        }, headers=headers_c1)

        resp2 = client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'aprovado_com_ressalvas', 'comentario': 'Minor issues'
        }, headers=headers_a2)
        assert resp2.status_code == 201
        assert resp2.get_json()['requirement_status'] == 'aprovado_com_ressalvas'

    def test_duplicate_validation_blocked(self, client, analista_user):
        """Same user cannot validate the same requirement twice."""
        r_c = client.post('/api/auth/register', json={
            'nome': 'Cliente Val', 'email': 'cli_val@test.com',
            'senha': 'senha123', 'perfil': 'cliente'
        })
        headers_c = {'Authorization': f"Bearer {r_c.get_json()['access_token']}"}
        c_id = r_c.get_json()['user']['id']

        resp = client.post('/api/projetos', json={
            'nome': 'Dup Val Project', 'cliente_id': c_id
        }, headers=analista_user['headers'])
        pid = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{pid}/requisitos', json={
            'titulo': 'Dup Val Req'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']
        client.post(f'/api/requisitos/{req_id}/submit-review', headers=analista_user['headers'])

        resp1 = client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'aprovado'
        }, headers=headers_c)
        assert resp1.status_code == 201

        resp2 = client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'rejeitado'
        }, headers=headers_c)
        assert resp2.status_code == 400


class TestRN003Versioning:
    def test_edit_aprovado_creates_version_and_resets_status(self, client, analista_user):
        """RN003: Editing titulo of an aprovado requirement should create
        a version snapshot and reset status to em_revisao."""
        r_c1 = client.post('/api/auth/register', json={
            'nome': 'Cli RN3-1', 'email': 'cli_rn3_1@test.com',
            'senha': 'senha123', 'perfil': 'cliente'
        })
        headers_c1 = {'Authorization': f"Bearer {r_c1.get_json()['access_token']}"}
        c_id = r_c1.get_json()['user']['id']

        r_a2 = client.post('/api/auth/register', json={
            'nome': 'Analista RN3-2', 'email': 'analista_rn3_2@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        headers_a2 = {'Authorization': f"Bearer {r_a2.get_json()['access_token']}"}

        resp = client.post('/api/projetos', json={
            'nome': 'RN003 Project', 'cliente_id': c_id
        }, headers=analista_user['headers'])
        pid = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{pid}/requisitos', json={
            'titulo': 'RN003 Req', 'descricao': 'Original desc'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']

        client.post(f'/api/requisitos/{req_id}/submit-review', headers=analista_user['headers'])
        client.post(f'/api/requisitos/{req_id}/validacoes', json={'resultado': 'aprovado'}, headers=headers_c1)
        client.post(f'/api/requisitos/{req_id}/validacoes', json={'resultado': 'aprovado'}, headers=headers_a2)

        resp = client.get(f'/api/projetos/{pid}/requisitos/{req_id}', headers=analista_user['headers'])
        assert resp.get_json()['requisito']['status'] == 'aprovado'

        resp2 = client.put(f'/api/projetos/{pid}/requisitos/{req_id}', json={
            'titulo': 'RN003 Req Updated'
        }, headers=analista_user['headers'])
        assert resp2.status_code == 200
        data = resp2.get_json()['requisito']
        assert data['status'] == 'em_revisao'
        assert data['titulo'] == 'RN003 Req Updated'
        assert data['numero_versao'] == 2

    def test_edit_aprovado_com_ressalvas_creates_version(self, client, analista_user):
        """RN003: Editing aprovado_com_ressalvas should also create version and reset."""
        r_c1 = client.post('/api/auth/register', json={
            'nome': 'Cli RN3R-1', 'email': 'cli_rn3r_1@test.com',
            'senha': 'senha123', 'perfil': 'cliente'
        })
        headers_c1 = {'Authorization': f"Bearer {r_c1.get_json()['access_token']}"}
        c_id = r_c1.get_json()['user']['id']

        r_a2 = client.post('/api/auth/register', json={
            'nome': 'Analista RN3R-2', 'email': 'analista_rn3r_2@test.com',
            'senha': 'senha123', 'perfil': 'analista'
        })
        headers_a2 = {'Authorization': f"Bearer {r_a2.get_json()['access_token']}"}

        resp = client.post('/api/projetos', json={
            'nome': 'RN003R Project', 'cliente_id': c_id
        }, headers=analista_user['headers'])
        pid = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{pid}/requisitos', json={
            'titulo': 'RN003R Req', 'descricao': 'Original'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']

        client.post(f'/api/requisitos/{req_id}/submit-review', headers=analista_user['headers'])
        client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'aprovado_com_ressalvas', 'comentario': 'Ajuste menor'
        }, headers=headers_c1)
        client.post(f'/api/requisitos/{req_id}/validacoes', json={
            'resultado': 'aprovado_com_ressalvas', 'comentario': 'Quase'
        }, headers=headers_a2)

        resp = client.get(f'/api/projetos/{pid}/requisitos/{req_id}', headers=analista_user['headers'])
        assert resp.get_json()['requisito']['status'] == 'aprovado_com_ressalvas'

        resp2 = client.put(f'/api/projetos/{pid}/requisitos/{req_id}', json={
            'descricao': 'Updated description'
        }, headers=analista_user['headers'])
        assert resp2.status_code == 200
        data = resp2.get_json()['requisito']
        assert data['status'] == 'em_revisao'
        assert data['numero_versao'] == 2

    def test_edit_rascunho_does_not_create_version(self, client, analista_user):
        """Editing a rascunho requirement should NOT create version snapshots."""
        resp = client.post('/api/projetos', json={'nome': 'NoVer Project'}, headers=analista_user['headers'])
        pid = resp.get_json()['project']['id']

        resp = client.post(f'/api/projetos/{pid}/requisitos', json={
            'titulo': 'NoVer Req'
        }, headers=analista_user['headers'])
        req_id = resp.get_json()['requisito']['id']

        resp2 = client.put(f'/api/projetos/{pid}/requisitos/{req_id}', json={
            'titulo': 'NoVer Req Updated'
        }, headers=analista_user['headers'])
        assert resp2.status_code == 200
        data = resp2.get_json()['requisito']
        assert data['status'] == 'rascunho'
        assert data['numero_versao'] == 1


class TestPerPageBound:
    def test_per_page_capped_at_100(self, client, analista_user):
        """per_page > 100 should be capped."""
        resp = client.post('/api/projetos', json={'nome': 'PerPage Project'}, headers=analista_user['headers'])
        pid = resp.get_json()['project']['id']
        resp = client.get(f'/api/projetos/{pid}/requisitos?per_page=999', headers=analista_user['headers'])
        assert resp.status_code == 200
        assert resp.get_json()['per_page'] <= 100
