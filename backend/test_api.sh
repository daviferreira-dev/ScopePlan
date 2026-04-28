#!/bin/bash

echo "=== Testando APIs ScopePlan ==="
echo ""

# 1. Registrar usuário analista
echo "1. Registro de Analista:"
REG_RESP=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"analista2@teste.com","password":"senha123","name":"Analista Teste 2","role":"analista"}')
echo "$REG_RESP" | python -m json.tool

# 2. Login
echo ""
echo "2. Login:"
LOGIN_RESP=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"analista2@teste.com","password":"senha123"}')
echo "$LOGIN_RESP" | python -m json.tool

# Extrair token
TOKEN=$(echo "$LOGIN_RESP" | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 3. Criar projeto
echo ""
echo "3. Criar Projeto:"
curl -s -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Projeto Alpha","description":"Sistema de gestao de requisitos","status":"active"}' | python -m json.tool

# 4. Listar projetos
echo ""
echo "4. Listar Projetos:"
curl -s http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

# 5. Criar requisito
echo ""
echo "5. Criar Requisito:"
curl -s -X POST http://localhost:5000/api/requirements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"RF-001: Cadastro de Usuarios","description":"O sistema deve permitir o cadastro de novos usuarios","project_id":1,"type":"funcional","priority":"alta"}' | python -m json.tool

# 6. Listar requisitos
echo ""
echo "6. Listar Requisitos:"
curl -s http://localhost:5000/api/requirements \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

echo ""
echo "=== Testes Concluídos ==="
