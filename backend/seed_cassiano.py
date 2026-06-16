"""
Popula 5 projetos extras na conta cassiano.soares156@gmail.com com audit logs
espalhados em várias datas (fev–jun/2026) para demonstrar a Trilha de Auditoria.

Execução:
  cd backend && ../venv/bin/python3 seed_cassiano.py
"""
import os
import json
from datetime import datetime, timezone, timedelta

os.environ.setdefault('FLASK_ENV', 'development')

from app import create_app, db
from app.models import User, Project, Requirement, AuditLog
from app.utils.crypto import email_lookup_hash

app = create_app('development')

GESTOR_EMAIL = 'fdavi07@gmail.com'

# (nome, descricao, status, custo, data_inicio do projeto)
PROJECTS = [
    ('Portal do Cliente',
     'Área logada para clientes acompanharem pedidos, faturas e abrirem chamados.',
     'em_andamento', 65000.00, datetime(2026, 2, 5, 9, 0, tzinfo=timezone.utc)),
    ('Sistema de RH',
     'Gestão de funcionários, ponto eletrônico e folha de pagamento.',
     'em_revisao', 140000.00, datetime(2026, 3, 3, 10, 0, tzinfo=timezone.utc)),
    ('Gestão de Estoque',
     'Controle de entrada e saída de produtos com alertas e inventário.',
     'planejamento', 48000.00, datetime(2026, 3, 24, 11, 0, tzinfo=timezone.utc)),
    ('CRM de Vendas',
     'Funil de vendas, histórico de clientes e automação de marketing.',
     'em_andamento', 98000.00, datetime(2026, 4, 21, 9, 30, tzinfo=timezone.utc)),
    ('App de Agendamento',
     'Aplicativo para marcação de horários com lembretes e reagendamento.',
     'concluido', 72000.00, datetime(2026, 5, 12, 14, 0, tzinfo=timezone.utc)),
]

# projeto_index -> lista de (titulo, tipo, categoria, prioridade)
REQUIREMENTS = {
    0: [
        ('Login com autenticação em dois fatores', 'funcional', 'Segurança', 'alta'),
        ('Dashboard com indicadores do cliente', 'funcional', 'Relatórios', 'media'),
        ('Exportação de relatórios em PDF', 'nao_funcional', 'Performance', 'media'),
    ],
    1: [
        ('Cadastro de funcionários', 'funcional', 'Cadastro', 'alta'),
        ('Controle de ponto eletrônico', 'funcional', 'Ponto', 'critica'),
        ('Folha de pagamento automatizada', 'negocio', 'Financeiro', 'alta'),
    ],
    2: [
        ('Controle de entrada e saída', 'funcional', 'Estoque', 'alta'),
        ('Alerta de estoque mínimo', 'funcional', 'Alertas', 'media'),
        ('Inventário por código de barras', 'funcional', 'Inventário', 'media'),
    ],
    3: [
        ('Funil de vendas em kanban', 'funcional', 'Vendas', 'alta'),
        ('Histórico de interações com clientes', 'funcional', 'Clientes', 'media'),
        ('Integração com e-mail marketing', 'restricao', 'Integração', 'baixa'),
    ],
    4: [
        ('Agenda com horários disponíveis', 'funcional', 'Agenda', 'alta'),
        ('Notificações de lembrete', 'funcional', 'Notificações', 'media'),
        ('Cancelamento e reagendamento', 'funcional', 'Agenda', 'media'),
    ],
}

PREFIX = {'funcional': 'RF', 'nao_funcional': 'RNF', 'negocio': 'RN', 'restricao': 'RT'}

# Passos (em dias) e horas que se alternam para espalhar os eventos no calendário
STEPS = [2, 3, 5, 4, 2, 6, 3, 4]
HOURS = [9, 11, 14, 16, 10, 15, 13, 17]


def add_log(usuario_id, acao, entidade_tipo, entidade_id, projeto_id, detalhes, dt):
    entry = AuditLog(
        usuario_id=usuario_id,
        acao=acao,
        entidade_tipo=entidade_tipo,
        entidade_id=entidade_id,
        projeto_id=projeto_id,
        detalhes=json.dumps({**detalhes, 'seed': True}),
        criado_em=dt,
    )
    db.session.add(entry)


def run():
    with app.app_context():
        gestor = User.query.filter_by(email_lookup=email_lookup_hash(GESTOR_EMAIL)).first()
        if not gestor:
            print(f'ERRO: usuário {GESTOR_EMAIL} não encontrado.')
            return
        print(f'Gestor: #{gestor.id} {gestor.nome} ({gestor.perfil})')

        total_logs = 0

        for pi, (nome, descricao, status, custo, start) in enumerate(PROJECTS):
            if Project.query.filter_by(nome=nome).first():
                print(f'  [skip] projeto "{nome}" já existe')
                continue

            proj = Project(
                nome=nome, descricao=descricao, status=status,
                custo_estimado=custo, gestor_id=gestor.id,
                nome_cliente='Cliente Demo', ativo=True,
                criado_em=start,
            )
            db.session.add(proj)
            db.session.flush()

            # Log de criação do projeto (um dia antes do primeiro requisito)
            add_log(gestor.id, 'criacao', 'projeto', proj.id, proj.id,
                    {'nome': nome}, start)
            total_logs += 1
            print(f'  [+] Projeto {pi + 1}: {nome}  (início {start.date()})')

            # cursor de datas avança ao longo do tempo para espalhar os eventos
            cursor = start + timedelta(days=2)
            si = 0  # índice de passo/hora

            for ri, (titulo, tipo, categoria, prioridade) in enumerate(REQUIREMENTS[pi]):
                count = Requirement.query.filter_by(projeto_id=proj.id, tipo=tipo).count()
                codigo = f"{PREFIX[tipo]}-{str(count + 1).zfill(3)}"

                req = Requirement(
                    projeto_id=proj.id, autor_id=gestor.id, codigo=codigo,
                    titulo=titulo, descricao=f'Requisito: {titulo}.',
                    tipo=tipo, categoria=categoria, prioridade=prioridade,
                    status='rascunho', ativo=True, criado_em=cursor,
                )
                db.session.add(req)
                db.session.flush()

                def step(dt):
                    nonlocal si
                    h = HOURS[si % len(HOURS)]
                    nxt = (dt + timedelta(days=STEPS[si % len(STEPS)])).replace(hour=h, minute=(si * 7) % 60)
                    si += 1
                    return nxt

                # criação do requisito
                add_log(gestor.id, 'criacao', 'requisito', req.id, proj.id,
                        {'titulo': titulo, 'tipo': tipo}, cursor)
                total_logs += 1

                # edição
                d = step(cursor)
                add_log(gestor.id, 'edicao', 'requisito', req.id, proj.id,
                        {'titulo': titulo, 'campo': 'descricao'}, d)
                total_logs += 1

                # submissão para revisão
                d = step(d)
                req.status = 'em_revisao'
                add_log(gestor.id, 'submissao_revisao', 'requisito', req.id, proj.id,
                        {'status_anterior': 'rascunho', 'status_atual': 'em_revisao', 'titulo': titulo}, d)
                total_logs += 1

                # validação
                d = step(d)
                add_log(gestor.id, 'validacao', 'requisito', req.id, proj.id,
                        {'resultado': 'aprovado', 'titulo': titulo}, d)
                total_logs += 1

                # status atualizado (em alguns)
                if ri % 2 == 0:
                    d = step(d)
                    req.status = 'aprovado'
                    add_log(gestor.id, 'status', 'requisito', req.id, proj.id,
                            {'status': 'aprovado', 'titulo': titulo}, d)
                    total_logs += 1

                # próximo requisito começa um pouco depois
                cursor = d + timedelta(days=2)

        db.session.commit()

        print(f'\nResumo:')
        print(f'  Projetos do gestor #{gestor.id}: '
              f'{Project.query.filter_by(gestor_id=gestor.id).count()}')
        print(f'  Audit logs criados nesta execução: {total_logs}')
        print(f'  Audit logs (total no banco): {AuditLog.query.count()}')
        print('Concluído!')


if __name__ == '__main__':
    run()
