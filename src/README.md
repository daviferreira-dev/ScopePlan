# ScopePlan Frontend

Interface web do ScopePlan — plataforma de Engenharia de Requisitos com workflows baseados em papéis (analista, desenvolvedor, cliente, gestor).

## Tecnologias

| Tecnologia | Versão | Propósito |
|-----------|--------|-----------|
| React | 19.2.5 | UI framework |
| React DOM | 19.2.5 | Renderização DOM |
| React Router DOM | 7.14.2 | Roteamento SPA |
| TypeScript | 6.0 | Tipagem estática |
| Vite | 8.0 | Build e dev server |
| ESLint | 10.2 | Linting |

> **Styling**: Estilos inline via template literals (sem CSS framework). Fontes Google (Fraunces + DM Sans) carregadas via `@import` em `<style>` tags.

## Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar proxy

O Vite já está configurado para fazer proxy de `/api` → `http://localhost:5000`. Certifique-se de que o backend está rodando na porta 5000.

### 3. Executar em desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

### 4. Build de produção

```bash
npm run build
npm run preview
```

---

## Estrutura do Projeto

```
src/
├── App.tsx                    # Rotas, ProtectedRoute inline, ErrorBoundary
├── main.tsx                   # Entry point (StrictMode + BrowserRouter)
├── index.css                  # Estilos globais mínimos
├── assets/
│   ├── hero.png               # Imagem hero
│   ├── logo_scope_plan.svg    # Logo SVG
│   ├── scopeplan.png          # Logo PNG (usado nas páginas)
│   ├── react.svg              # Logo React (default)
│   └── vite.svg               # Logo Vite (default)
├── components/
│   ├── ErrorBoundary.tsx      # Captura erros de renderização
│   └── ProtectedRoute.tsx     # NÃO UTILIZADO (App.tsx usa versão inline)
├── contexts/
│   └── AuthContext.tsx        # Provider de autenticação + hook useAuth()
├── services/
│   └── api.ts                 # Cliente HTTP (axios) — authApi, projectsApi, requirementsApi, auditApi
├── pages/
│   ├── Home.tsx               # Landing page (pública)
│   ├── Login.tsx              # Login (integrado com API via useAuth)
│   ├── Cadastro.tsx           # Cadastro de usuário (integrado com API via useAuth)
│   ├── analista/              # Portal do Analista — integrado com API
│   │   ├── Tela_Projetos.tsx        # Lista de projetos + criação + seleção de cliente
│   │   ├── Tela_Itens.tsx           # Requisitos do projeto (tópicos por tipo)
│   │   ├── ValidacaoRequisitos.tsx  # Validação (aprovar/rejeitar) + criação de requisito
│   │   ├── DownloadERS.tsx          # Download da ERS (DOCX/PDF, com filtro de tópicos)
│   │   └── Auditoria.tsx            # Registro de auditoria (paginação servidor + filtros)
│   └── cliente/               # Portal do Cliente — integrado com API
│       ├── Tela_Projetos.tsx        # Painel do cliente (somente leitura)
│       ├── Tela_Itens.tsx           # Requisitos do projeto (tópicos por tipo)
│       ├── ValidacaoRequisitos.tsx  # Validação (aprovar/rejeitar/observação com comentário)
│       ├── DownloadERS.tsx          # Download da ERS (DOCX/PDF, sem filtro de tópicos)
│       └── Auditoria.tsx            # Registro de auditoria (sem paginação, filtro client-side)
```

> **Nota:** Os diretórios `src/pages/desenvolvedor/` e `src/pages/gestor/` existem mas estão vazios. Esses perfis usam `PlaceholderPage` inline em App.tsx.

---

## Status de integração com API

Todas as 12 páginas existentes estão **100% integradas com a API backend**. Não há dados mock ou hardcoded em nenhuma página.

### Autenticação

| Página | Arquivo | API | Status |
|--------|---------|-----|--------|
| Login | `Login.tsx` | `authApi.login()` via `useAuth().login()` | ✅ Integrado |
| Cadastro | `Cadastro.tsx` | `authApi.register()` via `useAuth().register()` | ✅ Integrado |

> Login.tsx possui perfis de teste rápidos (`QUICK_PROFILES`) para conveniência — não são dados mock.

### Portal do Analista

| Página | Arquivo | API | Status |
|--------|---------|-----|--------|
| Projetos | `Tela_Projetos.tsx` | `projectsApi.list()`, `projectsApi.create()`, `authApi.listClientes()` | ✅ Integrado |
| Itens | `Tela_Itens.tsx` | `requirementsApi.list()` | ✅ Integrado |
| Validação | `ValidacaoRequisitos.tsx` | `requirementsApi.createValidacao()`, `requirementsApi.create()`, `requirementsApi.list()` | ✅ Integrado |
| Download ERS | `DownloadERS.tsx` | `projectsApi.downloadERS(projectId, format, topicIds)` | ✅ Integrado |
| Auditoria | `Auditoria.tsx` | `auditApi.list(page, perPage, filters)`, `projectsApi.list()` | ✅ Integrado |

### Portal do Cliente

| Página | Arquivo | API | Status |
|--------|---------|-----|--------|
| Projetos | `Tela_Projetos.tsx` | `projectsApi.list()` (somente leitura) | ✅ Integrado |
| Itens | `Tela_Itens.tsx` | `requirementsApi.list()` | ✅ Integrado |
| Validação | `ValidacaoRequisitos.tsx` | `requirementsApi.createValidacao()`, `requirementsApi.list()` | ✅ Integrado |
| Download ERS | `DownloadERS.tsx` | `projectsApi.downloadERS(projectId, format)` | ✅ Integrado |
| Auditoria | `Auditoria.tsx` | `auditApi.list()` (sem parâmetros, filtro client-side) | ✅ Integrado |

### Perfis Pendentes

| Perfil | Rota | Status |
|--------|------|--------|
| Desenvolvedor | `/desenvolvedor/projetos` | Placeholder (PlaceholderPage inline) |
| Gestor | `/gestor/projetos` | Placeholder (PlaceholderPage inline) |

---

## Diferenças entre portais Analista e Cliente

| Aspecto | Analista | Cliente |
|---------|----------|---------|
| Criar projeto | ✅ Botão "Novo Projeto" com modal | ❌ Somente leitura |
| Criar requisito | ✅ Na tela de validação | ❌ |
| Observação em validação | ❌ | ✅ `resultado: 'observacao'` com campo de comentário |
| Auditoria — paginação | ✅ Servidor (`page`, `perPage`) | ❌ Client-side |
| Auditoria — filtros | ✅ Projeto, ação, data início/fim | ❌ Filtro simples client-side |
| Download ERS — filtro | ✅ Seleção de tópicos (`topicIds`) | ⚠️ UI com checkboxes de tópicos, mas NÃO passa `topicIds` à API (bug) |

---

## AuthContext — Fluxo de autenticação

O `AuthContext` gerencia o estado de autenticação global:

| Ação | Comportamento |
|------|---------------|
| `login(email, senha)` | Chama `authApi.login()`, salva tokens no localStorage |
| `register(nome, email, senha, perfil)` | Chama `authApi.register()` + `authApi.login()` (auto-login) |
| `logout()` | Remove tokens do localStorage (⚠️ não chama `authApi.logout()`) |
| Restaurar sessão | No mount, se token existe, chama `authApi.me()` |

> ⚠️ **Gap:** O logout do frontend não invalida o token no servidor. O endpoint `POST /api/auth/logout` existe no backend mas não é chamado pelo AuthContext.

---

## Cliente API (`src/services/api.ts`)

O arquivo `api.ts` exporta 4 namespaces com todas as chamadas ao backend:

### `authApi`
| Função | Endpoint |
|--------|----------|
| `login(email, senha)` | `POST /api/auth/login` |
| `register(data)` | `POST /api/auth/register` |
| `logout()` | `POST /api/auth/logout` |
| `me()` | `GET /api/auth/me` |
| `updateMe(data)` | `PUT /api/auth/me` |
| `listClientes()` | `GET /api/auth/clientes` |
| `refreshToken()` | `POST /api/auth/refresh` |

### `projectsApi`
| Função | Endpoint |
|--------|----------|
| `list()` | `GET /api/projects` |
| `get(id)` | `GET /api/projects/:id` |
| `create(data)` | `POST /api/projects` |
| `update(id, data)` | `PUT /api/projects/:id` |
| `delete(id)` | `DELETE /api/projects/:id` |
| `downloadERS(projectId, format, topicIds?)` | `POST /api/projects/:id/ers/download` |

### `requirementsApi`
| Função | Endpoint |
|--------|----------|
| `list(projectId)` | `GET /api/requirements?projeto_id=X` |
| `get(id)` | `GET /api/requirements/:id` |
| `create(data)` | `POST /api/requirements` |
| `update(id, data)` | `PUT /api/requirements/:id` |
| `delete(id)` | `DELETE /api/requirements/:id` |
| `submitReview(id)` | `POST /api/requirements/:id/submit-review` |
| `createValidacao(id, data)` | `POST /api/requirements/:id/validacoes` |
| `listValidacoes(id)` | `GET /api/requirements/:id/validacoes` |
| `versionHistory(id)` | `GET /api/requirements/:id/version-history` |

### `auditApi`
| Função | Endpoint |
|--------|----------|
| `list(page?, perPage?, filters?)` | `GET /api/audit` |

---

## Rotas da aplicação

| Rota | Página | Perfil | Auth |
|------|--------|--------|------|
| `/` | Home | Pública | ❌ |
| `/login` | Login | Pública | ❌ |
| `/cadastro` | Cadastro | Pública | ❌ |
| `/analista/projetos` | Tela_Projetos | analista | ✅ |
| `/analista/projetos/:id/itens` | Tela_Itens | analista | ✅ |
| `/analista/projetos/:id/validacao` | ValidacaoRequisitos | analista | ✅ |
| `/analista/projetos/:id/ers` | DownloadERS | analista | ✅ |
| `/analista/projetos/:id/auditoria` | Auditoria | analista | ✅ |
| `/cliente/projetos` | Tela_Projetos | cliente | ✅ |
| `/desenvolvedor/projetos` | PlaceholderPage | desenvolvedor | ✅ |
| `/gestor/projetos` | PlaceholderPage | gestor | ✅ |
| `/acesso-negado` | Acesso negado | Pública | ❌ |

> **Nota:** As sub-páginas (tópicos, validação, download, auditoria) são controladas por estado (`activePage`, `selectedProject`, `activeTopic`) dentro dos componentes pai, não por rotas aninhadas separadas.

### Redirecionamentos de compatibilidade

- `/Tela_Projetos` → `/analista/projetos`
- `/Tela_Itens` → `/analista/projetos`

---

## Problemas conhecidos

| Issue | Detalhes |
|-------|----------|
| **Logout sem invalidação servidor** | ✅ Resolvido - `AuthContext.logout()` agora chama `authApi.logout()` antes de limpar tokens |
| **ProtectedRoute duplicado** | `src/components/ProtectedRoute.tsx` não é usado; App.tsx tem versão inline |
| **Duplicação de código** | Diretórios `analista/` e `cliente/` têm páginas quase idênticas |
| **Perfis não implementados** | Desenvolvedor e Gestor são placeholders |
| **Upload de arquivo** | UI presente mas sem lógica real de upload |

## Licença

© 2026 ScopePlan Inc. Todos os direitos reservados.
