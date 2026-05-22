import React, { useState, useEffect } from "react";
import { auditApi, projectsApi, type AuditLogData, type ProjectData } from "../../services/api";

const styles = `
 @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap');

 :root {
 --green-deep: #0d3320;
 --green-mid: #1a6634;
 --green-bright: #22883f;
 --green-light: #34c45a;
 --green-muted: #4a9e63;
 --card-border: rgba(34,136,63,0.10);
 --text-primary: #0d2016;
 --text-muted: #7a9882;
 --progress-bg: #e6f5eb;
 --surface: #f7faf8;
 --surface-2: #eef5f0;
 }

 /* ── Filters ── */
 .aud-filters {
 display: flex; gap: 10px; flex-wrap: wrap;
 margin-bottom: 28px; align-items: center;
 }

 .aud-filter-select {
 padding: 9px 32px 9px 12px;
 border: 1.5px solid rgba(34,136,63,0.15);
 border-radius: 10px;
 font-family: 'Sora', sans-serif;
 font-size: 12.5px; font-weight: 500;
 color: var(--text-primary);
 background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%237a9882'/%3E%3C/svg%3E") no-repeat right 12px center;
 -webkit-appearance: none; -moz-appearance: none; appearance: none;
 cursor: pointer; outline: none;
 transition: border-color 0.2s, box-shadow 0.2s;
 min-width: 148px;
 }

 .aud-filter-select:focus {
 border-color: var(--green-bright);
 box-shadow: 0 0 0 3px rgba(34,136,63,0.09);
 }

 .aud-filter-date {
 padding: 9px 12px;
 border: 1.5px solid rgba(34,136,63,0.15);
 border-radius: 10px;
 font-family: 'Sora', sans-serif;
 font-size: 12.5px; font-weight: 500;
 color: var(--text-primary);
 background: #fff; outline: none;
 transition: border-color 0.2s, box-shadow 0.2s;
 }

 .aud-filter-date:focus {
 border-color: var(--green-bright);
 box-shadow: 0 0 0 3px rgba(34,136,63,0.09);
 }

 .aud-search-wrap {
 position: relative; flex: 1; min-width: 180px;
 }

 .aud-search-icon {
 position: absolute; left: 12px; top: 50%;
 transform: translateY(-50%); color: #b0c4b6; pointer-events: none;
 }

 .aud-search {
 width: 100%; padding: 9px 12px 9px 38px;
 border: 1.5px solid rgba(34,136,63,0.15);
 border-radius: 10px;
 font-family: 'Sora', sans-serif;
 font-size: 12.5px; color: var(--text-primary);
 background: #fff; outline: none;
 transition: border-color 0.2s, box-shadow 0.2s;
 font-weight: 400;
 }

 .aud-search::placeholder { color: #b0c4b6; }

 .aud-search:focus {
 border-color: var(--green-bright);
 box-shadow: 0 0 0 3px rgba(34,136,63,0.09);
 background: #fff;
 }

 /* ── Timeline ── */
 .aud-timeline { position: relative; padding-left: 44px; }

 .aud-timeline::before {
 content: ''; position: absolute;
 left: 18px; top: 20px; bottom: 20px;
 width: 1.5px;
 background: linear-gradient(to bottom, rgba(34,136,63,0.25), rgba(34,136,63,0.06));
 border-radius: 2px;
 }

 .aud-event {
 position: relative; padding-bottom: 14px;
 animation: audFadeUp 0.38s cubic-bezier(0.22,1,0.36,1) both;
 }

 .aud-event:last-child { padding-bottom: 0; }

 @keyframes audFadeUp {
 from { opacity: 0; transform: translateY(8px); }
 to { opacity: 1; transform: translateY(0); }
 }

 .aud-event-dot {
 position: absolute; left: -44px; top: 16px;
 width: 28px; height: 28px; border-radius: 50%;
 display: flex; align-items: center; justify-content: center;
 z-index: 2; border: 2.5px solid var(--surface);
 box-shadow: 0 2px 8px rgba(0,0,0,0.10);
 }

 .aud-event-dot svg { width: 13px; height: 13px; }

 /* ── Event card ── */
 .aud-event-card {
 background: #fff; border: 1px solid var(--card-border);
 border-radius: 14px; padding: 16px 20px;
 cursor: pointer; transition: box-shadow 0.2s, transform 0.18s, border-color 0.2s;
 position: relative; overflow: hidden;
 }

 .aud-event-card::before {
 content: ''; position: absolute;
 top: 0; left: 0; right: 0; height: 2px;
 border-radius: 14px 14px 0 0; opacity: 0;
 transition: opacity 0.2s;
 }

 .aud-event-card:hover {
 box-shadow: 0 8px 24px rgba(26,102,52,0.10);
 transform: translateY(-1px);
 border-color: rgba(52,196,90,0.22);
 }

 .aud-event-card:hover::before { opacity: 1; }

 .aud-event-top {
 display: flex; align-items: center; gap: 10px;
 margin-bottom: 6px; flex-wrap: wrap;
 }

 .aud-event-type {
 font-family: 'Sora', sans-serif;
 font-size: 10.5px; font-weight: 600;
 padding: 3px 9px; border-radius: 6px; letter-spacing: 0.3px;
 }

 .aud-event-id {
 font-size: 11px; font-weight: 700;
 color: #fff; background: var(--green-mid);
 padding: 2px 8px; border-radius: 5px;
 font-family: 'Sora', sans-serif;
 }

 .aud-event-time {
 font-size: 11px; color: var(--text-muted);
 margin-left: auto; white-space: nowrap;
 font-weight: 500; letter-spacing: 0.3px;
 }

 .aud-event-desc {
 font-size: 12.5px; color: #4a6655;
 line-height: 1.55; margin-bottom: 10px; font-weight: 400;
 }

 .aud-event-bottom {
 display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
 }

 .aud-event-author {
 font-size: 11.5px; color: var(--text-muted);
 display: flex; align-items: center; gap: 4px; font-weight: 400;
 }

 .aud-event-project-badge {
 font-family: 'Sora', sans-serif;
 font-size: 10.5px; font-weight: 700;
 padding: 3px 10px; border-radius: 6px;
 letter-spacing: 0.3px; text-transform: uppercase;
 }

 /* ── Detail Modal ── */
 .modal-overlay {
 position: fixed; inset: 0;
 display: flex; align-items: center; justify-content: center;
 background: rgba(8,20,12,0.60); backdrop-filter: blur(7px);
 z-index: 50; padding: 24px;
 }

 .modal {
 width: min(100%, 500px); background: #fff;
 border-radius: 20px; padding: 28px;
 box-shadow: 0 32px 64px rgba(0,0,0,0.16);
 position: relative; border: 1px solid var(--card-border);
 }

 .modal-title {
 font-family: 'Playfair Display', serif;
 font-size: 20px; font-weight: 700;
 color: var(--text-primary); margin-bottom: 4px;
 }

 .modal-subtitle {
 font-size: 12.5px; color: var(--text-muted); margin-bottom: 22px;
 }

 .modal-divider { height: 1px; background: var(--card-border); margin: 16px 0; }

 .modal-actions { display: flex; justify-content: flex-end; margin-top: 20px; }

 .btn-cancel {
 padding: 10px 22px; background: var(--progress-bg);
 color: var(--green-mid); border: 1px solid rgba(34,136,63,0.14);
 border-radius: 10px; font-family: 'Sora', sans-serif;
 font-size: 13px; font-weight: 600; cursor: pointer;
 transition: background 0.18s, transform 0.15s;
 }
 .btn-cancel:hover { background: #d4eddb; transform: translateY(-1px); }

 .aud-detail-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }

 .aud-detail-label {
 font-size: 9px; font-weight: 700; letter-spacing: 2px;
 text-transform: uppercase; color: var(--text-muted);
 }

 .aud-detail-value {
 font-size: 13.5px; color: var(--text-primary);
 line-height: 1.5; font-family: 'Sora', sans-serif;
 }

 .aud-detail-type {
 display: inline-block; font-size: 12px; font-weight: 600;
 padding: 4px 12px; border-radius: 7px;
 }

 /* ── Pagination ── */
 .aud-pagination {
 display: flex; justify-content: center; align-items: center;
 gap: 8px; margin-top: 20px;
 }

 .aud-page-btn {
 padding: 8px 16px; border: 1.5px solid var(--card-border);
 border-radius: 8px; background: #fff;
 font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
 color: var(--text-primary); cursor: pointer;
 transition: background 0.15s, border-color 0.15s;
 }

 .aud-page-btn:hover:not(:disabled) {
 background: var(--progress-bg); border-color: var(--green-mid);
 }

 .aud-page-btn:disabled { opacity: 0.45; cursor: not-allowed; }

 .aud-page-info {
 padding: 8px 12px; font-size: 13px;
 color: var(--text-muted); font-weight: 500;
 }

 /* ── Empty / Loading states ── */
 .aud-empty {
 display: flex; flex-direction: column; align-items: center;
 justify-content: center; gap: 14px; padding: 60px 20px; text-align: center;
 }

 .aud-empty-icon {
 width: 56px; height: 56px; border-radius: 16px;
 background: var(--progress-bg);
 display: flex; align-items: center; justify-content: center;
 color: var(--green-muted);
 }

 .aud-empty-title {
 font-family: 'Playfair Display', serif;
 font-size: 18px; font-weight: 700; color: var(--text-primary);
 }

 .aud-empty-sub {
 font-size: 13px; color: var(--text-muted);
 max-width: 280px; line-height: 1.7;
 }

 .aud-loading {
 display: flex; flex-direction: column; align-items: center;
 justify-content: center; gap: 12px; padding: 60px 20px;
 }

 .aud-loading-spinner {
 width: 28px; height: 28px;
 border: 2.5px solid var(--progress-bg); border-top-color: var(--green-bright);
 border-radius: 50%; animation: spin 0.75s linear infinite;
 }

 @keyframes spin { to { transform: rotate(360deg); } }

 .aud-loading-text {
 font-size: 13px; color: var(--text-muted); font-family: 'Sora', sans-serif;
 }

 /* ── Responsive ── */
 @media (max-width: 768px) {
 .aud-filters { gap: 8px; }
 .aud-filter-select { min-width: 110px; font-size: 12px; }
 .aud-search-wrap { min-width: 120px; flex: 1 1 100%; }
 .aud-event-card { padding: 13px 14px; }
 .aud-event-time { margin-left: 0; width: 100%; }
 .aud-timeline { padding-left: 34px; }
 .aud-timeline::before { left: 14px; }
 .aud-event-dot { left: -34px; width: 24px; height: 24px; }
 .modal { padding: 24px 18px; margin: 12px; }
 }

 @media (max-width: 480px) {
 .aud-filters { flex-direction: column; }
 .aud-filter-select, .aud-search-wrap { width: 100%; }
 .aud-filter-date { width: 100%; }
 }
`;

/* ── Color mapping ── */
type ActionType = "criacao" | "edicao" | "aprovacao" | "reprovacao" | "comentario" | "anexo" | "autenticacao" | "permissao" | "exclusao" | "atualizacao" | "status";

const TYPE_COLORS: Record<ActionType, { bg: string; text: string; dot: string; accent: string }> = {
 criacao: { bg: "#e6f9ec", text: "#1a7a36", dot: "#22883f", accent: "#34c45a" },
 edicao: { bg: "#f0e8fc", text: "#7c3aed", dot: "#8b5cf6", accent: "#a78bfa" },
 atualizacao: { bg: "#f0e8fc", text: "#7c3aed", dot: "#8b5cf6", accent: "#a78bfa" },
 aprovacao: { bg: "#e0f8e8", text: "#166534", dot: "#22c55e", accent: "#4ade80" },
 reprovacao: { bg: "#fde8ea", text: "#be123c", dot: "#f43f5e", accent: "#fb7185" },
 comentario: { bg: "#e8f4fd", text: "#1e6fa8", dot: "#3b82f6", accent: "#60a5fa" },
 anexo: { bg: "#e4f0fb", text: "#1e40af", dot: "#3b82f6", accent: "#93c5fd" },
 autenticacao: { bg: "#f0f2f5", text: "#4b5563", dot: "#6b7280", accent: "#9ca3af" },
 permissao: { bg: "#fef3e2", text: "#92400e", dot: "#f59e0b", accent: "#fbbf24" },
 exclusao: { bg: "#fce4e4", text: "#7f1d1d", dot: "#dc2626", accent: "#f87171" },
 status: { bg: "#e8f4fd", text: "#1e6fa8", dot: "#3b82f6", accent: "#60a5fa" },
};

const ACTION_LABELS: Record<ActionType, string> = {
 criacao: "Requisito criado",
 edicao: "Requisito editado",
 atualizacao: "Registro atualizado",
 aprovacao: "Requisito aprovado",
 reprovacao: "Requisito reprovado",
 comentario: "Comentário adicionado",
 anexo: "Documento anexado",
 autenticacao: "Novo utilizador autenticado",
 permissao: "Permissão alterada",
 exclusao: "Exclusão realizada",
 status: "Status atualizado",
};

const ENTITY_LABELS: Record<string, string> = {
 requisito: "Requisito",
 projeto: "Projeto",
 usuario: "Usuário",
 validacao: "Validação",
 documento: "Documento",
};

/* ── Icons ── */
const TYPE_ICONS: Record<ActionType, React.ReactNode> = {
 criacao: (
 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path d="M12 5v14M5 12h14"/></svg>
 ),
 edicao: (
 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
 ),
 atualizacao: (
 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
 ),
 aprovacao: (
 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
 ),
 reprovacao: (
 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12"/><circle cx="12" cy="12" r="10"/></svg>
 ),
 comentario: (
 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
 ),
 anexo: (
 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
 ),
 autenticacao: (
 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
 ),
 permissao: (
 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
 ),
 exclusao: (
 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
 ),
 status: (
 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
 ),
};

const formatDateTime = (dateString: string): { dateLabel: string; timeLabel: string } => {
 const date = new Date(dateString);
 const timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
 const now = new Date();
 const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
 if (diffDays === 0) return { dateLabel: "Hoje", timeLabel };
 if (diffDays === 1) return { dateLabel: "Ontem", timeLabel };
 return { dateLabel: date.toLocaleDateString('pt-BR'), timeLabel };
};

const getActionType = (acao: string): ActionType => {
 if (acao in TYPE_COLORS) return acao as ActionType;
 return "atualizacao";
};

export default function Auditoria() {
 const [events, setEvents] = useState<AuditLogData[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [filterProject, setFilterProject] = useState("");
 const [filterType, setFilterType] = useState("");
 const [dateFrom, setDateFrom] = useState("");
 const [dateTo, setDateTo] = useState("");
 const [searchText, setSearchText] = useState("");
 const [selectedEvent, setSelectedEvent] = useState<AuditLogData | null>(null);
 const [projects, setProjects] = useState<ProjectData[]>([]);
 const [page, setPage] = useState(1);
 const [totalPages, setTotalPages] = useState(1);

 useEffect(() => {
 Promise.all([fetchAuditLogs(), fetchProjects()]);
 }, []);

 useEffect(() => {
 fetchAuditLogs();
 }, [page, filterProject, filterType, dateFrom, dateTo]);

 async function fetchProjects() {
 try {
 const response = await projectsApi.list();
 setProjects(response.projetos || []);
 } catch (err) {
 console.error("Erro ao carregar projetos:", err);
 }
 }

 async function fetchAuditLogs() {
 try {
 setLoading(true); setError(null);
 const filters: Record<string, string> = {};
 if (filterProject) filters.projeto_id = String(parseInt(filterProject) || "");
 if (filterType) filters.acao = filterType;
 if (dateFrom) filters.data_inicio = dateFrom;
 if (dateTo) filters.data_fim = dateTo;

 const response = await auditApi.list(page, 20, filters);
 setEvents(response.audit_logs || []);
 setTotalPages(response.pages || 1);
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Erro ao carregar auditoria');
 } finally {
 setLoading(false);
 }
 }

 const getProjectName = (projetoId: number | null): string => {
 if (!projetoId) return "—";
 const p = projects.find(proj => proj.id === projetoId);
 return p?.nome || `Projeto #${projetoId}`;
 };

 const getDescription = (ev: AuditLogData): string => {
 if (ev.detalhes) {
 try {
 const parsed = JSON.parse(ev.detalhes);
 if (parsed.description) return parsed.description;
 } catch {}
 }
 return `${ENTITY_LABELS[ev.entidade_tipo] || ev.entidade_tipo} #${ev.entidade_id} — ${ev.acao}`;
 };

 // Client-side search filter (backend does not support busca param)
 const displayedEvents = searchText.trim()
 ? events.filter((ev) => {
 const q = searchText.toLowerCase();
 return (
 (ev.detalhes?.toLowerCase().includes(q) ?? false) ||
 ev.acao.toLowerCase().includes(q) ||
 (ev.usuario?.nome?.toLowerCase().includes(q) ?? false) ||
 ev.entidade_tipo.toLowerCase().includes(q) ||
 getProjectName(ev.projeto_id).toLowerCase().includes(q)
 );
 })
 : events;

 return (
 <>
 <style>{styles}</style>

 {/* Filters */}
 <div className="aud-filters">
 <select
 className="aud-filter-select"
 value={filterProject}
 onChange={(e) => { setFilterProject(e.target.value); setPage(1); }}
 >
 <option value="">Todos os Projetos</option>
 {projects.map((p) => (
 <option key={p.id} value={p.id}>{p.nome}</option>
 ))}
 </select>

 <select
 className="aud-filter-select"
 value={filterType}
 onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
 >
 <option value="">Todos os Tipos</option>
 {Object.entries(ACTION_LABELS).map(([k, v]) => (
 <option key={k} value={k}>{v}</option>
 ))}
 </select>

 <input
 type="date"
 className="aud-filter-date"
 value={dateFrom}
 onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
 placeholder="De"
 title="Data inicial"
 />
 <input
 type="date"
 className="aud-filter-date"
 value={dateTo}
 onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
 placeholder="Até"
 title="Data final"
 />

 <div className="aud-search-wrap">
 <span className="aud-search-icon">
 <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

 {/* Loading */}
 {loading && (
 <div className="aud-loading">
 <div className="aud-loading-spinner" />
 <span className="aud-loading-text">Carregando registros...</span>
 </div>
 )}

 {/* Timeline */}
 {!loading && error ? (
 <div className="aud-empty">
 <div className="aud-empty-icon">
 <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
 <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
 </svg>
 </div>
 <div className="aud-empty-title">Erro ao carregar auditoria</div>
 <div className="aud-empty-sub">{error}</div>
 </div>
 ) : !loading && events.length === 0 ? (
 <div className="aud-empty">
 <div className="aud-empty-icon">
 <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
 <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
 </svg>
 </div>
 <div className="aud-empty-title">Nenhum evento encontrado</div>
 <div className="aud-empty-sub">Tente ajustar os filtros ou a busca para encontrar registros de auditoria.</div>
 </div>
 ) : !loading && (
 <div className="aud-timeline">
 {displayedEvents.map((ev, i) => {
 const actionType = getActionType(ev.acao);
 const colors = TYPE_COLORS[actionType];
 const { dateLabel, timeLabel } = formatDateTime(ev.criado_em);
 const itemId = `${ENTITY_LABELS[ev.entidade_tipo] || ev.entidade_tipo} #${ev.entidade_id}`;
 const description = getDescription(ev);
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
 {TYPE_ICONS[actionType]}
 </div>

 <div className="aud-event-card" onClick={() => setSelectedEvent(ev)}>
 <style>{`.aud-event-card:hover::before { background: linear-gradient(90deg, ${colors.dot}, ${colors.accent}); }`}</style>

 <div className="aud-event-top">
 <span
 className="aud-event-type"
 style={{ background: colors.bg, color: colors.text }}
 >
 {ACTION_LABELS[actionType] || ev.acao}
 </span>
 <span className="aud-event-id">{itemId}</span>
 <span className="aud-event-time">
 {timeLabel} &bull; {dateLabel}
 </span>
 </div>

 <div className="aud-event-desc">{description}</div>

 <div className="aud-event-bottom">
 <span className="aud-event-author">
 <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
 <circle cx="12" cy="7" r="4" />
 </svg>
 {ev.usuario?.nome || "Sistema"}
 </span>
 <span
 className="aud-event-project-badge"
 style={{ background: colors.bg, color: colors.text }}
 >
 {getProjectName(ev.projeto_id)}
 </span>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="aud-pagination">
 <button
 className="aud-page-btn"
 disabled={page === 1}
 onClick={() => setPage(p => p - 1)}
 >
 Anterior
 </button>
 <span className="aud-page-info">
 Página {page} de {totalPages}
 </span>
 <button
 className="aud-page-btn"
 disabled={page >= totalPages}
 onClick={() => setPage(p => p + 1)}
 >
 Próxima
 </button>
 </div>
 )}

 {/* Detail Modal */}
 {selectedEvent && (() => {
 const actionType = getActionType(selectedEvent.acao);
 const colors = TYPE_COLORS[actionType];
 return (
 <div
 className="modal-overlay"
 onClick={(e) => e.target === e.currentTarget && setSelectedEvent(null)}
 >
 <div className="modal">
 <div className="modal-title">Detalhes do Evento</div>
 <div className="modal-subtitle">Informações completas da ação registrada.</div>
 <div className="modal-divider" />

 <div className="aud-detail-row">
 <span className="aud-detail-label">Tipo da Ação</span>
 <span
 className="aud-detail-type"
 style={{ background: colors.bg, color: colors.text }}
 >
 {ACTION_LABELS[actionType] || selectedEvent.acao}
 </span>
 </div>

 <div className="aud-detail-row">
 <span className="aud-detail-label">Identificador</span>
 <span className="aud-detail-value">
 <strong>{ENTITY_LABELS[selectedEvent.entidade_tipo] || selectedEvent.entidade_tipo} #{selectedEvent.entidade_id}</strong>
 </span>
 </div>

 <div className="aud-detail-row">
 <span className="aud-detail-label">Descrição</span>
 <span className="aud-detail-value">{getDescription(selectedEvent)}</span>
 </div>

 {selectedEvent.detalhes && (
 <div className="aud-detail-row">
 <span className="aud-detail-label">Detalhamento</span>
 <span className="aud-detail-value">{selectedEvent.detalhes}</span>
 </div>
 )}

 <div className="aud-detail-row">
 <span className="aud-detail-label">Autor</span>
 <span className="aud-detail-value">{selectedEvent.usuario?.nome || "Sistema"}</span>
 </div>

 <div className="aud-detail-row">
 <span className="aud-detail-label">Projeto</span>
 <span className="aud-detail-value">{getProjectName(selectedEvent.projeto_id)}</span>
 </div>

 <div className="aud-detail-row">
 <span className="aud-detail-label">Data e Horário</span>
 <span className="aud-detail-value">
 {(() => {
 const { timeLabel, dateLabel } = formatDateTime(selectedEvent.criado_em);
 return `${timeLabel} \u2022 ${dateLabel}`;
 })()}
 </span>
 </div>

 <div className="modal-actions">
 <button className="btn-cancel" onClick={() => setSelectedEvent(null)}>
 Fechar
 </button>
 </div>
 </div>
 </div>
 );
 })()}
 </>
 );
}
