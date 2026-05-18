# ScopePlan Backend API

API RESTful para gestão e documentação de requisitos do projeto ScopePlan.

## Tecnologias

| Tecnologia | Versão | Propósito |
|-----------|--------|-----------|
| Flask | 3.0.0 | Framework web |
| Flask-SQLAlchemy | 3.1.1 | ORM |
| Flask-JWT-Extended | 4.6.0 | Autenticação JWT |
| Flask-CORS | 4.0.0 | Cross-Origin |
| Flask-Migrate | 4.0.5 | Migrações (Alembic) |
| Marshmallow | 3.20.1 | Validação de dados |
| bcrypt | 4.1.2 | Hash de senhas |
| WeasyPrint | 60.2 | Geração de PDF |
| python-docx | 1.1.0 | Geração de DOCX |
| gunicorn | 21.2.0 | WSGI servidor |

## Instalação

### 1. Criar ambiente virtual

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar ambiente

```bash
cp .env.example .env
# Edite o arquivo .env conforme necessário
```

### 4. Executar o servidor

```bash
python run.py
```

O servidor estará disponível em `http://localhost:5000`

## Configuração

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `SECRET_KEY` | `dev-secret-key-scopplan-2026` | Chave secreta Flask |
| `JWT_SECRET_KEY` | `jwt-secret-key-scoplan-2026` | Chave secreta JWT |
| `DATABASE_URL` | `sqlite:///scopepan.db` | URI do banco de dados |
| `FLASK_ENV` | `development` | Ambiente (development/production) |
| `PORT` | `5000` | Porta do servidor |

**Token JWT**: Access token expira em 24h, refresh token em 30 dias.

> ⚠️ **Token blocklist in-memory:** A blocklist de tokens revogados no logout é armazenada em um set na memória (`_token_blocklist` em `auth.py`). Tokens revogados são perdidos ao reiniciar o servidor. Em produção, deve ser migrada para Redis ou banco de dados.

---

## Endpoints da API

### Health Check

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/api/health` | Não | Verifica status da API |

### Autenticação (`/api/auth`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/api/auth/register` | Não | Cadastro de usuário (nome, email, senha, perfil) |
| POST | `/api/auth/login` | Não | Login — retorna access + refresh tokens |
| POST | `/api/auth/logout` | Sim | Logout — revoga token (blocklist in-memory) |
| POST | `/api/auth/refresh` | Refresh | Renova access token via refresh token |
| GET | `/api/auth/me` | Sim | Dados do usuário autenticado |
| PUT | `/api/auth/me` | Sim | Atualiza perfil do usuário (nome, email, senha) |
| GET | `/api/auth/clientes` | Sim | Lista usuários com perfil `cliente` (para vincular a projetos) |

### Projetos (`/api/projects`)

| Método | Endpoint | Auth | Permissão | Descrição |
|--------|----------|------|-----------|-----------|
| GET | `/api/projects` | Sim | Qualquer | Lista projetos do usuário (filtrado por perfil) |
| POST | `/api/projects` | Sim | analista, gestor | Criar projeto |
| GET | `/api/projects/:id` | Sim | Dono do projeto | Detalhes do projeto |
| PUT | `/api/projects/:id` | Sim | analista, gestor | Atualizar projeto |
| DELETE | `/api/projects/:id` | Sim | analista, gestor | Exclusão lógica (`ativo=False`) |
| POST | `/api/projects/:id/ers/download` | Sim | Qualquer com acesso | Gerar e baixar ERS (DOCX ou PDF) |

> **Isolamento de dados:** A listagem (`GET /api/projects`) retorna apenas projetos que o usuário pode ver: analista/gestor veem projetos que criaram (`gestor_id`), clientes veem projetos onde são o cliente (`cliente_id`), desenvolvedores veem projetos onde criaram requisitos.

> **ERS download:** Não tem restrição por perfil — qualquer usuário com acesso ao projeto pode baixar. Parâmetros: `formato` (docx/pdf), `topic_ids` (lista de IDs de requisitos para filtrar tópicos).

### Requisitos (`/api/requirements`)

| Método | Endpoint | Auth | Permissão | Descrição |
|--------|----------|------|-----------|-----------|
| GET | `/api/requirements` | Sim | Qualquer | Lista requisitos (filtrado por projeto do usuário) |
| POST | `/api/requirements` | Sim | analista, desenvolvedor | Criar requisito |
| GET | `/api/requirements/:id` | Sim | Dono do projeto | Detalhes do requisito |
| PUT | `/api/requirements/:id` | Sim | analista, desenvolvedor | Atualizar requisito |
| DELETE | `/api/requirements/:id` | Sim | analista, gestor | Exclusão lógica (`ativo=False`) |
| POST | `/api/requirements/:id/submit-review` | Sim | analista, desenvolvedor | Submeter requisito para revisão |
| POST | `/api/requirements/:id/validacoes` | Sim | cliente, analista, gestor | Registrar validação (aprovar/rejeitar/observação) |
| GET | `/api/requirements/:id/validacoes` | Sim | Dono do projeto | Listar validações do requisito |
| GET | `/api/requirements/:id/version-history` | Sim | Dono do projeto | Histórico de versões do requisito |

> **Versionamento (RN003):** Se um requisito aprovado tiver título ou descrição alterados, o status volta para `em_revisao` e a versão é incrementada.

> **Validação:** O resultado pode ser `aprovado`, `rejeitado` ou `observacao` (com campo `comentario`).

### Auditoria (`/api/audit`)

| Método | Endpoint | Auth | Permissão | Descrição |
|--------|----------|------|-----------|-----------|
| GET | `/api/audit` | Sim | Qualquer | Listar registros de auditoria (filtrado por projeto do usuário) |

**Parâmetros de query:** `page`, `per_page`, `projeto_id`, `acao`, `entidade_tipo`, `usuario_id`, `data_inicio`, `data_fim`

> ⚠️ **Audit log não funcional:** O modelo `AuditLog` e o endpoint de leitura existem, mas `AuditLog.log()` nunca é chamado pelas rotas. A tabela `audit_logs` permanece vazia. A gravação automática de ações precisa ser implementada.

---

## Modelos

### Usuario (`user.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| nome | String(200) | Nome completo |
| email | String(120) | Email único |
| senha_hash | String(200) | Hash bcrypt da senha |
| perfil | String(20) | Role: `analista`, `desenvolvedor`, `cliente`, `gestor` |
| ativo | Boolean | Usuário ativo/inativo |
| criado_em | DateTime | Data de criação |

### Projeto (`project.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| nome | String(200) | Nome do projeto |
| descricao | Text | Descrição |
| status | String(20) | Status: `planejamento`, `em_andamento`, `concluido`, `cancelado` |
| custo_estimado | Decimal(10,2) | Custo estimado |
| gestor_id | Integer (FK) | ID do analista/gestor que criou |
| cliente_id | Integer (FK) | ID do cliente vinculado |
| nome_cliente | String(200) | Nome do cliente (denormalizado) |
| ativo | Boolean | Exclusão lógica |
| criado_em | DateTime | Data de criação |
| atualizado_em | DateTime | Data de atualização |

### Requisito (`requirement.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| titulo | String(300) | Título do requisito |
| descricao | Text | Descrição detalhada |
| tipo | String(20) | Tipo: `funcional`, `nao_funcional`, `regra_negocio`, `restricao` |
| prioridade | String(20) | Prioridade: `baixa`, `media`, `alta`, `critica` |
| status | String(20) | Status: `rascunho`, `em_revisao`, `aprovado`, `rejeitado` |
| codigo | String(20) | Código gerado: `RF-001`, `RNF-001`, `RN-001`, `RT-001` |
| versao | Integer | Versão do requisito (incrementa ao editar aprovado) |
| projeto_id | Integer (FK) | Projeto pai |
| autor_id | Integer (FK) | ID do usuário que criou |
| ativo | Boolean | Exclusão lógica |
| criado_em | DateTime | Data de criação |
| atualizado_em | DateTime | Data de atualização |

### Validacao (`validacao.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| resultado | String(20) | Resultado: `aprovado`, `rejeitado`, `observacao`, `pendente` |
| comentario | Text | Comentário do validador |
| requisito_id | Integer (FK) | Requisito validado |
| validador_id | Integer (FK) | ID do usuário que validou |
| criado_em | DateTime | Data da validação |

### AuditLog (`audit_log.py`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Integer (PK) | Identificador |
| acao | String(50) | Ação realizada |
| entidade_tipo | String(50) | Tipo de entidade afetada |
| entidade_id | Integer | ID da entidade |
| detalhes | Text | Detalhes da ação |
| usuario_id | Integer (FK) | ID do usuário que executou |
| projeto_id | Integer (FK) | ID do projeto relacionado |
| criado_em | DateTime | Timestamp da ação |

> Método estático: `AuditLog.log(usuario_id, acao, entidade_tipo, entidade_id, projeto_id=None, detalhes=None)` — existe mas não é chamado por nenhuma rota.

---

## Permissões por perfil

| Ação | analista | desenvolvedor | cliente | gestor |
|------|----------|---------------|---------|--------|
| Criar projeto | ✅ | ❌ | ❌ | ✅ |
| Editar/excluir projeto | ✅ | ❌ | ❌ | ✅ |
| Ver projetos | só os que criou | só os que tem requisitos | só os seus | só os que criou |
| Criar requisito | ✅ | ✅ | ❌ | ❌ |
| Editar requisito | ✅ | ✅ | ❌ | ❌ |
| Excluir requisito | ✅ | ❌ | ❌ | ✅ |
| Submeter para revisão | ✅ | ✅ | ❌ | ❌ |
| Validar requisito | ✅ | ❌ | ✅ | ✅ |
| Baixar ERS | ✅* | ✅* | ✅* | ✅* |
| Ver requisitos | todos | todos | só dos seus projetos | todos |

> *ERS download não tem restrição por perfil — qualquer usuário com acesso ao projeto pode baixar.

---

## Schemas Marshmallow

### ProjectCreateSchema

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| nome | String | ✅ | max 200 |
| descricao | String | ❌ | — |
| status | String | ❌ | default `planejamento` |
| custo_estimado | Decimal | ❌ | — |
| cliente_id | Integer | ❌ | — |
| nome_cliente | String | ❌ | max 200 |

### ProjectUpdateSchema

Mesmos campos de `ProjectCreateSchema`, porém todos opcionais.

### ProjectSchema (dump)

| Campo | Tipo |
|-------|------|
| id | Integer |
| nome | String |
| descricao | String |
| status | String |
| custo_estimado | Decimal |
| gestor_id | Integer |
| gestor | String (nome do gestor) |
| cliente_id | Integer |
| nome_cliente | String |
| ativo | Boolean |
| requisitos_count | Integer |
| aprovados_count | Integer |
| criado_em | DateTime |
| atualizado_em | DateTime |

### RequirementCreateSchema

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| titulo | String | ✅ | max 300 |
| descricao | String | ❌ | — |
| tipo | String | ❌ | default `funcional` |
| prioridade | String | ❌ | default `media` |
| projeto_id | Integer | ✅ | Deve existir |

### ValidacaoCreateSchema

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| resultado | String | ✅ | `aprovado`, `rejeitado`, `observacao`, `pendente` |
| comentario | String | ❌ | Obrigatório quando resultado = `observacao` |

---

## Regras de negócio

### RN002 — ERS só inclui requisitos aprovados

O endpoint `POST /api/projects/:id/ers/download` filtra automaticamente os requisitos para incluir apenas os que têm `status = 'aprovado'`.

### RN003 — Versionamento de requisitos

Ao editar um requisito com `status = 'aprovado'`, se `titulo` ou `descricao` forem alterados, o sistema automaticamente:
1. Reseta o status para `em_revisao`
2. Incrementa a versão

### RN004 — Exclusão lógica

Projetos e requisitos nunca são fisicamente deletados. O `DELETE` define `ativo = False` e o registro é excluído das listagens padrão.

### Isolamento de dados por usuário

Todos os endpoints de listagem verificam o perfil do usuário autenticado e retornam apenas os dados que ele pode acessar:

- **Analista/Gestor** → projetos onde `gestor_id = user.id`
- **Cliente** → projetos onde `cliente_id = user.id`
- **Desenvolvedor** → projetos onde existem requisitos com `autor_id = user.id`

Tentativas de acessar recursos de outros projetos retornam 403.

---

## Problemas conhecidos

| Issue | Detalhes |
|-------|----------|
| **Audit log vazio** | `AuditLog.log()` nunca é chamado pelas rotas — a tabela permanece vazia |
| **Token blocklist in-memory** | Tokens revogados no logout são perdidos ao reiniciar o servidor |
| **Validação pendente** | `ValidacaoCreateSchema` aceita `resultado='pendente'`, mas a lógica do route handler não trata esse caso — pode deixar o status do requisito sem alteração |

## Licença

© 2026 ScopePlan Inc. Todos os direitos reservados.
