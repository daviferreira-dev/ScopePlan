---
name: project-state-analyst
description: Analisa a estrutura atual do projeto, mapeia a arquitetura React+Vite e Flask, identifica débitos técnicos e planeja os próximos passos.
---

# Analista de Estado Atual do Projeto (Codebase Auditor)

Sempre que esta skill for invocada, sua tarefa é analisar o repositório atual sem fazer alterações no código. Você deve ler a estrutura de arquivos, os arquivos de configuração (`package.json`, `vite.config.ts`, `requirements.txt`, `app.py`, etc.) e fornecer um diagnóstico claro.

### 📋 Roteiro de Análise OBRIGATÓRIO:

1. **Mapeamento da Estrutura:**
   - Liste as principais pastas do Frontend (React/Vite) e Backend (Flask).
   - Identifique como o front e o back se comunicam hoje (padrão de rotas, Axios/Fetch, chamadas de API).

2. **Auditoria Tecnológica:**
   - Verifique o arquivo `package.json` à procura de brechas ou falta de linters (ESLint, Prettier).
   - Verifique o arquivo `requirements.txt` ou `pipfile` para entender o ecossistema Python ativo.
   - Avalie se o Flask está modularizado (usando Blueprints) ou concentrado em arquivos únicos.

3. **Checklist de Prontidão (Gaps):**
   - Indique o que já está pronto e estruturado.
   - Identifique o que está faltando na estrutura atual para suportar as novas features (ex: se já existem pastas para os WebSockets, se o banco de dados já está modelado, se há suporte para TypeScript estrito).

4. **Plano de Ação:**
   - Sugira uma ordem lógica de tarefas para começarmos a implementar as próximas skills (LGPD, Edição em Tempo Real, Automação de Documentos).

### 🚨 Regra de Saída:
Apresente o resultado em um relatório direto, dividido em: `[Estrutura Atual]`, `[Pontos Críticos/Débito Técnico]` e `[Próximos Passos Recomendados]`. Não escreva códigos longos nesta fase, apenas esquemas e caminhos.