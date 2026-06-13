"""Tests for RF08 — comentários em requisitos (threads, edição, ocultação)."""


def _make_requirement(client, analista_headers, cliente_id=None):
    payload = {'nome': 'Proj Comentarios'}
    if cliente_id:
        payload['cliente_id'] = cliente_id
    resp = client.post('/api/projetos', json=payload, headers=analista_headers)
    project_id = resp.get_json()['project']['id']
    resp = client.post(f'/api/projetos/{project_id}/requisitos', json={
        'titulo': 'Req com comentarios', 'tipo': 'funcional'
    }, headers=analista_headers)
    return project_id, resp.get_json()['requisito']['id']


class TestComments:
    def test_create_and_list(self, client, analista_user):
        _, req_id = _make_requirement(client, analista_user['headers'])
        resp = client.post(f'/api/requisitos/{req_id}/comentarios', json={
            'texto': 'Primeiro comentário'
        }, headers=analista_user['headers'])
        assert resp.status_code == 201
        assert resp.get_json()['comentario']['texto'] == 'Primeiro comentário'

        resp2 = client.get(f'/api/requisitos/{req_id}/comentarios', headers=analista_user['headers'])
        assert resp2.status_code == 200
        assert resp2.get_json()['total'] == 1

    def test_cliente_can_comment(self, client, analista_user, cliente_user):
        _, req_id = _make_requirement(client, analista_user['headers'], cliente_id=cliente_user['id'])
        resp = client.post(f'/api/requisitos/{req_id}/comentarios', json={
            'texto': 'Comentário do cliente'
        }, headers=cliente_user['headers'])
        assert resp.status_code == 201

    def test_nested_reply(self, client, analista_user):
        _, req_id = _make_requirement(client, analista_user['headers'])
        root = client.post(f'/api/requisitos/{req_id}/comentarios', json={
            'texto': 'raiz'}, headers=analista_user['headers']).get_json()['comentario']
        reply = client.post(f'/api/requisitos/{req_id}/comentarios', json={
            'texto': 'resposta', 'parent_id': root['id']
        }, headers=analista_user['headers'])
        assert reply.status_code == 201
        assert reply.get_json()['comentario']['parent_id'] == root['id']

    def test_nesting_depth_limit(self, client, analista_user):
        """RF08-A3: no máximo 3 níveis de aninhamento."""
        _, req_id = _make_requirement(client, analista_user['headers'])
        h = analista_user['headers']
        c1 = client.post(f'/api/requisitos/{req_id}/comentarios', json={'texto': 'n1'}, headers=h).get_json()['comentario']
        c2 = client.post(f'/api/requisitos/{req_id}/comentarios', json={'texto': 'n2', 'parent_id': c1['id']}, headers=h).get_json()['comentario']
        c3 = client.post(f'/api/requisitos/{req_id}/comentarios', json={'texto': 'n3', 'parent_id': c2['id']}, headers=h).get_json()['comentario']
        # 4º nível deve ser rejeitado
        c4 = client.post(f'/api/requisitos/{req_id}/comentarios', json={'texto': 'n4', 'parent_id': c3['id']}, headers=h)
        assert c4.status_code == 400

    def test_edit_own_comment(self, client, analista_user):
        _, req_id = _make_requirement(client, analista_user['headers'])
        c = client.post(f'/api/requisitos/{req_id}/comentarios', json={
            'texto': 'original'}, headers=analista_user['headers']).get_json()['comentario']
        resp = client.put(f'/api/comentarios/{c["id"]}', json={
            'texto': 'editado'}, headers=analista_user['headers'])
        assert resp.status_code == 200
        assert resp.get_json()['comentario']['texto'] == 'editado'
        assert resp.get_json()['comentario']['editado_em'] is not None

    def test_cannot_edit_others_comment(self, client, analista_user, cliente_user):
        _, req_id = _make_requirement(client, analista_user['headers'], cliente_id=cliente_user['id'])
        c = client.post(f'/api/requisitos/{req_id}/comentarios', json={
            'texto': 'do analista'}, headers=analista_user['headers']).get_json()['comentario']
        resp = client.put(f'/api/comentarios/{c["id"]}', json={
            'texto': 'invadido'}, headers=cliente_user['headers'])
        assert resp.status_code == 403

    def test_hide_requires_privilege(self, client, analista_user, cliente_user):
        _, req_id = _make_requirement(client, analista_user['headers'], cliente_id=cliente_user['id'])
        c = client.post(f'/api/requisitos/{req_id}/comentarios', json={
            'texto': 'visível'}, headers=cliente_user['headers']).get_json()['comentario']
        # cliente não pode ocultar
        resp_cli = client.post(f'/api/comentarios/{c["id"]}/ocultar', headers=cliente_user['headers'])
        assert resp_cli.status_code == 403
        # analista pode ocultar
        resp_an = client.post(f'/api/comentarios/{c["id"]}/ocultar', headers=analista_user['headers'])
        assert resp_an.status_code == 200
        assert resp_an.get_json()['comentario']['oculto'] is True
        assert resp_an.get_json()['comentario']['texto'] == '[comentário ocultado]'
