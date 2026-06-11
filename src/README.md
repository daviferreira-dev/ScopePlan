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
├── App.tsx                   # Rotas, ProtectedRoute inline, ErrorBoundary
├── main.tsx                  # Entry point (StrictMode + BrowserRouter)
├── index.css                 # Estilos globais mínimos
├── assets/                   # Imagens e logos
├── components/
│   ├── AppLayout.tsx         # Layout com sidebar/topbar (recebe perfil prop)
│   └── ErrorBoundary.tsx     # Captura erros de renderização
├── contexts/
│   └── AuthContext.tsx       # Provider de autenticação + hook useAuth()
├── services/
│   └── api.ts                # Cliente HTTP (axios) — authApi, projectsApi, requirementsApi, auditApi
├── utils/
│   ├── helpers.ts            # Funções utilitárias (formatação, status, useLogout)
│   └── constants.tsx         # Tópicos, cores, ícones, labels, mapeamentos
├── pages/
│   ├── Home.tsx              # Landing page (pública)
│   ├── Login.tsx             # Login (integrado com API via useAuth)
│   ├── Cadastro.tsx          # Cadastro de usuário (integrado com API via useAuth)
│   ├── shared/               # Componentes compartilhados (recebem perfil prop)
│   │   ├── TelaProjetos.tsx  # Lista de projetos (showCreateButton por perfil)
│   │   ├── TelaItens.tsx     # Requisitos do projeto (tópicos por tipo)
│   │   ├── ValidacaoRequisitos.tsx # Validação + add requisito + observação
│   │   ├── DownloadERS.tsx   # Download da ERS (DOCX/PDF, topicIds por perfil)
│   │   └── Auditoria.tsx     # Auditoria (paginação servidor/client-side por perfil)
│   ├── analista/             # Wrapper do perfil Analista
│   │   └── Tela_Projetos.tsx # Importa de shared/ com perfil="analista"
│   ├── cliente/              # Wrapper do perfil Cliente
│   │   └── Tela_Projetos.tsx # Importa de shared/ com perfil="cliente"
│   ├── desenvolvedor/        # Wrapper do perfil Desenvolvedor
│   │   └── Tela_Projetos.tsx # Importa de shared/ com perfil="desenvolvedor"
│   └── gestor/               # Wrapper do perfil Gestor
│       └── Tela_Projetos.tsx # Importa de shared/ com perfil="gestor"
```

> **Nota:** Os wrappers em `analista/`, `cliente/`, `desenvolvedor/` e `gestor/` são thin components que importam de `shared/` e passam `perfil`. Toda a lógica de UI e comportamento está nos componentes compartilhados.

---

## Status de integração com API

Todos os 4 portais estão **100% integrados com a API backend**. Não há dados mock ou hardcoded.

### Componentes Shared

| Componente | Arquivo | Comportamento por perfil |
|------------|---------|--------------------------|
| Projetos | `shared/TelaProjetos.tsx` | `showCreateButton` para analista/gestor |
| Itens | `shared/TelaItens.tsx` | `perfil` passado adiante |
| Validação | `shared/ValidacaoRequisitos.tsx` | Analista/dev: add requisito; Cliente: aprovar/rejeitar/observar |
| Download ERS | `shared/DownloadERS.tsx` | Analista/gestor: filtro tópicos (`topicIds`); outros: download completo |
| Auditoria | `shared/Auditoria.tsx` | Analista/gestor: paginação servidor + filtros data + busca textual; outros: filtro client-side |

### Perfis

| Perfil | Wrapper | Status |
|--------|---------|--------|
| Analista | `analista/Tela_Projetos.tsx` | ✅ Integrado |
| Cliente | `cliente/Tela_Projetos.tsx` | ✅ Integrado |
| Desenvolvedor | `desenvolvedor/Tela_Projetos.tsx` | ✅ Integrado |
| Gestor | `gestor/Tela_Projetos.tsx` | ✅ Integrado |

---

## Diferenças de comportamento por perfil

| Aspecto | Analista | Cliente | Desenvolvedor | Gestor |
|---------|----------|---------|---------------|--------|
| Criar projeto | ✅ | ❌ | ❌ | ✅ |
| Criar requisito | ✅ | ❌ | ✅ | ❌ |
| Observação em validação | ❌ | ✅ | ❌ | ❌ |
| Filtro tópicos no download ERS | ✅ `topicIds` | ❌ | ❌ | ✅ `topicIds` |
| Auditoria | Paginação servidor + filtros + busca | Filtro client-side | Filtro client-side | Paginação servidor + filtros + busca |

---

## AuthContext — Fluxo de autenticação

O `AuthContext` gerencia o estado de autenticação global:

| Ação | Comportamento |
|------|---------------|
| `login(email, senha)` | Chama `authApi.login()`, salva access token em memória; refresh via cookie HttpOnly |
| `register(nome, email, senha, perfil)` | Chama `authApi.register()` + `authApi.login()` (auto-login) |
| `logout()` | Chama `authApi.logout()` para revogar tokens no servidor + limpar cookie, depois limpa access token da memória |
| Restaurar sessão | No mount, se token existe, chama `authApi.me()` |

> **Token revogação:** O `logout()` chama `POST /api/auth/logout` com access token no header. O backend revoga ambos os tokens (access + refresh) na `TokenBlocklist` e limpa o cookie de refresh.

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
| `create(data)` | `POST /api/projects` |
| `downloadERS(projectId, format, topicIds?)` | `POST /api/projects/:id/download-ers` |

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
| `/desenvolvedor/projetos` | Tela_Projetos | desenvolvedor | ✅ |
| `/gestor/projetos` | Tela_Projetos | gestor | ✅ |
| `/acesso-negado` | Acesso negado | Pública | ❌ |

> **Nota:** As sub-páginas (tópicos, validação, download, auditoria) são controladas por estado (`activePage`, `selectedProject`, `activeTopic`) dentro dos componentes pai, não por rotas aninhadas separadas.

### Redirecionamentos de compatibilidade

- `/Tela_Projetos` → `/analista/projetos`
- `/Tela_Itens` → `/analista/projetos`

---

## Problemas conhecidos

| Issue | Detalhes |
|-------|----------|
| **Upload de arquivo** | UI presente mas sem lógica real de upload |
| **Version history sem UI** | `requirementsApi.versionHistory()` existe mas nenhuma página consome os dados |

## Licença

© 2026 ScopePlan Inc. Todos os direitos reservados.
