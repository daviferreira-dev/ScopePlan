import scopeplanLogo from "../../assets/scopeplan.png";
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
 color: rgba(255,255,255,0.3); padding: 10px 8px 6px;
 }

 .nav-item {
 display: flex; align-items: center; gap: 8px; padding: 9px 10px;
 border-radius: 8px; cursor: pointer; color: var(--text-sidebar);
 font-size: 13px; font-weight: 500; transition: background 0.18s, color 0.18s;
 border: none; background: none; width: 100%; text-align: left;
 }

 .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
 .nav-item.active { background: rgba(255,255,255,0.2); border-radius: 10px; color: #fff; font-weight: 600; }

 .sidebar-user {
 padding: 12px; border-top: 1px solid rgba(255,255,255,0.08);
 margin: 12px; background: rgba(0,0,0,0.15); border-radius: 12px;
 display: flex; align-items: center; gap: 8px;
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

 .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #f4f7f5; min-width: 0; }

 .topbar {
 background: #fff; border-bottom: 1px solid var(--card-border);
 padding: 0 28px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center;
 }

 .topbar-back {
 display: flex; align-items: center; gap: 6px; font-size: 12px;
 color: var(--text-muted); cursor: pointer; background: none; border: none;
 padding: 14px 0 8px; font-family: 'DM Sans', sans-serif; transition: color 0.18s; width: fit-content;
 }
 .topbar-back:hover { color: var(--green-mid); }

 .topbar-bottom {
 display: flex; align-items: flex-end; justify-content: space-between;
 padding-bottom: 16px; gap: 16px;
 }

 .topbar-index-label {
 font-size: 9px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase;
 color: var(--text-muted); margin-bottom: 6px;
 }

 .topbar-project-name {
 font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700;
 color: var(--green-mid); line-height: 1.1; margin-bottom: 4px;
 }

 .topbar-client { font-size: 13px; color: var(--text-muted); }
 .topbar-client strong { color: var(--green-mid); font-weight: 600; }

 .content { flex: 1; overflow-y: auto; padding: 28px 32px; }
 .content-inner { max-width: 900px; margin: 0 auto; }

 .section-header {
 display: flex; align-items: center; justify-content: space-between;
 margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--card-border);
 }

 .section-title {
 font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700;
 color: var(--text-primary); margin: 0; padding: 0; border: none;
 }

 .req-card {
 background: #fff; border: 1px solid var(--card-border); border-radius: 14px;
 padding: 22px 24px; margin-bottom: 16px; transition: box-shadow 0.15s;
 }
 .req-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }

 .req-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }

 .req-id {
 font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
 background: #f0f2f5; color: #4a5568; padding: 3px 10px; border-radius: 4px; letter-spacing: 0.3px;
 }

 .req-status { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 4px; }
 .req-status.approved { background: #f0f7f2; color: #2d7a40; }
 .req-status.review { background: #fef9f0; color: #b45309; }
 .req-status.pending { background: #f8f9fa; color: #6b7280; }
.req-status.rejected { background: #fef2f2; color: #b91c1c; }

 .req-title {
 font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700;
 color: var(--text-primary); margin-bottom: 10px;
 }

 .req-desc {
 font-size: 14px; color: #4a5568; line-height: 1.7;
 padding: 14px 18px; background: #fafcfa; border-radius: 8px;
 margin-bottom: 16px; border-left: 3px solid #dde8df;
 }

 .req-footer {
 display: flex; justify-content: space-between; align-items: center;
 font-size: 12px; color: var(--text-muted); padding-top: 12px; border-top: 1px solid #f0f2f5;
 }
 .req-footer strong { color: #4a5568; font-weight: 600; }

 .req-actions {
 display: flex; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid #f0f2f5;
 }

 .btn-reject {
 flex: 1; padding: 10px 16px; background: #fff; color: #b91c1c;
 border: 1.5px solid #fecaca; border-radius: 8px;
 font-weight: 600; font-size: 13px; cursor: pointer; transition: background 0.15s;
 }
 .btn-reject:hover { background: #fef2f2; }

 .btn-approve {
 flex: 1; padding: 10px 16px; background: var(--green-mid); color: #fff;
 border: none; border-radius: 8px; font-weight: 600; font-size: 13px;
 cursor: pointer; transition: background 0.15s;
 }
 .btn-approve:hover { background: var(--green-bright); }

 .btn-observation {
 flex: 1; padding: 10px 16px; background: #fff; color: #b45309;
 border: 1.5px solid #fde68a; border-radius: 8px;
 font-weight: 600; font-size: 13px; cursor: pointer; transition: background 0.15s;
 }
 .btn-observation:hover { background: #fef9f0; }

 .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
 .empty-state h3 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
 .empty-state p { font-size: 13px; }

 /* Observation section */
 .req-observations {
 margin-top: 14px; padding-top: 14px; border-top: 1px solid #f0f2f5;
 }

 .observations-title {
 font-size: 12px; font-weight: 600; color: #4a5568;
 letter-spacing: 0.2px; margin-bottom: 10px;
 display: flex; align-items: center; gap: 6px;
 }

 .observation-item {
 background: #fef9f0; border: 1px solid #fde68a; border-radius: 8px;
 padding: 10px 14px; margin-bottom: 8px; font-size: 13px; color: #4a5568; line-height: 1.5;
 }

 .observation-meta {
 font-size: 11px; color: #b45309; margin-top: 6px; font-weight: 500;
 }

 .observation-input-wrap {
 display: flex; gap: 8px; margin-top: 8px;
 }

 .observation-input {
 flex: 1; padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
 font-size: 13px; font-family: 'DM Sans', sans-serif; color: var(--text-primary);
 background: #fafcfa; outline: none; transition: border-color 0.18s, box-shadow 0.18s;
 }
 .observation-input:focus { border-color: var(--green-mid); box-shadow: 0 0 0 3px rgba(45,122,64,0.1); background: #fff; }

 .btn-send-obs {
 padding: 9px 16px; background: #b45309; color: #fff; border: none; border-radius: 8px;
 font-weight: 600; font-size: 13px; cursor: pointer; transition: background 0.15s;
 font-family: 'DM Sans', sans-serif; white-space: nowrap;
 }
 .btn-send-obs:hover { background: #92400e; }
 .btn-send-obs:disabled { opacity: 0.5; cursor: not-allowed; }

 .file-card {
 background: #fff; border: 1px solid var(--card-border); border-radius: 12px;
 padding: 16px 20px; margin-bottom: 10px; display: flex; align-items: center; gap: 14px;
 }

 .file-icon {
 width: 42px; height: 42px; border-radius: 8px; background: var(--progress-bg);
 display: flex; align-items: center; justify-content: center; color: var(--green-mid); flex-shrink: 0;
 }

 .file-info { flex: 1; min-width: 0; }
 .file-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
 .file-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

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
   .content-inner { max-width: 100%; }
   .req-card { padding: 16px 14px; }
   .req-footer { flex-direction: column; gap: 4px; align-items: flex-start; }
   .req-actions { flex-direction: column; gap: 8px; }
   .req-actions button { width: 100%; }
   .observation-input-wrap { flex-direction: column; }
   .btn-send-obs { width: 100%; }
 }

 @media (max-width: 480px) {
   .topbar-title { font-size: 18px; }
   .req-header { flex-wrap: wrap; gap: 6px; }
   .req-title { font-size: 14px; }
   .req-desc { font-size: 12.5px; }
 }
`;

interface Observation {
 id: number;
 text: string;
 author: string;
 date: string;
 time: string;
}

interface Requirement {
 id: string;
 status: "Aprovado" | "Em Revisão" | "Pendente" | "Reprovado";
 title: string;
 description: string;
 commentsCount: number;
 modifiedBy: string;
 modifiedDate: string;
 modifiedTime: string;
 observations?: Observation[];
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
 onBack: () => void;
}

function getNow(): { date: string; time: string } {
 const now = new Date();
 const date = now.toLocaleDateString("pt-BR");
 const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
 return { date, time };
}

const mockUser = {
 name: "Bruno Costa",
 role: "Cliente / Validador",
 initials: "BC",
};

export default function ValidacaoRequisitos({ project, topic, onBack }: Props) {
 const [requirements, setRequirements] = useState<Requirement[]>(topic.requirements || []);
 const [observationInputs, setObservationInputs] = useState<Record<string, string>>({});
 const [sidebarOpen, setSidebarOpen] = useState(false);

 const handleApprove = (id: string) => {
   const { date, time } = getNow();
   setRequirements((prev) =>
     prev.map((r) =>
       r.id === id ? { ...r, status: "Aprovado" as const, modifiedBy: mockUser.name, modifiedDate: date, modifiedTime: time } : r
     )
   );
 };

 const handleReject = (id: string) => {
   const { date, time } = getNow();
   setRequirements((prev) =>
     prev.map((r) =>
       r.id === id ? { ...r, status: "Reprovado" as const, modifiedBy: mockUser.name, modifiedDate: date, modifiedTime: time } : r
     )
   );
 };

 const handleAddObservation = (reqId: string) => {
   const text = observationInputs[reqId]?.trim();
   if (!text) return;
   const { date, time } = getNow();
   const newObs: Observation = {
     id: Date.now(),
     text,
     author: mockUser.name,
     date,
     time,
   };
   setRequirements((prev) =>
     prev.map((r) =>
       r.id === reqId
         ? { ...r, observations: [...(r.observations || []), newObs] }
         : r
     )
   );
   setObservationInputs((prev) => ({ ...prev, [reqId]: "" }));
 };

 const statusClass = (status: string) => {
   if (status === "Aprovado") return "approved";
   if (status === "Em Revisão") return "review";
   if (status === "Reprovado") return "rejected"; return "pending";
 };

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
           <button className="nav-item active" onClick={() => { setSidebarOpen(false); onBack(); }}>
             <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
               <rect x="2" y="3" width="8" height="8" rx="2" />
               <rect x="14" y="3" width="8" height="8" rx="2" />
               <rect x="2" y="13" width="8" height="8" rx="2" />
               <rect x="14" y="13" width="8" height="8" rx="2" />
             </svg>
             Projetos
           </button>
           <button className="nav-item">
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
           <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Menu">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
           </button>
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
             <div className="section-header">
               <h2 className="section-title">{topic.name}</h2>
             </div>

             {requirements.length > 0 ? (
               requirements.map((req) => (
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

                   {/* Ações do cliente: aprovar, reprovar, observação */}
                   <div className="req-actions">
                     <button className="btn-reject" onClick={() => handleReject(req.id)}>
                       Reprovar
                     </button>
                     <button className="btn-observation" onClick={() => setObservationInputs((prev) => ({ ...prev, [`show_${req.id}`]: !prev[`show_${req.id}`] }))}>
                       Observação
                     </button>
                     <button className="btn-approve" onClick={() => handleApprove(req.id)}>
                       Aprovar
                     </button>
                   </div>

                   {/* Seção de observações */}
                   {(req.observations && req.observations.length > 0) || observationInputs[`show_${req.id}`] ? (
                     <div className="req-observations">
                       <div className="observations-title">
                         <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                           <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                           <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                         </svg>
                         Observações
                       </div>
                       {req.observations?.map((obs) => (
                         <div className="observation-item" key={obs.id}>
                           {obs.text}
                           <div className="observation-meta">
                             {obs.author} • {obs.date} {obs.time}
                           </div>
                         </div>
                       ))}
                       <div className="observation-input-wrap">
                         <input
                           className="observation-input"
                           placeholder="Escreva uma observação..."
                           value={observationInputs[req.id] || ""}
                           onChange={(e) =>
                             setObservationInputs((prev) => ({ ...prev, [req.id]: e.target.value }))
                           }
                           onKeyDown={(e) => {
                             if (e.key === "Enter") handleAddObservation(req.id);
                           }}
                         />
                         <button
                           className="btn-send-obs"
                           onClick={() => handleAddObservation(req.id)}
                           disabled={!observationInputs[req.id]?.trim()}
                         >
                           Enviar
                         </button>
                       </div>
                     </div>
                   ) : null}
                 </div>
               ))
             ) : (
               <div className="empty-state">
                 <h3>Nenhum requisito documentado</h3>
                 <p>Este tópico ainda não possui requisitos para validação.</p>
               </div>
             )}

             {topic.files && topic.files.length > 0 && (
               <>
                 <h2
                   className="section-title"
                   style={{ marginTop: "36px", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--card-border)" }}
                 >
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
                   </div>
                 ))}
               </>
             )}
           </div>
         </div>
       </div>
     </div>
   </>
 );
}
