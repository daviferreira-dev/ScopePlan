"""
Popula o banco com dados de teste simulando uso real da plataforma.

Usuários criados (todos com senha: Senha@123):
  ana.silva@scopeplan.dev      — analista (cria Projetos 1 e 2)
  carlos.mendes@scopeplan.dev  — gestor   (cria Projeto 3)
  joao.dev@scopeplan.dev       — desenvolvedor
  maria.dev@scopeplan.dev      — desenvolvedor
  lucas.dev@scopeplan.dev      — desenvolvedor
  acme@cliente.dev             — cliente  (vinculado ao Projeto 1)
  beta@cliente.dev             — cliente  (vinculado ao Projeto 2)
  gamma@cliente.dev            — cliente  (vinculado ao Projeto 3)

Projetos:
  1. Sistema de E-commerce      (ana x acme)
  2. App Mobile de Delivery     (ana x beta)
  3. Plataforma de EAD Online   (carlos x gamma)

Execução:
  cd backend && python seed.py
"""
import os
import sys
from datetime import datetime, timezone, timedelta

os.environ.setdefault('FLASK_ENV', 'development')

from app import create_app, db
from app.models import User, Project, Requirement, Validacao, AuditLog, RequirementVersion
from app.utils.crypto import email_lookup_hash

app = create_app('development')

SENHA = 'Senha@123'

USERS = [
    {'nome': 'Ana Silva',      'email': 'ana.silva@scopeplan.dev',    'perfil': 'analista'},
    {'nome': 'Carlos Mendes',  'email': 'carlos.mendes@scopeplan.dev','perfil': 'gestor'},
    {'nome': 'João Dev',       'email': 'joao.dev@scopeplan.dev',     'perfil': 'desenvolvedor'},
    {'nome': 'Maria Dev',      'email': 'maria.dev@scopeplan.dev',    'perfil': 'desenvolvedor'},
    {'nome': 'Lucas Dev',      'email': 'lucas.dev@scopeplan.dev',    'perfil': 'desenvolvedor'},
    {'nome': 'Acme Corp',      'email': 'acme@cliente.dev',          'perfil': 'cliente'},
    {'nome': 'Beta Ltda',      'email': 'beta@cliente.dev',          'perfil': 'cliente'},
    {'nome': 'Gamma SA',       'email': 'gamma@cliente.dev',         'perfil': 'cliente'},
]

PROJECTS = [
    {
        'nome': 'Sistema de E-commerce',
        'descricao': 'Plataforma completa de vendas online com catálogo, carrinho, pagamento e gestão de pedidos.',
        'status': 'em_andamento',
        'custo_estimado': 85000.00,
        'gestor_key': 'ana.silva@scopeplan.dev',
        'cliente_key': 'acme@cliente.dev',
    },
    {
        'nome': 'App Mobile de Delivery',
        'descricao': 'Aplicativo de entrega de refeições com rastreamento em tempo real e sistema de avaliações.',
        'status': 'em_andamento',
        'custo_estimado': 120000.00,
        'gestor_key': 'ana.silva@scopeplan.dev',
        'cliente_key': 'beta@cliente.dev',
    },
    {
        'nome': 'Plataforma de EAD Online',
        'descricao': 'Sistema de ensino a distância com videoaulas, quizzes, certificados e fórum de discussão.',
        'status': 'planejamento',
        'custo_estimado': 200000.00,
        'gestor_key': 'carlos.mendes@scopeplan.dev',
        'cliente_key': 'gamma@cliente.dev',
    },
]

# (projeto_index, autor_key, tipo, categoria, prioridade, titulo, descricao, status_final)
REQUIREMENTS = [
    # ── Projeto 1: E-commerce ───────────────────────────────────────────────────
    (0, 'joao.dev@scopeplan.dev', 'funcional', 'Catálogo', 'alta',
     'Listagem de produtos com filtros',
     'O sistema deve exibir produtos com filtros por categoria, faixa de preço e avaliação.',
     'aprovado'),

    (0, 'joao.dev@scopeplan.dev', 'funcional', 'Carrinho', 'alta',
     'Adicionar e remover itens do carrinho',
     'O usuário deve poder adicionar múltiplos itens ao carrinho e removê-los individualmente.',
     'aprovado'),

    (0, 'maria.dev@scopeplan.dev', 'funcional', 'Pagamento', 'critica',
     'Integração com gateway de pagamento',
     'O sistema deve integrar com Stripe para processar pagamentos com cartão de crédito e PIX.',
     'em_revisao'),

    (0, 'maria.dev@scopeplan.dev', 'funcional', 'Pedidos', 'alta',
     'Rastreamento de pedido em tempo real',
     'O cliente deve visualizar o status do pedido em tempo real na tela de acompanhamento.',
     'em_revisao'),

    (0, 'joao.dev@scopeplan.dev', 'nao_funcional', 'Performance', 'alta',
     'Tempo de resposta máximo de 2 segundos',
     'Todas as páginas do catálogo devem carregar em menos de 2 segundos com até 500 usuários simultâneos.',
     'aprovado'),

    (0, 'lucas.dev@scopeplan.dev', 'nao_funcional', 'Segurança', 'critica',
     'Dados de pagamento criptografados',
     'Todos os dados de cartão devem ser transmitidos via TLS 1.3 e nunca armazenados em texto puro.',
     'aprovado'),

    (0, 'lucas.dev@scopeplan.dev', 'negocio', 'Fiscal', 'media',
     'Emissão de nota fiscal eletrônica',
     'Após confirmação do pagamento, o sistema deve emitir NF-e automaticamente.',
     'rascunho'),

    (0, 'joao.dev@scopeplan.dev', 'restricao', 'Legal', 'alta',
     'Conformidade com LGPD',
     'O sistema deve implementar consentimento de cookies e permitir exclusão de dados pelo usuário.',
     'aprovado'),

    # ── Projeto 2: Delivery ─────────────────────────────────────────────────────
    (1, 'maria.dev@scopeplan.dev', 'funcional', 'Rastreamento', 'critica',
     'Mapa de rastreamento ao vivo',
     'O app deve exibir a localização do entregador em tempo real usando Google Maps SDK.',
     'aprovado'),

    (1, 'maria.dev@scopeplan.dev', 'funcional', 'Pedidos', 'alta',
     'Push notification de status do pedido',
     'O cliente deve receber notificação push a cada mudança de status do pedido.',
     'aprovado'),

    (1, 'lucas.dev@scopeplan.dev', 'funcional', 'Avaliações', 'media',
     'Sistema de avaliação 5 estrelas',
     'Após entrega, o cliente deve poder avaliar o restaurante e o entregador com nota de 1 a 5.',
     'em_revisao'),

    (1, 'lucas.dev@scopeplan.dev', 'funcional', 'Cardápio', 'alta',
     'Customização de itens do pedido',
     'O usuário deve poder adicionar observações e remover ingredientes de cada item.',
     'rascunho'),

    (1, 'joao.dev@scopeplan.dev', 'nao_funcional', 'Performance', 'critica',
     'Atualização de localização a cada 5 segundos',
     'O sistema de rastreamento deve atualizar a posição do entregador com latência máxima de 5s.',
     'em_revisao'),

    (1, 'joao.dev@scopeplan.dev', 'nao_funcional', 'Disponibilidade', 'alta',
     'SLA de 99.9% de uptime',
     'O serviço deve estar disponível 99.9% do tempo, com janelas de manutenção programadas.',
     'aprovado'),

    (1, 'maria.dev@scopeplan.dev', 'negocio', 'Financeiro', 'media',
     'Taxa de entrega dinâmica por distância',
     'O cálculo da taxa de entrega deve considerar distância, tempo estimado e demanda atual.',
     'aprovado'),

    # ── Projeto 3: EAD ──────────────────────────────────────────────────────────
    (2, 'lucas.dev@scopeplan.dev', 'funcional', 'Cursos', 'alta',
     'Player de videoaula com progresso',
     'O player deve registrar o progresso do aluno e retomar do ponto onde parou.',
     'rascunho'),

    (2, 'lucas.dev@scopeplan.dev', 'funcional', 'Quizzes', 'alta',
     'Avaliações com limite de tempo',
     'Cada módulo deve ter uma avaliação com tempo configurável e tentativas limitadas.',
     'rascunho'),

    (2, 'joao.dev@scopeplan.dev', 'funcional', 'Certificados', 'media',
     'Emissão automática de certificado',
     'Ao completar o curso com nota mínima, o sistema deve gerar e enviar certificado em PDF.',
     'rascunho'),

    (2, 'maria.dev@scopeplan.dev', 'nao_funcional', 'Acessibilidade', 'alta',
     'Conformidade com WCAG 2.1 nível AA',
     'Todas as interfaces devem seguir as diretrizes de acessibilidade WCAG 2.1 nível AA.',
     'rascunho'),

    (2, 'maria.dev@scopeplan.dev', 'restricao', 'Legal', 'alta',
     'Suporte a até 10.000 alunos simultâneos',
     'A infraestrutura deve suportar 10.000 usuários conectados ao mesmo tempo sem degradação.',
     'rascunho'),
]

# Validações: (req_titulo_parcial, validador_key, resultado, comentario)
VALIDACOES = [
    ('Listagem de produtos', 'acme@cliente.dev', 'aprovado',
     'Filtros funcionam perfeitamente. Aprovado.'),
    ('Listagem de produtos', 'ana.silva@scopeplan.dev', 'aprovado',
     'Atende aos critérios de aceitação definidos.'),

    ('Adicionar e remover itens', 'acme@cliente.dev', 'aprovado',
     'Comportamento correto em todos os fluxos testados.'),
    ('Adicionar e remover itens', 'ana.silva@scopeplan.dev', 'aprovado',
     'Conforme especificado.'),

    ('Tempo de resposta máximo', 'acme@cliente.dev', 'aprovado',
     'Testes de carga confirmaram o atendimento ao requisito.'),
    ('Tempo de resposta máximo', 'ana.silva@scopeplan.dev', 'aprovado',
     'Métricas de performance dentro do esperado.'),

    ('Dados de pagamento criptografados', 'acme@cliente.dev', 'aprovado',
     'Auditoria de segurança confirmou conformidade.'),
    ('Dados de pagamento criptografados', 'ana.silva@scopeplan.dev', 'aprovado',
     'TLS 1.3 configurado e verificado.'),

    ('Conformidade com LGPD', 'acme@cliente.dev', 'aprovado',
     'DPO revisou e aprovou a implementação.'),
    ('Conformidade com LGPD', 'ana.silva@scopeplan.dev', 'aprovado',
     'Todos os controles LGPD implementados.'),

    ('Mapa de rastreamento ao vivo', 'beta@cliente.dev', 'aprovado',
     'Rastreamento funcionando muito bem!'),
    ('Mapa de rastreamento ao vivo', 'ana.silva@scopeplan.dev', 'aprovado',
     'Google Maps SDK integrado corretamente.'),

    ('Push notification', 'beta@cliente.dev', 'aprovado',
     'Notificações chegando em tempo real.'),
    ('Push notification', 'ana.silva@scopeplan.dev', 'aprovado',
     'Firebase Cloud Messaging configurado.'),

    ('SLA de 99.9%', 'beta@cliente.dev', 'aprovado',
     'Conforme acordado no contrato.'),
    ('SLA de 99.9%', 'ana.silva@scopeplan.dev', 'aprovado',
     'Monitoramento implementado.'),

    ('Taxa de entrega dinâmica', 'beta@cliente.dev', 'aprovado',
     'Algoritmo de cálculo validado com a equipe de negócios.'),
    ('Taxa de entrega dinâmica', 'ana.silva@scopeplan.dev', 'aprovado',
     'Regras de negócio implementadas conforme especificado.'),

    # Requisito em revisão com votação dividida
    ('Integração com gateway', 'acme@cliente.dev', 'aprovado_com_ressalvas',
     'Funcional, mas falta suporte a boleto bancário.'),
    ('Sistema de avaliação 5 estrelas', 'beta@cliente.dev', 'aprovado_com_ressalvas',
     'Nota: incluir opção de avaliação anônima na próxima versão.'),
    ('Atualização de localização', 'beta@cliente.dev', 'aprovado',
     '5 segundos é aceitável para o MVP.'),
]


def get_or_create_user(session, data):
    lookup = email_lookup_hash(data['email'])
    user = session.query(User).filter_by(email_lookup=lookup).first()
    if user:
        print(f'  [skip] {data["email"]} já existe')
        return user
    user = User(nome=data['nome'], perfil=data['perfil'], ativo=True)
    user.set_email(data['email'])
    user.set_password(SENHA)
    session.add(user)
    session.flush()
    print(f'  [+] {data["perfil"]:12} {data["email"]}')
    return user


def run():
    with app.app_context():
        print('\n=== SEED: Usuários ===')
        user_map = {}
        for u in USERS:
            user = get_or_create_user(db.session, u)
            user_map[u['email']] = user
        db.session.commit()

        print('\n=== SEED: Projetos ===')
        project_list = []
        for i, p in enumerate(PROJECTS):
            gestor = user_map[p['gestor_key']]
            cliente = user_map[p['cliente_key']]
            existing = Project.query.filter_by(nome=p['nome']).first()
            if existing:
                print(f'  [skip] {p["nome"]}')
                project_list.append(existing)
                continue
            proj = Project(
                nome=p['nome'],
                descricao=p['descricao'],
                status=p['status'],
                custo_estimado=p['custo_estimado'],
                gestor_id=gestor.id,
                cliente_id=cliente.id,
                nome_cliente=cliente.nome,
                ativo=True,
            )
            db.session.add(proj)
            db.session.flush()
            AuditLog.log(gestor.id, 'criacao', 'projeto', proj.id, proj.id,
                         {'nome': proj.nome, 'seed': True})
            project_list.append(proj)
            print(f'  [+] Projeto {i+1}: {p["nome"]}')
        db.session.commit()

        print('\n=== SEED: Requisitos ===')
        req_map = {}
        for proj_idx, autor_key, tipo, categoria, prioridade, titulo, descricao, status_final in REQUIREMENTS:
            projeto = project_list[proj_idx]
            autor = user_map[autor_key]

            existing = Requirement.query.filter_by(projeto_id=projeto.id, titulo=titulo).first()
            if existing:
                print(f'  [skip] {titulo[:50]}')
                req_map[titulo] = existing
                continue

            prefix = {'funcional': 'RF', 'nao_funcional': 'RNF', 'negocio': 'RN', 'restricao': 'RT'}.get(tipo, 'RF')
            count = Requirement.query.filter_by(projeto_id=projeto.id, tipo=tipo).count()
            codigo = f"{prefix}-{str(count + 1).zfill(3)}"

            req = Requirement(
                projeto_id=projeto.id,
                autor_id=autor.id,
                codigo=codigo,
                titulo=titulo,
                descricao=descricao,
                tipo=tipo,
                categoria=categoria,
                prioridade=prioridade,
                status='rascunho',
                ativo=True,
            )
            db.session.add(req)
            db.session.flush()

            # Avança status conforme necessário
            if status_final in ('em_revisao', 'aprovado', 'rejeitado', 'aprovado_com_ressalvas'):
                req.status = 'em_revisao'
                AuditLog.log(autor.id, 'submissao_revisao', 'requisito', req.id, projeto.id,
                             {'seed': True})

            AuditLog.log(autor.id, 'criacao', 'requisito', req.id, projeto.id,
                         {'titulo': titulo, 'tipo': tipo, 'seed': True})
            req_map[titulo] = req
            print(f'  [+] [{codigo}] {titulo[:55]}')

        db.session.commit()

        print('\n=== SEED: Validações ===')
        for titulo_parcial, validador_key, resultado, comentario in VALIDACOES:
            validador = user_map[validador_key]
            req = next((r for t, r in req_map.items() if titulo_parcial in t), None)
            if not req:
                print(f'  [warn] Requisito não encontrado para: {titulo_parcial}')
                continue
            if req.status != 'em_revisao':
                print(f'  [skip] {titulo_parcial[:40]} — status={req.status}')
                continue
            existing = Validacao.query.filter_by(
                requisito_id=req.id, validador_id=validador.id).first()
            if existing:
                print(f'  [skip] {validador_key} já validou {titulo_parcial[:35]}')
                continue

            val = Validacao(
                requisito_id=req.id,
                validador_id=validador.id,
                resultado=resultado,
                comentario=comentario,
            )
            db.session.add(val)
            db.session.flush()

            # Recalcula consenso
            todas = Validacao.query.filter_by(requisito_id=req.id).all()
            total = len(todas)
            if total >= 2:
                aprovados = sum(1 for v in todas if v.resultado == 'aprovado')
                rejeitados = sum(1 for v in todas if v.resultado == 'rejeitado')
                ressalvas = sum(1 for v in todas if v.resultado == 'aprovado_com_ressalvas')
                majority = total / 2
                if rejeitados > majority:
                    req.status = 'rejeitado'
                elif aprovados > majority:
                    req.status = 'aprovado'
                elif ressalvas > 0 and rejeitados == 0:
                    req.status = 'aprovado_com_ressalvas'

            AuditLog.log(validador.id, 'validacao', 'requisito', req.id, req.projeto_id,
                         {'resultado': resultado, 'seed': True})
            print(f'  [+] {validador_key.split("@")[0]:20} -> {resultado:25} | {titulo_parcial[:35]}')

        db.session.commit()

        print('\n=== RESUMO FINAL ===')
        print(f'  Usuários:   {User.query.count()}')
        print(f'  Projetos:   {Project.query.count()}')
        print(f'  Requisitos: {Requirement.query.count()} '
              f'(aprovados: {Requirement.query.filter_by(status="aprovado").count()}, '
              f'em_revisao: {Requirement.query.filter_by(status="em_revisao").count()}, '
              f'rascunho: {Requirement.query.filter_by(status="rascunho").count()})')
        print(f'  Validações: {Validacao.query.count()}')
        print(f'  Audit logs: {AuditLog.query.count()}')
        print()
        print('Credenciais de acesso (senha: Senha@123):')
        print('  ana.silva@scopeplan.dev     | analista      | gestora dos projetos 1 e 2')
        print('  carlos.mendes@scopeplan.dev | gestor        | gestor do projeto 3')
        print('  joao.dev@scopeplan.dev      | desenvolvedor |')
        print('  maria.dev@scopeplan.dev     | desenvolvedor |')
        print('  lucas.dev@scopeplan.dev     | desenvolvedor |')
        print('  acme@cliente.dev            | cliente       | Projeto 1: E-commerce')
        print('  beta@cliente.dev            | cliente       | Projeto 2: Delivery')
        print('  gamma@cliente.dev           | cliente       | Projeto 3: EAD')
        print()
        print('Seed concluído com sucesso!')


if __name__ == '__main__':
    run()
