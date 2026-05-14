import scopeplanLogo from "../../assets/scopeplan.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DownloadERS from "./DownloadERS";
import ValidacaoRequisitos from "./ValidacaoRequisitos";
import Auditoria from "./Auditoria";

const styles = `
 @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

 *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

 :root {
 --green-deep: #1a5c2a;
 --green-mid: #2d7a40;
 --green-bright: #3a9e52;
 --green-light: #4ebb68;
 --sidebar-bg: #1e6030;
 --card-bg: #ffffff;
 --card-border: #e8f0ea;
 --text-primary: #1a2e1f;
 --text-muted: #7a9982;
 --text-sidebar: rgba(255,255,255,0.75);
 --progress-bg: #e4f0e7;
 }

 html, body { height: 100%; width: 100%; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; background: #f4f7f5; color: var(--text-primary); overflow: hidden; }

 #root { height: 100%; width: 100%; margin: 0; padding: 0; }

 .layout { display: flex; width: 100vw; height: 100vh; overflow: hidden; position: fixed; top: 0; left: 0; }

 .sidebar { width: 220px; min-width: 220px; background: #2e7d32; display: flex; flex-direction: column; flex-shrink: 0; position: relative; z-index: 20; }

 .sidebar-logo { padding: 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
 .sidebar-logo img { width: 150px; filter: brightness(0) invert(1); opacity: 0.95; }

 .sidebar-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }

 .nav-label { font-size: 8px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.3); padding: 10px 8px 6px; }

 .nav-item { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 8px; cursor: pointer; color: var(--text-sidebar); font-size: 13px; font-weight: 500; transition: background 0.18s, color 0.18s; border: none; background: none; width: 100%; text-align: left; }

 .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
 .nav-item.active { background: rgba(255,255,255,0.2); border-radius: 10px; color: #fff; font-weight: 600; }

 .sidebar-user { padding: 12px; border-top: 1px solid rgba(255,255,255,0.08); margin: 12px; background: rgba(0,0,0,0.15); border-radius: 12px; display: flex; align-items: center; gap: 8px; }

 .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--green-light); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--green-deep); flex-shrink: 0; }

 .user-info { flex: 1; overflow: hidden; min-width: 0; }
 .user-name { font-size: 12px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
 .user-role { font-size: 10px; color: rgba(255,255,255,0.45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

 .btn-logout { background: none; border: none; color: rgba(255,255,255,0.35); cursor: pointer; padding: 4px; border-radius: 6px; transition: color 0.2s, background 0.2s; display: flex; align-items: center; flex-shrink: 0; }
 .btn-logout:hover { color: #ff8080; background: rgba(255,100,100,0.1); }

 .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #f4f7f5; min-width: 0; }

 .topbar { background: #fff; border-bottom: 1px solid var(--card-border); padding: 0 28px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; }

 .topbar-back { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); cursor: pointer; background: none; border: none; padding: 14px 0 8px; font-family: 'DM Sans', sans-serif; transition: color 0.18s; width: fit-content; }
 .topbar-back:hover { color: var(--green-mid); }

 .topbar-bottom { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 16px; gap: 16px; }

 .topbar-index-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; }

 .topbar-project-name { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; color: var(--green-mid); line-height: 1.1; margin-bottom: 4px; }

 .topbar-client { font-size: 13px; color: var(--text-muted); }
 .topbar-client strong { color: var(--green-mid); font-weight: 600; }

 .topbar-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

 .btn-download { display: flex; align-items: center; gap: 7px; padding: 10px 18px; background: var(--green-mid); color: #fff; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.18s, transform 0.12s; box-shadow: 0 4px 14px rgba(45,122,64,0.25); white-space: nowrap; }
 .btn-download:hover { background: var(--green-bright); transform: translateY(-1px); }

 .content { flex: 1; overflow-y: auto; padding: 24px 28px; }

 .topics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }

 @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

 .topic-card { background: #fff; border: 1px solid var(--card-border); border-radius: 14px; padding: 20px 20px 18px; cursor: pointer; transition: box-shadow 0.2s, transform 0.18s, border-color 0.2s; display: flex; flex-direction: column; gap: 0; min-height: 110px; position: relative; }
 .topic-card:hover { box-shadow: 0 6px 24px rgba(45,122,64,0.1); transform: translateY(-2px); border-color: #c4dbc9; }

 .topic-card-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: auto; }

 .topic-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--progress-bg); display: flex; align-items: center; justify-content: center; color: var(--green-mid); flex-shrink: 0; }

 .topic-name { font-size: 14px; font-weight: 600; color: var(--text-primary); line-height: 1.35; padding-top: 6px; }
 .topic-count { font-size: 11.5px; color: var(--text-muted); margin-top: 14px; font-weight: 400; }

 /* ── Responsive ── */
 .hamburger-btn { display: none; background: none; border: none; color: var(--text-primary); cursor: pointer; padding: 8px; border-radius: 8px; -webkit-tap-highlight-color: transparent; }
 .hamburger-btn:hover { background: rgba(0,0,0,0.05); }
 .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 15; }

 @media (max-width: 768px) {
 .hamburger-btn { display: flex; align-items: center; }
 .sidebar-overlay.active { display: block; }
 .sidebar { position: fixed; top: 0; left: -260px; height: 100vh; z-index: 20; transition: left 0.25s cubic-bezier(0.22, 1, 0.36, 1); box-shadow: none; }
 .sidebar.open { left: 0; box-shadow: 4px 0 24px rgba(0,0,0,0.18); }
 .main { width: 100vw; }
 .topbar { padding: 20px 16px; flex-wrap: wrap; gap: 8px; }
 .topbar-title { font-size: 22px; }
 .topbar-subtitle { font-size: 12px; }
 .content { padding: 0 16px 16px; }
 .topics-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important; gap: 14px; }
 .topic-card { padding: 16px 14px; }
 }

 @media (max-width: 480px) {
 .topics-grid { grid-template-columns: 1fr !important; }
 .topbar-title { font-size: 18px; }
 .topbar-bottom { flex-wrap: wrap; }
 .topbar-actions { width: 100%; justify-content: flex-end; }
 .topic-card { padding: 14px 12px; }
 }
`;

interface Requirement {
  id: string;
  status: string;
  title: string;
  description: string;
  commentsCount: number;
  modifiedBy: string;
  modifiedDate: string;
  modifiedTime: string;
}

interface FileItem {
  id: number;
  name: string;
  size: string;
  addedAt: string;
}

interface Topic {
  id: number;
  name: string;
  count: number;
  files: FileItem[];
  requirements: Requirement[];
}

interface Project {
  id: number;
  name: string;
  client: string;
}

const DEFAULT_TOPICS: Omit<Topic, "files" | "requirements">[] = [
  { id: 1, name: "Requisitos Funcionais", count: 5 },
  { id: 2, name: "Regras de Negócio", count: 2 },
  { id: 3, name: "Requisitos Não-Funcionais", count: 3 },
  { id: 4, name: "Modelagem de Dados", count: 0 },
  { id: 5, name: "Integrações de Sistema", count: 0 },
  { id: 6, name: "Glossário Técnico", count: 0 },
  { id: 7, name: "Gestão de Erros", count: 0 },
  { id: 8, name: "UI/UX e Protótipos", count: 0 },
];

const MOCK_REQUIREMENTS_RF: Requirement[] = [
  { id: "RF-001", status: "Aprovado", title: "Autenticação Múltipla", description: "O sistema deve permitir que os utilizadores iniciem sessão através de credenciais locais ou integração com Active Directory corporativo via SAML 2.0.", commentsCount: 3, modifiedBy: "ANA SILVA", modifiedDate: "12/05/2026", modifiedTime: "16:30" },
  { id: "RF-002", status: "Em Revisão", title: "Exportação de Relatórios", description: "Todos os grids de dados devem possuir uma opção para exportar a visualização atual para formatos PDF e XLSX, mantendo a ordenação e os filtros aplicados.", commentsCount: 5, modifiedBy: "CARLOS MELO", modifiedDate: "10/05/2026", modifiedTime: "08:15" },
  { id: "RF-003", status: "Pendente", title: "Dashboard Executivo", description: "A plataforma deve disponibilizar um painel executivo com KPIs configuráveis, gráficos interativos e a possibilidade de exportação para apresentações.", commentsCount: 16, modifiedBy: "ANA SILVA", modifiedDate: "08/05/2026", modifiedTime: "11:00" },
  { id: "RF-004", status: "Pendente", title: "Cadastro de Fornecedores", description: "O sistema deve permitir o cadastro completo de fornecedores com CNPJ, endereço, contatos e documentos anexos, validando a integridade dos dados informados.", commentsCount: 2, modifiedBy: "CARLOS MELO", modifiedDate: "09/05/2026", modifiedTime: "14:20" },
  { id: "RF-005", status: "Pendente", title: "Notificações em Tempo Real", description: "O sistema deve enviar notificações push e por e-mail quando ocorrerem eventos críticos como aprovações pendentes, prazos próximos ou alterações em requisitos.", commentsCount: 8, modifiedBy: "ANA SILVA", modifiedDate: "11/05/2026", modifiedTime: "09:45" },
];

const MOCK_REQUIREMENTS_RN: Requirement[] = [
  { id: "RN-001", status: "Pendente", title: "Aprovação de Requisitos", description: "Todo requisito deve ser validado pelo cliente antes de ser considerado aprovado. O cliente pode aprovar, reprovar ou enviar observações para revisão.", commentsCount: 4, modifiedBy: "ANA SILVA", modifiedDate: "07/05/2026", modifiedTime: "10:00" },
  { id: "RN-002", status: "Pendente", title: "Regra de Bloqueio de Exclusão", description: "Nenhum requisito aprovado pode ser excluído sem autorização formal do cliente e registro na trilha de auditoria.", commentsCount: 6, modifiedBy: "CARLOS MELO", modifiedDate: "06/05/2026", modifiedTime: "15:30" },
];

const MOCK_REQUIREMENTS_RNF: Requirement[] = [
  { id: "RNF-001", status: "Pendente", title: "Performance de Consultas", description: "As consultas ao banco de dados devem retornar resultados em menos de 2 segundos para volumes de até 100.000 registros.", commentsCount: 3, modifiedBy: "ANA SILVA", modifiedDate: "05/05/2026", modifiedTime: "11:15" },
  { id: "RNF-002", status: "Em Revisão", title: "Disponibilidade do Sistema", description: "O sistema deve garantir disponibilidade de 99,5% mensais, com janela de manutenção programada aos domingos das 02h às 06h.", commentsCount: 10, modifiedBy: "CARLOS MELO", modifiedDate: "04/05/2026", modifiedTime: "16:00" },
  { id: "RNF-003", status: "Pendente", title: "Compatibilidade de Navegadores", description: "A aplicação deve ser compatível com as duas últimas versões estáveis dos navegadores Chrome, Firefox, Edge e Safari.", commentsCount: 2, modifiedBy: "ANA SILVA", modifiedDate: "03/05/2026", modifiedTime: "08:30" },
];

const mockUser = {
  name: "Diego Santos",
  role: "Desenvolvedor",
  initials: "DS",
};

interface Props {
  project: Project;
  onBack: () => void;
}

export default function Tela_Itens({ project, onBack }: Props) {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>(
    DEFAULT_TOPICS.map((t) => ({
      ...t,
      files: [],
      requirements: t.id === 1 ? MOCK_REQUIREMENTS_RF : t.id === 2 ? MOCK_REQUIREMENTS_RN : t.id === 3 ? MOCK_REQUIREMENTS_RNF : [],
    })),
  );
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activePage, setActivePage] = useState<"projetos" | "auditoria">("projetos");
  const [showDownload, setShowDownload] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openTopic = (t: Topic) => {
    const fresh = topics.find((x) => x.id === t.id) || t;
    setActiveTopic(fresh);
  };

  const handleBackFromTopic = () => {
    setActiveTopic(null);
  };

  if (showDownload) {
    return (
      <DownloadERS
        project={project}
        topics={topics}
        onBack={() => setShowDownload(false)}
      />
    );
  }

  if (activeTopic) {
    return (
      <ValidacaoRequisitos
        project={project}
        topic={activeTopic}
        onBack={handleBackFromTopic}
      />
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="layout">
        {/* Mobile sidebar overlay */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <img src={scopeplanLogo} alt="ScopePlan" />
          </div>
          <nav className="sidebar-nav">
            <span className="nav-label">Menu</span>
            <button
              className={`nav-item ${activePage === "projetos" ? "active" : ""}`}
              onClick={() => { setSidebarOpen(false); setActivePage("projetos"); setActiveTopic(null); onBack(); }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="2" y="3" width="8" height="8" rx="2" />
                <rect x="14" y="3" width="8" height="8" rx="2" />
                <rect x="2" y="13" width="8" height="8" rx="2" />
                <rect x="14" y="13" width="8" height="8" rx="2" />
              </svg>
              Projetos
            </button>
            <button
              className={`nav-item ${activePage === "auditoria" ? "active" : ""}`}
              onClick={() => { setSidebarOpen(false); setActivePage("auditoria"); }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M9 12l2 2 4-4" />
                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
              Auditoria
            </button>
          </nav>
          <div className="sidebar-user">
            <div className="user-avatar">{mockUser.initials}</div>
            <div className="user-info">
              <div className="user-name">{mockUser.name}</div>
              <div className="user-role">{mockUser.role}</div>
            </div>
            <button
              className="btn-logout"
              onClick={() => { setSidebarOpen(false); navigate("/"); }}
              title="Encerrar sessão"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </aside>

        {activePage === "auditoria" ? (
          <div className="main">
            <header className="topbar">
              <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <button className="topbar-back" onClick={() => setActivePage("projetos")}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Voltar ao Projeto
              </button>
              <div className="topbar-bottom">
                <div>
                  <div className="topbar-index-label">Trilha de Auditoria</div>
                  <div className="topbar-project-name">{project.name}</div>
                </div>
              </div>
            </header>
            <div className="content">
              <Auditoria />
            </div>
          </div>
        ) : (
          <div className="main">
            <header className="topbar">
              <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <button className="topbar-back" onClick={activeTopic ? handleBackFromTopic : onBack}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                {activeTopic ? "Voltar ao Índice" : "Voltar para Projetos"}
              </button>
              <div className="topbar-bottom">
                <div>
                  <div className="topbar-index-label">{activeTopic ? activeTopic.name : "Índice de Especificação"}</div>
                  <div className="topbar-project-name">{project.name}</div>
                  <div className="topbar-client">
                    <strong>Cliente:</strong> {project.client}
                  </div>
                </div>
                {!activeTopic && (
                  <div className="topbar-actions">
                    <button className="btn-download" onClick={() => setShowDownload(true)}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                      Baixar ERS
                    </button>
                  </div>
                )}
              </div>
            </header>
            <div className="content">
              {!activeTopic && (
                <div className="topics-grid">
                  {topics.map((t) => (
                    <div className="topic-card" key={t.id} onClick={() => openTopic(t)}>
                      <div className="topic-card-top">
                        <div className="topic-icon">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                        </div>
                        <div className="topic-name">{t.name}</div>
                      </div>
                      <div className="topic-count">
                        {t.count === 0 ? "0 requisitos" : t.count === 1 ? "1 requisito" : `${t.count} requisitos`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
