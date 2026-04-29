import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectDetail from "./Tela_Itens"; // ← importa a tela de itens
 
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
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    font-family: 'DM Sans', sans-serif;
    background: #f4f7f5;
    color: var(--text-primary);
    overflow: hidden;
  }
 
  #root {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
  }
 
  .layout {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
  }
 
  .sidebar {
    width: 220px;
    min-width: 220px;
    background: #2e7d32;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: relative;
    z-index: 20;
  }
 
  .sidebar-logo {
    padding: 24px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
 
  .sidebar-logo img {
    width: 150px;
    filter: brightness(0) invert(1);
    opacity: 0.95;
  }
 
  .sidebar-nav {
    flex: 1;
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
  }
 
  .nav-label {
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    padding: 10px 8px 6px;
    margin-top: 4px;
  }
 
  .nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 10px;
    border-radius: 8px;
    cursor: pointer;
    color: var(--text-sidebar);
    font-size: 13px;
    font-weight: 500;
    transition: background 0.18s, color 0.18s;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    -webkit-tap-highlight-color: transparent;
  }
 
  .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
 
  .nav-item.active {
    background: rgba(255,255,255,0.2);
    border-radius: 10px;
    color: #fff;
    font-weight: 600;
  }
 
  .nav-item svg { flex-shrink: 0; opacity: 0.8; }
  .nav-item.active svg { opacity: 1; }
 
  .sidebar-user {
    padding: 12px;
    margin: 12px;
    border-top: 1px solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0,0,0,0.15);
    border-radius: 12px;
  }
 
  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--green-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--green-deep);
    flex-shrink: 0;
  }
 
  .user-info { flex: 1; overflow: hidden; min-width: 0; }
 
  .user-name {
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
 
  .user-role {
    font-size: 10px;
    color: rgba(255,255,255,0.45);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
 
  .btn-logout {
    background: none;
    border: none;
    color: rgba(255,255,255,0.35);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: color 0.2s, background 0.2s;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
 
  .btn-logout:hover { color: #ff8080; background: rgba(255,100,100,0.1); }
 
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #f1f3f2;
    min-width: 0;
  }
 
  .topbar {
    background: transparent;
    border-bottom: none;
    padding: 32px;
    height: auto;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }
 
  .topbar-left { display: flex; flex-direction: column; }
 
  .topbar-title {
    font-family: 'Fraunces', serif;
    font-size: 28px;
    font-weight: 900;
    color: #1f2f23;
  }
 
  .topbar-subtitle {
    font-size: 13px;
    color: #6f8f79;
    font-weight: 400;
    margin-top: 4px;
  }
 
  .btn-new-project {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 18px;
    background: #2e7d32;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
    box-shadow: 0 6px 16px rgba(46,125,50,0.25);
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
  }
 
  .btn-new-project:hover {
    background: var(--green-bright);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(45,122,64,0.35);
  }
 
  .content {
    flex: 1;
    overflow-y: auto;
    padding: 0 28px 28px;
  }
 
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 80px 20px;
    text-align: center;
    animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
 
  .empty-icon {
    width: 72px;
    height: 72px;
    border-radius: 20px;
    background: var(--progress-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--green-mid);
    margin-bottom: 8px;
  }
 
  .empty-title {
    font-family: 'Fraunces', serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
  }
 
  .empty-subtitle {
    font-size: 14px;
    color: var(--text-muted);
    max-width: 320px;
    line-height: 1.6;
  }
 
  .btn-empty-create {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: var(--green-mid);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.18s, transform 0.12s;
    box-shadow: 0 4px 14px rgba(45,122,64,0.3);
  }
 
  .btn-empty-create:hover { background: var(--green-bright); transform: translateY(-1px); }
 
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease both;
  }
 
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
 
  .modal {
    background: #fff;
    border-radius: 18px;
    padding: 36px 32px 28px;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.18);
    animation: slideUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
 
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
 
  .modal-title {
    font-family: 'Fraunces', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 6px;
  }
 
  .modal-subtitle { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }
 
  .modal-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
 
  .modal-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
 
  .modal-input {
    padding: 11px 14px;
    border: 1.5px solid #dde8df;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: #fafcfa;
    width: 100%;
    -webkit-appearance: none;
  }
 
  .modal-input::placeholder { color: #b0c4b6; }
 
  .modal-input:focus {
    border-color: var(--green-mid);
    box-shadow: 0 0 0 3px rgba(45,122,64,0.1);
    background: #fff;
  }
 
  .modal-actions { display: flex; gap: 10px; margin-top: 24px; }
 
  .btn-cancel {
    flex: 1; padding: 12px;
    background: #f0f4f1; border: none; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    color: var(--text-muted); cursor: pointer; transition: background 0.18s;
  }
 
  .btn-cancel:hover { background: #e4ece6; color: var(--text-primary); }
 
  .btn-confirm {
    flex: 1; padding: 12px;
    background: var(--green-mid); border: none; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    color: #fff; cursor: pointer;
    transition: background 0.18s, transform 0.12s;
    box-shadow: 0 4px 14px rgba(45,122,64,0.25);
  }
 
  .btn-confirm:hover { background: var(--green-bright); transform: translateY(-1px); }
  .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
 
  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
 
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
 
  .project-card {
    background: #fff;
    border: 1px solid var(--card-border);
    border-radius: 16px;
    padding: 22px 20px 18px;
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.18s, border-color 0.2s;
    position: relative;
  }
 
  .project-card:hover {
    box-shadow: 0 8px 28px rgba(45,122,64,0.12);
    transform: translateY(-2px);
    border-color: #c4dbc9;
  }
 
  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;
  }
 
  .card-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    background: var(--progress-bg);
    display: flex; align-items: center; justify-content: center;
    color: var(--green-mid);
  }
 
  .card-menu {
    background: none; border: none; cursor: pointer;
    color: #c4d4c8; padding: 4px; border-radius: 6px;
    transition: color 0.2s, background 0.2s; display: flex;
  }
 
  .card-menu:hover { color: var(--text-muted); background: #f0f4f1; }
 
  .card-name {
    font-family: 'Fraunces', serif;
    font-size: 16px; font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 3px; line-height: 1.3;
  }
 
  .card-client { font-size: 12px; color: var(--text-muted); margin-bottom: 18px; }
 
  .card-progress-label {
    font-size: 10px; font-weight: 600;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text-muted);
    display: flex; justify-content: space-between;
    margin-bottom: 6px;
  }
 
  .progress-bar-bg {
    height: 5px; background: var(--progress-bg);
    border-radius: 99px; overflow: hidden; margin-bottom: 14px;
  }
 
  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--green-mid), var(--green-light));
    border-radius: 99px;
    transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
 
  .card-updated {
    font-size: 11px; color: #b0c4b6;
    display: flex; align-items: center; gap: 5px;
  }
 
  .placeholder-page {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    height: 100%; gap: 12px; color: var(--text-muted);
  }
 
  .placeholder-page svg { opacity: 0.3; }
 
  .placeholder-page h2 {
    font-family: 'Fraunces', serif;
    font-size: 20px; color: var(--text-primary); opacity: 0.4;
  }
 
  .placeholder-page p { font-size: 13px; opacity: 0.5; }
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
  name: "Ana Silva",
  role: "Analista de Sistemas",
  initials: "AS",
};
 
export default function Tela_Projetos() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<Page>("projetos");
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectClient, setNewProjectClient] = useState("");
 
  // ── NOVO: projeto selecionado — null = mostra o painel
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
 
  const handleLogout = () => navigate("/");
 
  const handleCreateProject = () => {
    if (!newProjectName.trim() || !newProjectClient.trim()) return;
    const project: Project = {
      id: Date.now(),
      name: newProjectName.trim(),
      client: newProjectClient.trim(),
      progress: 0,
      updatedAt: "agora mesmo",
    };
    setProjects((prev) => [project, ...prev]);
    setNewProjectName("");
    setNewProjectClient("");
    setShowModal(false);
  };
 
  const openModal = () => {
    setNewProjectName("");
    setNewProjectClient("");
    setShowModal(true);
  };
 
  // ── Se projeto selecionado, renderiza ProjectDetail no lugar do Dashboard
  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }
 
  return (
    <>
      <style>{styles}</style>
 
      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src="./src/assets/scopeplan.png" alt="ScopePlan" />
          </div>
 
          <nav className="sidebar-nav">
            <span className="nav-label">Menu</span>
 
            <button
              className={`nav-item ${activePage === "projetos" ? "active" : ""}`}
              onClick={() => setActivePage("projetos")}
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
              onClick={() => setActivePage("auditoria")}
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
            <button className="btn-logout" onClick={handleLogout} title="Encerrar sessão">
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
                <div className="topbar-left">
                  <div className="topbar-title">Painel de Projetos</div>
                  <div className="topbar-subtitle">Visão geral dos documentos ativos.</div>
                </div>
                <button className="btn-new-project" onClick={openModal}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Novo Projeto
                </button>
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
                    <div className="empty-title">Nenhum projeto ainda</div>
                    <div className="empty-subtitle">
                      Crie seu primeiro projeto para começar a gerenciar documentos e acompanhar o progresso da ERS.
                    </div>
                    <button className="btn-empty-create" onClick={openModal}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Criar primeiro projeto
                    </button>
                  </div>
                ) : (
                  <div className="projects-grid">
                    {projects.map((p) => (
                      // ── onClick abre o ProjectDetail
                      <div
                        className="project-card"
                        key={p.id}
                        onClick={() => setSelectedProject(p)}
                      >
                        <div className="card-header">
                          <div className="card-icon">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                            </svg>
                          </div>
                          {/* stopPropagation evita abrir o projeto ao clicar no ⋮ */}
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
                <div className="topbar-left">
                  <div className="topbar-title">Auditoria</div>
                  <div className="topbar-subtitle">Histórico de ações e alterações.</div>
                </div>
              </header>
              <div className="content">
                <div className="placeholder-page">
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path d="M9 12l2 2 4-4M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                  </svg>
                  <h2>Auditoria</h2>
                  <p>Em breve disponível.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
 
      {/* MODAL NOVO PROJETO */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Novo Projeto</div>
            <div className="modal-subtitle">Preencha as informações do projeto para criá-lo.</div>
 
            <div className="modal-field">
              <label className="modal-label">Nome do Projeto</label>
              <input
                className="modal-input"
                type="text"
                placeholder="Ex: Sistema ERP Integrado"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
              />
            </div>
 
            <div className="modal-field">
              <label className="modal-label">Cliente</label>
              <input
                className="modal-input"
                type="text"
                placeholder="Ex: TecnoCorp Ltda"
                value={newProjectClient}
                onChange={(e) => setNewProjectClient(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
              />
            </div>
 
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
              <button
                className="btn-confirm"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || !newProjectClient.trim()}
              >
                Criar Projeto
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
 