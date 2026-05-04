import { useState, useRef } from "react";

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

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #f4f7f5;
    min-width: 0;
  }

  .topbar {
    background: #fff;
    border-bottom: 1px solid var(--card-border);
    padding: 0 28px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
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

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 28px 32px;
  }

  .content-inner {
    max-width: 900px;
    margin: 0 auto;
  }

  .section-title {
    font-family: 'Fraunces', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--card-border);
  }

  .req-card {
    background: #fff;
    border: 1px solid var(--card-border);
    border-radius: 14px;
    padding: 22px 24px;
    margin-bottom: 16px;
    transition: box-shadow 0.15s;
  }

  .req-card:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .req-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .req-id {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    background: #f0f2f5;
    color: #4a5568;
    padding: 3px 10px;
    border-radius: 4px;
    letter-spacing: 0.3px;
  }

  .req-status {
    font-size: 11px;
    font-weight: 500;
    padding: 3px 10px;
    border-radius: 4px;
  }

  .req-status.approved {
    background: #f0f7f2;
    color: #2d7a40;
  }

  .req-status.review {
    background: #fef9f0;
    color: #b45309;
  }

  .req-status.pending {
    background: #f8f9fa;
    color: #6b7280;
  }

  .req-title {
    font-family: 'Fraunces', serif;
    font-size: 17px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 10px;
  }

  .req-desc {
    font-size: 14px;
    color: #4a5568;
    line-height: 1.7;
    padding: 14px 18px;
    background: #fafcfa;
    border-radius: 8px;
    margin-bottom: 16px;
    border-left: 3px solid #dde8df;
  }

  .req-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--text-muted);
    padding-top: 12px;
    border-top: 1px solid #f0f2f5;
  }

  .req-footer strong {
    color: #4a5568;
    font-weight: 600;
  }

  .req-actions {
    display: flex;
    gap: 10px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid #f0f2f5;
  }

  .btn-reject {
    flex: 1;
    padding: 10px 16px;
    background: #fff;
    color: #b91c1c;
    border: 1.5px solid #fecaca;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-reject:hover { background: #fef2f2; }

  .btn-approve {
    flex: 1;
    padding: 10px 16px;
    background: var(--green-mid);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-approve:hover { background: var(--green-bright); }

  .file-card {
    background: #fff;
    border: 1px solid var(--card-border);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .file-icon {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    background: var(--progress-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--green-mid);
    flex-shrink: 0;
  }

  .file-info {
    flex: 1;
    min-width: 0;
  }

  .file-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .file-meta {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .file-remove {
    background: none; border: none;
    color: #c4d4c8; cursor: pointer;
    padding: 4px; border-radius: 6px;
    transition: color 0.2s; display: flex;
  }

  .file-remove:hover { color: #e05555; }

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

  .upload-area.dragover {
    border-color: var(--green-mid);
    background: #e6f4ea;
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

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-muted);
  }

  .empty-state h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 6px;
  }

  .empty-state p {
    font-size: 13px;
  }
`;

interface Requirement {
  id: string;
  status: "Aprovado" | "Em Revisão" | "Pendente";
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

interface Props {
  project: { id: number; name: string; client: string };
  topic: { id: number; name: string; requirements: Requirement[]; files: FileItem[] };
  userRole: "Analista de Sistemas" | "Cliente / Validador" | "Equipa Técnica";
  userName: string;
  onBack: () => void;
  onUploadFiles?: (topicId: number, fileList: FileList) => void;
  onRemoveFile?: (topicId: number, fileId: number) => void;
}

export default function ValidacaoRequisitos({ project, topic, userRole, userName, onBack, onUploadFiles, onRemoveFile }: Props) {
  const [requirements, setRequirements] = useState<Requirement[]>(topic.requirements || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const isCliente = userRole === "Cliente / Validador";
  const isAnalista = userRole === "Analista de Sistemas";

  const handleApprove = (id: string) => {
    setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Aprovado" as const } : r)));
  };

  const handleReject = (id: string) => {
    setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Em Revisão" as const } : r)));
  };

  const statusClass = (status: string) => {
    if (status === "Aprovado") return "approved";
    if (status === "Em Revisão") return "review";
    return "pending";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUploadFiles) {
      onUploadFiles(topic.id, e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onUploadFiles) {
      onUploadFiles(topic.id, e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src="./src/assets/scopeplan.png" alt="ScopePlan" />
          </div>
          <nav className="sidebar-nav">
            <span className="nav-label">Menu</span>
            <button className="nav-item active" onClick={onBack}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="2" y="3" width="8" height="8" rx="2" />
                <rect x="14" y="3" width="8" height="8" rx="2" />
                <rect x="2" y="13" width="8" height="8" rx="2" />
                <rect x="14" y="13" width="8" height="8" rx="2" />
              </svg>
              Projetos
            </button>
            <button className="nav-item" onClick={() => {}}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M9 12l2 2 4-4" />
                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
              Auditoria
            </button>
          </nav>
          <div className="sidebar-user">
            <div className="user-avatar">
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-role">{userRole}</div>
            </div>
            <button className="btn-logout" onClick={() => (window.location.href = "/")}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <button className="topbar-back" onClick={onBack}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Voltar ao Índice
            </button>
            <div className="topbar-bottom">
              <div>
                <div className="topbar-index-label">{topic.name}</div>
                <div className="topbar-project-name">{project.name}</div>
                <div className="topbar-client">
                  <strong>Cliente:</strong> {project.client}
                </div>
              </div>
            </div>
          </header>

          <div className="content">
            <div className="content-inner">
              {isAnalista && onUploadFiles && (
                <>
                  <h2 className="section-title">Adicionar Arquivos</h2>
                  <div className={`upload-area ${dragOver ? "dragover" : ""}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={handleUploadClick}>
                    <div className="upload-icon">
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                    </div>
                    <div className="upload-title">Arraste arquivos ou clique para enviar</div>
                    <div className="upload-subtitle">PDF, DOCX, XLSX, PNG — até 20 MB por arquivo</div>
                    <input type="file" multiple ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
                  </div>
                </>
              )}

              {requirements.length > 0 && (
                <>
                  <h2 className="section-title" style={{ marginTop: isAnalista ? "36px" : "0" }}>
                    Requisitos Documentados
                  </h2>
                  {requirements.map((req) => (
                    <div className="req-card" key={req.id}>
                      <div className="req-header">
                        <span className="req-id">{req.id}</span>
                        <span className={`req-status ${statusClass(req.status)}`}>{req.status}</span>
                      </div>
                      <h3 className="req-title">{req.title}</h3>
                      <div className="req-desc">
                        <p>{req.description}</p>
                      </div>
                      <div className="req-footer">
                        <span>
                          Modificado por: <strong>{req.modifiedBy}</strong>
                        </span>
                        <span>
                          {req.modifiedDate} • {req.modifiedTime}
                        </span>
                      </div>
                      {isCliente && (
                        <div className="req-actions">
                          <button className="btn-reject" onClick={() => handleReject(req.id)}>
                            Reprovar
                          </button>
                          <button className="btn-approve" onClick={() => handleApprove(req.id)}>
                            Aprovar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {topic.files && topic.files.length > 0 && (
                <>
                  <h2 className="section-title" style={{ marginTop: requirements.length > 0 || isAnalista ? "36px" : "0" }}>
                    Arquivos Anexados
                  </h2>
                  {topic.files.map((file) => (
                    <div className="file-card" key={file.id}>
                      <div className="file-icon">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="file-info">
                        <div className="file-name">{file.name}</div>
                        <div className="file-meta">
                          {file.size} • Adicionado {file.addedAt}
                        </div>
                      </div>
                      <button className="file-remove" onClick={() => onRemoveFile?.(topic.id, file.id)} title="Remover arquivo">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </>
              )}

              {requirements.length === 0 && (!topic.files || topic.files.length === 0) && !isAnalista && (
                <div className="empty-state">
                  <h3>Nenhum conteúdo documentado</h3>
                  <p>Este tópico ainda não possui requisitos ou arquivos.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
