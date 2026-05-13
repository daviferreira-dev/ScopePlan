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
    display: flex; width: 100vw; height: 100vh;
    overflow: hidden; position: fixed; top: 0; left: 0;
  }

  .sidebar {
    width: 220px; min-width: 220px;
    background: #2e7d32;
    display: flex; flex-direction: column;
    flex-shrink: 0; position: relative; z-index: 20;
  }

  .sidebar-logo {
    padding: 24px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .sidebar-logo img { width: 150px; filter: brightness(0) invert(1); opacity: 0.95; }

  .sidebar-nav {
    flex: 1; padding: 12px 8px;
    display: flex; flex-direction: column; gap: 2px; overflow-y: auto;
  }

  .nav-label {
    font-size: 8px; font-weight: 600; letter-spacing: 2px;
    text-transform: uppercase; color: rgba(255,255,255,0.3); padding: 10px 8px 6px;
  }

  .nav-item {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 10px; border-radius: 8px; cursor: pointer;
    color: var(--text-sidebar); font-size: 13px; font-weight: 500;
    transition: background 0.18s, color 0.18s;
    border: none; background: none; width: 100%; text-align: left;
  }

  .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
  .nav-item.active { background: rgba(255,255,255,0.2); border-radius: 10px; color: #fff; font-weight: 600; }

  .sidebar-user {
    padding: 12px;
    border-top: 1px solid rgba(255,255,255,0.08); margin: 12px; background: rgba(0,0,0,0.15); border-radius: 12px;
    display: flex; align-items: center; gap: 8px;
  }

  .user-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--green-light);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: var(--green-deep); flex-shrink: 0;
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
    background: none; border: none; color: rgba(255,255,255,0.35);
    cursor: pointer; padding: 4px; border-radius: 6px;
    transition: color 0.2s, background 0.2s;
    display: flex; align-items: center; flex-shrink: 0;
  }

  .btn-logout:hover { color: #ff8080; background: rgba(255,100,100,0.1); }

  .main {
    flex: 1; display: flex; flex-direction: column;
    overflow: hidden; background: #f4f7f5; min-width: 0;
  }

  .topbar {
    background: #fff; border-bottom: 1px solid var(--card-border);
    padding: 0 28px; flex-shrink: 0;
    display: flex; flex-direction: column; justify-content: center;
  }

  .topbar-back {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--text-muted); cursor: pointer;
    background: none; border: none; padding: 14px 0 8px;
    font-family: 'DM Sans', sans-serif; transition: color 0.18s; width: fit-content;
  }

  .topbar-back:hover { color: var(--green-mid); }

  .topbar-bottom {
    display: flex; align-items: flex-end;
    justify-content: space-between; padding-bottom: 16px; gap: 16px;
  }

  .topbar-index-label {
    font-size: 9px; font-weight: 600; letter-spacing: 2.5px;
    text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;
  }

  .topbar-project-name {
    font-family: 'Fraunces', serif; font-size: 26px;
    font-weight: 700; color: var(--green-mid); line-height: 1.1; margin-bottom: 4px;
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
    font-family: 'Fraunces', serif; font-size: 20px;
    font-weight: 700; color: var(--text-primary); margin: 0; padding: 0; border: none;
  }

  .btn-add-req {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px; background: var(--green-mid); color: #fff;
    border: none; border-radius: 8px; font-weight: 600; font-size: 13px;
    cursor: pointer; transition: background 0.15s, transform 0.1s;
    font-family: 'DM Sans', sans-serif;
  }

  .btn-add-req:hover { background: var(--green-bright); transform: translateY(-1px); }
  .btn-add-req:active { transform: translateY(0); }

  .req-card {
    background: #fff; border: 1px solid var(--card-border);
    border-radius: 14px; padding: 22px 24px; margin-bottom: 16px;
    transition: box-shadow 0.15s;
  }

  .req-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }

  .req-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }

  .req-id {
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
    background: #f0f2f5; color: #4a5568; padding: 3px 10px;
    border-radius: 4px; letter-spacing: 0.3px;
  }

  .req-status { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 4px; }
  .req-status.approved { background: #f0f7f2; color: #2d7a40; }
  .req-status.review { background: #fef9f0; color: #b45309; }
  .req-status.pending { background: #f8f9fa; color: #6b7280; }

  .req-title {
    font-family: 'Fraunces', serif; font-size: 17px;
    font-weight: 700; color: var(--text-primary); margin-bottom: 10px;
  }

  .req-desc {
    font-size: 14px; color: #4a5568; line-height: 1.7;
    padding: 14px 18px; background: #fafcfa; border-radius: 8px;
    margin-bottom: 16px; border-left: 3px solid #dde8df;
  }

  .req-footer {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 12px; color: var(--text-muted);
    padding-top: 12px; border-top: 1px solid #f0f2f5;
  }

  .req-footer strong { color: #4a5568; font-weight: 600; }

  .req-actions {
    display: flex; gap: 10px;
    margin-top: 14px; padding-top: 14px; border-top: 1px solid #f0f2f5;
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

  .file-card {
    background: #fff; border: 1px solid var(--card-border);
    border-radius: 12px; padding: 16px 20px; margin-bottom: 10px;
    display: flex; align-items: center; gap: 14px;
  }

  .file-icon {
    width: 42px; height: 42px; border-radius: 8px;
    background: var(--progress-bg);
    display: flex; align-items: center; justify-content: center;
    color: var(--green-mid); flex-shrink: 0;
  }

  .file-info { flex: 1; min-width: 0; }
  .file-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
  .file-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

  .file-remove {
    background: none; border: none; color: #c4d4c8; cursor: pointer;
    padding: 4px; border-radius: 6px; transition: color 0.2s; display: flex;
  }

  .file-remove:hover { color: #e05555; }

  .upload-area {
    border: 2px dashed #c4dbc9; border-radius: 14px; padding: 48px 32px;
    text-align: center; cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    background: #fafcfa; margin-bottom: 20px;
  }

  .upload-area:hover { border-color: var(--green-mid); background: #f0f7f2; }
  .upload-area.dragover { border-color: var(--green-mid); background: #e6f4ea; }

  .upload-icon {
    width: 48px; height: 48px; border-radius: 12px;
    background: var(--progress-bg);
    display: flex; align-items: center; justify-content: center;
    color: var(--green-mid); margin: 0 auto 14px;
  }

  .upload-title { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
  .upload-subtitle { font-size: 12px; color: var(--text-muted); }

  .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
  .empty-state h3 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
  .empty-state p { font-size: 13px; }

  /* MODAL */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(10, 30, 15, 0.45);
    backdrop-filter: blur(3px);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 24px;
    animation: fadeIn 0.18s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .modal {
    background: #fff; border-radius: 18px; width: 100%; max-width: 540px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .modal-header {
    padding: 22px 26px 18px; border-bottom: 1px solid var(--card-border);
    display: flex; align-items: center; justify-content: space-between;
  }

  .modal-title {
    font-family: 'Fraunces', serif; font-size: 19px;
    font-weight: 700; color: var(--text-primary);
  }

  .modal-close {
    background: #f4f7f5; border: none; width: 32px; height: 32px;
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text-muted); transition: background 0.15s, color 0.15s;
  }

  .modal-close:hover { background: #fce8e8; color: #b91c1c; }

  .modal-body {
    padding: 22px 26px; display: flex; flex-direction: column; gap: 16px;
    max-height: 65vh; overflow-y: auto;
  }

  .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }

  .form-label { font-size: 12px; font-weight: 600; color: #4a5568; letter-spacing: 0.2px; }

  .form-input,
  .form-select,
  .form-textarea {
    width: 100%; padding: 10px 14px;
    border: 1.5px solid #e2e8f0; border-radius: 9px;
    font-size: 14px; font-family: 'DM Sans', sans-serif;
    color: var(--text-primary); background: #fafcfa;
    transition: border-color 0.18s, box-shadow 0.18s; outline: none;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    border-color: var(--green-mid);
    box-shadow: 0 0 0 3px rgba(45,122,64,0.1);
    background: #fff;
  }

  .form-textarea { resize: vertical; min-height: 90px; line-height: 1.6; }

  .form-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a9982' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center;
    padding-right: 34px; cursor: pointer;
  }

  .modal-footer {
    padding: 16px 26px 22px; display: flex; gap: 10px;
    justify-content: flex-end; border-top: 1px solid var(--card-border);
  }

  .btn-cancel {
    padding: 10px 20px; background: #f4f7f5; color: #4a5568;
    border: none; border-radius: 8px; font-weight: 600; font-size: 13px;
    cursor: pointer; transition: background 0.15s; font-family: 'DM Sans', sans-serif;
  }

  .btn-cancel:hover { background: #e8ece9; }

  .btn-save {
    padding: 10px 22px; background: var(--green-mid); color: #fff;
    border: none; border-radius: 8px; font-weight: 600; font-size: 13px;
    cursor: pointer; transition: background 0.15s; font-family: 'DM Sans', sans-serif;
  }

  .btn-save:hover { background: var(--green-bright); }
  .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

 /* ── Responsive ── */
 .hamburger-btn {
   display: none;
   background: none;
   border: none;
   color: var(--text-primary);
   cursor: pointer;
   padding: 8px;
   border-radius: 8px;
   -webkit-tap-highlight-color: transparent;
 }
 .hamburger-btn:hover { background: rgba(0,0,0,0.05); }

 .sidebar-overlay {
   display: none;
   position: fixed;
   inset: 0;
   background: rgba(0,0,0,0.4);
   z-index: 15;
 }

 @media (max-width: 768px) {
   .hamburger-btn { display: flex; align-items: center; }
   .sidebar-overlay.active { display: block; }
   .sidebar {
     position: fixed; top: 0; left: -260px;
     height: 100vh; z-index: 20;
     transition: left 0.25s cubic-bezier(0.22, 1, 0.36, 1);
     box-shadow: none;
   }
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
   .file-card { flex-wrap: wrap; gap: 8px; }
   .modal { padding: 24px 18px 20px; margin: 12px; }
   .modal-body { max-height: 55vh; }
 }

 @media (max-width: 480px) {
   .topbar-title { font-size: 18px; }
   .req-header { flex-wrap: wrap; gap: 6px; }
   .req-title { font-size: 14px; }
   .req-desc { font-size: 12.5px; }
   .upload-area { padding: 24px 14px; }
   .modal { border-radius: 14px; }
   .modal-title { font-size: 18px; }
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

function getIdPrefix(topicName: string): string {
  const n = normalizeStr(topicName);
  if (n.includes("nao funcional")) return "RNF";
  return "RF";
}

function generateId(requirements: Requirement[], prefix: string): string {
  const nums = requirements
    .filter((r) => r.id.startsWith(prefix))
    .map((r) => parseInt(r.id.replace(/\D/g, ""), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

function getNow(): { date: string; time: string } {
  const now = new Date();
  const date = now.toLocaleDateString("pt-BR");
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

const EMPTY_FORM = {
  title: "",
  description: "",
  status: "Pendente" as Requirement["status"],
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

export default function ValidacaoRequisitos({
  project,
  topic,
  userRole,
  userName,
  onBack,
  onUploadFiles,
  onRemoveFile,
}: Props) {
  const [requirements, setRequirements] = useState<Requirement[]>(topic.requirements || []);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isCliente = userRole === "Cliente / Validador";
  const isAnalista = userRole === "Analista de Sistemas";
  const canAddRequirements = isAnalista && isRequirementTopic(topic.name);

  const handleApprove = (id: string) =>
    setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Aprovado" as const } : r)));

  const handleReject = (id: string) =>
    setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Em Revisão" as const } : r)));

  const statusClass = (status: string) => {
    if (status === "Aprovado") return "approved";
    if (status === "Em Revisão") return "review";
    return "pending";
  };

  const handleSaveRequirement = (data: typeof EMPTY_FORM) => {
    const prefix = getIdPrefix(topic.name);
    const { date, time } = getNow();
    const newReq: Requirement = {
      id: generateId(requirements, prefix),
      title: data.title,
      description: data.description,
      status: data.status,
      modifiedBy: userName,
      modifiedDate: date,
      modifiedTime: time,
      commentsCount: 0,
    };
    setRequirements((prev) => [...prev, newReq]);
    setShowModal(false);
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

  return (
    <>
      <style>{styles}</style>
      <div className="layout">
        {/* Mobile sidebar overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <img src="./src/assets/scopeplan.png" alt="ScopePlan" />
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
              {isAnalista && onUploadFiles && (
                <>
                  <h2
                    className="section-title"
                    style={{ marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--card-border)" }}
                  >
                    Adicionar Arquivos
                  </h2>
                  <div
                    className={`upload-area ${dragOver ? "dragover" : ""}`}
                    onDrop={handleDrop}
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
                      onChange={handleFileChange}
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
                  ))
                ) : (
                  <div className="empty-state">
                    <h3>Nenhum requisito documentado</h3>
                    <p>
                      {canAddRequirements
                        ? 'Clique em "Adicionar Requisito" para comecar.'
                        : "Este topico ainda nao possui requisitos."}
                    </p>
                  </div>
                )}
              </div>

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
                      <button
                        className="file-remove"
                        onClick={() => onRemoveFile?.(topic.id, file.id)}
                        title="Remover arquivo"
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </>
              )}
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