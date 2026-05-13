import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  .aud-filters {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 24px;
    align-items: center;
  }

  .aud-filter-select {
    padding: 9px 32px 9px 12px;
    border: 1.5px solid #dde8df;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: #1a2e1f;
    background: #fafcfa url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%237a9982'/%3E%3C/svg%3E") no-repeat right 12px center;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    min-width: 140px;
  }

  .aud-filter-select:focus {
    border-color: #2d7a40;
    box-shadow: 0 0 0 3px rgba(45,122,64,0.1);
  }

  .aud-search {
    flex: 1;
    min-width: 180px;
    padding: 9px 12px 9px 36px;
    border: 1.5px solid #dde8df;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: #1a2e1f;
    background: #fafcfa;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    position: relative;
  }

  .aud-search:focus {
    border-color: #2d7a40;
    box-shadow: 0 0 0 3px rgba(45,122,64,0.1);
    background: #fff;
  }

  .aud-search-wrap {
    position: relative;
    flex: 1;
    min-width: 180px;
  }

  .aud-search-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: #b0c4b6;
    pointer-events: none;
  }

  .aud-filter-date {
    padding: 9px 12px;
    border: 1.5px solid #dde8df;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: #1a2e1f;
    background: #fafcfa;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    min-width: 130px;
  }

  .aud-filter-date:focus {
    border-color: #2d7a40;
    box-shadow: 0 0 0 3px rgba(45,122,64,0.1);
  }

  /* ── Timeline ── */
  .aud-timeline {
    position: relative;
    padding-left: 36px;
  }

  .aud-timeline::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, #c4dbc9, #e4f0e7);
    border-radius: 2px;
  }

  .aud-event {
    position: relative;
    margin-bottom: 0;
    padding-bottom: 28px;
    animation: audFadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .aud-event:last-child {
    padding-bottom: 0;
  }

  @keyframes audFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .aud-event-dot {
    position: absolute;
    left: -36px;
    top: 18px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    border: 3px solid #f4f7f5;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .aud-event-dot svg {
    width: 14px;
    height: 14px;
  }

  .aud-event-card {
    background: #fff;
    border: 1px solid #e8f0ea;
    border-radius: 14px;
    padding: 18px 20px;
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.18s, border-color 0.2s;
  }

  .aud-event-card:hover {
    box-shadow: 0 8px 28px rgba(45,122,64,0.1);
    transform: translateY(-2px);
    border-color: #c4dbc9;
  }

  .aud-event-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  .aud-event-type {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 6px;
    letter-spacing: 0.3px;
    line-height: 1.4;
  }

  .aud-event-id {
    font-size: 12px;
    font-weight: 700;
    color: #1a5c2a;
    background: #e4f0e7;
    padding: 3px 8px;
    border-radius: 5px;
    font-family: 'DM Sans', sans-serif;
  }

  .aud-event-time {
    font-size: 11.5px;
    color: #7a9982;
    margin-left: auto;
    white-space: nowrap;
  }

  .aud-event-desc {
    font-size: 14px;
    color: #1a2e1f;
    line-height: 1.5;
    margin-bottom: 10px;
  }

  .aud-event-bottom {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .aud-event-author {
    font-size: 12px;
    color: #7a9982;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .aud-event-author strong {
    color: #1a2e1f;
    font-weight: 600;
  }

  .aud-event-project-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 6px;
    background: #f0f4f1;
    color: #2d7a40;
    letter-spacing: 0.2px;
  }

  /* ── Detail Modal ── */
  .aud-detail-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 16px;
  }

  .aud-detail-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: #7a9982;
  }

  .aud-detail-value {
    font-size: 14px;
    color: #1a2e1f;
    line-height: 1.5;
  }

  .aud-detail-type {
    display: inline-block;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 7px;
  }

  /* ── Empty state ── */
  .aud-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 60px 20px;
    text-align: center;
  }

  .aud-empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: #e4f0e7;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2d7a40;
  }

  .aud-empty-title {
    font-family: 'Fraunces', serif;
    font-size: 18px;
    font-weight: 700;
    color: #1a2e1f;
  }

  .aud-empty-sub {
    font-size: 13px;
    color: #7a9982;
    max-width: 280px;
    line-height: 1.6;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .aud-filters {
      gap: 8px;
    }
    .aud-filter-select {
      min-width: 110px;
      font-size: 12px;
    }
    .aud-search-wrap {
      min-width: 120px;
      flex: 1 1 100%;
    }
    .aud-event-card {
      padding: 14px 16px;
    }
    .aud-event-top {
      gap: 6px;
    }
    .aud-event-time {
      margin-left: 0;
      width: 100%;
    }
    .aud-timeline {
      padding-left: 30px;
    }
    .aud-timeline::before {
      left: 12px;
    }
    .aud-event-dot {
      left: -30px;
      width: 26px;
      height: 26px;
    }
  }

  @media (max-width: 480px) {
    .aud-filters {
      flex-direction: column;
    }
    .aud-filter-select,
    .aud-filter-date {
      width: 100%;
    }
    .aud-search-wrap {
      width: 100%;
    }
  }
`;

/* ── Types ── */
type ActionType =
  | "criacao"
  | "edicao"
  | "aprovacao"
  | "reprovacao"
  | "comentario"
  | "anexo"
  | "autenticacao"
  | "permissao"
  | "exclusao"
  | "status";

interface AuditEvent {
  id: number;
  type: ActionType;
  typeLabel: string;
  itemId: string;
  description: string;
  author: string;
  project: string;
  date: string;
  time: string;
  detail?: string;
}

/* ── Color mapping ── */
const TYPE_COLORS: Record<ActionType, { bg: string; text: string; dot: string }> = {
  criacao:     { bg: "#e6f9ec", text: "#1a8a3a", dot: "#2ecc5e" },
  edicao:      { bg: "#f0e8fc", text: "#7c3aed", dot: "#9b6dff" },
  aprovacao:   { bg: "#e0f8e8", text: "#27ae60", dot: "#4ebb68" },
  reprovacao:  { bg: "#fde8ea", text: "#d63031", dot: "#ff4757" },
  comentario:  { bg: "#e8f4fd", text: "#2d7da8", dot: "#5ba3d9" },
  anexo:       { bg: "#e4f0fb", text: "#2b6cb0", dot: "#4a90d9" },
  autenticacao:{ bg: "#f0f2f5", text: "#6b7280", dot: "#9ca3af" },
  permissao:   { bg: "#fef3e2", text: "#b7791f", dot: "#e6a817" },
  exclusao:    { bg: "#fce4e4", text: "#8b1a1a", dot: "#c0392b" },
  status:      { bg: "#e8f4fd", text: "#2d7da8", dot: "#5ba3d9" },
};

/* ── Icons ── */
const TYPE_ICONS: Record<ActionType, JSX.Element> = {
  criacao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  edicao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  aprovacao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  reprovacao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path d="M18 6L6 18M6 6l12 12" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  comentario: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  anexo: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  autenticacao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  permissao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  exclusao: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  status: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
};

/* ── Mock data ── */
const MOCK_EVENTS: AuditEvent[] = [
  {
    id: 1,
    type: "criacao",
    typeLabel: "Requisito Criado",
    itemId: "RF-002",
    description: "RF-002 \"Exportação de Relatórios\" foi criado e adicionado ao projeto Sistema ERP Integrado.",
    author: "Ana Silva",
    project: "Sistema ERP Integrado",
    date: "HOJE",
    time: "09:15",
    detail: "O requisito funcional RF-002 foi criado com a descrição completa sobre exportação de dados em PDF e XLSX. Prioridade definida como Alta.",
  },
  {
    id: 2,
    type: "edicao",
    typeLabel: "Requisito Editado",
    itemId: "RF-002",
    description: "RF-002 teve sua descrição alterada para incluir suporte ao formato CSV além de PDF e XLSX.",
    author: "Carlos Melo",
    project: "Sistema ERP Integrado",
    date: "HOJE",
    time: "08:42",
    detail: "Campo 'description' atualizado. Adicionado formato CSV como opção de exportação. Justificativa: solicitação do cliente em reunião de alinhamento.",
  },
  {
    id: 3,
    type: "aprovacao",
    typeLabel: "Requisito Aprovado",
    itemId: "RF-001",
    description: "RF-001 \"Autenticação Múltipla\" foi aprovado pelo validador do cliente.",
    author: "Bruno Costa",
    project: "Sistema ERP Integrado",
    date: "ONTEM",
    time: "17:30",
    detail: "Requisito aprovado sem restrições. Comentário do validador: \"Conforme esperado, sem ajustes necessários.\"",
  },
  {
    id: 4,
    type: "reprovacao",
    typeLabel: "Requisito Reprovado",
    itemId: "RN-001",
    description: "RN-001 \"Validação de CPF\" foi reprovado pelo cliente por não atender à regra de negócio.",
    author: "Bruno Costa",
    project: "Portal Financeiro",
    date: "ONTEM",
    time: "16:05",
    detail: "Motivo da reprovação: a regra não contempla CPFs de empresas (CNPJ base). Solicitado ajuste para aceitar ambos os documentos.",
  },
  {
    id: 5,
    type: "comentario",
    typeLabel: "Comentário Adicionado",
    itemId: "RF-003",
    description: "Novo comentário adicionado ao requisito RF-003 sobre necessidade de filtros avançados.",
    author: "Ana Silva",
    project: "App Mobile Cliente",
    date: "ONTEM",
    time: "14:22",
    detail: "Comentário: \"Precisamos incluir filtros por período e categoria no Dashboard. Isso é essencial para a versão mobile.\"",
  },
  {
    id: 6,
    type: "anexo",
    typeLabel: "Documento Anexado",
    itemId: "DOC-003",
    description: "Documento técnico \"Diagrama de Classes v2\" anexado ao projeto Controle de Estoque.",
    author: "Carlos Melo",
    project: "Controle de Estoque",
    date: "20/03/2026",
    time: "14:08",
    detail: "Arquivo: diagrama_classes_v2.pdf (2.4 MB). Substitui a versão anterior que continha inconsistências na relação Produto-Fornecedor.",
  },
  {
    id: 7,
    type: "autenticacao",
    typeLabel: "Usuário Autenticado",
    itemId: "—",
    description: "Bruno Costa realizou login na plataforma às 10:45.",
    author: "Bruno Costa",
    project: "Sistema ERP Integrado",
    date: "20/03/2026",
    time: "10:45",
    detail: "Login realizado com sucesso via integração SAML 2.0 (Active Directory corporativo). IP: 192.168.1.42",
  },
  {
    id: 8,
    type: "permissao",
    typeLabel: "Permissão Alterada",
    itemId: "—",
    description: "Permissão de Ana Silva alterada de \"Visualizador\" para \"Editor\" no projeto Portal Financeiro.",
    author: "Sistema",
    project: "Portal Financeiro",
    date: "19/03/2026",
    time: "09:30",
    detail: "Alteração realizada automaticamente pela política de governança. Motivo: atribuição de novo papel no LDAP corporativo.",
  },
  {
    id: 9,
    type: "exclusao",
    typeLabel: "Exclusão Realizada",
    itemId: "RNF-005",
    description: "RNF-005 \"Suporte a IE11\" foi removido do projeto App Mobile Cliente.",
    author: "Ana Silva",
    project: "App Mobile Cliente",
    date: "19/03/2026",
    time: "08:15",
    detail: "Requisito excluído por decisão do comitê técnico. Justificativa: descontinuidade do navegador IE11 pela Microsoft. Substituído por RNF-012.",
  },
  {
    id: 10,
    type: "status",
    typeLabel: "Status Atualizado",
    itemId: "RF-003",
    description: "RF-003 \"Dashboard Executivo\" teve seu status alterado de \"Pendente\" para \"Em Revisão\".",
    author: "Carlos Melo",
    project: "Controle de Estoque",
    date: "18/03/2026",
    time: "15:40",
    detail: "Transição de status: Pendente → Em Revisão. Motivo: todas as informações complementares foram preenchidas pelo analista responsável.",
  },
];

const ALL_PROJECTS = [
  "Todos os Projetos",
  "Sistema ERP Integrado",
  "Portal Financeiro",
  "App Mobile Cliente",
  "Controle de Estoque",
];

const ALL_TYPES = [
  "Todos os Tipos",
  "Requisito Criado",
  "Requisito Editado",
  "Requisito Aprovado",
  "Requisito Reprovado",
  "Comentário Adicionado",
  "Documento Anexado",
  "Usuário Autenticado",
  "Permissão Alterada",
  "Exclusão Realizada",
  "Status Atualizado",
];

const ALL_USERS = [
  "Todos os Usuários",
  "Ana Silva",
  "Bruno Costa",
  "Carlos Melo",
  "Sistema",
];

interface Props {
  onBack?: () => void;
}

export default function Auditoria({ onBack }: Props) {
  const [filterProject, setFilterProject] = useState("Todos os Projetos");
  const [filterType, setFilterType] = useState("Todos os Tipos");
  const [filterUser, setFilterUser] = useState("Todos os Usuários");
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const filtered = MOCK_EVENTS.filter((ev) => {
    if (filterProject !== "Todos os Projetos" && ev.project !== filterProject) return false;
    if (filterType !== "Todos os Tipos" && ev.typeLabel !== filterType) return false;
    if (filterUser !== "Todos os Usuários" && ev.author !== filterUser) return false;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const match =
        ev.itemId.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.typeLabel.toLowerCase().includes(q) ||
        ev.author.toLowerCase().includes(q) ||
        ev.project.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const formatTimeLabel = (time: string, date: string) => {
    return `${time} \u2022 ${date}`;
  };

  return (
    <>
      <style>{styles}</style>

      {/* Filters */}
      <div className="aud-filters">
        <select
          className="aud-filter-select"
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
        >
          {ALL_PROJECTS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          className="aud-filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          className="aud-filter-select"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
        >
          {ALL_USERS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        <input
          type="date"
          className="aud-filter-date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="De"
          title="Data inicial"
        />
        <input
          type="date"
          className="aud-filter-date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="Até"
          title="Data final"
        />

        <div className="aud-search-wrap">
          <span className="aud-search-icon">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            className="aud-search"
            placeholder="Buscar por requisito, documento ou descrição..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="aud-empty">
          <div className="aud-empty-icon">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <div className="aud-empty-title">Nenhum evento encontrado</div>
          <div className="aud-empty-sub">
            Tente ajustar os filtros ou a busca para encontrar registros de auditoria.
          </div>
        </div>
      ) : (
        <div className="aud-timeline">
          {filtered.map((ev, i) => {
            const colors = TYPE_COLORS[ev.type];
            return (
              <div
                className="aud-event"
                key={ev.id}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div
                  className="aud-event-dot"
                  style={{ background: colors.dot, color: "#fff" }}
                >
                  {TYPE_ICONS[ev.type]}
                </div>

                <div className="aud-event-card" onClick={() => setSelectedEvent(ev)}>
                  <div className="aud-event-top">
                    <span
                      className="aud-event-type"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {ev.typeLabel}
                    </span>
                    <span className="aud-event-id">{ev.itemId}</span>
                    <span className="aud-event-time">
                      {formatTimeLabel(ev.time, ev.date)}
                    </span>
                  </div>

                  <div className="aud-event-desc">{ev.description}</div>

                  <div className="aud-event-bottom">
                    <span className="aud-event-author">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <strong>{ev.author}</strong>
                    </span>
                    <span className="aud-event-project-badge">{ev.project}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEvent && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setSelectedEvent(null)}
        >
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-title">Detalhes do Evento</div>
            <div className="modal-subtitle">Informações completas da ação registrada.</div>

            <div className="aud-detail-row">
              <span className="aud-detail-label">Tipo da Ação</span>
              <span
                className="aud-detail-type"
                style={{
                  background: TYPE_COLORS[selectedEvent.type].bg,
                  color: TYPE_COLORS[selectedEvent.type].text,
                }}
              >
                {selectedEvent.typeLabel}
              </span>
            </div>

            <div className="aud-detail-row">
              <span className="aud-detail-label">Identificador</span>
              <span className="aud-detail-value">
                <strong>{selectedEvent.itemId}</strong>
              </span>
            </div>

            <div className="aud-detail-row">
              <span className="aud-detail-label">Descrição</span>
              <span className="aud-detail-value">{selectedEvent.description}</span>
            </div>

            {selectedEvent.detail && (
              <div className="aud-detail-row">
                <span className="aud-detail-label">Detalhamento</span>
                <span className="aud-detail-value">{selectedEvent.detail}</span>
              </div>
            )}

            <div className="aud-detail-row">
              <span className="aud-detail-label">Autor</span>
              <span className="aud-detail-value">{selectedEvent.author}</span>
            </div>

            <div className="aud-detail-row">
              <span className="aud-detail-label">Projeto</span>
              <span className="aud-detail-value">{selectedEvent.project}</span>
            </div>

            <div className="aud-detail-row">
              <span className="aud-detail-label">Data e Horário</span>
              <span className="aud-detail-value">
                {selectedEvent.time} &bull; {selectedEvent.date}
              </span>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setSelectedEvent(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
