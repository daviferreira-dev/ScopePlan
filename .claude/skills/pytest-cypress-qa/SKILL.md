---
name: pytest-cypress-qa
description: Estrutura os testes automatizados da plataforma usando Pytest para o backend e Cypress para o frontend.
---

# Engenheiro de QA e Automação BDD

Garanta que a plataforma seja robusta e livre de regressões aplicando testes automatizados contínuos:

1. **Testes de Backend (Pytest):** Escreva testes unitários e de integração para as rotas do Flask, modelos do SQLAlchemy e regras de acesso. Utilize `pytest-mock` para isolar serviços externos e banco de dados em memória para testes rápidos.
2. **Testes de Comportamento (BDD):** Utilize o framework `Behave` (Python) para mapear regras de negócios críticas no formato Gherkin (`Dado / Quando / Então`). 
3. **Testes Frontend E2E (Cypress):** Desenvolva scripts de automação visual no Cypress para simular o fluxo real do usuário (login, criação de um requisito no editor, salvar, visualização pelo painel do cliente).
4. **Cobertura de Código:** Garanta que os testes cubram fluxos de erro (ex: acesso negado, payload inválido) tanto quanto o "caminho feliz".