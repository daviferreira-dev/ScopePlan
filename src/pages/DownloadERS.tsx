import { useState } from "react";

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
    overflow: hidden;
    padding: 0;
  }

  .download-layout {
    display: flex;
    height: 100%;
  }

  .download-left {
    width: 420px;
    min-width: 420px;
    border-right: 1px solid var(--card-border);
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .download-left-inner {
    padding: 24px 28px;
  }

  .download-title {
    font-family: 'Fraunces', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 6px;
  }

  .download-subtitle {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 24px;
  }

  .section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 10px;
  }

  .topic-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 28px;
  }

  .topic-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #fafcfa;
    border: 1.5px solid #dde8df;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .topic-checkbox:hover {
    background: #f0f7f2;
    border-color: #b8d4be;
  }

  .topic-checkbox.selected {
    background: #e6f4ea;
    border-color: var(--green-mid);
    box-shadow: 0 0 0 1px rgba(45,122,64,0.2);
  }

  .topic-checkbox input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border: 2px solid #b0c4b6;
    border-radius: 5px;
    flex-shrink: 0;
    cursor: pointer;
    position: relative;
    transition: border-color 0.15s, background 0.15s;
    background: #fff;
  }

  .topic-checkbox input[type="checkbox"]:checked {
    background: var(--green-mid);
    border-color: var(--green-mid);
  }

  .topic-checkbox input[type="checkbox"]:checked::after {
    content: "";
    position: absolute;
    left: 5px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  .topic-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    flex: 1;
  }

  .topic-count {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
  }

  .format-options {
    display: flex;
    gap: 10px;
    margin-bottom: 28px;
  }

  .format-option {
    flex: 1;
    padding: 13px 12px;
    background: #fafcfa;
    border: 1.5px solid #dde8df;
    border-radius: 10px;
    text-align: center;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
  }

  .format-option:hover {
    background: #f0f7f2;
    border-color: #b8d4be;
  }

  .format-option.selected {
    background: #e6f4ea;
    border-color: var(--green-mid);
    box-shadow: 0 0 0 1px rgba(45,122,64,0.2);
  }

  .format-name {
    font-family: 'Fraunces', serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 2px;
  }

  .format-desc {
    font-size: 11px;
    color: var(--text-muted);
  }

  .actions {
    display: flex;
    gap: 10px;
    margin-top: 4px;
  }

  .btn-cancel {
    flex: 1;
    padding: 12px 16px;
    background: #f0f4f1;
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    transition: background 0.18s;
    text-align: center;
  }

  .btn-cancel:hover { background: #e4ece6; color: var(--text-primary); }

  .btn-download {
    flex: 1;
    padding: 12px 16px;
    background: var(--green-mid);
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    transition: background 0.18s, transform 0.12s;
    box-shadow: 0 4px 12px rgba(45,122,64,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .btn-download:hover { background: var(--green-bright); transform: translateY(-1px); }
  .btn-download:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .error-message {
    background: #fef0f0;
    color: #b91c1c;
    font-size: 13px;
    padding: 10px 14px;
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid #f5c6c6;
  }

  .download-right {
    flex: 1;
    overflow: auto;
    background: #e8ece8;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .preview-panel {
    background: #fff;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    width: 210mm;
    min-height: 297mm;
    padding: 30mm 20mm 20mm 30mm;
    font-family: 'Times New Roman', serif;
    color: #000;
    line-height: 1.5;
    font-size: 12pt;
  }

  .abnt-cover {
    text-align: center;
    padding-top: 60px;
  }

  .abnt-cover h1 {
    font-size: 18pt;
    font-weight: bold;
    color: #000;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .abnt-cover .subtitle {
    font-size: 14pt;
    font-weight: normal;
    color: #000;
    margin-bottom: 20px;
  }

  .abnt-cover .project-name {
    font-size: 18pt;
    font-weight: bold;
    color: #000;
    margin: 30px 0 10px;
  }

  .abnt-cover .client {
    font-size: 14pt;
    color: #000;
    margin-bottom: 60px;
  }

  .abnt-cover .date {
    font-size: 12pt;
    color: #000;
    margin-top: 80px;
  }

  .abnt-toc {
    margin: 20px 0;
  }

  .abnt-toc h2 {
    font-size: 14pt;
    font-weight: bold;
    color: #000;
    text-align: center;
    margin-bottom: 12px;
  }

  .abnt-toc-item {
    display: flex;
    justify-content: space-between;
    font-size: 12pt;
    color: #000;
    margin-bottom: 6px;
  }

  .abnt-toc-dots {
    flex: 1;
    border-bottom: 1px dotted #000;
    margin: 0 6px;
    align-self: flex-end;
  }

  .abnt-section {
    margin-top: 20px;
  }

  .abnt-section h2 {
    font-size: 13pt;
    font-weight: bold;
    color: #000;
    text-align: left;
    margin-bottom: 10px;
  }

  .abnt-file-list {
    list-style: none;
    padding-left: 0;
    margin-top: 8px;
  }

  .abnt-file-item {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 12pt;
    color: #000;
  }

  .abnt-file-bullet {
    font-size: 12pt;
    color: #000;
  }

  .abnt-file-name {
    font-weight: normal;
    color: #000;
  }

  .abnt-file-size {
    color: #333;
    font-size: 10pt;
    margin-left: 8px;
  }

  .abnt-no-files {
    font-style: italic;
    color: #444;
    font-size: 12pt;
    margin-left: 20px;
  }
`;

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

interface Props {
  project: Project;
  topics: Topic[];
  onBack: () => void;
}

const mockUser = { name: "Ana Silva", role: "Analista de Sistemas", initials: "AS" };

type Format = "pdf" | "docx";

async function downloadERS(projectId: number, selectedTopicIds: number[], format: Format): Promise<Blob> {
  const url = `/api/projects/${projectId}/ers/download`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topics: selectedTopicIds, format }),
  });

  if (!response.ok) {
    throw new Error("Falha ao gerar o documento. Tente novamente.");
  }

  return response.blob();
}

export default function DownloadERS({ project, topics, onBack }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>(topics.map((t) => t.id));
  const [format, setFormat] = useState<Format>("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleTopic = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectedTopics = topics.filter((t) => selectedIds.includes(t.id));

  const handleDownload = async () => {
    if (selectedIds.length === 0) {
      setError("Selecione pelo menos um tópico.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const blob = await downloadERS(project.id, selectedIds, format);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${project.name.replace(/\s+/g, "_")}_ERS.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setError(err.message || "Erro inesperado ao gerar download.");
    } finally {
      setLoading(false);
    }
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
            <div className="user-avatar">{mockUser.initials}</div>
            <div className="user-info">
              <div className="user-name">{mockUser.name}</div>
              <div className="user-role">{mockUser.role}</div>
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
              Voltar ao Projeto
            </button>
            <div className="topbar-bottom">
              <div>
                <div className="topbar-index-label">Download da ERS</div>
                <div className="topbar-project-name">{project.name}</div>
                <div className="topbar-client">
                  <strong>Cliente:</strong> {project.client}
                </div>
              </div>
            </div>
          </header>

          <div className="content">
            <div className="download-layout">
              <div className="download-left">
                <div className="download-left-inner">
                  <h2 className="download-title">Exportar Documento ERS</h2>
                  <p className="download-subtitle">Selecione os tópicos e o formato para gerar o arquivo.</p>

                  <div className="section-label">Tópicos da ERS</div>
                  <div className="topic-list">
                    {topics.map((topic) => (
                      <label key={topic.id} className={`topic-checkbox ${selectedIds.includes(topic.id) ? "selected" : ""}`}>
                        <input type="checkbox" checked={selectedIds.includes(topic.id)} onChange={() => toggleTopic(topic.id)} />
                        <span className="topic-name">{topic.name}</span>
                        <span className="topic-count">{topic.count} itens</span>
                      </label>
                    ))}
                  </div>

                  <div className="section-label">Formato</div>
                  <div className="format-options">
                    <div className={`format-option ${format === "pdf" ? "selected" : ""}`} onClick={() => setFormat("pdf")}>
                      <div className="format-name">PDF</div>
                      <div className="format-desc">Documento portável</div>
                    </div>
                    <div className={`format-option ${format === "docx" ? "selected" : ""}`} onClick={() => setFormat("docx")}>
                      <div className="format-name">DOCX</div>
                      <div className="format-desc">Microsoft Word</div>
                    </div>
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  <div className="actions">
                    <button className="btn-cancel" onClick={onBack}>
                      Cancelar
                    </button>
                    <button className="btn-download" onClick={handleDownload} disabled={loading || selectedIds.length === 0}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                      {loading ? "Gerando..." : "Baixar ERS"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="download-right">
                <div className="preview-panel">
                  <div className="abnt-cover">
                    <h1>Especificação de Requisitos de Software</h1>
                    <div className="subtitle">ERS</div>
                    <div className="project-name">{project.name}</div>
                    <div className="client">Cliente: {project.client}</div>
                    <div className="date">{new Date().toLocaleDateString("pt-BR")}</div>
                  </div>

                  <div className="abnt-toc">
                    <h2>Sumário</h2>
                    {selectedTopics.map((topic, index) => (
                      <div className="abnt-toc-item" key={topic.id}>
                        <span>
                          {index + 1}. {topic.name}
                        </span>
                        <span className="abnt-toc-dots"></span>
                        <span>{topic.files.length}</span>
                      </div>
                    ))}
                  </div>

                  {selectedTopics.map((topic, index) => (
                    <div className="abnt-section" key={topic.id}>
                      <h2>
                        {index + 1}. {topic.name}
                      </h2>
                      {topic.files.length === 0 ? (
                        <p className="abnt-no-files">Nenhum arquivo documentado neste tópico.</p>
                      ) : (
                        <ul className="abnt-file-list">
                          {topic.files.map((file) => (
                            <li className="abnt-file-item" key={file.id}>
                              <span className="abnt-file-bullet">•</span>
                              <span className="abnt-file-name">{file.name}</span>
                              <span className="abnt-file-size">({file.size})</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
