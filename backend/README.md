# ScopePlan Backend API

API RESTful para gestão e documentação de requisitos do projeto ScopePlan.

## Tecnologias

- **Framework**: Flask 3.0
- **ORM**: SQLAlchemy
- **Autenticação**: JWT (Flask-JWT-Extended)
- **Banco de Dados**: SQLite (padrão), compatível com PostgreSQL
- **Validação**: Marshmallow

## Instalação

### 1. Criar ambiente virtual

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
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

## Endpoints da API

### Autenticação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Registrar novo usuário | Não |
| POST | `/api/auth/login` | Login | Não |
| POST | `/api/auth/logout` | Logout | Sim |
| POST | `/api/auth/refresh` | Renovar token | Sim (refresh) |
| GET | `/api/auth/me` | Perfil do usuário | Sim |
| PUT | `/api/auth/me` | Atualizar perfil | Sim |

### Projetos

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/projects` | Criar projeto | Sim |
| GET | `/api/projects` | Listar projetos | Sim |
| GET | `/api/projects/:id` | Detalhes do projeto | Sim |
| PUT | `/api/projects/:id` | Atualizar projeto | Sim |
| DELETE | `/api/projects/:id` | Excluir projeto | Sim |
| POST | `/api/projects/:id/increment-version` | Incrementar versão | Sim |

### Requisitos

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/requirements` | Criar requisito | Sim (Analista) |
| GET | `/api/requirements` | Listar requisitos | Sim |
| GET | `/api/requirements/:id` | Detalhes do requisito | Sim |
| PUT | `/api/requirements/:id` | Atualizar requisito | Sim (Autor) |
| DELETE | `/api/requirements/:id` | Excluir requisito | Sim (Autor) |
| POST | `/api/requirements/:id/validate` | Validar/Rejeitar | Sim (Cliente) |
| POST | `/api/requirements/:id/submit-review` | Submeter para revisão | Sim (Autor) |
| GET | `/api/requirements/:id/version-history` | Histórico de versões | Sim |

## Autenticação

A API usa JWT (JSON Web Tokens) para autenticação.

### Headers

Inclua o token nos headers de todas as requisições autenticadas:

```
Authorization: Bearer <access_token>
```

### Exemplo de Registro

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123",
    "name": "Nome do Usuário",
    "role": "analista"
  }'
```

### Exemplo de Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

### Exemplo de Criar Projeto

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Meu Projeto",
    "description": "Descrição do projeto",
    "status": "draft"
  }'
```

### Exemplo de Criar Requisito

```bash
curl -X POST http://localhost:5000/api/requirements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "RF-001: Cadastro de Usuários",
    "description": "O sistema deve permitir o cadastro de novos usuários",
    "project_id": 1,
    "type": "funcional",
    "priority": "alta"
  }'
```

### Exemplo de Validar Requisito (Cliente)

```bash
curl -X POST http://localhost:5000/api/requirements/1/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "approved": true,
    "comments": "Requisito aprovado"
  }'
```

## Estrutura do Projeto

```
backend/
├── app/
│   ├── __init__.py      # App factory
│   ├── config.py        # Configurações
│   ├── models/          # Modelos SQLAlchemy
│   │   ├── user.py
│   │   ├── project.py
│   │   └── requirement.py
│   ├── routes/          # Rotas da API
│   │   ├── auth.py
│   │   ├── projects.py
│   │   └── requirements.py
│   ├── schemas/         # Schemas Marshmallow
│   │   ├── auth.py
│   │   ├── project.py
│   │   └── requirement.py
│   └── utils/           # Utilitários
│       └── decorators.py
├── run.py               # Entry point
├── requirements.txt
└── .env.example
```

## Papéis dos Usuários

- **Analista**: Criam e editam requisitos
- **Cliente**: Validam requisitos

## Status dos Projetos

- `draft`: Rascunho
- `active`: Ativo
- `completed`: Concluído
- `archived`: Arquivado

## Status dos Requisitos

- `draft`: Rascunho
- `in_review`: Em revisão
- `approved`: Aprovado
- `rejected`: Rejeitado

## Tipo de Requisitos

- `funcional`: Requisito funcional
- `nao-funcional`: Requisito não funcional
- `negocio`: Regra de negócio
- `usuario`: Requisito de interface
- `sistema`: Requisito de sistema

## Prioridade

- `baixa`: Prioridade baixa
- `media`: Prioridade média
- `alta`: Prioridade alta
- `critica`: Prioridade crítica

## Desenvolvimento

### Executar em modo de desenvolvimento

```bash
export FLASK_ENV=development
python run.py
```

### Executar com Gunicorn (Produção)

```bash
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

## Licença

© 2026 ScopePlan Inc. Todos os direitos reservados.
