import scopeplanLogo from "../../assets/scopeplan.png";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { projectsApi, type ProjectData, type RequirementData } from "../../services/api";
import { useNavigate } from "react-router-dom";

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
 }

 .nav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }
 .nav-item.active { background: rgba(52,196,90,0.15); color: #5fdb7f; font-weight: 600; }
 .nav-item.active::before {
 content: ''; position: absolute; left: 0; top: 25%; bottom: 25%;
 width: 3px; border-radius: 0 3px 3px 0; background: var(--green-light);
 }

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
 }

 .topbar-accent-line {
 width: 36px; height: 3px; border-radius: 99px;
 background: linear-gradient(90deg, var(--green-bright), var(--green-light));
 margin: 6px 0;
 }

 .topbar-client { font-size: 12.5px; color: var(--text-muted); font-weight: 400; }
 .topbar-client strong { color: var(--green-mid); font-weight: 600; }

 .content { flex: 1; overflow: hidden; padding: 0; }

 /* ── DOWNLOAD LAYOUT ── */
 .download-layout { display: flex; height: 100%; }

 .download-left {
 width: 420px; min-width: 420px;
 border-right: 1px solid var(--card-border);
 background: #fff; display: flex; flex-direction: column; overflow-y: auto;
 }

 .download-left-inner { padding: 28px 32px; }

 .download-title {
 font-family: 'Playfair Display', serif; font-size: 22px;
 font-weight: 700; color: var(--text-primary); margin-bottom: 6px;
 }

 .download-subtitle {
 font-size: 13px; color: var(--text-muted); margin-bottom: 28px;
 }

 .section-label {
 font-size: 10px; font-weight: 700; letter-spacing: 2px;
 text-transform: uppercase; color: var(--green-muted); margin-bottom: 10px;
 }

 /* ── TOPIC CHECKBOXES ── */
 .topic-list {
 display: flex; flex-direction: column; gap: 8px; margin-bottom: 28px;
 }

 .topic-checkbox {
 display: flex; align-items: center; gap: 12px;
 padding: 12px 16px; background: var(--surface);
 border: 1.5px solid var(--card-border); border-radius: 12px;
 cursor: pointer; transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
 }

 .topic-checkbox:hover { background: var(--progress-bg); border-color: rgba(34,136,63,0.22); }

 .topic-checkbox.selected {
 background: var(--progress-bg); border-color: var(--green-bright);
 box-shadow: 0 0 0 2px rgba(34,136,63,0.12);
 }

 .topic-checkbox input[type="checkbox"] {
 appearance: none; -webkit-appearance: none;
 width: 20px; height: 20px; border: 2px solid rgba(34,136,63,0.25);
 border-radius: 6px; flex-shrink: 0; cursor: pointer;
 position: relative; transition: border-color 0.15s, background 0.15s;
 background: #fff;
 }

 .topic-checkbox input[type="checkbox"]:checked {
 background: var(--green-bright); border-color: var(--green-bright);
 }

 .topic-checkbox input[type="checkbox"]:checked::after {
 content: ""; position: absolute; left: 5px; top: 2px;
 width: 5px; height: 10px;
 border: solid #fff; border-width: 0 2.5px 2.5px 0;
 transform: rotate(45deg);
 }

 .topic-name { font-size: 14px; font-weight: 500; color: var(--text-primary); flex: 1; }
 .topic-count { font-size: 12px; color: var(--text-muted); font-weight: 500; }

 /* ── FORMAT OPTIONS ── */
 .format-options { display: flex; gap: 10px; margin-bottom: 28px; }

 .format-option {
 flex: 1; padding: 14px 14px; background: var(--surface);
 border: 1.5px solid var(--card-border); border-radius: 12px;
 text-align: center; cursor: pointer;
 transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
 }

 .format-option:hover { background: var(--progress-bg); border-color: rgba(34,136,63,0.22); }

 .format-option.selected {
 background: var(--progress-bg); border-color: var(--green-bright);
 box-shadow: 0 0 0 2px rgba(34,136,63,0.12);
 }

 .format-name {
 font-family: 'Playfair Display', serif; font-size: 16px;
 font-weight: 700; color: var(--text-primary); margin-bottom: 2px;
 }

 .format-desc { font-size: 11px; color: var(--text-muted); }

 /* ── ACTION BUTTONS ── */
 .actions { display: flex; gap: 10px; margin-top: 4px; }

 .btn-cancel {
 flex: 1; padding: 12px 16px; background: var(--surface);
 border: 1px solid var(--card-border); border-radius: 11px;
 font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
 color: var(--text-muted); cursor: pointer;
 transition: background 0.18s, border-color 0.18s; text-align: center;
 }
 .btn-cancel:hover { background: var(--progress-bg); border-color: rgba(34,136,63,0.18); color: var(--text-primary); }

 .btn-download {
 flex: 1; padding: 12px 16px;
 background: linear-gradient(135deg, var(--green-bright), var(--green-light));
 border: none; border-radius: 11px;
 font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
 color: #fff; cursor: pointer; transition: box-shadow 0.2s, transform 0.15s;
 box-shadow: 0 4px 14px rgba(34,136,63,0.28);
 display: flex; align-items: center; justify-content: center; gap: 7px;
 }
 .btn-download:hover { box-shadow: 0 6px 20px rgba(34,136,63,0.38); transform: translateY(-1px); }
 .btn-download:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

 .error-message {
 background: #fef0f0; color: #b91c1c; font-size: 13px;
 padding: 10px 14px; border-radius: 10px; margin-bottom: 16px;
 border: 1px solid #f5c6c6;
 }

 /* ── PREVIEW PANEL ── */
 .download-right {
 flex: 1; overflow: auto; background: var(--surface-2);
 padding: 24px; display: flex; justify-content: center; align-items: flex-start;
 }

 .preview-panel {
 background: #fff; box-shadow: 0 2px 16px rgba(0,0,0,0.07);
 width: 210mm; min-height: 297mm;
 padding: 30mm 20mm 20mm 30mm;
 font-family: 'Times New Roman', serif; color: #000;
 line-height: 1.5; font-size: 12pt;
 border-radius: 4px;
 }

 .abnt-cover { text-align: center; padding-top: 60px; }
 .abnt-cover h1 {
 font-size: 18pt; font-weight: bold; color: #000;
 margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;
 }
 .abnt-cover .subtitle { font-size: 14pt; font-weight: normal; color: #000; margin-bottom: 20px; }
 .abnt-cover .project-name { font-size: 18pt; font-weight: bold; color: #000; margin: 30px 0 10px; }
 .abnt-cover .client { font-size: 14pt; color: #000; margin-bottom: 60px; }
 .abnt-cover .date { font-size: 12pt; color: #000; margin-top: 80px; }

 .abnt-toc { margin: 20px 0; }
 .abnt-toc h2 { font-size: 14pt; font-weight: bold; color: #000; text-align: center; margin-bottom: 12px; }
 .abnt-toc-item { display: flex; justify-content: space-between; font-size: 12pt; color: #000; margin-bottom: 6px; }
 .abnt-toc-dots { flex: 1; border-bottom: 1px dotted #000; margin: 0 6px; align-self: flex-end; }

 .abnt-section { margin-top: 20px; }
 .abnt-section h2 { font-size: 13pt; font-weight: bold; color: #000; text-align: left; margin-bottom: 10px; }

 .abnt-req-list { list-style: none; padding-left: 0; margin-top: 8px; }
 .abnt-req-item { margin-bottom: 12px; font-size: 12pt; color: #000; }
 .abnt-req-code { font-weight: bold; color: #000; margin-right: 8px; }
 .abnt-req-title { font-weight: bold; color: #000; }
 .abnt-req-desc { color: #333; font-size: 11pt; margin-left: 20px; margin-top: 4px; line-height: 1.5; }

 .abnt-no-reqs { font-style: italic; color: #444; font-size: 12pt; margin-left: 20px; }

 /* ── Responsive ── */
 .hamburger-btn {
 display: none; background: none; border: none; color: var(--text-primary);
 cursor: pointer; padding: 8px; border-radius: 8px; -webkit-tap-highlight-color: transparent;
 }
 .hamburger-btn:hover { background: rgba(0,0,0,0.05); }
 .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 15; }

 @media (max-width: 1200px) {
 .download-layout { flex-direction: column !important; height: auto !important; overflow-y: auto !important; }
 .download-left { width: 100% !important; min-width: 0 !important; max-height: none !important; border-right: none !important; border-bottom: 1px solid var(--card-border); padding: 24px 20px !important; }
 .download-left-inner { max-width: 100%; }
 .download-right { width: 100% !important; min-height: 0 !important; padding: 24px 20px !important; display: flex; justify-content: center; }
 .preview-panel { width: 100% !important; max-width: 680px !important; min-height: auto !important; padding: 24px 20px !important; margin: 0 auto; }
 }

 @media (max-width: 768px) {
 .hamburger-btn { display: flex; align-items: center; }
 .sidebar-overlay.active { display: block; }
 .sidebar {
 position: fixed; top: 0; left: -260px; height: 100vh; z-index: 20;
 transition: left 0.25s cubic-bezier(0.22, 1, 0.36, 1); box-shadow: none;
 }
 .sidebar.open { left: 0; box-shadow: 4px 0 24px rgba(0,0,0,0.18); }
 .main { width: 100vw; }
 .topbar { padding: 20px 16px; flex-wrap: wrap; gap: 8px; }
 .content { padding: 0 16px 16px; overflow-y: auto !important; }
 .format-options { flex-wrap: wrap; }
 .actions { flex-direction: column; gap: 10px; }
 .actions .btn-cancel, .actions .btn-download { width: 100%; }
 }

 @media (max-width: 480px) {
 .download-left { padding: 18px 14px !important; }
 .download-right { padding: 18px 14px !important; }
 .preview-panel { padding: 16px 12px !important; }
 .topic-checkbox { padding: 8px 6px; }
 }
`;

interface TopicInfo {
    id: number;
    name: string;
    type: string;
    count: number;
    requirements: RequirementData[];
}

const BASE_TOPICS: { id: number; name: string; type: string }[] = [
    { id: 1, name: "Requisitos Funcionais", type: "funcional" },
    { id: 2, name: "Regras de Negócio", type: "negocio" },
    { id: 3, name: "Requisitos Não-Funcionais", type: "nao_funcional" },
    { id: 4, name: "Restrições", type: "restricao" },
];

interface Props {
    project: ProjectData;
    requirements: RequirementData[];
    onBack: () => void;
}

type Format = "pdf" | "docx";

export default function DownloadERS({ project, requirements, onBack }: Props) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const topicsWithCount: TopicInfo[] = BASE_TOPICS.map(t => ({
        ...t,
        count: requirements.filter(r => r.tipo === t.type).length,
        requirements: requirements.filter(r => r.tipo === t.type),
    }));

    const [selectedIds, setSelectedIds] = useState<number[]>(BASE_TOPICS.map(t => t.id));
    const [format, setFormat] = useState<Format>("pdf");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleTopic = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const selectedTopics = topicsWithCount.filter((t) => selectedIds.includes(t.id));

    const handleDownload = async () => {
        if (selectedIds.length === 0) {
            setError("Selecione pelo menos um tópico.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const blob = await projectsApi.downloadERS(project.id, format, selectedIds.length === BASE_TOPICS.length ? undefined : selectedIds);
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `${project.nome.replace(/\s+/g, "_")}_ERS.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (err: unknown) {
            setError((err instanceof Error ? err.message : String(err)) || "Erro inesperado ao gerar download.");
        } finally {
            setLoading(false);
        }
    };

    const getUserInitials = () => {
        if (!user?.nome) return "AN";
        return user.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    };

    const getUserRole = () => {
        if (user?.perfil === "analista") return "Analista de Sistemas";
        return user?.perfil || "";
    };

    const handleLogout = async () => { await logout(); navigate("/"); };

    return (
        <>
            <style>{styles}</style>
            <div className="layout">
                {/* Mobile sidebar overlay */}
                <div className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)} />

                <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
                    <div className="sidebar-logo">
                        <img src={scopeplanLogo} alt="ScopePlan" />
                    </div>
                    <nav className="sidebar-nav">
                        <span className="nav-label">Menu</span>
                        <button className="nav-item active" onClick={() => { setSidebarOpen(false); onBack(); }}>
                            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <rect x="2" y="3" width="8" height="8" rx="2" />
                                <rect x="14" y="3" width="8" height="8" rx="2" />
                                <rect x="2" y="13" width="8" height="8" rx="2" />
                                <rect x="14" y="13" width="8" height="8" rx="2" />
                            </svg>
                            Projetos
                        </button>
                    </nav>
                    <div className="sidebar-user">
                        <div className="user-avatar">{getUserInitials()}</div>
                        <div className="user-info">
                            <div className="user-name">{user?.nome || "Analista"}</div>
                            <div className="user-role">{getUserRole()}</div>
                        </div>
                        <button className="btn-logout" onClick={() => { setSidebarOpen(false); handleLogout(); }} title="Encerrar sessão">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                            </svg>
                        </button>
                    </div>
                </aside>

                <div className="main">
                    <header className="topbar">
                        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                        </button>
                        <button className="topbar-back" onClick={onBack}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M19 12H5M12 5l-7 7 7 7" />
                            </svg>
                            Voltar ao Projeto
                        </button>
                        <div className="topbar-bottom">
                            <div>
                                <div className="topbar-index-label">Download da ERS</div>
                                <div className="topbar-project-name">{project.nome}</div>
                                <div className="topbar-accent-line" />
                                <div className="topbar-client">
                                    <strong>Cliente:</strong> {project.nome_cliente || "—"}
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
                                        {topicsWithCount.map((topic) => (
                                            <label key={topic.id} className={`topic-checkbox ${selectedIds.includes(topic.id) ? "selected" : ""}`}>
                                                <input type="checkbox" checked={selectedIds.includes(topic.id)} onChange={() => toggleTopic(topic.id)} />
                                                <span className="topic-name">{topic.name}</span>
                                                <span className="topic-count">{topic.count} requisitos</span>
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
                                        <div className="project-name">{project.nome}</div>
                                        <div className="client">Cliente: {project.nome_cliente || "—"}</div>
                                        <div className="date">{new Date().toLocaleDateString("pt-BR")}</div>
                                    </div>

                                    <div className="abnt-toc">
                                        <h2>Sumário</h2>
                                        {selectedTopics.map((topic, index) => (
                                            <div className="abnt-toc-item" key={topic.id}>
                                                <span>{index + 1}. {topic.name}</span>
                                                <span className="abnt-toc-dots"></span>
                                                <span>{topic.count}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedTopics.map((topic, index) => (
                                        <div className="abnt-section" key={topic.id}>
                                            <h2>{index + 1}. {topic.name}</h2>
                                            {topic.requirements.length === 0 ? (
                                                <p className="abnt-no-reqs">Nenhum requisito documentado neste tópico.</p>
                                            ) : (
                                                <ul className="abnt-req-list">
                                                    {topic.requirements.map((req) => (
                                                        <li className="abnt-req-item" key={req.id}>
                                                            <span className="abnt-req-code">{req.codigo || `REQ-${req.id}`}</span>
                                                            <span className="abnt-req-title">{req.titulo}</span>
                                                            <div className="abnt-req-desc">{req.descricao}</div>
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