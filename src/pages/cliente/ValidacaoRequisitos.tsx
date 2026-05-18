import scopeplanLogo from "../../assets/scopeplan.png";
import { useState, useEffect } from "react";
import { requirementsApi } from "../../services/api";
import type { RequirementData, ProjectData } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

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
 content: '';
 position: absolute; inset: 0;
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
 font-size: 8.5px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;
 color: rgba(255,255,255,0.2); padding: 10px 8px 8px;
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
 font-size: 12px; font-weight: 500;
 color: var(--text-muted); cursor: pointer;
 background: none; border: none;
 padding: 16px 0 8px; font-family: 'Sora', sans-serif;
 transition: color 0.18s; width: fit-content;
 }
 .topbar-back:hover { color: var(--green-mid); }

 .topbar-bottom {
 display: flex; align-items: flex-end; justify-content: space-between;
 padding-bottom: 18px; gap: 16px;
 }

 .topbar-index-label {
 font-size: 9px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;
 color: var(--green-muted); margin-bottom: 6px;
 }

 .topbar-project-name {
 font-family: 'Playfair Display', serif;
 font-size: 26px; font-weight: 900;
 color: var(--green-mid); line-height: 1.1; margin-bottom: 2px;
 }

 .topbar-accent-line {
 width: 36px; height: 3px; border-radius: 99px;
 background: linear-gradient(90deg, var(--green-bright), var(--green-light));
 margin: 6px 0 6px;
 }

 .topbar-client { font-size: 12.5px; color: var(--text-muted); font-weight: 400; }

 /* ── CONTENT ── */
 .content { flex: 1; overflow-y: auto; padding: 28px 36px; }
 .content-inner { max-width: 860px; margin: 0 auto; }

 .section-header {
 display: flex; align-items: center; justify-content: space-between;
 margin-bottom: 20px;
 }

 .section-title {
 font-family: 'Playfair Display', serif;
 font-size: 20px; font-weight: 700; color: var(--text-primary);
 }

 .section-count {
 font-size: 12px; color: var(--text-muted); font-weight: 400;
 background: var(--progress-bg); padding: 3px 10px; border-radius: 99px;
 }

 /* ── REQUIREMENT CARD ── */
 .req-card {
 background: #fff; border: 1px solid var(--card-border); border-radius: 16px;
 padding: 22px 24px; margin-bottom: 16px;
 transition: box-shadow 0.2s, border-color 0.2s;
 position: relative; overflow: hidden;
 }

 .req-card::before {
 content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
 border-radius: 16px 16px 0 0;
 }

 .req-card.status-aprovado::before { background: linear-gradient(90deg, #22883f, #34c45a); }
 .req-card.status-rejeitado::before { background: linear-gradient(90deg, #dc2626, #f87171); }
 .req-card.status-em_analise::before { background: linear-gradient(90deg, #d97706, #fbbf24); }
 .req-card.status-pendente::before { background: linear-gradient(90deg, #9ca3af, #d1d5db); }

 .req-card:hover { box-shadow: 0 6px 24px rgba(26,102,52,0.09); border-color: rgba(52,196,90,0.2); }

 .req-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }

 .req-id {
 font-family: 'Sora', sans-serif; font-size: 11.5px; font-weight: 700;
 background: var(--green-mid); color: #fff;
 padding: 3px 10px; border-radius: 6px; letter-spacing: 0.3px;
 }

 .req-status { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 6px; }
 .req-status.aprovado { background: #e0f8e8; color: #166534; }
 .req-status.em_analise { background: #fef3e2; color: #92400e; }
 .req-status.pendente { background: #f1f5f9; color: #64748b; }
 .req-status.rejeitado { background: #fce4e4; color: #7f1d1d; }

 .req-title {
 font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700;
 color: var(--text-primary); margin-bottom: 12px;
 }

 .req-desc {
 font-size: 13.5px; color: #3a5445; line-height: 1.7;
 padding: 14px 18px; background: var(--progress-bg); border-radius: 10px;
 margin-bottom: 16px; border-left: 3px solid rgba(34,136,63,0.3);
 font-style: italic;
 }

 .req-meta-row {
 display: flex; align-items: center; gap: 18px;
 margin-bottom: 14px; padding-bottom: 14px;
 border-bottom: 1px solid var(--card-border);
 }

 .req-meta-item {
 display: flex; align-items: center; gap: 5px;
 font-size: 11px; color: var(--text-muted); font-weight: 500;
 }

 .req-meta-item strong { color: var(--text-primary); font-weight: 600; }

 /* ── ACTION BUTTONS ── */
 .req-actions { display: flex; gap: 10px; }

 .btn-reject {
 flex: 1; padding: 10px 16px;
 background: #fff5f5; color: #dc2626;
 border: 1.5px solid #fecaca; border-radius: 10px;
 font-family: 'Sora', sans-serif; font-weight: 600; font-size: 13px;
 cursor: pointer; transition: background 0.15s, transform 0.12s;
 display: flex; align-items: center; justify-content: center; gap: 6px;
 }
 .btn-reject:hover { background: #fef2f2; transform: translateY(-1px); }
 .btn-reject:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

 .btn-approve {
 flex: 1; padding: 10px 16px;
 background: var(--progress-bg); color: var(--green-mid);
 border: 1.5px solid rgba(34,136,63,0.2); border-radius: 10px;
 font-family: 'Sora', sans-serif; font-weight: 600; font-size: 13px;
 cursor: pointer; transition: background 0.15s, transform 0.12s;
 display: flex; align-items: center; justify-content: center; gap: 6px;
 }
 .btn-approve:hover { background: #d0edda; transform: translateY(-1px); }
 .btn-approve:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

 /* ── OBSERVATION ── */
 .req-observations {
 margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--card-border);
 }

 .observations-title {
 font-size: 11.5px; font-weight: 600; color: var(--text-muted);
 letter-spacing: 0.2px; margin-bottom: 10px;
 display: flex; align-items: center; gap: 6px;
 }

 .observation-input-wrap { display: flex; gap: 8px; }

 .observation-input {
 flex: 1; padding: 9px 14px; border: 1.5px solid var(--card-border); border-radius: 9px;
 font-size: 13px; font-family: 'Sora', sans-serif; color: var(--text-primary);
 background: var(--surface); outline: none; transition: border-color 0.18s, box-shadow 0.18s;
 }
 .observation-input::placeholder { color: #b0c4b6; }
 .observation-input:focus { border-color: var(--green-bright); box-shadow: 0 0 0 3px rgba(34,136,63,0.09); background: #fff; }

 .btn-send-obs {
 padding: 9px 18px; background: var(--green-mid); color: #fff;
 border: none; border-radius: 9px; font-weight: 600; font-size: 13px;
 cursor: pointer; transition: background 0.15s, transform 0.12s;
 font-family: 'Sora', sans-serif; white-space: nowrap;
 }
 .btn-send-obs:hover { background: var(--green-bright); transform: translateY(-1px); }
 .btn-send-obs:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

 /* ── FOOTER ROW ── */
 .req-footer {
 display: flex; justify-content: space-between; align-items: center;
 font-size: 11px; color: var(--text-muted); font-weight: 500;
 letter-spacing: 0.3px; text-transform: uppercase;
 padding-top: 14px; margin-top: 14px; border-top: 1px solid var(--card-border);
 }
 .req-footer strong { color: var(--text-primary); font-weight: 600; text-transform: none; letter-spacing: 0; }

 /* ── EMPTY STATE ── */
 .empty-state {
 display: flex; flex-direction: column; align-items: center;
 gap: 12px; padding: 60px 20px; text-align: center;
 }
 .empty-icon {
 width: 60px; height: 60px; border-radius: 16px;
 background: var(--progress-bg); display: flex; align-items: center; justify-content: center;
 color: var(--green-muted);
 }
 .empty-state h3 {
 font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700;
 color: var(--text-primary);
 }
 .empty-state p { font-size: 13px; color: var(--text-muted); max-width: 280px; line-height: 1.7; }

 /* ── RESPONSIVE ── */
 .hamburger-btn { display: none; background: none; border: none; color: var(--text-primary); cursor: pointer; padding: 8px; border-radius: 8px; }
 .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 15; }

 @media (max-width: 768px) {
 .hamburger-btn { display: flex; align-items: center; }
 .sidebar-overlay.active { display: block; }
 .sidebar { position: fixed; top: 0; left: -260px; height: 100vh; z-index: 20; transition: left 0.25s cubic-bezier(0.22,1,0.36,1); }
 .sidebar.open { left: 0; box-shadow: 6px 0 30px rgba(0,0,0,0.22); }
 .main { width: 100vw; }
 .topbar { padding: 0 18px; }
 .content { padding: 16px; }
 .content-inner { max-width: 100%; }
 .req-card { padding: 16px; }
 .req-actions { flex-direction: column; gap: 8px; }
 .observation-input-wrap { flex-direction: column; }
 .btn-send-obs { width: 100%; }
 }
`;

interface Topic {
 id: number;
 name: string;
 type: string;
 requirements: RequirementData[];
}

interface Props {
 project: ProjectData;
 topic: Topic;
 onBack: () => void;
}

export default function ValidacaoRequisitos({ project, topic, onBack }: Props) {
 const { user, logout } = useAuth();
 const [requirements, setRequirements] = useState<RequirementData[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [observationInputs, setObservationInputs] = useState<Record<string, string>>({});
 const [showObservation, setShowObservation] = useState<Record<number, boolean>>({});
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [submittingId, setSubmittingId] = useState<number | null>(null);

 useEffect(() => { fetchRequirements(); }, [project.id, topic.type]);

 async function fetchRequirements() {
 try {
 setLoading(true); setError(null);
 const response = await requirementsApi.list(project.id);
 const topicReqs = response.requisitos.filter(r => r.tipo === topic.type);
 setRequirements(topicReqs);
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Erro ao carregar requisitos');
 } finally { setLoading(false); }
 }

 const handleApprove = async (req: RequirementData) => {
 try {
 setSubmittingId(req.id);
 await requirementsApi.createValidacao(req.id, { resultado: 'aprovado' });
 setRequirements(prev => prev.map(r => r.id === req.id ? { ...r, status: 'aprovado' } : r));
 } catch (err) { console.error('Erro ao aprovar:', err); }
 finally { setSubmittingId(null); }
 };

 const handleReject = async (req: RequirementData) => {
 try {
 setSubmittingId(req.id);
 await requirementsApi.createValidacao(req.id, { resultado: 'rejeitado' });
 setRequirements(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejeitado' } : r));
 } catch (err) { console.error('Erro ao reprovar:', err); }
 finally { setSubmittingId(null); }
 };

 const handleAddObservation = async (reqId: number) => {
 const text = observationInputs[reqId]?.trim();
 if (!text) return;
 try {
 setSubmittingId(reqId);
 await requirementsApi.createValidacao(reqId, { resultado: 'observacao', comentario: text });
 setObservationInputs(prev => ({ ...prev, [reqId]: "" }));
 } catch (err) { console.error('Erro ao adicionar observação:', err); }
 finally { setSubmittingId(null); }
 };

 const getStatusLabel = (status: string) => {
 const labels: Record<string, string> = {
 pendente: "Pendente", em_analise: "Em Revisão",
 aprovado: "Aprovado", rejeitado: "Rejeitado"
 };
 return labels[status] || status;
 };

 const statusClass = (status: string) => {
 if (status === "aprovado") return "aprovado";
 if (status === "em_analise") return "em_analise";
 if (status === "rejeitado") return "rejeitado";
 return "pendente";
 };

 const handleLogout = () => { logout(); window.location.href = "/"; };
 const getUserInitials = () => { if (!user) return "US"; return user.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); };
 const getUserName = () => user?.nome || "Usuário";
 const getUserRole = () => {
 if (!user) return "";
 const roleMap: Record<string, string> = {
 cliente: "Cliente / Validador", analista: "Analista",
 desenvolvedor: "Desenvolvedor", gestor: "Gestor"
 };
 return roleMap[user.perfil] || user.perfil;
 };

 return (
 <>
 <style>{styles}</style>
 <div className="layout">
 <div className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)} />

 {/* ── SIDEBAR ── */}
 <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
 <div className="sidebar-logo"><img src={scopeplanLogo} alt="ScopePlan" /></div>
 <nav className="sidebar-nav">
 <span className="nav-label">Menu</span>
 <button className="nav-item active" onClick={() => { setSidebarOpen(false); onBack(); }}>
 <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
 <rect x="2" y="3" width="8" height="8" rx="2"/><rect x="14" y="3" width="8" height="8" rx="2"/>
 <rect x="2" y="13" width="8" height="8" rx="2"/><rect x="14" y="13" width="8" height="8" rx="2"/>
 </svg>
 Projetos
 </button>
 <button className="nav-item">
 <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
 <path d="M9 12l2 2 4-4"/><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/>
 </svg>
 Auditoria
 </button>
 </nav>
 <div className="sidebar-user">
 <div className="user-avatar">{getUserInitials()}</div>
 <div className="user-info">
 <div className="user-name">{getUserName()}</div>
 <div className="user-role">{getUserRole()}</div>
 </div>
 <button className="btn-logout" onClick={handleLogout} title="Encerrar sessão">
 <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
 <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
 </svg>
 </button>
 </div>
 </aside>

 {/* ── MAIN ── */}
 <div className="main">
 <header className="topbar">
 <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Menu">
 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
 <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
 </svg>
 </button>
 <button className="topbar-back" onClick={onBack}>
 <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
 <path d="M19 12H5M12 5l-7 7 7 7"/>
 </svg>
 Voltar para {project.nome}
 </button>
 <div className="topbar-bottom">
 <div>
 <div className="topbar-index-label">{topic.name}</div>
 <div className="topbar-project-name">{topic.name}</div>
 <div className="topbar-accent-line" />
 <div className="topbar-client">{project.nome_cliente || "Sem cliente"}</div>
 </div>
 </div>
 </header>

 <div className="content">
 <div className="content-inner">
 <div className="section-header">
 <h2 className="section-title">{requirements.length} requisitos documentados</h2>
 </div>

 {loading ? (
 <div className="empty-state">
 <div className="empty-icon">
 <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
 <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
 </svg>
 </div>
 <h3>Carregando requisitos...</h3>
 </div>
 ) : error ? (
 <div className="empty-state">
 <div className="empty-icon">
 <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
 <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
 </svg>
 </div>
 <h3>Erro ao carregar</h3>
 <p>{error}</p>
 </div>
 ) : requirements.length > 0 ? (
 requirements.map((req, idx) => (
 <div className={`req-card status-${statusClass(req.status)}`} key={req.id}>
 {/* Header: ID badge + status */}
 <div className="req-header">
 <span className="req-id">RF-00{idx + 1}</span>
 <span className={`req-status ${statusClass(req.status)}`}>
 {getStatusLabel(req.status)}
 </span>
 </div>

 {/* Title */}
 <h3 className="req-title">{req.titulo}</h3>

 {/* Description blockquote */}
 <div className="req-desc">"{req.descricao}"</div>

 {/* Meta row */}
 <div className="req-meta-row">
 <span className="req-meta-item">
 <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
 </svg>
 Comentários (3)
 </span>
 <span className="req-meta-item">
 <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
 </svg>
 Histórico de Versões
 </span>
 </div>

 {/* Action buttons */}
 <div className="req-actions">
 <button
 className="btn-reject"
 onClick={() => handleReject(req)}
 disabled={submittingId === req.id}
 >
 <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
 <path d="M18 6L6 18M6 6l12 12"/>
 </svg>
 Reprovar
 </button>
 <button
 className="btn-approve"
 onClick={() => handleApprove(req)}
 disabled={submittingId === req.id}
 >
 <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
 <path d="M5 13l4 4L19 7"/>
 </svg>
 Aprovar
 </button>
 </div>

 {/* Footer */}
 <div className="req-footer">
 <span>Modificado por: <strong>{req.autor?.nome || "Sistema"}</strong></span>
 <span>{new Date(req.criado_em || Date.now()).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
 </div>

 {/* Observation section */}
 {showObservation[req.id] && (
 <div className="req-observations">
 <div className="observations-title">
 <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
 <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
 <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
 </svg>
 Adicionar Observação
 </div>
 <div className="observation-input-wrap">
 <input
 className="observation-input"
 placeholder="Escreva uma observação..."
 value={observationInputs[req.id] || ""}
 onChange={(e) => setObservationInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
 onKeyDown={(e) => { if (e.key === "Enter") handleAddObservation(req.id); }}
 />
 <button
 className="btn-send-obs"
 onClick={() => handleAddObservation(req.id)}
 disabled={!observationInputs[req.id]?.trim() || submittingId === req.id}
 >
 Enviar
 </button>
 </div>
 </div>
 )}
 </div>
 ))
 ) : (
 <div className="empty-state">
 <div className="empty-icon">
 <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
 <rect x="2" y="3" width="8" height="8" rx="2"/><rect x="14" y="3" width="8" height="8" rx="2"/>
 <rect x="2" y="13" width="8" height="8" rx="2"/><rect x="14" y="13" width="8" height="8" rx="2"/>
 </svg>
 </div>
 <h3>Nenhum requisito documentado</h3>
 <p>Este tópico ainda não possui requisitos para validação.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </>
 );
}