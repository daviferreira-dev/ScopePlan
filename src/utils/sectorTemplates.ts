export interface TemplateRequirement {
  tipo: 'funcional' | 'nao_funcional' | 'negocio' | 'restricao';
  titulo: string;
  descricao: string;
}

export interface SectorTemplate {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  summary: string;
  requirements: TemplateRequirement[];
}

export const SECTOR_TEMPLATES: SectorTemplate[] = [
  {
    id: 'farmaceutico',
    label: 'Farmacêutico',
    emoji: '🧪',
    color: '#7c3aed',
    bg: '#f5f3ff',
    summary: 'FDA 21 CFR Part 11, GAMP 5, CoA, OOS',
    requirements: [
      {
        tipo: 'funcional',
        titulo: 'Gestão de amostras com rastreabilidade por lote',
        descricao: 'O sistema deve permitir o cadastro, rastreamento e controle de amostras identificadas por código de lote único, incluindo origem, responsável e data de coleta.',
      },
      {
        tipo: 'funcional',
        titulo: 'Registro de resultados analíticos por analista',
        descricao: 'O sistema deve permitir o registro de resultados analíticos vinculados ao analista responsável, ao instrumento utilizado e ao método analítico aplicado.',
      },
      {
        tipo: 'funcional',
        titulo: 'Fluxo de aprovação de resultados com dupla validação',
        descricao: 'Resultados analíticos devem passar por um fluxo de aprovação em duas etapas, exigindo a revisão e assinatura eletrônica de dois analistas distintos antes da liberação.',
      },
      {
        tipo: 'funcional',
        titulo: 'Geração de Certificado de Análise (CoA) automatizado',
        descricao: 'O sistema deve gerar automaticamente Certificados de Análise (CoA) padronizados após a aprovação dos resultados, com todos os dados rastreáveis do ensaio.',
      },
      {
        tipo: 'funcional',
        titulo: 'Controle de instrumentos analíticos e calibrações',
        descricao: 'O sistema deve registrar e controlar o histórico de calibrações, manutenções preventivas e qualificações dos instrumentos analíticos do laboratório.',
      },
      {
        tipo: 'funcional',
        titulo: 'Gestão de amostras retidas e descarte controlado',
        descricao: 'O sistema deve controlar o prazo de retenção de amostras de referência e registrar formalmente o processo de descarte, incluindo autorização e método.',
      },
      {
        tipo: 'nao_funcional',
        titulo: 'Conformidade com FDA 21 CFR Part 11',
        descricao: 'O sistema deve estar em conformidade com os requisitos do FDA 21 CFR Part 11, incluindo trilha de auditoria eletrônica imutável, assinaturas eletrônicas e controle de acesso por perfil.',
      },
      {
        tipo: 'nao_funcional',
        titulo: 'Validação de sistema conforme GAMP 5',
        descricao: 'O sistema deve ser qualificável e validável segundo a diretriz GAMP 5 da ISPE, com suporte a documentação de IQ, OQ e PQ.',
      },
      {
        tipo: 'nao_funcional',
        titulo: 'Disponibilidade mínima de 99,5% do sistema',
        descricao: 'O sistema deve garantir disponibilidade mínima de 99,5% ao mês, com janelas de manutenção programadas e comunicadas com antecedência mínima de 72 horas.',
      },
      {
        tipo: 'negocio',
        titulo: 'Resultado OOS exige abertura de investigação obrigatória',
        descricao: 'Todo resultado Fora de Especificação (OOS) deve disparar automaticamente a abertura de uma investigação laboratorial, bloqueando a liberação do lote até a conclusão.',
      },
      {
        tipo: 'negocio',
        titulo: 'Aprovação exige confirmação de dois analistas distintos',
        descricao: 'Nenhum resultado analítico pode ser aprovado pelo mesmo analista que o registrou. A segunda aprovação deve ser realizada por profissional com perfil de aprovador.',
      },
      {
        tipo: 'restricao',
        titulo: 'Trilha de auditoria imutável por mínimo 10 anos',
        descricao: 'A trilha de auditoria deve ser imutável e retida por no mínimo 10 anos, não podendo ser alterada, excluída ou sobrescrita por nenhum perfil de usuário, inclusive administradores.',
      },
      {
        tipo: 'restricao',
        titulo: 'Alterações em resultados aprovados exigem justificativa documentada',
        descricao: 'Qualquer alteração em resultado já aprovado deve exigir justificativa formal documentada, nova aprovação dupla e registro automático na trilha de auditoria.',
      },
    ],
  },

  {
    id: 'petroquimico',
    label: 'Petroquímico',
    emoji: '🏭',
    color: '#d97706',
    bg: '#fffbeb',
    summary: 'SCADA/DCS, OOS, alta disponibilidade, multi-lab',
    requirements: [
      {
        tipo: 'funcional',
        titulo: 'Monitoramento de parâmetros de processo em tempo real',
        descricao: 'O sistema deve exibir parâmetros de processo em tempo real (temperatura, pressão, vazão, composição), com limites de alerta e alarme configuráveis por ponto de monitoramento.',
      },
      {
        tipo: 'funcional',
        titulo: 'Gestão de amostras de campo com identificação por ponto de coleta',
        descricao: 'O sistema deve gerenciar amostras identificadas pelo ponto de coleta na planta, turno, operador e condições de processo no momento da coleta.',
      },
      {
        tipo: 'funcional',
        titulo: 'Alertas automáticos para parâmetros fora de especificação',
        descricao: 'O sistema deve gerar alertas automáticos (notificação no sistema e e-mail) quando qualquer parâmetro de produto ou processo ultrapassar os limites de especificação configurados.',
      },
      {
        tipo: 'funcional',
        titulo: 'Relatório de conformidade de produto por batelada',
        descricao: 'O sistema deve gerar relatórios de conformidade consolidados por batelada, indicando todos os parâmetros analisados, resultados, limites e status de aprovação.',
      },
      {
        tipo: 'funcional',
        titulo: 'Integração com sistemas de controle de processo (SCADA/DCS)',
        descricao: 'O sistema deve suportar integração bidirecional com sistemas SCADA e DCS para importação automática de dados de processo e exportação de limites de alarme.',
      },
      {
        tipo: 'funcional',
        titulo: 'Controle de calibração de instrumentos de campo',
        descricao: 'O sistema deve registrar e alertar sobre vencimentos de calibração de instrumentos de campo (analisadores online, cromatógrafos, sensores), bloqueando o uso de dados de instrumentos vencidos.',
      },
      {
        tipo: 'nao_funcional',
        titulo: 'Alta disponibilidade com uptime mínimo de 99,9%',
        descricao: 'O sistema deve garantir uptime mínimo de 99,9% ao mês, com arquitetura de alta disponibilidade e failover automático, dado o caráter contínuo das operações petroquímicas.',
      },
      {
        tipo: 'nao_funcional',
        titulo: 'Tempo de resposta para alertas críticos inferior a 30 segundos',
        descricao: 'O sistema deve processar e notificar alertas de parâmetros críticos em no máximo 30 segundos após a detecção da não conformidade.',
      },
      {
        tipo: 'nao_funcional',
        titulo: 'Suporte a operação simultânea de múltiplos laboratórios',
        descricao: 'O sistema deve suportar operação simultânea de múltiplas unidades laboratoriais da mesma planta ou de plantas distintas, com isolamento de dados por unidade e visão consolidada gerencial.',
      },
      {
        tipo: 'negocio',
        titulo: 'OOS exige investigação e re-análise antes de decisão de produto',
        descricao: 'Resultado Fora de Especificação (OOS) em qualquer parâmetro de produto obriga abertura de investigação formal e re-análise antes de qualquer decisão de liberação, reprocessamento ou descarte.',
      },
      {
        tipo: 'negocio',
        titulo: 'Produto retido até aprovação de todos os testes críticos',
        descricao: 'Nenhum lote de produto pode ser liberado para expedição enquanto houver resultado pendente, em análise ou reprovado em qualquer parâmetro classificado como crítico na especificação do produto.',
      },
      {
        tipo: 'restricao',
        titulo: 'Retenção de dados históricos por no mínimo 5 anos',
        descricao: 'Todos os dados analíticos, logs de processo e registros de auditoria devem ser retidos por no mínimo 5 anos, em conformidade com regulamentações ambientais e de segurança do setor petroquímico.',
      },
      {
        tipo: 'restricao',
        titulo: 'Integração via API REST com sistemas corporativos',
        descricao: 'A integração com sistemas ERP, LIMS legado e plataformas corporativas deve ser realizada exclusivamente via API REST documentada, com autenticação OAuth 2.0 e rate limiting.',
      },
    ],
  },

  {
    id: 'alimenticio',
    label: 'Alimentício',
    emoji: '🌾',
    color: '#16a34a',
    bg: '#f0fdf4',
    summary: 'FSMA, ISO 22000, APPCC, rastreabilidade bidirecional',
    requirements: [
      {
        tipo: 'funcional',
        titulo: 'Rastreabilidade bidirecional de lotes (da matéria-prima ao produto acabado)',
        descricao: 'O sistema deve garantir rastreabilidade completa e bidirecional de lotes, permitindo identificar, a partir de qualquer ponto da cadeia, todos os insumos utilizados e todos os produtos gerados (farm-to-fork).',
      },
      {
        tipo: 'funcional',
        titulo: 'Controle de validade e gestão de shelf-life de produtos',
        descricao: 'O sistema deve controlar as datas de validade de matérias-primas, produtos em processo e produtos acabados, alertando sobre vencimentos e bloqueando o uso de materiais expirados.',
      },
      {
        tipo: 'funcional',
        titulo: 'Registro de análises microbiológicas e físico-químicas',
        descricao: 'O sistema deve permitir o registro estruturado de resultados de análises microbiológicas (coliformes, salmonela, listeria etc.) e físico-químicas (pH, aw, umidade etc.) com comparação automática aos limites de especificação.',
      },
      {
        tipo: 'funcional',
        titulo: 'Gestão de não conformidades com plano de ação corretiva (CAPA)',
        descricao: 'O sistema deve registrar não conformidades detectadas, vincular planos de ação corretiva e preventiva (CAPA), acompanhar a implementação e verificar a eficácia das ações.',
      },
      {
        tipo: 'funcional',
        titulo: 'Controle de aprovação de fornecedores e matérias-primas',
        descricao: 'O sistema deve gerenciar a qualificação de fornecedores e a aprovação de matérias-primas, bloqueando o uso de insumos de fornecedores não qualificados ou com aprovação pendente.',
      },
      {
        tipo: 'funcional',
        titulo: 'Notificação automática de recall em caso de não conformidade crítica',
        descricao: 'O sistema deve gerar alertas automáticos e suportar o processo de recall de produto quando identificada não conformidade crítica de segurança alimentar, identificando todos os lotes afetados e destinos de distribuição.',
      },
      {
        tipo: 'nao_funcional',
        titulo: 'Conformidade com FSMA (FDA Food Safety Modernization Act)',
        descricao: 'O sistema deve atender aos requisitos do FSMA para registros eletrônicos de segurança alimentar, incluindo PCQI (Preventive Controls Qualified Individual) e rastreabilidade da regra de traçabilidade.',
      },
      {
        tipo: 'nao_funcional',
        titulo: 'Conformidade com ISO 22000 e APPCC/HACCP',
        descricao: 'O sistema deve suportar a documentação e o controle dos pontos críticos de controle (PCC) definidos no plano APPCC/HACCP, em conformidade com a ISO 22000.',
      },
      {
        tipo: 'nao_funcional',
        titulo: 'Interface em português com suporte a múltiplos idiomas',
        descricao: 'A interface do sistema deve estar disponível em português do Brasil como idioma padrão, com suporte a internacionalização para espanhol e inglês para operações em outros países.',
      },
      {
        tipo: 'negocio',
        titulo: 'Produto bloqueado até aprovação de resultados microbiológicos',
        descricao: 'Nenhum lote de produto alimentício pode ser liberado para distribuição enquanto houver resultado microbiológico pendente ou reprovado. O bloqueio é automático e só pode ser removido após aprovação formal.',
      },
      {
        tipo: 'negocio',
        titulo: 'Não conformidade crítica exige notificação à ANVISA em até 24h',
        descricao: 'A identificação de não conformidade crítica de segurança alimentar (contaminação microbiológica, corpo estranho, alergenização não declarada) deve gerar notificação formal à autoridade sanitária competente em até 24 horas.',
      },
      {
        tipo: 'negocio',
        titulo: 'Laudos de terceiros aceitos somente de laboratórios credenciados',
        descricao: 'O sistema deve permitir o registro de laudos de laboratórios terceirizados apenas quando o laboratório estiver cadastrado e com acreditação ISO/IEC 17025 vigente no sistema.',
      },
      {
        tipo: 'restricao',
        titulo: 'Dados de rastreabilidade mantidos por no mínimo 3 anos após validade do produto',
        descricao: 'Todos os registros de rastreabilidade devem ser mantidos por no mínimo 3 anos após a data de validade do produto ao qual se referem, conforme legislação sanitária vigente.',
      },
      {
        tipo: 'restricao',
        titulo: 'Acesso ao sistema auditável em conformidade com a LGPD',
        descricao: 'O sistema deve registrar todos os acessos a dados pessoais (colaboradores, fornecedores) e suportar requisições de titulares de dados conforme a Lei Geral de Proteção de Dados (LGPD).',
      },
    ],
  },
];
