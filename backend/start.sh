#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "==> Python: $(python --version)"
echo "==> Pip:    $(python -m pip --version)"
echo "==> Dir:    $(pwd)"

echo "==> Instalando dependencias..."
python -m pip install -r requirements.txt

echo "==> Rodando migrations..."
python migrate.py

echo "==> Iniciando servidor na porta ${PORT:-5000}..."
exec python -m gunicorn \
  --worker-class eventlet \
  -w 1 \
  --bind "0.0.0.0:${PORT:-5000}" \
  --timeout 120 \
  --log-level info \
  run:app
