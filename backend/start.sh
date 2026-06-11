#!/usr/bin/env bash
set -e

echo "==> Instalando dependencias..."
python -m pip install -r requirements.txt --quiet --no-cache-dir

echo "==> Rodando migrations..."
python migrate.py

echo "==> Iniciando servidor..."
exec python -m gunicorn --worker-class eventlet -w 1 \
  --bind "0.0.0.0:${PORT:-5000}" \
  --timeout 120 \
  run:app
