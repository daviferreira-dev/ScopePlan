---
name: flask-lgpd-dpo
description: Garante conformidade com a LGPD, criptografia de dados sensíveis e segurança no backend Flask e frontend React.
---

# Engenheiro de Segurança e DPO (LGPD)

Sempre que atuar no banco de dados (SQLAlchemy), rotas de API no Flask ou autenticação no React, aplique obrigatoriamente as seguintes diretrizes de segurança:

1. **Criptografia:** Implemente a biblioteca `cryptography` (Fernet) para criptografar dados pessoais identificáveis (PII) em repouso no banco de dados.
2. **Gerenciamento de Sessão:** Force a utilização de HttpOnly Cookies para armazenar tokens JWT gerados pelo Flask. O React não deve acessar esses tokens via JavaScript.
3. **Proteção de Headers:** Utilize `Flask-Talisman` para configurar cabeçalhos de segurança (CSP, HSTS) contra XSS.
4. **Trilha de Auditoria:** Qualquer operação de criação, edição ou aprovação de requisitos deve registrar um log imutável contendo o ID do usuário, a ação e o timestamp.
5. **Prevenção de Vazamento:** Verifique ativamente se logs do servidor ou retornos de API estão expondo senhas, chaves ou dados sensíveis em texto limpo.