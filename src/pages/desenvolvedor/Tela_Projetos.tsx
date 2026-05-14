import scopeplanLogo from "../../assets/scopeplan.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectDetail from "./Tela_Itens";
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
 --sidebar-width: 220px;
 --topbar-height: 64px;
 --card-bg: #ffffff;
 --card-border: #e8f0ea;
 --text-primary: #1a2e1f;
 --text-muted: #7a9982;
 --text-sidebar: rgba(255,255,255,0.75);
 --accent: #2d7a40;
 --progress-bg: #e4f0e7;
 }

 html, body {
 height: 100%; width: 100%; margin: 0; padding: 0;
 font-family: 'DM Sans', sans-serif;
 background: #f4f7f5; color: var(--text-primary); overflow: hidden;
 }

 #root { height: 100%; width: 100%; margin: 0; padding: 0; }

 .layout {
 display: flex; width: 100vw; height: 100vh;
 overflow: hidden; position: fixed; top: 0; left: 0;
 }

 .sidebar {
 width: 220px; min-width: 220px;
 background: #2e7d32; display: flex; flex-direction: column;
 flex-shrink: 0; position: relative; z-index: 20;
 }

 .sidebar-logo { padding: 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
 .sidebar-logo img { width: 150px; filter: brightness(0) invert(1); opacity: 0.95; }

 .sidebar-nav {
 flex: 1; padding: 12px 8px; display: flex; flex-direction: column;
 gap: 2px; overflow-y: auto;
 }

 .nav-label {
 font-size: 8px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
 color: rgba(255,255,255,0.3); padding: 10px 8px 6px; margin-top: 4px;
 }

 .nav-item {
 display: flex; align-items: center; gap: 8px; padding: 9px 10px;
 border-radius: 8px; cursor: pointer; color: var(--text-sidebar);
 font-size: 13px; font-weight: 500; transition: background 0.18s, color 0.18s;
 border: none; background: none; width: 100%; text-align: left;
 -webkit-tap-highlight-color: transparent;
 }

 .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
 .nav-item.active { background: rgba(255,255,255,0.2); border-radius: 10px; color: #fff; font-weight: 600; }
 .nav-item svg { flex-shrink: 0; opacity: 0.8; }
 .nav-item.active svg { opacity: 1; }

 .sidebar-user {
 padding: 12px; margin: 12px;
 border-top: 1px solid rgba(255,255,255,0.08);
 display: flex; align-items: center; gap: 8px;
 background: rgba(0,0,0,0.15); border-radius: 12px;
 }

 .user-avatar {
 width: 32px; height: 32px; border-radius: 50%;
 background: var(--green-light); display: flex; align-items: center; justify-content: center;
 font-size: 11px; font-weight: 700; color: var(--green-deep); flex-shrink: 0;
 }

 .user-info { flex: 1; overflow: hidden; min-width: 0; }
 .user-name { font-size: 12px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
 .user-role { font-size: 10px; color: rgba(255,255,255,0.45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

 .btn-logout {
 background: none; border: none; color: rgba(255,255,255,0.35); cursor: pointer;
 padding: 4px; border-radius: 6px; transition: color 0.2s, background 0.2s;
 display: flex; align-items: center; flex-shrink: 0;
 }
 .btn-logout:hover { color: #ff8080; background: rgba(255,100,100,0.1); }

 .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #f1f3f2; min-width: 0; }

 .topbar {
 background: transparent; border-bottom: none; padding: 32px;
 height: auto; display: flex; flex-direction: row;
 align-items: center; justify-content: space-between; gap: 4px;
 }

 .topbar-left { display: flex; flex-direction: column; }
 .topbar-title { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 900; color: #1f2f23; }
 .topbar-subtitle { font-size: 13px; color: #6f8f79; font-weight: 400; margin-top: 4px; }

 .content { flex: 1; overflow-y: auto; padding: 0 28px 28px; }

 .empty-state {
 display: flex; flex-direction: column; align-items: center; justify-content: center;
 gap: 16px; padding: 80px 20px; text-align: center;
 animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
 }

 .empty-icon {
 width: 72px; height: 72px; border-radius: 20px;
 background: var(--progress-bg); display: flex; align-items: center; justify-content: center;
 color: var(--green-mid); margin-bottom: 8px;
 }

 .empty-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; color: var(--text-primary); }
 .empty-subtitle { font-size: 14px; color: var(--text-muted); max-width: 320px; line-height: 1.6; }

 .projects-grid {
 display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
 gap: 20px; animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
 }

 @keyframes fadeUp {
 from { opacity: 0; transform: translateY(16px); }
 to { opacity: 1; transform: translateY(0); }
 }

 .project-card {
 background: #fff; border: 1px solid var(--card-border); border-radius: 16px;
 padding: 22px 20px 18px; cursor: pointer;
 transition: box-shadow 0.2s, transform 0.18s, border-color 0.2s; position: relative;
 }
 .project-card:hover { box-shadow: 0 8px 28px rgba(45,122,64,0.12); transform: translateY(-2px); border-color: #c4dbc9; }

 .card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
 .card-icon { width: 38px; height: 38px; border-radius: 10px; background: var(--progress-bg); display: flex; align-items: center; justify-content: center; color: var(--green-mid); }
 .card-menu { background: none; border: none; cursor: pointer; color: #c4d4c8; padding: 4px; border-radius: 6px; transition: color 0.2s, background 0.2s; display: flex; }
 .card-menu:hover { color: var(--text-muted); background: #f0f4f1; }

 .card-name { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px; line-height: 1.3; }
 .card-client { font-size: 12px; color: var(--text-muted); margin-bottom: 18px; }

 .card-progress-label {
 font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;
 color: var(--text-muted); display: flex; justify-content: space-between; margin-bottom: 6px;
 }
 .progress-bar-bg { height: 5px; background: var(--progress-bg); border-radius: 99px; overflow: hidden; margin-bottom: 14px; }
 .progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--green-mid), var(--green-light)); border-radius: 99px; transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
 .card-updated { font-size: 11px; color: #b0c4b6; display: flex; align-items: center; gap: 5px; }

 .placeholder-page { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: var(--text-muted); }
 .placeholder-page svg { opacity: 0.3; }
 .placeholder-page h2 { font-family: 'Fraunces', serif; font-size: 20px; color: var(--text-primary); opacity: 0.4; }
 .placeholder-page p { font-size: 13px; opacity: 0.5; }

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
 .projects-grid { grid-template-columns: 1fr; gap: 14px; }
 .empty-state { padding: 40px 16px; }
 }

 @media (max-width: 480px) {
 .topbar-title { font-size: 18px; }
 .topbar-subtitle { font-size: 11px; }
 .project-card { padding: 16px 14px 14px; }
 .card-name { font-size: 14px; }
 }
`;

type Page = "projetos" | "auditoria";

interface Project {
  id: number;
  name: string;
  client: string;
  progress: number;
  updatedAt: string;
}

const mockUser = {
  name: "Diego Santos",
  role: "Desenvolvedor",
  initials: "DS",
};

export default function Tela_Projetos() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<Page>("projetos");
  const [projects, setProjects] = useState<Project[]>([
    { id: 1, name: "ERP Financeiro", client: "TechCorp Ltda", progress: 45, updatedAt: "12/05/2026" },
    { id: 2, name: "Portal de Vendas", client: "MegaStore S.A.", progress: 72, updatedAt: "10/05/2026" },
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleLogout = () => navigate("/");

  if (selectedProject) {
    return (
      <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} />
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
              onClick={() => { setActivePage("projetos"); setSidebarOpen(false); }}
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
              onClick={() => { setActivePage("auditoria"); setSidebarOpen(false); }}
            >
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
              onClick={() => { setSidebarOpen(false); handleLogout(); }}
              title="Encerrar sessão"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          {activePage === "projetos" && (
            <>
              <header className="topbar">
                <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
                <div className="topbar-left">
                  <div className="topbar-title">Painel de Projetos</div>
                  <div className="topbar-subtitle">Visão geral dos documentos ativos.</div>
                </div>
              </header>
              <div className="content">
                {projects.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <rect x="2" y="3" width="8" height="8" rx="2" />
                        <rect x="14" y="3" width="8" height="8" rx="2" />
                        <rect x="2" y="13" width="8" height="8" rx="2" />
                        <rect x="14" y="13" width="8" height="8" rx="2" />
                      </svg>
                    </div>
                    <div className="empty-title">Nenhum projeto disponível</div>
                    <div className="empty-subtitle">
                      Os projetos criados pelo analista aparecerão aqui para visualização.
                    </div>
                  </div>
                ) : (
                  <div className="projects-grid">
                    {projects.map((p) => (
                      <div className="project-card" key={p.id} onClick={() => setSelectedProject(p)}>
                        <div className="card-header">
                          <div className="card-icon">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                            </svg>
                          </div>
                          <button className="card-menu" onClick={(e) => e.stopPropagation()}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <circle cx="12" cy="5" r="1" fill="currentColor" />
                              <circle cx="12" cy="12" r="1" fill="currentColor" />
                              <circle cx="12" cy="19" r="1" fill="currentColor" />
                            </svg>
                          </button>
                        </div>
                        <div className="card-name">{p.name}</div>
                        <div className="card-client">{p.client}</div>
                        <div className="card-progress-label">
                          <span>Progresso da ERS</span>
                          <span>{p.progress}%</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${p.progress}%` }} />
                        </div>
                        <div className="card-updated">
                          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          Atualizado {p.updatedAt}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activePage === "auditoria" && (
            <>
              <header className="topbar">
                <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
                <div className="topbar-left">
                  <div className="topbar-title">Trilha de Auditoria</div>
                  <div className="topbar-subtitle">Registro cronológico de todas as ações realizadas nos projetos da plataforma.</div>
                </div>
              </header>
              <div className="content">
                <Auditoria />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
