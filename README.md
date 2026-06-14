# ScopePlan

Plataforma colaborativa de gerenciamento de requisitos de software com geração automática de ERS (Especificação de Requisitos de Software). Desenvolvido como Projeto Integrador para o SENAI de Informática, em parceria com a empresa LabWare.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 19 + TypeScript + Vite 8 |
| **Backend** | Flask 3.0 + SQLAlchemy + Flask-JWT-Extended |
| **Banco de dados** | SQLite (desenvolvimento) / PostgreSQL (produção) |
| **Tempo real** | Flask-SocketIO 5.3 + eventlet + Y.js (CRDT) |
| **Segurança** | Flask-Talisman (headers HTTP), Flask-Limiter (rate limiting), bcrypt |
| **Geração de docs** | python-docx (DOCX) + reportlab (PDF) |
| **Deploy** | Render.com (render.yaml) / Docker (docker-compose.yml) |

## Funcionalidades

### Core
- Cadastro e login de usuários com 4 perfis: **analista**, **desenvolvedor**, **cliente**, **gestor**
- Reset de senha via e-mail (link temporário)
- CRUD de projetos com custo estimado e vínculo com cliente
- CRUD de requisitos (RF, RNF, RN, RT) organizados por tipo, com código gerado automaticamente (`RF-001`, etc.)
- Fluxo de status: `rascunho` → `em_revisao` → `aprovado` / `aprovado_com_ressalvas` / `rejeitado`
- Geração de ERS em **DOCX** e **PDF** com filtro de tópicos por perfil

### Colaboração
- **Comentários em requisitos** (RF08) — respostas aninhadas até 3 níveis, edição por 15 min, ocultação por analista/gestor
- **Convites por e-mail** — analista/gestor convida cliente ou desenvolvedor via link com token (validade 7 dias); aceite pela rota pública `/convite/:token`
- **Edição colaborativa em tempo real** — Flask-SocketIO + Y.js CRDT no editor TipTap
- **Diagramas** — upload e gestão de diagramas vinculados a requisitos
- **Anexos** — upload de arquivos vinculados a requisitos
- **Blocos personalizados** — blocos de conteúdo estruturado dentro dos projetos

### Governança
- **Isolamento de dados por usuário** — cada usuário vê apenas seus projetos e requisitos
- **Auditoria completa** — `AuditLog.log()` chamado em todo CRUD; busca textual, filtro por projeto/ação/data, paginação servidor
- **Versionamento de requisitos (RN003)** — edição de requisito aprovado gera snapshot, incrementa versão, volta status para `em_revisao`
- **Exclusão lógica (RN004)** — nenhum registro é deletado fisicamente; flag `ativo = False`
- **Logout com revogação de token** — access + refresh tokens blocklisted no banco (`TokenBlocklist`)

## Arquitetura Shared + Props

Todas as telas de conteúdo vivem em `src/pages/shared/` e recebem `perfil` como prop, adaptando UI e permissões internamente. Cada perfil tem um thin wrapper em `src/pages/<perfil>/Tela_Projetos.tsx`.

| Componente compartilhado | Diferença por perfil |
|--------------------------|---------------------|
| `TelaProjetos.tsx` | Botão "Criar" visível só para analista/gestor |
| `TelaItens.tsx` | Controles de edição por perfil |
| `ValidacaoRequisitos.tsx` | Analista/dev: criar requisito; Cliente: aprovar/rejeitar/observar |
| `DownloadERS.tsx` | Analista/gestor: filtro de tópicos (`topicIds`); outros: download completo |
| `Auditoria.tsx` | Analista/gestor: paginação servidor + filtros data/busca; outros: filtro client-side |
| `Comentarios.tsx` | Todos os perfis leem; autor edita (15 min); analista/gestor ocultam |
| `Dashboard.tsx` | Visão geral do projeto por perfil |
| `RequirementHistory.tsx` | Histórico de versões de um requisito |

## Regras de negócio

### Permissões por perfil

| Ação | analista | desenvolvedor | cliente | gestor |
|------|----------|---------------|---------|--------|
| Criar projeto | ✅ | ❌ | ❌ | ✅ |
| Editar/excluir projeto | ✅ | ❌ | ❌ | ✅ |
| Ver projetos | só os que criou | só os com seus requisitos | só os seus | só os que criou |
| Criar requisito | ✅ | ✅ | ❌ | ❌ |
| Editar requisito | ✅ | ✅ | ❌ | ❌ |
| Excluir requisito | ✅ | ❌ | ❌ | ✅ |
| Submeter para revisão | ✅ | ✅ | ❌ | ❌ |
| Validar requisito | ✅ | ❌ | ✅ | ✅ |
| Baixar ERS | ✅ | ✅ | ✅ | ✅ |
| Enviar convite | ✅ | ❌ | ❌ | ✅ |
| Comentar requisito | ✅ | ✅ | ✅ | ✅ |
| Ocultar comentário | ✅ | ❌ | ❌ | ✅ |

### Isolamento de dados por usuário

- **Analistas/Gestores** — projetos onde `gestor_id = user.id`
- **Clientes** — projetos onde `cliente_id = user.id`
- **Desenvolvedores** — projetos onde são membros via `MembroProjeto` ou têm requisitos com `autor_id = user.id`
- Todos os endpoints retornam 403 para acesso fora do escopo do usuário.

### Versionamento de requisitos (RN003)

Editar título ou descrição de um requisito com `status = aprovado` ou `aprovado_com_ressalvas`:
1. Cria snapshot em `RequirementVersion`
2. Incrementa `numero_versao`
3. Reseta status para `em_revisao`

O histórico pode ser consultado via API e pela tela `RequirementHistory.tsx`.

### Validação por consenso (desvio consciente de RF06)

O status do requisito muda quando 2+ validadores concordam no mesmo resultado. A ERS especifica aprovação individual do Cliente; a implementação adota consenso por maioria para validação colaborativa mais robusta.

### Sistema de convites

Analista/gestor envia convite por e-mail para `cliente` ou `desenvolvedor`. O link (`/convite/:token`) é público e válido por 7 dias. Ao aceitar:
- `desenvolvedor` → registrado em `MembroProjeto`
- `cliente` → vinculado diretamente ao projeto (`cliente_id`)

## Pré-requisitos

- **Node.js** 18+ e npm
- **Python** 3.12 (especificado em `runtime.txt`)
- Variáveis de ambiente em `backend/.env` (ver seção abaixo)

## Como rodar

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python run.py
```

Backend disponível em `http://localhost:5000`.

### 2. Frontend

```bash
npm install
npm run dev
```

Frontend disponível em `http://localhost:5173` (proxy `/api` e `/socket.io` → porta 5000 configurado no Vite).

## Rotas da aplicação

| Rota | Página | Perfil | Auth |
|------|--------|--------|------|
| `/` | Home | Pública | ❌ |
| `/login` | Login | Pública | ❌ |
| `/cadastro` | Cadastro | Pública | ❌ |
| `/reset-senha` | Redefinir senha | Pública | ❌ |
| `/convite/:token` | Aceitar convite | Pública | ❌ |
| `/analista/projetos` | Painel do Analista | analista | ✅ |
| `/cliente/projetos` | Painel do Cliente | cliente | ✅ |
| `/desenvolvedor/projetos` | Painel do Desenvolvedor | desenvolvedor | ✅ |
| `/gestor/projetos` | Painel do Gestor | gestor | ✅ |
| `/acesso-negado` | Acesso negado | Pública | ❌ |

> Sub-páginas (tópicos, validação, download, auditoria, comentários, histórico) são controladas por estado interno (`activePage`, `selectedProject`, `activeTopic`), não por rotas aninhadas.

## API Endpoints

### Health Check

| Método | Rota | Auth |
|--------|------|------|
| GET | `/api/health` | ❌ |

### Autenticação (`/api/auth`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | ❌ | Cadastro (retorna access token + refresh cookie) |
| POST | `/api/auth/login` | ❌ | Login JWT |
| POST | `/api/auth/logout` | ✅ | Revoga ambos os tokens + limpa cookie |
| POST | `/api/auth/refresh` | Cookie | Renova access token |
| GET | `/api/auth/me` | ✅ | Dados do usuário autenticado |
| PUT | `/api/auth/me` | ✅ | Atualiza perfil |
| GET | `/api/auth/clientes` | ✅ | Lista usuários com perfil `cliente` |

### Projetos (`/api/projects`)

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/api/projects` | qualquer | Lista projetos do usuário |
| POST | `/api/projects` | analista, gestor | Criar projeto |
| GET | `/api/projects/:id` | dono | Detalhes |
| PUT | `/api/projects/:id` | analista, gestor | Atualizar |
| DELETE | `/api/projects/:id` | analista, gestor | Exclusão lógica |
| POST | `/api/projects/:id/download-ers` | qualquer com acesso | Gerar ERS (DOCX/PDF) |

### Requisitos (`/api/requirements`)

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/api/requirements` | qualquer | Lista por projeto |
| POST | `/api/requirements` | analista, desenvolvedor | Criar |
| GET | `/api/requirements/:id` | dono do projeto | Detalhes |
| PUT | `/api/requirements/:id` | analista, desenvolvedor | Atualizar (dispara RN003 se aprovado) |
| DELETE | `/api/requirements/:id` | analista, gestor | Exclusão lógica |
| POST | `/api/requirements/:id/submit-review` | analista, desenvolvedor | Submeter para revisão |
| POST | `/api/requirements/:id/validacoes` | cliente, analista, gestor | Registrar validação |
| GET | `/api/requirements/:id/validacoes` | dono do projeto | Listar validações |
| GET | `/api/requirements/:id/version-history` | dono do projeto | Histórico de versões |

### Comentários (`/api/requisitos` + `/api/comentarios`)

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| POST | `/api/requisitos/:id/comentarios` | qualquer com acesso | Criar comentário (ou resposta aninhada) |
| GET | `/api/requisitos/:id/comentarios` | qualquer com acesso | Listar comentários |
| PUT | `/api/comentarios/:id` | autor (em 15 min) | Editar comentário |
| POST | `/api/comentarios/:id/ocultar` | analista, gestor | Ocultar comentário |

### Convites (`/api/projetos` + `/api/convites`)

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| POST | `/api/convites/verificar-email` | analista, gestor | Verifica se e-mail tem conta |
| GET | `/api/projetos/:id/convites` | analista, gestor | Lista convites do projeto |
| POST | `/api/projetos/:id/convites` | analista, gestor | Enviar convite por e-mail |
| DELETE | `/api/projetos/:id/convites/:cid` | analista, gestor | Cancelar convite pendente |
| GET | `/api/convites/:token` | ❌ | Info pública do convite |
| POST | `/api/convites/:token/aceitar` | ✅ (perfil correto) | Aceitar convite |

### Auditoria (`/api/audit`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/audit` | Lista registros (filtros: `projeto_id`, `acao`, `data_inicio`, `data_fim`, `search`, `page`, `per_page`) |

## Variáveis de ambiente (Backend)

Arquivo `backend/.env`:

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `SECRET_KEY` | *(obrigatório)* | Chave secreta Flask |
| `JWT_SECRET_KEY` | *(obrigatório)* | Chave secreta JWT |
| `DATABASE_URL` | `sqlite:///instance/scopeplan.db` | URI do banco de dados |
| `FLASK_ENV` | `development` | Ambiente |
| `PORT` | `5000` | Porta do servidor |
| `FRONTEND_URL` | `http://localhost:5173` | URL base para links de e-mail (convites, reset) |
| `SMTP_HOST` | — | Servidor SMTP (convites/reset por e-mail) |
| `SMTP_PORT` | `587` | Porta SMTP |
| `SMTP_USER` | — | Usuário SMTP |
| `SMTP_PASS` | — | Senha SMTP |
| `ALLOWED_ORIGINS` | — | CORS (produção) |

## Estrutura do projeto

```
ScopePlan/
├── backend/
│   ├── app/
│   │   ├── __init__.py               # Factory create_app (blueprints, JWT, CORS, SocketIO, Talisman, Limiter)
│   │   ├── config.py                 # Configurações dev/prod
│   │   ├── models/
│   │   │   ├── user.py               # Usuario (perfil, email criptografado, bcrypt)
│   │   │   ├── project.py            # Projeto (nome, status, custo_estimado, cliente_id)
│   │   │   ├── requirement.py        # Requisito (tipo, prioridade, status, codigo, versao)
│   │   │   ├── requirement_version.py # Snapshot de versão (RN003)
│   │   │   ├── validacao.py          # Validação de requisito
│   │   │   ├── comentario.py         # Comentário aninhado em requisito (RF08)
│   │   │   ├── diagrama.py           # Diagrama vinculado a requisito
│   │   │   ├── anexo.py              # Anexo de arquivo
│   │   │   ├── bloco_personalizado.py # Bloco de conteúdo do projeto
│   │   │   ├── convite_projeto.py    # Convite com token (7 dias)
│   │   │   ├── membro_projeto.py     # Desenvolvedor membro do projeto
│   │   │   ├── password_reset_token.py # Token de reset de senha
│   │   │   ├── audit_log.py          # Registro de auditoria
│   │   │   └── token_blocklist.py    # Blocklist de JWTs revogados
│   │   ├── routes/
│   │   │   ├── auth.py               # Autenticação + reset de senha
│   │   │   ├── projects.py           # CRUD projetos + download ERS
│   │   │   ├── requirements.py       # CRUD requisitos + validações + histórico
│   │   │   ├── comments.py           # Comentários aninhados (RF08)
│   │   │   ├── convites.py           # Sistema de convites por e-mail
│   │   │   ├── diagramas.py          # Upload/gestão de diagramas
│   │   │   ├── anexos.py             # Upload/gestão de anexos
│   │   │   ├── blocos.py             # Blocos personalizados
│   │   │   └── audit.py              # Consulta de auditoria
│   │   ├── schemas/                  # Validação Marshmallow
│   │   └── utils/                    # Decorators, access control, ERS generator, mailer, crypto
│   ├── migrations/                   # Alembic (auto-upgrade no start)
│   ├── instance/                     # scopeplan.db (SQLite)
│   ├── run.py                        # Inicia Flask + SocketIO (eventlet)
│   ├── requirements.txt
│   └── .env
├── src/
│   ├── App.tsx                       # Rotas + ProtectedRoute
│   ├── main.tsx                      # Entry point React
│   ├── assets/                       # logo, hero, icons
│   ├── components/
│   │   ├── AppLayout.tsx             # Sidebar + topbar
│   │   ├── ErrorBoundary.tsx
│   │   ├── RequirementEditor.tsx     # Editor TipTap (rich text + colaborativo)
│   │   ├── Diagramas.tsx             # Upload/visualização de diagramas
│   │   ├── RequistoAnexos.tsx        # Gestão de anexos
│   │   ├── ConvitesModal.tsx         # Modal de convites
│   │   ├── ToastContainer.tsx        # Notificações toast
│   │   └── EyeIcons.tsx
│   ├── hooks/
│   │   └── useToast.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── services/
│   │   ├── api.ts                    # authApi, projectsApi, requirementsApi, auditApi
│   │   └── socket.ts                 # Cliente WebSocket (Socket.IO)
│   ├── utils/
│   │   ├── constants.tsx             # Tópicos, cores, ícones, nav
│   │   ├── helpers.ts                # Formatação, useLogout
│   │   └── socketYjsProvider.ts      # Y.js CRDT para edição colaborativa
│   └── pages/
│       ├── Home.tsx
│       ├── Login.tsx
│       ├── Cadastro.tsx
│       ├── ResetSenha.tsx
│       ├── AceitarConvite.tsx
│       ├── shared/
│       │   ├── TelaProjetos.tsx
│       │   ├── TelaItens.tsx
│       │   ├── ValidacaoRequisitos.tsx
│       │   ├── DownloadERS.tsx
│       │   ├── Auditoria.tsx
│       │   ├── Comentarios.tsx
│       │   ├── Dashboard.tsx
│       │   └── RequirementHistory.tsx
│       ├── analista/Tela_Projetos.tsx
│       ├── cliente/Tela_Projetos.tsx
│       ├── desenvolvedor/Tela_Projetos.tsx
│       └── gestor/Tela_Projetos.tsx
├── public/
│   ├── Docs/
│   │   ├── DesafioSagaSenai.txt      # Brief do desafio (LabWare / SENAI)
│   │   └── Projeto_Integrador_Atualizado.pdf # ERS v1.19 (documento de referência)
│   └── Design/                       # Mockups das telas
├── package.json
├── vite.config.ts
├── tsconfig.json
├── render.yaml                       # Deploy Render.com
└── docker-compose.yml
```

## Comparação com a ERS (Projeto_Integrador_Atualizado.pdf)

| Requisito ERS | Status | Observação |
|---------------|--------|------------|
| **RF01** — Cadastro/login por perfil | ✅ Implementado | Auto-cadastro público; perfil `gestor` requer convite (desvio de RF01-A6) |
| **RF01-A1** — Política de senha forte | ✅ Implementado | Mín. 8 caracteres, 1 maiúscula, 1 número, 1 especial |
| **RF01-A5** — Reset de senha | ✅ Implementado | `ResetSenha.tsx` + `password_reset_token` + e-mail |
| **RF02** — CRUD de projetos | ✅ Implementado | — |
| **RF03** — CRUD de requisitos por tipo | ✅ Implementado | RF/RNF/RN/RT com código automático |
| **RF04** — Fluxo de validação de requisitos | ✅ Implementado | Desvio: consenso por maioria ao invés de aprovação individual |
| **RF05** — Geração de ERS | ✅ Implementado | DOCX + PDF; apenas aprovados (RN002) |
| **RF06** — Aprovação pelo cliente | ⚠️ Desvio consciente | ERS: aprovação individual. Implementado: consenso 2+ validadores |
| **RF07** — Auditoria | ✅ Implementado | Registro automático em todo CRUD + busca textual |
| **RF08** — Canal de colaboração (comentários) | ✅ Implementado | Respostas aninhadas 3 níveis, edição 15 min, ocultação |
| **RN001** — Cadastro só por convite | ⚠️ Desvio consciente | Auto-cadastro habilitado para `cliente`/`desenvolvedor`/`analista`; convite por e-mail também disponível |
| **RN002** — ERS só com aprovados | ✅ Implementado | Filtro `status IN ('aprovado','aprovado_com_ressalvas')` |
| **RN003** — Versionamento de requisitos | ✅ Implementado | Snapshot + increment ao editar aprovado |
| **RN004** — Exclusão lógica | ✅ Implementado | `ativo = False` em projetos e requisitos |

### Desvios conscientes da ERS

| Item | ERS | Implementação | Justificativa |
|------|-----|---------------|---------------|
| **RF06** | Aprovação individual do Cliente | Consenso por maioria (2+) | Validação colaborativa mais robusta |
| **RF01-A6 / RN001** | Criação de usuários só por convite | Auto-cadastro público habilitado | Onboarding self-service; papel `gestor` protegido via convite |

## Notas de desenvolvimento

### Banco de dados

O banco SQLite fica em `backend/instance/scopeplan.db`. Para navegar visualmente:

```bash
pip install sqlite-web
cd backend
sqlite_web instance/scopeplan.db
# Abre em http://localhost:8080
```

### Scripts úteis

```bash
# Backend — popular banco com dados de teste
cd backend && python seed.py

# Backend — criar usuário gestor de teste
cd backend && python create_gestor.py

# Frontend — build de produção
npm run build

# Frontend — lint
npm run lint
```

## Problemas conhecidos

| Issue | Detalhes |
|-------|----------|
| **CRUD de projetos sem UI** | Endpoints `PUT`/`DELETE` de projetos existem no backend mas não há tela de edição/exclusão individual no frontend |
| **reportlab** | PDF indisponível sem reportlab instalado — DOCX funciona normalmente |
| **SMTP obrigatório para convites/reset** | Sem variáveis SMTP configuradas, envio de e-mail falha e convite/reset não funcionam |

## Licença

© 2026 ScopePlan Inc. Todos os direitos reservados.
