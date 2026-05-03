import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DownloadERS from "./DownloadERS";

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

  html, body {
    height: 100%; width: 100%; margin: 0; padding: 0;
    font-family: 'DM Sans', sans-serif;
    background: #f4f7f5;
    color: var(--text-primary);
    overflow: hidden;
  }

  #root { height: 100%; width: 100%; margin: 0; padding: 0; }

  .layout {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: fixed;
    top: 0; left: 0;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 130px;
    min-width: 130px;
    background: var(--sidebar-bg);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    z-index: 20;
  }

  .sidebar-logo {
    padding: 20px 14px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .sidebar-logo img {
    width: 90px;
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
  }

  .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
  .nav-item.active { background: rgba(255,255,255,0.14); color: #fff; font-weight: 600; }

  .sidebar-user {
    padding: 12px 10px;
    border-top: 1px solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .user-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--green-light);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    color: var(--green-deep);
    flex-shrink: 0;
  }

  .user-info { flex: 1; overflow: hidden; min-width: 0; }

  .user-name {
    font-size: 12px; font-weight: 600; color: #fff;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .user-role {
    font-size: 10px; color: rgba(255,255,255,0.45);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .btn-logout {
    background: none; border: none;
    color: rgba(255,255,255,0.35);
    cursor: pointer; padding: 4px; border-radius: 6px;
    transition: color 0.2s, background 0.2s;
    display: flex; align-items: center; flex-shrink: 0;
  }

  .btn-logout:hover { color: #ff8080; background: rgba(255,100,100,0.1); }

  /* ── MAIN ── */
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #f4f7f5;
    min-width: 0;
  }

  /* ── TOPBAR ── */
  .topbar {
    background: #fff;
    border-bottom: 1px solid var(--card-border);
    padding: 0 28px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0;
  }

  .topbar-back {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
    cursor: pointer;
    background: none;
    border: none;
    padding: 14px 0 8px;
    font-family: 'DM Sans', sans-serif;
    transition: color 0.18s;
    width: fit-content;
  }

  .topbar-back:hover { color: var(--green-mid); }

  .topbar-bottom {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding-bottom: 16px;
    gap: 16px;
  }

  .topbar-index-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  .topbar-project-name {
    font-family: 'Fraunces', serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--green-mid);
    line-height: 1.1;
    margin-bottom: 4px;
  }

  .topbar-client {
    font-size: 13px;
    color: var(--text-muted);
  }

  .topbar-client strong {
    color: var(--green-mid);
    font-weight: 600;
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .btn-download {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 18px;
    background: var(--green-mid);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.18s, transform 0.12s;
    box-shadow: 0 4px 14px rgba(45,122,64,0.25);
    white-space: nowrap;
  }

  .btn-download:hover { background: var(--green-bright); transform: translateY(-1px); }

  .btn-add-topic {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 18px;
    background: var(--green-mid);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.18s, transform 0.12s;
    box-shadow: 0 4px 14px rgba(45,122,64,0.25);
    white-space: nowrap;
    position: relative;
  }

  .btn-add-topic:hover { background: var(--green-bright); transform: translateY(-1px); }

  .btn-add-topic .divider-btn {
    width: 1px;
    height: 16px;
    background: rgba(255,255,255,0.3);
    margin: 0 2px 0 6px;
  }

  .btn-add-topic .chevron { opacity: 0.8; }

  /* ── CONTENT ── */
  .content {
    flex: 1;
    overflow-y: auto;
    padding: 24px 28px;
  }

  /* ── TOPICS GRID ── */
  .topics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .topic-card {
    background: #fff;
    border: 1px solid var(--card-border);
    border-radius: 14px;
    padding: 20px 20px 18px;
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.18s, border-color 0.2s;
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 110px;
    position: relative;
  }

  .topic-card:hover {
    box-shadow: 0 6px 24px rgba(45,122,64,0.1);
    transform: translateY(-2px);
    border-color: #c4dbc9;
  }

  .topic-card-top {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: auto;
  }

  .topic-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: var(--progress-bg);
    display: flex; align-items: center; justify-content: center;
    color: var(--green-mid);
    flex-shrink: 0;
  }

  .topic-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.35;
    padding-top: 6px;
  }

  .topic-count {
    font-size: 11.5px;
    color: var(--text-muted);
    margin-top: 14px;
    font-weight: 400;
  }

  /* ── TOPIC MODAL (adicionar tópico) ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
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
    padding: 32px 28px 24px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.15);
    animation: slideUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .modal-title {
    font-family: 'Fraunces', serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .modal-subtitle {
    font-size: 12.5px;
    color: var(--text-muted);
    margin-bottom: 22px;
  }

  .modal-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 14px;
  }

  .modal-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .modal-input {
    padding: 10px 13px;
    border: 1.5px solid #dde8df;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: #fafcfa;
    width: 100%;
  }

  .modal-input::placeholder { color: #b0c4b6; }

  .modal-input:focus {
    border-color: var(--green-mid);
    box-shadow: 0 0 0 3px rgba(45,122,64,0.08);
    background: #fff;
  }

  .modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 22px;
  }

  .btn-cancel {
    flex: 1; padding: 11px;
    background: #f0f4f1; border: none; border-radius: 9px;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600;
    color: var(--text-muted); cursor: pointer; transition: background 0.18s;
  }

  .btn-cancel:hover { background: #e4ece6; color: var(--text-primary); }

  .btn-confirm {
    flex: 1; padding: 11px;
    background: var(--green-mid); border: none; border-radius: 9px;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600;
    color: #fff; cursor: pointer;
    transition: background 0.18s, transform 0.12s;
    box-shadow: 0 4px 14px rgba(45,122,64,0.22);
  }

  .btn-confirm:hover { background: var(--green-bright); transform: translateY(-1px); }
  .btn-confirm:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

  /* ── TOPIC DETAIL VIEW ── */
  .topic-detail {
    animation: fadeUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .topic-detail-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  .topic-detail-back {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--text-muted);
    cursor: pointer; background: none; border: none;
    font-family: 'DM Sans', sans-serif;
    transition: color 0.18s; padding: 0;
  }

  .topic-detail-back:hover { color: var(--green-mid); }

  .topic-detail-title {
    font-family: 'Fraunces', serif;
    font-size: 20px; font-weight: 700;
    color: var(--text-primary);
  }

  .upload-area {
    border: 2px dashed #c4dbc9;
    border-radius: 14px;
    padding: 48px 32px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    background: #fafcfa;
    margin-bottom: 20px;
  }

  .upload-area:hover {
    border-color: var(--green-mid);
    background: #f0f7f2;
  }

  .upload-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    background: var(--progress-bg);
    display: flex; align-items: center; justify-content: center;
    color: var(--green-mid);
    margin: 0 auto 14px;
  }

  .upload-title {
    font-size: 15px; font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .upload-subtitle {
    font-size: 12px; color: var(--text-muted);
  }

  .files-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .file-item {
    display: flex; align-items: center; gap: 12px;
    background: #fff;
    border: 1px solid var(--card-border);
    border-radius: 10px;
    padding: 12px 14px;
  }

  .file-icon {
    width: 36px; height: 36px;
    border-radius: 8px;
    background: var(--progress-bg);
    display: flex; align-items: center; justify-content: center;
    color: var(--green-mid);
    flex-shrink: 0;
  }

  .file-info { flex: 1; }

  .file-name {
    font-size: 13px; font-weight: 600;
    color: var(--text-primary);
  }

  .file-meta {
    font-size: 11px; color: var(--text-muted);
    margin-top: 1px;
  }

  .file-remove {
    background: none; border: none;
    color: #c4d4c8; cursor: pointer;
    padding: 4px; border-radius: 6px;
    transition: color 0.2s; display: flex;
  }

  .file-remove:hover { color: #e05555; }
`;

// ── TIPOS ──
interface Topic {
  id: number;
  name: string;
  count: number;
  files: FileItem[];
}

interface FileItem {
  id: number;
  name: string;
  size: string;
  addedAt: string;
}

interface Project {
  id: number;
  name: string;
  client: string;
}

// Tópicos padrão — igual à imagem
const DEFAULT_TOPICS: Omit<Topic, "files">[] = [
  { id: 1, name: "Requisitos Funcionais", count: 0 },
  { id: 2, name: "Regras de Negócio", count: 0 },
  { id: 3, name: "Requisitos Não-Funcionais", count: 0 },
  { id: 4, name: "Modelagem de Dados", count: 0 },
  { id: 5, name: "Integrações de Sistema", count: 0 },
  { id: 6, name: "Glossário Técnico", count: 0 },
  { id: 7, name: "Gestão de Erros", count: 0 },
  { id: 8, name: "UI/UX e Protótipos", count: 0 },
];

const mockUser = { name: "Ana Silva", role: "Analista de Sistemas", initials: "AS" };

// Props que o Dashboard vai passar
interface Props {
  project: Project;
  onBack: () => void;
}

export default function Tela_Itens({ project, onBack }: Props) {
  const navigate = useNavigate();

  const [topics, setTopics] = useState<Topic[]>(DEFAULT_TOPICS.map((t) => ({ ...t, files: [] })));
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [activePage, setActivePage] = useState<"projetos" | "auditoria">("projetos");
  const [showDownload, setShowDownload] = useState(false);

  // Adicionar tópico novo
  const handleAddTopic = () => {
    if (!newTopicName.trim()) return;
    const t: Topic = {
      id: Date.now(),
      name: newTopicName.trim(),
      count: 0,
      files: [],
    };
    setTopics((prev) => [...prev, t]);
    setNewTopicName("");
    setShowAddModal(false);
  };

  // Simular upload de arquivo
  const handleFileUpload = (topicId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => {
      const fileItem: FileItem = {
        id: Date.now() + Math.random(),
        name: f.name,
        size: (f.size / 1024).toFixed(0) + " KB",
        addedAt: "agora mesmo",
      };
      setTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, files: [...t.files, fileItem], count: t.files.length + 1 } : t)));
      setActiveTopic((prev) => (prev && prev.id === topicId ? { ...prev, files: [...prev.files, fileItem], count: prev.files.length + 1 } : prev));
    });
    e.target.value = "";
  };

  const removeFile = (topicId: number, fileId: number) => {
    setTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, files: t.files.filter((f) => f.id !== fileId), count: Math.max(0, t.count - 1) } : t)));
    setActiveTopic((prev) => (prev && prev.id === topicId ? { ...prev, files: prev.files.filter((f) => f.id !== fileId), count: Math.max(0, prev.count - 1) } : prev));
  };

  const openTopic = (t: Topic) => {
    // sincroniza com estado atual
    const fresh = topics.find((x) => x.id === t.id) || t;
    setActiveTopic(fresh);
  };

  if (showDownload) {
    return <DownloadERS project={project} topics={topics} onBack={() => setShowDownload(false)} />;
  }

  return (
    <>
      <style>{styles}</style>

      <div className="layout">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src="./src/assets/scopeplan.png" alt="ScopePlan" />
          </div>

          <nav className="sidebar-nav">
            <span className="nav-label">Menu</span>

            <button
              className={`nav-item ${activePage === "projetos" ? "active" : ""}`}
              onClick={() => {
                setActivePage("projetos");
                setActiveTopic(null);
                onBack();
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="2" y="3" width="8" height="8" rx="2" />
                <rect x="14" y="3" width="8" height="8" rx="2" />
                <rect x="2" y="13" width="8" height="8" rx="2" />
                <rect x="14" y="13" width="8" height="8" rx="2" />
              </svg>
              Projetos
            </button>

            <button className={`nav-item ${activePage === "auditoria" ? "active" : ""}`} onClick={() => setActivePage("auditoria")}>
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
            <button className="btn-logout" onClick={() => navigate("/")} title="Encerrar sessão">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="main">
          {/* TOPBAR */}
          <header className="topbar">
            <button className="topbar-back" onClick={activeTopic ? () => setActiveTopic(null) : onBack}>
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
                  <button className="btn-add-topic" onClick={() => setShowAddModal(true)}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Adicionar Tópico
                    <span className="divider-btn" />
                    <svg className="chevron" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>
              )}

              {activeTopic && (
                <div className="topbar-actions">
                  <label className="btn-add-topic" style={{ cursor: "pointer" }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Adicionar Arquivo
                    <input type="file" multiple style={{ display: "none" }} onChange={(e) => handleFileUpload(activeTopic.id, e)} />
                  </label>
                </div>
              )}
            </div>
          </header>

          {/* CONTENT */}
          <div className="content">
            {/* ── ÍNDICE DE TÓPICOS ── */}
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
                    <div className="topic-count">{t.count === 0 ? "0 requisitos" : t.count === 1 ? "1 requisito" : `${t.count} requisitos`}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── DETALHE DO TÓPICO ── */}
            {activeTopic && (
              <div className="topic-detail">
                {/* Upload area */}
                <label className="upload-area" style={{ display: "block" }}>
                  <div className="upload-icon">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                  </div>
                  <div className="upload-title">Arraste arquivos ou clique para enviar</div>
                  <div className="upload-subtitle">PDF, DOCX, XLSX, PNG — até 20 MB por arquivo</div>
                  <input type="file" multiple style={{ display: "none" }} onChange={(e) => handleFileUpload(activeTopic.id, e)} />
                </label>

                {/* Lista de arquivos */}
                {activeTopic.files.length > 0 && (
                  <div className="files-list">
                    {topics
                      .find((t) => t.id === activeTopic.id)
                      ?.files.map((f) => (
                        <div className="file-item" key={f.id}>
                          <div className="file-icon">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <div className="file-info">
                            <div className="file-name">{f.name}</div>
                            <div className="file-meta">
                              {f.size} · Adicionado {f.addedAt}
                            </div>
                          </div>
                          <button className="file-remove" onClick={() => removeFile(activeTopic.id, f.id)} title="Remover">
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {activeTopic.files.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "13px" }}>Nenhum arquivo adicionado ainda.</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ADICIONAR TÓPICO ── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal">
            <div className="modal-title">Novo Tópico</div>
            <div className="modal-subtitle">Dê um nome para o novo tópico da ERS.</div>
            <div className="modal-field">
              <label className="modal-label">Nome do Tópico</label>
              <input
                className="modal-input"
                type="text"
                placeholder="Ex: Casos de Uso"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>
                Cancelar
              </button>
              <button className="btn-confirm" onClick={handleAddTopic} disabled={!newTopicName.trim()}>
                Criar Tópico
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
