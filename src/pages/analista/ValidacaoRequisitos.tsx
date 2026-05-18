import scopeplanLogo from "../../assets/scopeplan.png";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { requirementsApi, type RequirementData, type ProjectData } from "../../services/api";

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
 font-size: 12px; font-weight: 500; color: var(--text-muted); cursor: pointer;
 background: none; border: none; padding: 16px 0 8px;
 font-family: 'Sora', sans-serif; transition: color 0.18s; width: fit-content;
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
 font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 900;
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
 font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700;
 color: var(--text-primary);
 }

 .section-count {
 font-size: 12px; color: var(--text-muted); font-weight: 400;
 background: var(--progress-bg); padding: 3px 10px; border-radius: 99px;
 }

 .btn-add-req {
 display: flex; align-items: center; gap: 6px;
 padding: 8px 16px; background: var(--green-mid); color: #fff;
 border: none; border-radius: 10px; font-weight: 600; font-size: 13px;
 cursor: pointer; transition: background 0.15s, transform 0.1s;
 font-family: 'Sora', sans-serif;
 }
 .btn-add-req:hover { background: var(--green-bright); transform: translateY(-1px); }
 .btn-add-req:active { transform: translateY(0); }

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
 }

 .req-footer {
 display: flex; justify-content: space-between; align-items: center;
 font-size: 11px; color: var(--text-muted); font-weight: 500;
 letter-spacing: 0.3px; text-transform: uppercase;
 padding-top: 14px; margin-top: 14px; border-top: 1px solid var(--card-border);
 }
 .req-footer strong { color: var(--text-primary); font-weight: 600; text-transform: none; letter-spacing: 0; }

 .req-actions { display: flex; gap: 10px; margin-top: 14px; }

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

 /* ── UPLOAD AREA ── */
 .upload-area {
 border: 2px dashed rgba(34,136,63,0.2); border-radius: 16px;
 padding: 48px 32px; text-align: center; cursor: pointer;
 transition: border-color 0.2s, background 0.2s;
 background: var(--surface); margin-bottom: 20px;
 }
 .upload-area:hover { border-color: var(--green-mid); background: var(--surface-2); }
 .upload-area.dragover { border-color: var(--green-bright); background: var(--progress-bg); }

 .upload-icon {
 width: 56px; height: 56px; border-radius: 16px;
 background: var(--progress-bg); display: flex; align-items: center; justify-content: center;
 color: var(--green-mid); margin: 0 auto 14px;
 }

 .upload-title { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; font-family: 'Sora', sans-serif; }
 .upload-subtitle { font-size: 12px; color: var(--text-muted); }

 /* ── EMPTY STATE ── */
 .empty-state {
 display: flex; flex-direction: column; align-items: center; gap: 12px;
 padding: 60px 20px; text-align: center;
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

 /* ── MODAL ── */
 .modal-overlay {
 position: fixed; inset: 0;
 background: rgba(8,20,12,0.60); backdrop-filter: blur(7px);
 display: flex; align-items: center; justify-content: center;
 z-index: 100; padding: 24px;
 animation: fadeIn 0.18s ease;
 }

 @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

 .modal {
 background: #fff; border-radius: 20px; width: 100%; max-width: 540px;
 box-shadow: 0 32px 64px rgba(0,0,0,0.16);
 animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
 overflow: hidden; border: 1px solid var(--card-border);
 }

 @keyframes slideUp {
 from { opacity: 0; transform: translateY(24px) scale(0.97); }
 to { opacity: 1; transform: translateY(0) scale(1); }
 }

 .modal-header {
 padding: 22px 26px 18px; border-bottom: 1px solid var(--card-border);
 display: flex; align-items: center; justify-content: space-between;
 }

 .modal-title {
 font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 700;
 color: var(--text-primary);
 }

 .modal-close {
 background: var(--surface); border: none; width: 32px; height: 32px;
 border-radius: 8px; display: flex; align-items: center; justify-content: center;
 cursor: pointer; color: var(--text-muted); transition: background 0.15s, color 0.15s;
 }
 .modal-close:hover { background: #fce8e8; color: #b91c1c; }

 .modal-body {
 padding: 22px 26px; display: flex; flex-direction: column; gap: 16px;
 max-height: 65vh; overflow-y: auto;
 }

 .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }

 .form-label { font-size: 12px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.2px; }

 .form-input, .form-select, .form-textarea {
 width: 100%; padding: 10px 14px;
 border: 1.5px solid rgba(34,136,63,0.15); border-radius: 9px;
 font-size: 14px; font-family: 'Sora', sans-serif;
 color: var(--text-primary); background: var(--surface);
 transition: border-color 0.18s, box-shadow 0.18s; outline: none;
 }
 .form-input:focus, .form-select:focus, .form-textarea:focus {
 border-color: var(--green-bright);
 box-shadow: 0 0 0 3px rgba(34,136,63,0.09);
 background: #fff;
 }

 .form-textarea { resize: vertical; min-height: 90px; line-height: 1.6; }

 .form-select {
 appearance: none;
 background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a9882' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
 background-repeat: no-repeat; background-position: right 12px center;
 padding-right: 34px; cursor: pointer;
 }

 .modal-footer {
 padding: 16px 26px 22px; display: flex; gap: 10px;
 justify-content: flex-end; border-top: 1px solid var(--card-border);
 }

 .btn-cancel {
 padding: 10px 22px; background: var(--progress-bg);
 color: var(--green-mid); border: 1px solid rgba(34,136,63,0.14);
 border-radius: 10px; font-family: 'Sora', sans-serif;
 font-size: 13px; font-weight: 600; cursor: pointer;
 transition: background 0.18s, transform 0.15s;
 }
 .btn-cancel:hover { background: #d4eddb; transform: translateY(-1px); }

 .btn-save {
 padding: 10px 22px; background: var(--green-mid); color: #fff;
 border: none; border-radius: 10px; font-family: 'Sora', sans-serif;
 font-weight: 600; font-size: 13px; cursor: pointer;
 transition: background 0.15s, transform 0.12s;
 }
 .btn-save:hover { background: var(--green-bright); transform: translateY(-1px); }
 .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

 /* ── Responsive ── */
 .hamburger-btn { display: none; background: none; border: none; color: var(--text-primary); cursor: pointer; padding: 8px; border-radius: 8px; }
 .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 15; }

 @media (max-width: 768px) {
 .hamburger-btn { display: flex; align-items: center; }
 .sidebar-overlay.active { display: block; }
 .sidebar {
 position: fixed; top: 0; left: -260px; height: 100vh; z-index: 20;
 transition: left 0.25s cubic-bezier(0.22,1,0.36,1);
 }
 .sidebar.open { left: 0; box-shadow: 6px 0 30px rgba(0,0,0,0.22); }
 .main { width: 100vw; }
 .topbar { padding: 0 18px; }
 .content { padding: 16px; }
 .content-inner { max-width: 100%; }
 .req-card { padding: 16px; }
 .req-footer { flex-direction: column; gap: 4px; align-items: flex-start; }
 .req-actions { flex-direction: column; gap: 8px; }
 .req-actions button { width: 100%; }
 .modal { margin: 12px; }
 .modal-body { max-height: 55vh; }
 }

 @media (max-width: 480px) {
 .req-header { flex-wrap: wrap; gap: 6px; }
 .req-title { font-size: 14px; }
 .req-desc { font-size: 12.5px; }
 .upload-area { padding: 24px 14px; }
 .modal { border-radius: 14px; }
 .modal-title { font-size: 18px; }
 }
`;

interface Props {
 project: ProjectData;
 topic: { id: number; name: string; type: string; requirements: RequirementData[] };
 onBack: () => void;
}

// Aceita qualquer nome de topico que contenha "funcional" (RF e RNF)
function normalizeStr(s: string): string {
 const map: Record<string, string> = {
 a: "a", á: "a", ã: "a", â: "a", à: "a",
 e: "e", é: "e", ê: "e",
 i: "i", í: "i",
 o: "o", ó: "o", õ: "o", ô: "o",
 u: "u", ú: "u", ü: "u",
 c: "c", ç: "c", n: "n", ñ: "n",
 };
 return s.toLowerCase().split("").map((c) => map[c] ?? c).join("");
}

function isRequirementTopic(name: string): boolean {
 return normalizeStr(name).includes("requisitos");
}

const EMPTY_FORM = {
 title: "",
 description: "",
 status: "Pendente" as string,
};

function AddRequirementModal({
 topicName,
 onClose,
 onSave,
}: {
 topicName: string;
 onClose: () => void;
 onSave: (data: typeof EMPTY_FORM) => void;
}) {
 const [form, setForm] = useState({ ...EMPTY_FORM });

 const set =
 (field: keyof typeof EMPTY_FORM) =>
 (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
 setForm((prev) => ({ ...prev, [field]: e.target.value }));

 const isValid = form.title.trim() !== "" && form.description.trim() !== "";

 return (
 <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
 <div className="modal">
 <div className="modal-header">
 <span className="modal-title">Novo Requisito — {topicName}</span>
 <button className="modal-close" onClick={onClose} aria-label="Fechar">
 <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
 <path d="M18 6L6 18M6 6l12 12" />
 </svg>
 </button>
 </div>

 <div className="modal-body">
 <div className="form-group">
 <label className="form-label">Nome / Título *</label>
 <input
 className="form-input"
 placeholder="Ex: Autenticação Múltipla"
 value={form.title}
 onChange={set("title")}
 />
 </div>

 <div className="form-group">
 <label className="form-label">Descrição *</label>
 <textarea
 className="form-textarea"
 placeholder="Descreva o requisito em detalhe..."
 value={form.description}
 onChange={set("description")}
 />
 </div>

 <div className="form-group">
 <label className="form-label">Status</label>
 <select className="form-select" value={form.status} onChange={set("status")}>
 <option value="Pendente">Pendente</option>
 <option value="Em Revisão">Em Revisão</option>
 <option value="Aprovado">Aprovado</option>
 </select>
 </div>
 </div>

 <div className="modal-footer">
 <button className="btn-cancel" onClick={onClose}>
 Cancelar
 </button>
 <button className="btn-save" onClick={() => isValid && onSave(form)} disabled={!isValid}>
 Salvar Requisito
 </button>
 </div>
 </div>
 </div>
 );
}

export default function ValidacaoRequisitos({ project, topic, onBack }: Props) {
 const { user, isAnalista: isAnalistaAuth, isCliente: isClienteAuth, logout } = useAuth();
 const navigate = useNavigate();

 const [requirements, setRequirements] = useState<RequirementData[]>(topic.requirements || []);
 const [loadingAction, setLoadingAction] = useState<number | null>(null);
 const [showModal, setShowModal] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [dragOver, setDragOver] = useState(false);
 const [sidebarOpen, setSidebarOpen] = useState(false);

 const isCliente = isClienteAuth;
 const isAnalista = isAnalistaAuth;
 const canAddRequirements = isAnalista && isRequirementTopic(topic.name);

 const handleApprove = async (reqId: number) => {
 setLoadingAction(reqId);
 try {
 await requirementsApi.createValidacao(reqId, { resultado: "aprovado" });
 setRequirements(prev => prev.map(r => r.id === reqId ? { ...r, status: "aprovado" } : r));
 } catch (err: any) {
 console.error("Erro ao aprovar:", err.message);
 } finally {
 setLoadingAction(null);
 }
 };

 const handleReject = async (reqId: number) => {
 setLoadingAction(reqId);
 try {
 await requirementsApi.createValidacao(reqId, { resultado: "rejeitado" });
 setRequirements(prev => prev.map(r => r.id === reqId ? { ...r, status: "em_revisao" } : r));
 } catch (err: any) {
 console.error("Erro ao rejeitar:", err.message);
 } finally {
 setLoadingAction(null);
 }
 };

 const statusClass = (status: string) => {
 if (status === "aprovado") return "aprovado";
 if (status === "em_revisao") return "em_analise";
 if (status === "rejeitado") return "rejeitado";
 return "pendente";
 };

 const statusLabel = (status: string) => {
 if (status === "aprovado") return "Aprovado";
 if (status === "em_revisao") return "Em Revisão";
 if (status === "rascunho") return "Pendente";
 if (status === "rejeitado") return "Rejeitado";
 if (status === "implementado") return "Implementado";
 return status;
 };

 const handleSaveRequirement = async (data: typeof EMPTY_FORM) => {
 try {
 const statusMap: Record<string, string> = {
 "Pendente": "rascunho",
 "Em Revisão": "em_revisao",
 "Aprovado": "aprovado",
 };
 const tipoMap: Record<number, string> = {
 1: "funcional",
 2: "negocio",
 3: "nao_funcional",
 4: "restricao"
 };
 const tipo = tipoMap[topic.id] || topic.type || "funcional";
 await requirementsApi.create({
 titulo: data.title,
 descricao: data.description,
 projeto_id: project.id,
 tipo,
 status: statusMap[data.status] || "rascunho",
 });
 // Refresh requirements from API
 const res = await requirementsApi.list(project.id);
 setRequirements(res.requisitos.filter(r => r.tipo === tipo));
 setShowModal(false);
 } catch (err: any) {
 console.error("Erro ao criar requisito:", err.message);
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

 const handleLogout = () => { logout(); navigate("/"); };

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
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
 </button>
 <button className="topbar-back" onClick={onBack}>
 <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
 <path d="M19 12H5M12 5l-7 7 7 7" />
 </svg>
 Voltar ao Índice
 </button>
 <div className="topbar-bottom">
 <div>
 <div className="topbar-index-label">{topic.name}</div>
 <div className="topbar-project-name">{project.nome}</div>
 <div className="topbar-accent-line" />
 <div className="topbar-client">
 {project.nome_cliente || "Sem cliente"}
 </div>
 </div>
 </div>
 </header>

 <div className="content">
 <div className="content-inner">
 {isAnalista && (
 <>
 <h2
 className="section-title"
 style={{ marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--card-border)" }}
 >
 Adicionar Arquivos
 </h2>
 <div
 className={`upload-area ${dragOver ? "dragover" : ""}`}
 onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
 onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
 onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
 onClick={() => fileInputRef.current?.click()}
 >
 <div className="upload-icon">
 <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
 <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
 </svg>
 </div>
 <div className="upload-title">Arraste arquivos ou clique para enviar</div>
 <div className="upload-subtitle">PDF, DOCX, XLSX, PNG - ate 20 MB por arquivo</div>
 <input
 type="file"
 multiple
 ref={fileInputRef}
 style={{ display: "none" }}
 />
 </div>
 </>
 )}

 <div style={{ marginTop: isAnalista ? "36px" : "0" }}>
 <div className="section-header">
 <h2 className="section-title">{topic.name}</h2>
 {canAddRequirements && (
 <button className="btn-add-req" onClick={() => setShowModal(true)}>
 <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
 <path d="M12 5v14M5 12h14" />
 </svg>
 Adicionar Requisito
 </button>
 )}
 </div>

 {requirements.length > 0 ? (
 requirements.map((req) => (
 <div className={`req-card status-${statusClass(req.status)}`} key={req.id}>
 <div className="req-header">
 <span className="req-id">{req.codigo || req.id}</span>
 <span className={`req-status ${statusClass(req.status)}`}>{statusLabel(req.status)}</span>
 </div>
 <h3 className="req-title">{req.titulo}</h3>
 <div className="req-desc">
 <p>{req.descricao}</p>
 </div>
 <div className="req-footer">
 <span>
 Modificado por: <strong>{req.autor?.nome || "Desconhecido"}</strong>
 </span>
 <span>
 {new Date(req.atualizado_em).toLocaleDateString("pt-BR")} • {new Date(req.atualizado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
 </span>
 </div>
 {isCliente && (
 <div className="req-actions">
 <button className="btn-reject" onClick={() => handleReject(req.id)} disabled={loadingAction === req.id}>
 {loadingAction === req.id ? "Rejeitando..." : "Reprovar"}
 </button>
 <button className="btn-approve" onClick={() => handleApprove(req.id)} disabled={loadingAction === req.id}>
 {loadingAction === req.id ? "Aprovando..." : "Aprovar"}
 </button>
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
 <p>
 {canAddRequirements
 ? 'Clique em "Adicionar Requisito" para comecar.'
 : "Este topico ainda nao possui requisitos."}
 </p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>

 {showModal && (
 <AddRequirementModal
 topicName={topic.name}
 onClose={() => setShowModal(false)}
 onSave={handleSaveRequirement}
 />
 )}
 </>
 );
}
