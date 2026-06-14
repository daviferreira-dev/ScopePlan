# ScopePlan Backend API

API RESTful para gerenciamento colaborativo de requisitos de software — backend do ScopePlan.

## Tecnologias

| Tecnologia | Versão | Propósito |
|-----------|--------|-----------|
| Flask | 3.0.0 | Framework web |
| Flask-SQLAlchemy | 3.1.1 | ORM |
| Flask-JWT-Extended | 4.6.0 | Autenticação JWT |
| Flask-CORS | 4.0.0 | Cross-Origin |
| Flask-Migrate | 4.0.5 | Migrações (Alembic) |
| Flask-SocketIO | 5.3.0 | WebSocket / tempo real |
| Flask-Talisman | 1.1.0 | Headers de segurança HTTP |
| Flask-Limiter | 3.5.0 | Rate limiting |
| Marshmallow | 3.20.1 | Validação e serialização |
| bcrypt | 4.1.2 | Hash de senhas |
| eventlet | 0.35.0 | WSGI assíncrono (WebSocket) |
| python-docx | 1.1.0 | Geração de DOCX |
| reportlab | 4.0.0 | Geração de PDF |
| gunicorn | 21.2.0 | WSGI produção |
| psycopg2-binary | 2.9.0 | Adaptador PostgreSQL |

## Instalação

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

## Configuração

Crie `backend/.env`:

```env
SECRET_KEY=<gere com: python -c "import secrets; print(secrets.token_hex(32))">
JWT_SECRET_KEY=<idem>
DATABASE_URL=sqlite:///instance/scopeplan.db
FLASK_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
# Opcional — necessário para convites e reset de senha por e-mail
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=senha
ALLOWED_ORIGINS=https://meusite.com   # apenas em produção
```

**Tokens JWT:** access token expira em 2h (in-memory); refresh token em 30 dias (cookie HttpOnly).

## Executar

```bash
python run.py
```

O servidor sobe em `http://localhost:5000`. As migrações Alembic são aplicadas automaticamente no start.

---

## Endpoints da API

### Health Check

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/health` | ❌ |

---

### Autenticação (`/api/auth`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/api/auth/register` | ❌ | Cadastro — retorna access token + seta refresh cookie |
| POST | `/api/auth/login` | ❌ | Login JWT |
| POST | `/api/auth/logout` | ✅ | Revoga access + refresh, limpa cookie |
| POST | `/api/auth/refresh` | Cookie | Renova access token via refresh cookie |
| GET | `/api/auth/me` | ✅ | Dados do usuário autenticado |
| PUT | `/api/auth/me` | ✅ | Atualiza nome, email ou senha |
| GET | `/api/auth/clientes` | ✅ | Lista usuários com perfil `cliente` |

> **Blocklist:** tokens revogados ficam em `TokenBlocklist` (tabela `token_blocklist`). O middleware JWT verifica a blocklist em cada requisição autenticada.

> **Rate limiting:** `/api/auth/login` — 5 req/min; `/api/auth/register` — 3 req/min.

---

### Projetos (`/api/projects`)

| Método | Endpoint | Permissão | Descrição |
|--------|----------|-----------|-----------|
| GET | `/api/projects` | qualquer | Lista projetos do usuário (filtrado por perfil) |
| POST | `/api/projects` | analista, gestor | Criar projeto |
| GET | `/api/projects/:id` | dono do projeto | Detalhes |
| PUT | `/api/projects/:id` | analista, gestor | Atualizar |
| DELETE | `/api/projects/:id` | analista, gestor | Exclusão lógica (`ativo=False`) |
| POST | `/api/projects/:id/download-ers` | qualquer com acesso | Gerar ERS em DOCX ou PDF |

> **Isolamento:** `GET /api/projects` retorna apenas o que o usuário pode ver — analista/gestor: `gestor_id = user.id`; cliente: `cliente_id = user.id`; desenvolvedor: membro via `MembroProjeto` ou autor de requisito.

> **ERS:** parâmetros `formato` (docx/pdf) e `topic_ids` (filtrar tópicos). Inclui apenas requisitos `aprovado` ou `aprovado_com_ressalvas` (RN002).

---

### Requisitos (`/api/requirements`)

| Método | Endpoint | Permissão | Descrição |
|--------|----------|-----------|-----------|
| GET | `/api/requirements` | qualquer | Lista por projeto |
| POST | `/api/requirements` | analista, desenvolvedor | Criar |
| GET | `/api/requirements/:id` | dono do projeto | Detalhes |
| PUT | `/api/requirements/:id` | analista, desenvolvedor | Atualizar (RN003 se aprovado) |
| DELETE | `/api/requirements/:id` | analista, gestor | Exclusão lógica |
| POST | `/api/requirements/:id/submit-review` | analista, desenvolvedor | Submeter para revisão |
| POST | `/api/requirements/:id/validacoes` | cliente, analista, gestor | Registrar validação |
| GET | `/api/requirements/:id/validacoes` | dono do projeto | Listar validações |
| GET | `/api/requirements/:id/version-history` | dono do projeto | Histórico de versões |

---

### Comentários (`/api/requisitos` + `/api/comentarios`)

RF08 — Canal de colaboração.

| Método | Endpoint | Permissão | Descrição |
|--------|----------|-----------|-----------|
| POST | `/api/requisitos/:id/comentarios` | qualquer com acesso | Criar comentário (campo `parent_id` opcional para resposta) |
| GET | `/api/requisitos/:id/comentarios` | qualquer com acesso | Listar comentários |
| PUT | `/api/comentarios/:id` | autor (janela de 15 min) | Editar texto do comentário |
| POST | `/api/comentarios/:id/ocultar` | analista, gestor | Ocultar comentário |

> Máximo 3 níveis de aninhamento (RF08-A3). Edição permitida por 15 minutos após criação (RF08-A1). Ocultação registrada em audit_log.

---

### Convites (`/api/projetos` + `/api/convites`)

| Método | Endpoint | Permissão | Descrição |
|--------|----------|-----------|-----------|
| POST | `/api/convites/verificar-email` | analista, gestor | Verifica se e-mail já tem conta |
| GET | `/api/projetos/:id/convites` | analista, gestor | Lista convites do projeto |
| POST | `/api/projetos/:id/convites` | analista, gestor | Enviar convite por e-mail (perfis: `cliente`, `desenvolvedor`) |
| DELETE | `/api/projetos/:id/convites/:cid` | analista, gestor | Cancelar convite pendente |
| GET | `/api/convites/:token` | ❌ | Info pública do convite (sem auth) |
| POST | `/api/convites/:token/aceitar` | ✅ (perfil correto) | Aceitar convite |

> Token válido por 7 dias. Ao aceitar: `desenvolvedor` → `MembroProjeto`; `cliente` → `projeto.cliente_id`. Requer SMTP configurado no `.env`.

---

### Auditoria (`/api/audit`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/audit` | Lista registros de auditoria |

**Query params:** `page`, `per_page`, `projeto_id`, `acao`, `entidade_tipo`, `usuario_id`, `data_inicio`, `data_fim`, `search` (busca textual em ação, entidade_tipo e detalhes).

---

## Modelos

### Usuario (`user.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer PK | — |
| nome | String(120) | Nome completo |
| email | String(180) | Email único |
| email_lookup | String | Hash para busca (LGPD) |
| senha_hash | String(255) | Hash bcrypt |
| perfil | String(20) | `analista`, `desenvolvedor`, `cliente`, `gestor` |
| ativo | Boolean | — |
| criado_em | DateTime | — |

### Projeto (`project.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer PK | — |
| nome | String(200) | — |
| descricao | Text | — |
| status | String(20) | `planejamento`, `em_andamento`, `em_revisao`, `concluido`, `cancelado` |
| custo_estimado | Numeric(12,2) | — |
| gestor_id | FK → Usuario | Analista/gestor criador |
| cliente_id | FK → Usuario | Cliente vinculado |
| nome_cliente | String(200) | Denormalizado |
| ativo | Boolean | Exclusão lógica |
| criado_em / atualizado_em | DateTime | — |

### Requisito (`requirement.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer PK | — |
| titulo | String(300) | — |
| descricao | Text | — |
| tipo | String(30) | `funcional`, `nao_funcional`, `negocio`, `restricao` |
| prioridade | String(20) | `baixa`, `media`, `alta`, `critica` |
| status | String(30) | `rascunho`, `em_revisao`, `aprovado`, `aprovado_com_ressalvas`, `rejeitado` |
| codigo | String(20) | `RF-001`, `RNF-001`, `RN-001`, `RT-001` |
| numero_versao | SmallInteger | Incrementado pelo RN003 |
| projeto_id | FK → Projeto | — |
| autor_id | FK → Usuario | — |
| ativo | Boolean | Exclusão lógica |

### RequirementVersion (`requirement_version.py`)

Snapshot criado pelo RN003 ao editar requisito aprovado.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer PK | — |
| requisito_id | FK → Requisito | — |
| numero_versao | SmallInteger | Versão do snapshot |
| titulo | String | Título no momento do snapshot |
| descricao | Text | — |
| status | String | Status no momento |
| usuario_id | FK → Usuario | Quem editou |
| criado_em | DateTime | — |

### Validacao (`validacao.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer PK | — |
| resultado | String(20) | `aprovado`, `rejeitado`, `aprovado_com_ressalvas` |
| comentario | Text | Obrigatório para `aprovado_com_ressalvas` |
| requisito_id | FK → Requisito | — |
| validador_id | FK → Usuario | — |
| validado_em | DateTime | — |

### Comentario (`comentario.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer PK | — |
| requisito_id | FK → Requisito | — |
| autor_id | FK → Usuario | — |
| parent_id | FK → Comentario | Para respostas aninhadas (máx 3 níveis) |
| texto | Text | — |
| editado_em | DateTime | Preenchido ao editar |
| oculto | Boolean | Ocultado por analista/gestor |
| ativo | Boolean | Exclusão lógica |
| criado_em | DateTime | — |

### ConviteProjeto (`convite_projeto.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer PK | — |
| token | String | UUID único, usado na URL |
| projeto_id | FK → Projeto | — |
| email | String | E-mail do convidado |
| perfil | String(20) | `cliente` ou `desenvolvedor` |
| status | String(20) | `pendente`, `aceito`, `cancelado` |
| convidado_por_id | FK → Usuario | — |
| aceito_por_id | FK → Usuario | Preenchido ao aceitar |
| criado_em | DateTime | — |
| expira_em | DateTime | criado_em + 7 dias |
| expirado | property | `expira_em < now` |

### MembroProjeto (`membro_projeto.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer PK | — |
| projeto_id | FK → Projeto | — |
| usuario_id | FK → Usuario | Desenvolvedor membro |
| criado_em | DateTime | Data de aceite do convite |

### AuditLog (`audit_log.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer PK | — |
| acao | String(50) | Ação realizada |
| entidade_tipo | String(50) | Entidade afetada |
| entidade_id | Integer | ID da entidade |
| detalhes | Text | JSON com detalhes extras |
| usuario_id | FK (SET NULL) | Quem executou |
| projeto_id | FK (SET NULL) | Projeto relacionado |
| criado_em | DateTime | — |

> `AuditLog.log(usuario_id, acao, entidade_tipo, entidade_id, projeto_id, detalhes)` — método estático chamado em todo CRUD.

### TokenBlocklist (`token_blocklist.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer PK | — |
| jti | String(36) | JWT ID do token revogado |
| expires_at | DateTime | — |
| created_at | DateTime | — |

### PasswordResetToken (`password_reset_token.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer PK | — |
| token | String | Token único enviado por e-mail |
| usuario_id | FK → Usuario | — |
| expires_at | DateTime | — |
| usado | Boolean | Evita reutilização |

---

## Regras de negócio

### RN002 — ERS inclui apenas aprovados

`POST /api/projects/:id/download-ers` filtra `status IN ('aprovado', 'aprovado_com_ressalvas')` por padrão. Enviar `{"incluir_nao_aprovados": true}` no corpo para incluir todos.

### RN003 — Versionamento de requisitos

Ao editar um requisito com `status = 'aprovado'` ou `'aprovado_com_ressalvas'`, se `titulo` ou `descricao` mudarem:
1. `RequirementVersion.snapshot()` salva o estado atual
2. `numero_versao` é incrementado
3. `status` volta para `em_revisao`

### RN004 — Exclusão lógica

`DELETE` em projetos e requisitos define `ativo = False`. Todas as queries filtram `WHERE ativo = True`.

### Validação por consenso (desvio de RF06)

Status do requisito muda quando 2+ validadores concordam:
- 2+ `aprovado` → `aprovado`
- 2+ `rejeitado` → `rejeitado`
- 2+ `aprovado_com_ressalvas` → `aprovado_com_ressalvas`

### Isolamento de dados por usuário

| Perfil | Filtro aplicado |
|--------|----------------|
| analista/gestor | projetos onde `gestor_id = user.id` |
| cliente | projetos onde `cliente_id = user.id` |
| desenvolvedor | projetos onde é membro (`MembroProjeto`) ou tem requisitos próprios |

Acessos fora do escopo retornam **403**.

---

## Permissões por perfil

| Ação | analista | desenvolvedor | cliente | gestor |
|------|----------|---------------|---------|--------|
| Criar projeto | ✅ | ❌ | ❌ | ✅ |
| Editar/excluir projeto | ✅ | ❌ | ❌ | ✅ |
| Criar requisito | ✅ | ✅ | ❌ | ❌ |
| Editar requisito | ✅ | ✅ | ❌ | ❌ |
| Excluir requisito | ✅ | ❌ | ❌ | ✅ |
| Submeter para revisão | ✅ | ✅ | ❌ | ❌ |
| Validar requisito | ✅ | ❌ | ✅ | ✅ |
| Baixar ERS | ✅ | ✅ | ✅ | ✅ |
| Enviar convite | ✅ | ❌ | ❌ | ✅ |
| Comentar requisito | ✅ | ✅ | ✅ | ✅ |
| Ocultar comentário | ✅ | ❌ | ❌ | ✅ |

---

## Segurança

- **JWT** — access token 2h (in-memory), refresh token 30d (HttpOnly cookie)
- **Blocklist** — tokens revogados armazenados em banco; verificação em toda requisição autenticada
- **Talisman** — headers HSTS, CSP, X-Frame-Options, X-Content-Type-Options em produção
- **Rate limiting** — 5 req/min no login, 3 req/min no cadastro
- **bcrypt** — hash de senhas (custo automático)
- **CORS** — origens restritas por ambiente (`localhost` em dev, `ALLOWED_ORIGINS` em prod)
- **Chave secreta** — bloqueia inicialização com chaves fracas (`SECRET_KEY` e `JWT_SECRET_KEY` obrigatórias)

---

## Desvios conscientes em relação à ERS (Projeto_Integrador_Atualizado.pdf)

| Item ERS | Especificação | Implementação | Justificativa |
|----------|---------------|---------------|---------------|
| **RF06** | Aprovação individual do Cliente | Consenso por maioria (2+) | Validação colaborativa mais robusta |
| **RF01-A6 / RN001** | Usuários criados só por convite | Auto-cadastro público + convite por e-mail | Onboarding self-service; gestor protegido via convite |

---

## Scripts auxiliares

```bash
# Popular banco com dados de teste
python seed.py

# Criar usuário gestor de teste
python create_gestor.py

# Rodar migrações manualmente
python migrate.py

# Shell Flask interativo
flask shell
```

## Problemas conhecidos

| Issue | Detalhes |
|-------|----------|
| **reportlab** | PDF indisponível se não instalado — DOCX funciona normalmente |
| **SMTP obrigatório** | Convites e reset de senha falham sem SMTP configurado |
| **CRUD projetos sem UI** | Endpoints `PUT`/`DELETE` de projetos existem mas o frontend não tem tela de edição individual |

## Licença

© 2026 ScopePlan Inc. Todos os direitos reservados.
