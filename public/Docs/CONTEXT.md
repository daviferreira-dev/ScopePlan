# ScopePlan — Project Context

> Last updated: 2026-05-18

## Overview

ScopePlan is a web-based Requirements Engineering platform for managing software project requirements, validations, and ERS (Especificação de Requisitos de Software) document generation. It supports role-based workflows where analysts create requirements, clients validate them, and the system tracks full audit history.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript + Vite | React 19.2, Vite 8, TS 6 |
| Routing | react-router-dom | 7.14 |
| Styling | Inline `<style>` template literals | No CSS framework |
| Backend | Flask (Python) | 3.0 |
| ORM | Flask-SQLAlchemy | — |
| Auth | Flask-JWT-Extended | JWT access (24h) + refresh (30d) |
| Validation | Marshmallow schemas | — |
| DB Migrations | Flask-Migrate (Alembic) | — |
| Database | SQLite | `backend/instance/scopepan.db` |
| Password Hashing | bcrypt | — |
| PDF Generation | WeasyPrint | — |
| DOCX Generation | python-docx | — |
| WSGI | gunicorn | — |

---

## Project Structure

```
ScopePlan/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory, blueprint registration, JWT config, health check
│   │   ├── config.py            # Config class (DB URI, JWT secrets, token expiry)
│   │   ├── models/
│   │   │   ├── __init__.py      # Re-exports all models
│   │   │   ├── user.py          # Usuario model (auth, roles, password hashing)
│   │   │   ├── project.py       # Projeto model (status, gestor, cliente)
│   │   │   ├── requirement.py   # Requisito model (codigo, tipo, prioridade, versioning)
│   │   │   ├── validacao.py     # Validacao model (review outcomes)
│   │   │   └── audit_log.py     # AuditLog model (model exists, logging not wired)
│   │   ├── routes/
│   │   │   ├── __init__.py      # Re-exports blueprints
│   │   │   ├── auth.py          # 7 endpoints (register, login, logout, refresh, me, update-me, clientes)
│   │   │   ├── projects.py      # 6 endpoints (CRUD + ERS download)
│   │   │   ├── requirements.py  # 9 endpoints (CRUD + submit-review + validacoes + version-history)
│   │   │   └── audit.py         # 1 endpoint (GET list with filters)
│   │   ├── schemas/
│   │   │   ├── project.py       # ProjectCreate, ProjectUpdate, Project (dump)
│   │   │   └── requirement.py   # RequirementCreate, RequirementUpdate, ValidacaoCreate
│   │   └── utils/
│   │       └── decorators.py    # role_required decorator
│   ├── instance/
│   │   └── scopepan.db          # SQLite database
│   ├── requirements.txt
│   ├── run.py                   # Entry point
│   └── .env
├── src/                         # Frontend (React + TypeScript + Vite)
│   ├── App.tsx                  # Routes, inline ProtectedRoute, ErrorBoundary, PlaceholderPage
│   ├── main.tsx                 # Entry point (StrictMode + BrowserRouter)
│   ├── contexts/
│   │   └── AuthContext.tsx       # Auth provider + useAuth() hook
│   ├── services/
│   │   └── api.ts               # Axios client — authApi, projectsApi, requirementsApi, auditApi
│   ├── pages/
│   │   ├── Home.tsx             # Landing page (public)
│   │   ├── Login.tsx            # Login (API-integrated via useAuth)
│   │   ├── Cadastro.tsx         # Register (API-integrated via useAuth)
│   │   ├── analista/            # Analyst portal — fully integrated with API
│   │   │   ├── Tela_Projetos.tsx        # Project list + create + client selection
│   │   │   ├── Tela_Itens.tsx           # Requirements by topic type
│   │   │   ├── ValidacaoRequisitos.tsx  # Validate (approve/reject) + create requirement
│   │   │   ├── DownloadERS.tsx          # ERS download (DOCX/PDF, with topic filtering)
│   │   │   └── Auditoria.tsx            # Audit log (server pagination + filters)
│   │   └── cliente/             # Client portal — fully integrated with API
│   │       ├── Tela_Projetos.tsx        # Project list (read-only)
│   │       ├── Tela_Itens.tsx           # Requirements by topic type
│   │       ├── ValidacaoRequisitos.tsx  # Validate (approve/reject/observation with comment)
│   │       ├── DownloadERS.tsx          # ERS download (DOCX/PDF, no topic filter)
│   │       └── Auditoria.tsx            # Audit log (client-side filter, no pagination)
│   ├── components/
│   │   ├── ErrorBoundary.tsx    # Render error catcher
│   │   └── ProtectedRoute.tsx   # NOT USED (App.tsx uses inline version)
│   └── assets/                  # Images, logos, SVGs
├── public/
│   └── Design/                  # UI design references
├── package.json
├── vite.config.ts               # Proxy /api → localhost:5000
└── tsconfig.json
```

---

## User Roles & Permissions

| Action | analista | desenvolvedor | cliente | gestor |
|--------|----------|---------------|---------|--------|
| Create project | ✅ | ❌ | ❌ | ✅ |
| Edit/delete project | ✅ | ❌ | ❌ | ✅ |
| View projects | own (gestor_id) | has requirements | own (cliente_id) | own (gestor_id) |
| Create requirement | ✅ | ✅ | ❌ | ❌ |
| Edit requirement | ✅ | ✅ | ❌ | ❌ |
| Delete requirement | ✅ | ❌ | ❌ | ✅ |
| Submit for review | ✅ | ✅ | ❌ | ❌ |
| Validate requirement | ✅ | ❌ | ✅ | ✅ |
| Download ERS | ✅* | ✅* | ✅* | ✅* |
| View requirements | all | all | own projects only | all |

> *ERS download has no role restriction — any user with project access can download.

---

## Data Isolation

Every entity is scoped to the logged-in user:

- **Analista/Gestor** → only projects where `gestor_id = user.id`
- **Cliente** → only projects where `cliente_id = user.id`
- **Desenvolvedor** → only projects where they authored requirements (`autor_id = user.id`)
- Backend enforces this at the route level; attempting to access another user's project returns 403

---

## Frontend Integration Status

All 12 existing pages are **fully integrated with the API backend**. There is zero mock or hardcoded data.

### Auth pages

| Page | File | API | Status |
|------|------|-----|--------|
| Login | `Login.tsx` | `authApi.login()` via useAuth | ✅ Integrated |
| Cadastro | `Cadastro.tsx` | `authApi.register()` via useAuth | ✅ Integrated |

### Analyst portal

| Page | File | API | Status |
|------|------|-----|--------|
| Projects | `analista/Tela_Projetos.tsx` | `projectsApi.list()`, `projectsApi.create()`, `authApi.listClientes()` | ✅ Integrated |
| Items | `analista/Tela_Itens.tsx` | `requirementsApi.list()` | ✅ Integrated |
| Validation | `analista/ValidacaoRequisitos.tsx` | `requirementsApi.createValidacao()`, `requirementsApi.create()`, `requirementsApi.list()` | ✅ Integrated |
| ERS Download | `analista/DownloadERS.tsx` | `projectsApi.downloadERS(projectId, format, topicIds)` | ✅ Integrated |
| Audit | `analista/Auditoria.tsx` | `auditApi.list(page, perPage, filters)`, `projectsApi.list()` | ✅ Integrated |

### Client portal

| Page | File | API | Status |
|------|------|-----|--------|
| Projects | `cliente/Tela_Projetos.tsx` | `projectsApi.list()` (read-only) | ✅ Integrated |
| Items | `cliente/Tela_Itens.tsx` | `requirementsApi.list()` | ✅ Integrated |
| Validation | `cliente/ValidacaoRequisitos.tsx` | `requirementsApi.createValidacao()` (includes observation), `requirementsApi.list()` | ✅ Integrated |
| ERS Download | `cliente/DownloadERS.tsx` | `projectsApi.downloadERS(projectId, format)` | ✅ Integrated |
| Audit | `cliente/Auditoria.tsx` | `auditApi.list()` (no pagination, client-side filter) | ✅ Integrated |

### Pending portals

| Profile | Route | Status |
|---------|-------|--------|
| Desenvolvedor | `/desenvolvedor/projetos` | Placeholder (PlaceholderPage in App.tsx) |
| Gestor | `/gestor/projetos` | Placeholder (PlaceholderPage in App.tsx) |

---

## Analyst vs Client — Feature Differences

| Aspect | Analyst | Client |
|--------|---------|--------|
| Create project | ✅ Modal with client selection | ❌ Read-only list |
| Create requirement | ✅ In validation page | ❌ |
| Validation options | Approve / Reject | Approve / Reject / Observation (with comment) |
| Audit — pagination | ✅ Server-side (page, perPage) | ❌ Client-side |
| Audit — filters | ✅ Project, action, date range | ❌ Simple client-side filter |
| ERS download — topic filter | ✅ `topicIds` parameter | ⚠️ UI has topic checkboxes but they are NOT passed to the API call (bug) |

---

## Business Rules

### RN002 — ERS includes only approved requirements

The ERS download endpoint automatically filters to `status = 'aprovado'`.

### RN003 — Requirement versioning

Editing an approved requirement resets status to `em_revisao` and increments the version number.

### RN004 — Soft delete

Projects and requirements are never physically deleted. `DELETE` sets `ativo = False` and excludes from default listings.

---

## API Endpoints Summary

### Health

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/health` | No |

### Auth

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/logout` | Yes |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Yes |
| PUT | `/api/auth/me` | Yes |
| GET | `/api/auth/clientes` | Yes |

### Projects

| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/api/projects` | Yes | Any (filtered by role) |
| POST | `/api/projects` | Yes | analista, gestor |
| GET | `/api/projects/:id` | Yes | Owner |
| PUT | `/api/projects/:id` | Yes | analista, gestor |
| DELETE | `/api/projects/:id` | Yes | analista, gestor |
| POST | `/api/projects/:id/ers/download` | Yes | Any with access |

### Requirements

| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/api/requirements` | Yes | Any (filtered by role) |
| POST | `/api/requirements` | Yes | analista, desenvolvedor |
| GET | `/api/requirements/:id` | Yes | Owner |
| PUT | `/api/requirements/:id` | Yes | analista, desenvolvedor |
| DELETE | `/api/requirements/:id` | Yes | analista, gestor |
| POST | `/api/requirements/:id/submit-review` | Yes | analista, desenvolvedor |
| POST | `/api/requirements/:id/validacoes` | Yes | cliente, analista, gestor |
| GET | `/api/requirements/:id/validacoes` | Yes | Owner |
| GET | `/api/requirements/:id/version-history` | Yes | Owner |

### Audit

| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/api/audit` | Yes | Any (filtered by role) |

---

## Known Issues

| Issue | Details | Severity |
|-------|---------|----------|
| **Audit log implementation** | ✅ Fixed — `AuditLog.log()` now called from all project and requirement CRUD routes | Resolved |
| **Logout server invalidation** | ✅ Fixed — `AuthContext.logout()` now calls `authApi.logout()` before clearing tokens | Resolved |
| **Validation 'pendente' handling** | ✅ Fixed — `create_validacao` endpoint now handles `resultado='pendente'` correctly | Resolved |
| **Client ERS download topicIds** | ✅ Fixed — Client DownloadERS page now passes requirement IDs to API | Resolved |
| **Token blocklist in-memory** | Revoked tokens are lost on server restart | Low |
| **Developer/Manager portals not implemented** | Both are PlaceholderPage in App.tsx | Medium |
| **Code duplication** | `analista/` and `cliente/` directories have near-identical pages | Low |
| **ProtectedRoute duplication** | `src/components/ProtectedRoute.tsx` exists but isn't used; App.tsx has inline version | Low |
