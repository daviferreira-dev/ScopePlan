# ScopePlan

Sistema de gerenciamento de requisitos de projeto com geração de ERS (Especificação de Requisitos de Software).

## Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Flask (Python) + SQLAlchemy + JWT
- **Banco de dados:** SQLite (desenvolvimento) / PostgreSQL (produção)

## Pré-requisitos

- **Node.js** 18+ e npm
- **Python** 3.11+ (recomendado: 3.12)

## Como rodar

### 1. Backend

```bash
# Entre na pasta do backend
cd backend

# Crie um ambiente virtual
python -m venv venv

# Ative o ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente (o .env já vem pre-configurado para dev)
# Se necessário, copie o .env de exemplo:
# cp .env.example .env

# Rode o servidor                                                                                                           
python run.py
``` 

O backend roda em `http://localhost:5000`.

### 2. Frontend

```bash
# Na raiz do projeto, instale as dependências
npm install

# Rode o servidor de desenvolvimento
npm run dev
```

O frontend roda em `http://localhost:5173` e já possui proxy configurado para `/api` apontando para o backend na porta 5000.

### 3. Acesse

Abra `http://localhost:5173` no navegador.

## Rotas da aplicação

| Rota | Página |
|------|--------|
| `/` | Login |
| `/cadastro` | Cadastro de usuário |
| `/projetos` | Lista de projetos (protegida) |

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
│   │   ├── __init__.py        # Factory do Flask (create_app)
│   │   ├── config.py          # Configurações (dev/prod)
│   │   ├── models/            # Modelos SQLAlchemy
│   │   ├── routes/            # Blueprints da API
│   │   ├── schemas/           # Schemas Marshmallow
│   │   └── utils/             # Decorators e utilitários
│   ├── instance/              # Banco SQLite
│   ├── requirements.txt
│   ├── run.py                 # Entry point do servidor
│   └── .env                   # Variáveis de ambiente
├── src/
│   ├── pages/                 # Páginas React
│   ├── components/            # Componentes reutilizáveis
│   ├── contexts/              # Contextos (AuthContext)
│   ├── services/              # Cliente API (api.ts)
│   ├── App.tsx                # Rotas da aplicação
│   └── main.tsx               # Entry point React
├── package.json
├── vite.config.ts
└── tsconfig.json
```
