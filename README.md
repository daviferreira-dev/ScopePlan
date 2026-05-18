# ScopePlan

Sistema de gerenciamento de requisitos de projeto com geração de ERS (Especificação de Requisitos de Software).

## Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Flask (Python) + SQLAlchemy + JWT
- **Banco de dados:** SQLite (desenvolvimento) / PostgreSQL (produção)

## Status do Projeto

### Portal do Analista — Integrado com API (2026-05-18)

Todas as telas do analista estão integradas com a API backend e utilizam dados reais:

| Tela | Arquivo | API | Status |
|------|---------|-----|--------|
| Projetos | `Tela_Projetos.tsx` | `projectsApi.list()`, `projectsApi.create()`, `authApi.listClientes()` | ✅ Integrado |
| Itens (tópicos) | `Tela_Itens.tsx` | `requirementsApi.list()` | ✅ Integrado |
| Validação | `ValidacaoRequisitos.tsx` | `requirementsApi.createValidacao()`, `requirementsApi.create()`, `requirementsApi.list()` | ✅ Integrado |
| Download ERS | `DownloadERS.tsx` | `projectsApi.downloadERS()` (com `topicIds`) | ✅ Integrado |
| Auditoria | `Auditoria.tsx` | `auditApi.list()` (paginação + filtros servidor), `projectsApi.list()` | ✅ Integrado |

### Portal do Cliente — Integrado com API (2026-05-18)

Todas as telas do cliente estão integradas com a API backend:

| Tela | Arquivo | API | Status |
|------|---------|-----|--------|
| Projetos | `Tela_Projetos.tsx` | `projectsApi.list()` (somente leitura) | ✅ Integrado |
| Itens | `Tela_Itens.tsx` | `requirementsApi.list()` | ✅ Integrado |
| Validação | `ValidacaoRequisitos.tsx` | `requirementsApi.createValidacao()`, `requirementsApi.list()` (com observação) | ✅ Integrado |
| Download ERS | `DownloadERS.tsx` | `projectsApi.downloadERS()` (sem `topicIds`) | ✅ Integrado |
| Auditoria | `Auditoria.tsx` | `auditApi.list()` (sem paginação, filtro client-side) | ✅ Integrado |

### Portais Pendentes

| Perfil | Status |
|--------|--------|
| Desenvolvedor | Placeholder — sem página dedicada |
| Gestor | Placeholder — sem página dedicada |

### Autenticação

| Tela | Arquivo | API | Status |
|------|---------|-----|--------|
| Login | `Login.tsx` | `authApi.login()` via `useAuth()` | ✅ Integrado |
| Cadastro | `Cadastro.tsx` | `authApi.register()` via `useAuth()` | ✅ Integrado |

**Build:** TypeScript compilation ✅ | Vite build ✅

## Funcionalidades

- Cadastro e login de usuários com perfis: **analista**, **desenvolvedor**, **cliente**, **gestor**
- CRUD de projetos (vinculados a um cliente)
- CRUD de requisitos (RF, RNF, RN, RT) por projeto, com versionamento
- Fluxo de validação: rascunho → em revisão → aprovado/rejeitado
- Geração de ERS em DOCX (e PDF se WeasyPrint/GTK estiver disponível)
- **Isolamento de dados por usuário** — cada usuário só vê seus próprios projetos, requisitos e logs de auditoria (analista/gestor por gestor_id, cliente por cliente_id, desenvolvedor por autor_id)
- **Registro de auditoria** — modelo e endpoint de leitura existem, porém nenhuma ação é gravada automaticamente (ver nota abaixo)

> ✅ **Audit log implementado:** Todas as rotas de CRUD de projetos e requisitos agora registram eventos de auditoria automaticamente via `AuditLog.log()`.

## Regras de negócio

### Permissões por perfil

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
| Baixar ERS | ✅ | ✅* | ✅* | ✅* |
| Ver requisitos | todos | todos | só dos seus projetos | todos |

> *ERS download não tem restrição por perfil — qualquer usuário com acesso ao projeto pode baixar.

### Isolamento de dados por usuário

- **Analistas/Gestores** só veem projetos que criaram (`gestor_id` = seu ID)
- **Clientes** só veem projetos onde são o cliente (`cliente_id` = seu ID)
- **Desenvolvedores** só veem projetos onde criaram requisitos (`autor_id` = seu ID)
- **Backend:** todos os endpoints de projetos e requisitos verificam se o usuário autenticado tem acesso ao projeto. Se não tiver, retorna 403.
- **Frontend:** botões de criação/edição/baixar são ocultados para clientes. A listagem já vem filtrada pelo backend.

### Versionamento de requisitos (RN003)

- Se um requisito **aprovado** tem seu título ou descrição alterados, o status volta para `em_revisao` e a versão é incrementada.

### Organização de requisitos por tipo

- Cada tópico (aba) na tela de itens corresponde a um tipo: **Funcional**, **Não-Funcional**, **Regra de Negócio**, **Restrição**
- Ao criar um requisito dentro de um tópico, o `tipo` é predefinido pelo tópico — o requisito é salvo automaticamente no tipo correto
- A listagem dentro de cada tópico mostra apenas os requisitos daquele tipo (filtrado por `tipo` no frontend)
- O código do requisito é gerado automaticamente com o prefixo do tipo: `RF-001`, `RNF-001`, `RN-001`, `RT-001`

### Exclusão lógica (RN004)

- Projetos e requisitos não são fisicamente deletados — recebem `ativo = False`.

## Pré-requisitos

- **Node.js** 18+ e npm
- **Python** 3.11+ (recomendado: 3.12)

## Como rodar

### 1. Backend

```bash
cd backend
python -m venv venv

# Ative o ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt

# Rode o servidor
python run.py
```

O backend roda em `http://localhost:5000`.

### 2. Frontend

```bash
npm install
npm run dev
```

O frontend roda em `http://localhost:5173` e já possui proxy configurado para `/api` apontando para o backend na porta 5000.

### 3. Acesse

Abra `http://localhost:5173` no navegador.

## Rotas da aplicação

| Rota | Página | Perfil |
|------|--------|--------|
| `/` | Home | Pública |
| `/login` | Login | Pública |
| `/cadastro` | Cadastro de usuário | Pública |
| `/analista/projetos` | Lista de projetos | Analista |
| `/analista/projetos/:id/itens` | Requisitos do projeto | Analista |
| `/analista/projetos/:id/validacao` | Validação de requisitos | Analista |
| `/analista/projetos/:id/ers` | Download da ERS | Analista |
| `/analista/projetos/:id/auditoria` | Registro de auditoria | Analista |
| `/cliente/projetos` | Painel do Cliente | Cliente (integrado) |
| `/desenvolvedor/projetos` | Painel do Desenvolvedor | Desenvolvedor (placeholder) |
| `/gestor/projetos` | Painel do Gestor | Gestor (placeholder) |
| `/acesso-negado` | Acesso negado | Pública |

> **Nota:** As sub-páginas (tópicos, validação, download, auditoria) são controladas por estado (`activePage`, `selectedProject`, `activeTopic`), não por rotas aninhadas.

## API Endpoints

### Health Check

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Verifica status da API |

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Cadastro de usuário |
| POST | `/api/auth/login` | Login (retorna JWT) |
| POST | `/api/auth/logout` | Logout (revoga token via blocklist) |
| POST | `/api/auth/refresh` | Renovar token |
| GET | `/api/auth/me` | Dados do usuário logado |
| PUT | `/api/auth/me` | Atualizar perfil do usuário |
| GET | `/api/auth/clientes` | Lista clientes (para vincular a projetos) |

> **Nota:** A blocklist de tokens do logout é armazenada em memória — tokens revogados são perdidos ao reiniciar o servidor.

### Projetos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/projects` | Listar projetos (filtrado por perfil) |
| POST | `/api/projects` | Criar projeto (analista, gestor) |
| GET | `/api/projects/:id` | Detalhes do projeto (verifica acesso) |
| PUT | `/api/projects/:id` | Atualizar projeto (analista, gestor) |
| DELETE | `/api/projects/:id` | Exclusão lógica do projeto (analista, gestor) |
| POST | `/api/projects/:id/ers/download` | Gerar e baixar ERS (qualquer perfil com acesso) |

### Requisitos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/requirements` | Listar requisitos (filtrado por projeto do usuário) |
| POST | `/api/requirements` | Criar requisito (analista, desenvolvedor) |
| GET | `/api/requirements/:id` | Detalhes do requisito (verifica acesso) |
| PUT | `/api/requirements/:id` | Atualizar requisito (analista, desenvolvedor) |
| DELETE | `/api/requirements/:id` | Exclusão lógica (analista, gestor) |
| POST | `/api/requirements/:id/submit-review` | Submeter para revisão |
| POST | `/api/requirements/:id/validacoes` | Registrar validação (cliente, analista, gestor) |
| GET | `/api/requirements/:id/validacoes` | Listar validações |
| GET | `/api/requirements/:id/version-history` | Histórico de versões |

### Auditoria

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/audit` | Listar registros de auditoria (filtrado por projeto, ação, entidade_tipo, usuário, data) |

## Variáveis de ambiente (Backend)

Arquivo `backend/.env`:

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `FLASK_ENV` | `development` | Ambiente (development/production) |
| `FLASK_APP` | `run.py` | Entry point do Flask |
| `PORT` | `5000` | Porta do backend |
| `SECRET_KEY` | - | Chave secreta do Flask |
| `JWT_SECRET_KEY` | - | Chave secreta do JWT |
| `DATABASE_URL` | `sqlite:///scopepan.db` | URL do banco de dados |

## Visualizando o banco de dados

O banco SQLite fica em `backend/instance/scopepan.db`. Para navegar visualmente pelas tabelas:

### Opção 1 — sqlite-web (recomendado)

```bash
pip install sqlite-web
cd backend
sqlite_web instance/scopepan.db
```

Abre um painel web em `http://localhost:8080` onde você pode ver, editar e filtrar registros de cada tabela.

### Opção 2 — DB Browser for SQLite

1. Baixe em [sqlitebrowser.org](https://sqlitebrowser.org/)
2. Abra o arquivo `backend/instance/scopepan.db`
3. Interface gráfica nativa para explorar tabelas, rodar queries e editar dados

### Opção 3 — Linha de comando

```bash
cd backend
python -c "
import sqlite3
conn = sqlite3.connect('instance/scopepan.db')
cursor = conn.cursor()
cursor.execute(\"SELECT name FROM sqlite_master WHERE type='table'\")
for t in cursor.fetchall():
 print(t[0])
conn.close()
"
```

## Notas para Windows

- **WeasyPrint** (geração de PDF da ERS) requer bibliotecas GTK. Se não tiver instalado, o formato PDF não estará disponível, mas o formato DOCX funciona normalmente. Para instalar o GTK, use o MSYS2 ou o instalador do WeasyPrint para Windows.
- Se tiver problemas com o `bcrypt`, certifique-se de ter o Visual Studio Build Tools instalado para compilar extensões C, ou use wheels pré-compilados.

## Scripts úteis

```bash
# Frontend - build de produção
npm run build

# Frontend - preview do build
npm run preview

# Frontend - lint
npm run lint

# Backend - shell interativo Flask
cd backend && flask shell
```

## Estrutura do projeto

```
ScopePlan/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Factory do Flask (create_app, blueprints, health check)
│   │   ├── config.py            # Configurações (dev/prod)
│   │   ├── models/              # Modelos SQLAlchemy
│   │   │   ├── user.py          # Usuário (nome, email, senha, perfil)
│   │   │   ├── project.py       # Projeto (nome, descricao, cliente_id)
│   │   │   ├── requirement.py   # Requisito (titulo, descricao, tipo, prioridade, status)
│   │   │   ├── validacao.py     # Validação de requisito
│   │   │   └── audit_log.py     # Registro de auditoria (modelo existe, gravação pendente)
│   │   ├── routes/              # Blueprints da API
│   │   │   ├── auth.py          # Autenticação e registro (7 endpoints)
│   │   │   ├── projects.py      # CRUD de projetos + download ERS
│   │   │   ├── requirements.py  # CRUD de requisitos + validações
│   │   │   └── audit.py         # Consulta de registros de auditoria
│   │   ├── schemas/             # Schemas Marshmallow
│   │   └── utils/               # Decorators e utilitários
│   ├── instance/                # Banco SQLite
│   ├── requirements.txt
│   ├── run.py                   # Entry point do servidor
│   └── .env                     # Variáveis de ambiente
├── src/
│   ├── pages/                   # Páginas React
│   │   ├── Login.tsx            # Login (integrado com API)
│   │   ├── Cadastro.tsx         # Cadastro de usuário (integrado com API)
│   │   ├── Home.tsx             # Landing page
│   │   ├── analista/            # Páginas do perfil Analista (integrado com API)
│   │   │   ├── Tela_Projetos.tsx    # Lista de projetos + criação
│   │   │   ├── Tela_Itens.tsx       # Requisitos do projeto (tópicos)
│   │   │   ├── ValidacaoRequisitos.tsx # Validação de requisitos
│   │   │   ├── DownloadERS.tsx      # Download da ERS (DOCX/PDF)
│   │   │   └── Auditoria.tsx        # Registro de auditoria
│   │   └── cliente/             # Páginas do perfil Cliente (integrado com API)
│   │       ├── Tela_Projetos.tsx    # Painel do cliente (somente leitura)
│   │       ├── Tela_Itens.tsx       # Requisitos do projeto
│   │       ├── ValidacaoRequisitos.tsx # Validação + observação
│   │       ├── DownloadERS.tsx      # Download da ERS
│   │       └── Auditoria.tsx        # Auditoria simplificada
│   ├── contexts/                # Contextos (AuthContext)
│   ├── services/                # Cliente API (api.ts)
│   ├── components/              # ErrorBoundary, ProtectedRoute (não usado)
│   ├── App.tsx                  # Rotas da aplicação (com AuthProvider)
│   └── main.tsx                 # Entry point React
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Diferenças entre portais Analista e Cliente

| Aspecto | Analista | Cliente |
|---------|----------|---------|
| Criar projeto | ✅ Botão "Novo Projeto" | ❌ Somente leitura |
| Criar requisito | ✅ Na tela de validação | ❌ |
| Observação em validação | ❌ | ✅ `resultado: 'observacao'` com comentário |
| Auditoria | Paginação servidor + filtros (projeto, ação, datas) | Sem paginação, filtro client-side |
| Download ERS | Filtra tópicos via `topicIds` | ✅ Integrado - passa `topicIds` à API |

## Problemas conhecidos

| Issue | Detalhes |
|-------|----------|
| **Logout sem invalidação servidor** | ✅ Resolvido - `AuthContext.logout()` agora chama `authApi.logout()` antes de limpar tokens |
| **Token blocklist in-memory** | Tokens revogados no logout são perdidos ao reiniciar o servidor |
| **Páginas não implementadas** | Desenvolvedor e Gestor são placeholders |
| **Duplicação de código** | Diretórios `analista/` e `cliente/` têm páginas quase idênticas |
| **ProtectedRoute duplicado** | `src/components/ProtectedRoute.tsx` não é usado; App.tsx tem versão inline |

## Licença

© 2026 ScopePlan Inc. Todos os direitos reservados.
