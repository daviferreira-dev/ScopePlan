#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

VENV="$(pwd)/.venv-prod"

echo "==> Python do sistema: $(python --version)"

# Cria venv proprio isolado do ambiente gerenciado pelo Render
if [ ! -f "$VENV/bin/python" ]; then
    echo "==> Criando virtualenv isolado em $VENV ..."
    python -m venv "$VENV"
fi

echo "==> Instalando dependencias no venv isolado..."
"$VENV/bin/pip" install -r requirements.txt

echo "==> Verificando imports criticos..."
"$VENV/bin/python" -c "import flask_socketio, eventlet, cryptography, psycopg2; print('Todos os modulos OK')"

echo "==> Rodando migrations..."
"$VENV/bin/python" migrate.py

echo "==> Iniciando servidor na porta ${PORT:-5000}..."
exec "$VENV/bin/gunicorn" \
  --worker-class eventlet \
  -w 1 \
  --bind "0.0.0.0:${PORT:-5000}" \
  --timeout 120 \
  --log-level info \
  run:app
