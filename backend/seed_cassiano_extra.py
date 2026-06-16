"""
Adiciona projetos extras na conta cassiano.soares156@gmail.com com eventos
concentrados em ABRIL e MAIO/2026, para reforçar a Trilha de Auditoria.

Execução:
  cd backend && ../venv/bin/python3 seed_cassiano_extra.py
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

# (nome, descricao, status, custo, data_inicio) — start define o mês dos eventos
PROJECTS = [
    ('Sistema de Chamados',
     'Abertura, triagem e acompanhamento de tickets de suporte.',
     'em_andamento', 54000.00, datetime(2026, 4, 3, 9, 0, tzinfo=timezone.utc)),
    ('Plataforma de Eventos',
     'Criação de eventos, venda de ingressos e check-in de participantes.',
     'em_revisao', 88000.00, datetime(2026, 5, 5, 10, 0, tzinfo=timezone.utc)),
]

REQUIREMENTS = {
    0: [
        ('Abertura de chamado pelo cliente', 'funcional', 'Chamados', 'alta'),
        ('Triagem automática por categoria', 'funcional', 'Triagem', 'media'),
        ('SLA de resposta por prioridade', 'nao_funcional', 'SLA', 'critica'),
    ],
    1: [
        ('Cadastro e publicação de eventos', 'funcional', 'Eventos', 'alta'),
        ('Venda de ingressos online', 'funcional', 'Ingressos', 'critica'),
        ('Check-in por QR Code', 'funcional', 'Check-in', 'media'),
    ],
}

PREFIX = {'funcional': 'RF', 'nao_funcional': 'RNF', 'negocio': 'RN', 'restricao': 'RT'}

# passos curtos (1–4 dias) para manter os eventos dentro do mês
STEPS = [1, 2, 3, 2, 1, 3, 2, 4]
HOURS = [9, 11, 14, 16, 10, 15, 13, 17]


def add_log(usuario_id, acao, entidade_tipo, entidade_id, projeto_id, detalhes, dt):
    db.session.add(AuditLog(
        usuario_id=usuario_id, acao=acao, entidade_tipo=entidade_tipo,
        entidade_id=entidade_id, projeto_id=projeto_id,
        detalhes=json.dumps({**detalhes, 'seed': True}), criado_em=dt,
    ))


def run():
    with app.app_context():
        gestor = User.query.filter_by(email_lookup=email_lookup_hash(GESTOR_EMAIL)).first()
        if not gestor:
            print(f'ERRO: usuário {GESTOR_EMAIL} não encontrado.')
            return
        print(f'Gestor: #{gestor.id} {gestor.nome}')

        total = 0
        for pi, (nome, descricao, status, custo, start) in enumerate(PROJECTS):
            if Project.query.filter_by(nome=nome).first():
                print(f'  [skip] "{nome}" já existe')
                continue

            proj = Project(nome=nome, descricao=descricao, status=status,
                           custo_estimado=custo, gestor_id=gestor.id,
                           nome_cliente='Cliente Demo', ativo=True, criado_em=start)
            db.session.add(proj)
            db.session.flush()
            add_log(gestor.id, 'criacao', 'projeto', proj.id, proj.id, {'nome': nome}, start)
            total += 1
            print(f'  [+] {nome}  (eventos a partir de {start.date()})')

            cursor = start + timedelta(days=1)
            si = 0
            for ri, (titulo, tipo, categoria, prioridade) in enumerate(REQUIREMENTS[pi]):
                count = Requirement.query.filter_by(projeto_id=proj.id, tipo=tipo).count()
                codigo = f"{PREFIX[tipo]}-{str(count + 1).zfill(3)}"
                req = Requirement(projeto_id=proj.id, autor_id=gestor.id, codigo=codigo,
                                  titulo=titulo, descricao=f'Requisito: {titulo}.', tipo=tipo,
                                  categoria=categoria, prioridade=prioridade,
                                  status='rascunho', ativo=True, criado_em=cursor)
                db.session.add(req)
                db.session.flush()

                def step(dt):
                    nonlocal si
                    nxt = (dt + timedelta(days=STEPS[si % len(STEPS)])).replace(
                        hour=HOURS[si % len(HOURS)], minute=(si * 7) % 60)
                    si += 1
                    return nxt

                add_log(gestor.id, 'criacao', 'requisito', req.id, proj.id,
                        {'titulo': titulo, 'tipo': tipo}, cursor); total += 1
                d = step(cursor)
                add_log(gestor.id, 'edicao', 'requisito', req.id, proj.id,
                        {'titulo': titulo, 'campo': 'descricao'}, d); total += 1
                d = step(d); req.status = 'em_revisao'
                add_log(gestor.id, 'submissao_revisao', 'requisito', req.id, proj.id,
                        {'status_anterior': 'rascunho', 'status_atual': 'em_revisao', 'titulo': titulo}, d); total += 1
                d = step(d)
                add_log(gestor.id, 'validacao', 'requisito', req.id, proj.id,
                        {'resultado': 'aprovado', 'titulo': titulo}, d); total += 1
                if ri % 2 == 0:
                    d = step(d); req.status = 'aprovado'
                    add_log(gestor.id, 'status', 'requisito', req.id, proj.id,
                            {'status': 'aprovado', 'titulo': titulo}, d); total += 1
                cursor = d + timedelta(days=1)

        db.session.commit()
        print(f'\nAudit logs criados: {total}')
        print(f'Total no banco: {AuditLog.query.count()}')
        print('Concluído!')


if __name__ == '__main__':
    run()
