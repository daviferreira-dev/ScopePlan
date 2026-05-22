import scopeplanLogo from "../../assets/scopeplan.png";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { requirementsApi } from "../../services/api";
import type { RequirementData, ProjectData } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import DownloadERS from "./DownloadERS";
import ValidacaoRequisitos from "./ValidacaoRequisitos";
import Auditoria from "./Auditoria";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green-deep: #0d3320;
    --green-mid: #1a6634;
    --green-bright: #22883f;
    --green-light: #34c45a;
    --green-muted: #4a9e63;
    --sidebar-bg: #0f3d22;
    --card-border: rgba(34,136,63,0.10);
    --text-primary: #0d2016;
    --text-muted: #7a9882;
    --text-sidebar: rgba(255,255,255,0.6);
    --progress-bg: #e6f5eb;
    --surface: #f7faf8;
    --surface-2: #eef5f0;
  }

  html, body {
    height: 100%; width: 100%; margin: 0; padding: 0;
    font-family: 'Sora', sans-serif;
    background: var(--surface); color: var(--text-primary); overflow: hidden;
  }

  #root { height: 100%; width: 100%; }

  .layout {
    display: flex; width: 100vw; height: 100vh;
    overflow: hidden; position: fixed; top: 0; left: 0;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 230px; min-width: 230px;
    background: var(--sidebar-bg); display: flex; flex-direction: column;
    flex-shrink: 0; position: relative; z-index: 20; overflow: hidden;
  }

  .sidebar::before {
    content: ''; position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 0;
  }

  .sidebar > * { position: relative; z-index: 1; }

  .sidebar::after {
    content: ''; position: absolute; top: 0; right: 0; bottom: 0; width: 1px;
    background: linear-gradient(180deg, transparent, rgba(52,196,90,0.25) 40%, rgba(52,196,90,0.1) 80%, transparent);
    z-index: 2;
  }

  .sidebar-logo { padding: 28px 22px 22px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .sidebar-logo img { width: 140px; filter: brightness(0) invert(1); opacity: 0.9; }

  .sidebar-nav {
    flex: 1; padding: 16px 12px; display: flex; flex-direction: column;
    gap: 3px; overflow-y: auto;
  }

  .nav-label {
    font-size: 8.5px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; color: rgba(255,255,255,0.2); padding: 10px 8px 8px;
  }

  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    border-radius: 10px; cursor: pointer; color: var(--text-sidebar);
    font-size: 13px; font-weight: 500; transition: background 0.18s, color 0.18s;
    border: none; background: none; width: 100%; text-align: left; position: relative;
    font-family: 'Sora', sans-serif;
    -webkit-tap-highlight-color: transparent;
  }

  .nav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }
  .nav-item.active { background: rgba(52,196,90,0.15); color: #5fdb7f; font-weight: 600; }
  .nav-item.active::before {
    content: ''; position: absolute; left: 0; top: 25%; bottom: 25%;
    width: 3px; border-radius: 0 3px 3px 0; background: var(--green-light);
  }

  .nav-item svg { flex-shrink: 0; opacity: 0.8; }
  .nav-item.active svg { opacity: 1; }

  .sidebar-user {
    margin: 12px; padding: 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.04); border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.06);
  }

  .user-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, var(--green-bright), var(--green-light));
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(52,196,90,0.35);
  }

  .user-info { flex: 1; overflow: hidden; min-width: 0; }
  .user-name { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-role { font-size: 10px; color: rgba(255,255,255,0.35); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }

  .btn-logout {
    background: none; border: none; color: rgba(255,255,255,0.25); cursor: pointer;
    padding: 5px; border-radius: 7px; transition: color 0.2s, background 0.2s;
    display: flex; align-items: center; flex-shrink: 0;
  }
  .btn-logout:hover { color: #ff8080; background: rgba(255,80,80,0.12); }

  /* ── MAIN ── */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--surface); min-width: 0; }

  /* ── TOPBAR ── */
  .topbar {
    background: #fff; border-bottom: 1px solid var(--card-border);
    padding: 0 36px; flex-shrink: 0;
    display: flex; flex-direction: column; justify-content: center;
  }

  .topbar-back {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 500; color: var(--text-muted);
    cursor: pointer; background: none; border: none;
    padding: 16px 0 8px; font-family: 'Sora', sans-serif;
    transition: color 0.18s; width: fit-content;
  }
  .topbar-back:hover { color: var(--green-mid); }

  .topbar-bottom {
    display: flex; align-items: flex-end; justify-content: space-between;
    padding-bottom: 18px; gap: 16px;
  }

  .topbar-index-label {
    font-size: 9px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; color: var(--green-muted); margin-bottom: 6px;
  }

  .topbar-project-name {
    font-family: 'Playfair Display', serif; font-size: 26px;
    font-weight: 900; color: var(--green-mid); line-height: 1.1;
    margin-bottom: 4px;
  }

  .topbar-accent-line {
    width: 36px; height: 3px; border-radius: 99px;
    background: linear-gradient(90deg, var(--green-bright), var(--green-light));
    margin: 6px 0;
  }

  .topbar-client { font-size: 12.5px; color: var(--text-muted); font-weight: 400; }
  .topbar-client strong { color: var(--green-mid); font-weight: 600; }

  .topbar-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

  .btn-download {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 20px;
    background: linear-gradient(135deg, var(--green-bright), var(--green-light));
    color: #fff; border: none; border-radius: 10px;
    font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.15s;
    box-shadow: 0 4px 14px rgba(34,136,63,0.28);
    white-space: nowrap;
  }
  .btn-download:hover {
    box-shadow: 0 6px 20px rgba(34,136,63,0.38); transform: translateY(-1px);
  }

  /* ── CONTENT ── */
  .content { flex: 1; overflow-y: auto; padding: 28px 36px; }

  /* ── TOPICS GRID ── */
  .topics-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 16px; animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── TOPIC CARD ── */
  .topic-card {
    background: #fff; border: 1px solid var(--card-border);
    border-radius: 14px; padding: 22px 22px 18px;
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.18s, border-color 0.2s;
    display: flex; flex-direction: column; gap: 0;
    min-height: 110px; position: relative; overflow: hidden;
  }

  .topic-card::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 2.5px;
    background: linear-gradient(90deg, var(--green-bright), var(--green-light));
    border-radius: 14px 14px 0 0; opacity: 0;
    transition: opacity 0.2s;
  }

  .topic-card:hover {
    box-shadow: 0 8px 28px rgba(26,102,52,0.12);
    transform: translateY(-2px); border-color: rgba(52,196,90,0.22);
  }
  .topic-card:hover::before { opacity: 1; }

  .topic-card-top {
    display: flex; align-items: flex-start; gap: 12px; margin-bottom: auto;
  }

  .topic-icon {
    width: 34px; height: 34px; border-radius: 9px;
    background: var(--progress-bg);
    display: flex; align-items: center; justify-content: center;
    color: var(--green-mid); flex-shrink: 0;
  }

  .topic-name {
    font-size: 14px; font-weight: 600;
    color: var(--text-primary); line-height: 1.35; padding-top: 7px;
    font-family: 'Sora', sans-serif;
  }

  .topic-count {
    font-size: 11.5px; color: var(--text-muted);
    margin-top: 14px; font-weight: 500;
    letter-spacing: 0.2px;
  }

  /* ── EMPTY / LOADING STATES ── */
  .empty-state {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 14px; padding: 80px 20px;
    text-align: center; animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }

  .empty-icon {
    width: 64px; height: 64px; border-radius: 18px;
    background: var(--progress-bg);
    display: flex; align-items: center; justify-content: center;
    color: var(--green-muted); margin-bottom: 6px;
  }

  .empty-title {
    font-family: 'Playfair Display', serif; font-size: 21px;
    font-weight: 700; color: var(--text-primary);
  }

  .empty-subtitle {
    font-size: 13.5px; color: var(--text-muted);
    max-width: 320px; line-height: 1.65;
  }

  /* ── HAMBURGER / MOBILE OVERLAY ── */
  .hamburger-btn {
    display: none; background: none; border: none; color: var(--text-primary);
    cursor: pointer; padding: 8px; border-radius: 8px;
    -webkit-tap-highlight-color: transparent;
  }
  .hamburger-btn:hover { background: rgba(0,0,0,0.05); }
  .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 15; }

  @media (max-width: 768px) {
    .hamburger-btn { display: flex; align-items: center; }
    .sidebar-overlay.active { display: block; }
    .sidebar {
      position: fixed; top: 0; left: -260px; height: 100vh; z-index: 20;
      transition: left 0.25s cubic-bezier(0.22,1,0.36,1); box-shadow: none;
    }
    .sidebar.open { left: 0; box-shadow: 4px 0 24px rgba(0,0,0,0.18); }
    .main { width: 100vw; }
    .topbar { padding: 0 16px; }
    .content { padding: 16px; }
    .topics-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important; gap: 14px; }
    .topic-card { padding: 16px 14px; }
  }

  @media (max-width: 480px) {
    .topics-grid { grid-template-columns: 1fr !important; }
    .topbar-bottom { flex-wrap: wrap; }
    .topbar-actions { width: 100%; justify-content: flex-end; }
    .topic-card { padding: 14px 12px; }
  }
`;

interface Topic {
  id: number;
  name: string;
  count: number;
  type: string;
}

interface Props {
  project: ProjectData;
  onBack: () => void;
}

const BASE_TOPICS: Omit<Topic, "count">[] = [
  { id: 1, name: "Requisitos Funcionais",     type: "funcional"    },
  { id: 2, name: "Regras de Negócio",          type: "negocio"      },
  { id: 3, name: "Requisitos Não-Funcionais",  type: "nao_funcional"},
  { id: 4, name: "Restrições",                 type: "restricao"    },
];

export default function Tela_Itens({ project, onBack }: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [requirements, setRequirements] = useState<RequirementData[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [activeTopic, setActiveTopic]   = useState<Topic | null>(null);
  const [activePage, setActivePage]     = useState<"projetos" | "auditoria">("projetos");
  const [showDownload, setShowDownload] = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  useEffect(() => { fetchRequirements(); }, [project.id]);

  async function fetchRequirements() {
    try {
      setLoading(true); setError(null);
      const response = await requirementsApi.list(project.id);
      setRequirements(response.requisitos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar requisitos");
    } finally {
      setLoading(false);
    }
  }

  const topicsWithCount: Topic[] = BASE_TOPICS.map((t) => ({
    ...t,
    count: requirements.filter((r) => r.tipo === t.type).length,
  }));

  const handleLogout = async () => { await logout(); navigate("/"); };

  const getUserInitials = () => {
    if (!user?.nome) return "AN";
    return user.nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const getUserRole = () => {
    if (user?.perfil === "analista") return "Analista de Sistemas";
    return user?.perfil || "";
  };

  if (showDownload) {
    return (
      <DownloadERS
        project={project}
        requirements={requirements}
        onBack={() => setShowDownload(false)}
      />
    );
  }

  if (activeTopic) {
    return (
      <ValidacaoRequisitos
        project={project}
        topic={{
          id: activeTopic.id,
          name: activeTopic.name,
          type: activeTopic.type,
          requirements: requirements.filter((r) => r.tipo === activeTopic.type),
        }}
        onBack={() => setActiveTopic(null)}
      />
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="layout">
        {/* Mobile overlay */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* ── SIDEBAR ── */}
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
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M9 12l2 2 4-4" />
                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
              Auditoria
            </button>
          </nav>

          <div className="sidebar-user">
            <div className="user-avatar">{getUserInitials()}</div>
            <div className="user-info">
              <div className="user-name">{user?.nome || "Analista"}</div>
              <div className="user-role">{getUserRole()}</div>
            </div>
            <button
              className="btn-logout"
              onClick={() => { setSidebarOpen(false); handleLogout(); }}
              title="Encerrar sessão"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </aside>

        {/* ── AUDITORIA PAGE ── */}
        {activePage === "auditoria" ? (
          <div className="main">
            <header className="topbar">
              <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
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
                  <div className="topbar-project-name">{project.nome}</div>
                  <div className="topbar-accent-line" />
                </div>
              </div>
            </header>
            <div className="content">
              <Auditoria />
            </div>
          </div>
        ) : (
          /* ── PROJETOS / TOPICS PAGE ── */
          <div className="main">
            <header className="topbar">
              <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <button className="topbar-back" onClick={onBack}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Voltar para Projetos
              </button>
              <div className="topbar-bottom">
                <div>
                  <div className="topbar-index-label">Índice de Especificação</div>
                  <div className="topbar-project-name">{project.nome}</div>
                  <div className="topbar-accent-line" />
                  <div className="topbar-client">
                    <strong>Cliente:</strong> {project.nome_cliente || "Sem cliente"}
                  </div>
                </div>
                <div className="topbar-actions">
                  <button className="btn-download" onClick={() => setShowDownload(true)}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Baixar ERS
                  </button>
                </div>
              </div>
            </header>

            <div className="content">
              {loading ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="empty-title">Carregando requisitos...</div>
                </div>
              ) : error ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="empty-title">Erro ao carregar requisitos</div>
                  <div className="empty-subtitle">{error}</div>
                </div>
              ) : (
                <div className="topics-grid">
                  {topicsWithCount.map((t) => (
                    <div className="topic-card" key={t.id} onClick={() => setActiveTopic(t)}>
                      <div className="topic-card-top">
                        <div className="topic-icon">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                        </div>
                        <div className="topic-name">{t.name}</div>
                      </div>
                      <div className="topic-count">
                        {t.count === 0
                          ? "0 requisitos"
                          : t.count === 1
                          ? "1 requisito"
                          : `${t.count} requisitos`}
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