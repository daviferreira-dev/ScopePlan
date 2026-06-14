# ScopePlan Frontend

Interface web do ScopePlan — plataforma colaborativa de engenharia de requisitos com workflows baseados em papéis (analista, desenvolvedor, cliente, gestor).

## Tecnologias

| Tecnologia | Versão | Propósito |
|-----------|--------|-----------|
| React | 19.2.5 | UI framework |
| React DOM | 19.2.5 | Renderização DOM |
| React Router DOM | 7.14.2 | Roteamento SPA |
| TypeScript | 6.0 | Tipagem estática |
| Vite | 8.0 | Build e dev server |
| TipTap | — | Editor de rich text (requisitos) |
| Y.js | — | CRDT para edição colaborativa |
| Socket.IO Client | — | WebSocket (tempo real) |
| ESLint | 10.2 | Linting |

> **Styling:** Estilos inline via template literals (sem CSS framework). Fontes Google (Fraunces + DM Sans + Sora) carregadas via `@import`.

## Instalação

```bash
npm install
npm run dev
```

O Vite já tem proxy configurado: `/api` → `http://localhost:5000` e `/socket.io` → `http://localhost:5000`. Certifique-se de que o backend está rodando na porta 5000.

**Build de produção:**
```bash
npm run build
npm run preview
```

---

## Estrutura do Projeto

```
src/
├── App.tsx                       # Rotas, ProtectedRoute, NotFound
├── main.tsx                      # Entry point (StrictMode + BrowserRouter)
├── index.css                     # Reset global mínimo
├── assets/                       # logo_scope_plan.svg, hero.png, scopeplan.png, icons.svg
│
├── components/
│   ├── AppLayout.tsx             # Sidebar + topbar (recebe perfil prop)
│   ├── ErrorBoundary.tsx         # Captura erros de renderização
│   ├── RequirementEditor.tsx     # Editor TipTap (rich text + colaborativo via Y.js)
│   ├── Diagramas.tsx             # Upload e visualização de diagramas
│   ├── RequistoAnexos.tsx        # Gestão de anexos de requisitos
│   ├── ConvitesModal.tsx         # Modal para envio de convites (analista/gestor)
│   ├── ToastContainer.tsx        # Sistema de notificações toast
│   └── EyeIcons.tsx              # Ícones de visibilidade de senha
│
├── hooks/
│   └── useToast.tsx              # Hook para disparar toasts
│
├── contexts/
│   └── AuthContext.tsx           # Provider global de auth + hook useAuth()
│
├── services/
│   ├── api.ts                    # Cliente HTTP — authApi, projectsApi, requirementsApi, auditApi
│   └── socket.ts                 # Cliente WebSocket (Socket.IO)
│
├── utils/
│   ├── constants.tsx             # Tópicos, cores, ícones de tipo, labels, nav sidebar
│   ├── helpers.ts                # Formatação de data, status, useLogout
│   └── socketYjsProvider.ts      # Y.js CRDT provider para edição colaborativa
│
└── pages/
    ├── Home.tsx                  # Landing page (pública)
    ├── Login.tsx                 # Login (via useAuth)
    ├── Cadastro.tsx              # Cadastro (via useAuth)
    ├── ResetSenha.tsx            # Redefinição de senha por e-mail
    ├── AceitarConvite.tsx        # Aceitar convite por token (pública)
    │
    ├── shared/                   # Componentes compartilhados — recebem `perfil` prop
    │   ├── TelaProjetos.tsx      # Lista de projetos
    │   ├── TelaItens.tsx         # Requisitos por tipo (tópicos)
    │   ├── ValidacaoRequisitos.tsx # Fluxo de validação
    │   ├── DownloadERS.tsx       # Geração de ERS (DOCX/PDF)
    │   ├── Auditoria.tsx         # Log de auditoria
    │   ├── Comentarios.tsx       # Comentários aninhados em requisito
    │   ├── Dashboard.tsx         # Visão geral do projeto
    │   └── RequirementHistory.tsx # Histórico de versões do requisito
    │
    ├── analista/Tela_Projetos.tsx      # Wrapper → shared/ com perfil="analista"
    ├── cliente/Tela_Projetos.tsx       # Wrapper → shared/ com perfil="cliente"
    ├── desenvolvedor/Tela_Projetos.tsx # Wrapper → shared/ com perfil="desenvolvedor"
    └── gestor/Tela_Projetos.tsx        # Wrapper → shared/ com perfil="gestor"
```

---

## Arquitetura Shared + Props

Os wrappers em `analista/`, `cliente/`, `desenvolvedor/` e `gestor/` são thin components que importam de `shared/` e passam `perfil`. Toda a lógica de UI e permissões está nos componentes compartilhados, que adaptam o comportamento pelo valor de `perfil`.

---

## Status de integração com API

Todos os 4 portais estão **100% integrados com a API backend**. Não há dados mock ou hardcoded.

### Componentes Shared

| Componente | Comportamento por perfil |
|------------|--------------------------|
| `TelaProjetos.tsx` | Botão "Criar projeto" visível para analista/gestor |
| `TelaItens.tsx` | Controles de edição/exclusão por permissão |
| `ValidacaoRequisitos.tsx` | Analista/dev: criar requisito; Cliente: aprovar/rejeitar/observar |
| `DownloadERS.tsx` | Analista/gestor: filtro de tópicos (`topicIds`); outros: download completo |
| `Auditoria.tsx` | Analista/gestor: paginação servidor + filtros data/busca; outros: filtro client-side |
| `Comentarios.tsx` | Todos leem; autor edita (15 min); analista/gestor ocultam |
| `Dashboard.tsx` | Métricas do projeto |
| `RequirementHistory.tsx` | Lista de versões com diff visual |

### Portais

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
| Editar requisito | ✅ | ❌ | ✅ | ❌ |
| Excluir requisito | ✅ | ❌ | ❌ | ✅ |
| Observação em validação | ❌ | ✅ | ❌ | ❌ |
| Enviar convite | ✅ | ❌ | ❌ | ✅ |
| Ocultar comentário | ✅ | ❌ | ❌ | ✅ |
| Filtro tópicos ERS | ✅ `topicIds` | ❌ | ❌ | ✅ `topicIds` |
| Auditoria | Paginação servidor + filtros | Filtro client-side | Filtro client-side | Paginação servidor + filtros |

---

## AuthContext — Fluxo de autenticação

O `AuthContext` gerencia o estado global de autenticação:

| Ação | Comportamento |
|------|---------------|
| `login(email, senha)` | `authApi.login()` → salva access token in-memory; refresh via cookie HttpOnly |
| `register(nome, email, senha, perfil)` | `authApi.register()` + auto-login |
| `logout()` | `authApi.logout()` revoga tokens no servidor + limpa cookie + limpa estado local |
| Restaurar sessão | No mount: tenta `authApi.me()` com token existente; se falhar, tenta `authApi.refreshToken()` |

---

## Cliente API (`src/services/api.ts`)

Exporta 4 namespaces com todas as chamadas ao backend:

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

## WebSocket e edição colaborativa

`src/services/socket.ts` mantém uma conexão Socket.IO com o backend (Flask-SocketIO + eventlet).

`src/utils/socketYjsProvider.ts` implementa um provider Y.js que sincroniza o estado do editor TipTap entre múltiplos usuários via WebSocket. O `RequirementEditor.tsx` usa esse provider para habilitar edição simultânea de um requisito com reconciliação automática de conflitos (CRDT).

---

## Rotas da aplicação

| Rota | Página | Perfil | Auth |
|------|--------|--------|------|
| `/` | Home | Pública | ❌ |
| `/login` | Login | Pública | ❌ |
| `/cadastro` | Cadastro | Pública | ❌ |
| `/reset-senha` | Redefinir senha | Pública | ❌ |
| `/convite/:token` | Aceitar convite | Pública | ❌ |
| `/analista/projetos` | Tela_Projetos | analista | ✅ |
| `/cliente/projetos` | Tela_Projetos | cliente | ✅ |
| `/desenvolvedor/projetos` | Tela_Projetos | desenvolvedor | ✅ |
| `/gestor/projetos` | Tela_Projetos | gestor | ✅ |
| `/acesso-negado` | Acesso negado | Pública | ❌ |

> Sub-páginas (tópicos, validação, download, auditoria, comentários, histórico) são controladas por estado interno (`activePage`, `selectedProject`, `activeTopic`) dentro dos componentes pai, não por rotas aninhadas separadas.

### Redirecionamentos legados

- `/Tela_Projetos` → `/analista/projetos`
- `/Tela_Itens` → `/analista/projetos`

---

## Problemas conhecidos

| Issue | Detalhes |
|-------|----------|
| **CRUD de projetos sem UI** | Endpoints `PUT`/`DELETE` de projetos individuais existem no backend mas não há tela de edição/exclusão no frontend |
| **SMTP obrigatório** | Reset de senha e aceite de convite requerem configuração SMTP no backend |

## Licença

© 2026 ScopePlan Inc. Todos os direitos reservados.
