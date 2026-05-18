import scopeplanLogo from "../../assets/scopeplan.png";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { projectsApi, authApi, type ProjectData } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import ProjectDetail from "./Tela_Itens";
import Auditoria from "./Auditoria";

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
 --sidebar-width: 230px;
 --card-bg: #ffffff;
 --card-border: rgba(34,136,63,0.10);
 --text-primary: #0d2016;
 --text-muted: #7a9882;
 --text-sidebar: rgba(255,255,255,0.6);
 --progress-bg: #e6f5eb;
 --surface: #f7faf8;
 --surface-2: #eef5f0;
 }

 html, body {
 height: 100%;
 width: 100%;
 margin: 0;
 padding: 0;
 font-family: 'Sora', sans-serif;
 background: var(--surface);
 color: var(--text-primary);
 overflow: hidden;
 }

 #root { height: 100%; width: 100%; }

 .layout {
 display: flex;
 width: 100vw;
 height: 100vh;
 overflow: hidden;
 position: fixed;
 top: 0;
 left: 0;
 }

 /* ── SIDEBAR ── */
 .sidebar {
 width: var(--sidebar-width);
 min-width: var(--sidebar-width);
 background: var(--sidebar-bg);
 display: flex;
 flex-direction: column;
 flex-shrink: 0;
 position: relative;
 z-index: 20;
 overflow: hidden;
 }

 /* subtle grain overlay on sidebar */
 .sidebar::before {
 content: '';
 position: absolute;
 inset: 0;
 background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
 pointer-events: none;
 z-index: 0;
 }

 .sidebar > * { position: relative; z-index: 1; }

 /* vertical accent line */
 .sidebar::after {
 content: '';
 position: absolute;
 top: 0; right: 0; bottom: 0;
 width: 1px;
 background: linear-gradient(180deg, transparent, rgba(52,196,90,0.25) 40%, rgba(52,196,90,0.1) 80%, transparent);
 z-index: 2;
 }

 .sidebar-logo {
 padding: 28px 22px 22px;
 border-bottom: 1px solid rgba(255,255,255,0.06);
 }

 .sidebar-logo img {
 width: 140px;
 filter: brightness(0) invert(1);
 opacity: 0.9;
 }

 .sidebar-nav {
 flex: 1;
 padding: 16px 12px;
 display: flex;
 flex-direction: column;
 gap: 3px;
 overflow-y: auto;
 }

 .nav-label {
 font-size: 8.5px;
 font-weight: 700;
 letter-spacing: 2.5px;
 text-transform: uppercase;
 color: rgba(255,255,255,0.2);
 padding: 10px 8px 8px;
 margin-top: 6px;
 }

 .nav-item {
 display: flex;
 align-items: center;
 gap: 10px;
 padding: 10px 12px;
 border-radius: 10px;
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
 position: relative;
 }

 .nav-item:hover {
 background: rgba(255,255,255,0.07);
 color: rgba(255,255,255,0.9);
 }

 .nav-item.active {
 background: rgba(52,196,90,0.15);
 color: #5fdb7f;
 font-weight: 600;
 }

 /* left accent bar for active */
 .nav-item.active::before {
 content: '';
 position: absolute;
 left: 0; top: 25%; bottom: 25%;
 width: 3px;
 border-radius: 0 3px 3px 0;
 background: var(--green-light);
 }

 .nav-item svg { flex-shrink: 0; }

 .sidebar-user {
 margin: 12px;
 padding: 12px;
 border-top: 1px solid rgba(255,255,255,0.06);
 display: flex;
 align-items: center;
 gap: 10px;
 background: rgba(255,255,255,0.04);
 border-radius: 12px;
 border: 1px solid rgba(255,255,255,0.06);
 }

 .user-avatar {
 width: 34px; height: 34px;
 border-radius: 50%;
 background: linear-gradient(135deg, var(--green-bright), var(--green-light));
 display: flex; align-items: center; justify-content: center;
 font-size: 11px; font-weight: 700; color: #fff;
 flex-shrink: 0;
 box-shadow: 0 2px 8px rgba(52,196,90,0.35);
 }

 .user-info { flex: 1; overflow: hidden; min-width: 0; }
 .user-name { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
 .user-role { font-size: 10px; color: rgba(255,255,255,0.35); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }

 .btn-logout {
 background: none; border: none;
 color: rgba(255,255,255,0.25);
 cursor: pointer; padding: 5px; border-radius: 7px;
 transition: color 0.2s, background 0.2s;
 display: flex; align-items: center; flex-shrink: 0;
 }
 .btn-logout:hover { color: #ff8080; background: rgba(255,80,80,0.12); }

 /* ── MAIN ── */
 .main {
 flex: 1; display: flex; flex-direction: column;
 overflow: hidden;
 background: var(--surface);
 min-width: 0;
 }

 /* ── TOPBAR ── */
 .topbar {
 padding: 36px 36px 20px;
 display: flex;
 align-items: flex-start;
 justify-content: space-between;
 background: transparent;
 gap: 12px;
 }

 .topbar-left { display: flex; flex-direction: column; gap: 2px; }

 .topbar-title {
 font-family: 'Playfair Display', serif;
 font-size: 30px;
 font-weight: 900;
 color: var(--green-mid);
 letter-spacing: -0.5px;
 line-height: 1.1;
 }

 .topbar-subtitle {
 font-size: 12.5px;
 color: var(--text-muted);
 font-weight: 400;
 margin-top: 5px;
 letter-spacing: 0.01em;
 }

 /* decorative underline below title */
 .topbar-title-wrap {
 display: flex; flex-direction: column; gap: 6px;
 }

 .title-accent-line {
 width: 44px; height: 3px; border-radius: 99px;
 background: linear-gradient(90deg, var(--green-bright), var(--green-light));
 }

 /* ── CONTENT ── */
 .content { flex: 1; overflow-y: auto; padding: 4px 36px 36px; }

 /* ── STATS ROW ── */
 .stats-row {
 display: flex;
 gap: 14px;
 margin-bottom: 28px;
 animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
 }

 .stat-pill {
 display: flex; align-items: center; gap: 8px;
 background: #fff;
 border: 1px solid var(--card-border);
 border-radius: 12px;
 padding: 10px 16px;
 font-size: 12px;
 color: var(--text-muted);
 font-weight: 500;
 }

 .stat-pill strong {
 font-size: 16px; font-weight: 700; color: var(--text-primary);
 font-family: 'Sora', sans-serif;
 }

 .stat-dot {
 width: 8px; height: 8px; border-radius: 50%;
 background: var(--green-light);
 box-shadow: 0 0 0 3px rgba(52,196,90,0.2);
 }

 /* ── PROJECTS GRID ── */
 .projects-grid {
 display: grid;
 grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
 gap: 18px;
 animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
 }

 @keyframes fadeUp {
 from { opacity: 0; transform: translateY(14px); }
 to { opacity: 1; transform: translateY(0); }
 }

 /* ── PROJECT CARD ── */
 .project-card {
 background: #fff;
 border: 1px solid var(--card-border);
 border-radius: 18px;
 padding: 22px 22px 18px;
 cursor: pointer;
 transition: box-shadow 0.22s, transform 0.18s, border-color 0.2s;
 position: relative;
 overflow: hidden;
 }

 /* top accent stripe */
 .project-card::before {
 content: '';
 position: absolute;
 top: 0; left: 0; right: 0;
 height: 3px;
 background: linear-gradient(90deg, var(--green-mid), var(--green-light));
 opacity: 0;
 transition: opacity 0.2s;
 border-radius: 18px 18px 0 0;
 }

 .project-card:hover {
 box-shadow: 0 10px 36px rgba(26,102,52,0.11);
 transform: translateY(-3px);
 border-color: rgba(52,196,90,0.25);
 }

 .project-card:hover::before { opacity: 1; }

 .card-header {
 display: flex; align-items: flex-start; justify-content: space-between;
 margin-bottom: 16px;
 }

 .card-icon {
 width: 40px; height: 40px; border-radius: 11px;
 background: var(--progress-bg);
 display: flex; align-items: center; justify-content: center;
 color: var(--green-mid);
 }

 .card-badge {
 font-size: 10px; font-weight: 600;
 padding: 3px 9px; border-radius: 99px;
 background: var(--progress-bg);
 color: var(--green-mid);
 letter-spacing: 0.5px;
 text-transform: uppercase;
 }

 .card-name {
 font-family: 'Playfair Display', serif;
 font-size: 16px; font-weight: 700;
 color: var(--text-primary);
 margin-bottom: 4px; line-height: 1.3;
 }

 .card-client {
 font-size: 11.5px; color: var(--text-muted);
 margin-bottom: 20px; font-weight: 400;
 display: flex; align-items: center; gap: 5px;
 }

 .card-client-dot {
 width: 4px; height: 4px; border-radius: 50%;
 background: var(--green-muted); opacity: 0.5;
 }

 .card-progress-header {
 display: flex; justify-content: space-between; align-items: baseline;
 margin-bottom: 7px;
 }

 .card-progress-label {
 font-size: 10px; font-weight: 600;
 letter-spacing: 1px; text-transform: uppercase;
 color: var(--text-muted);
 }

 .card-progress-pct {
 font-size: 14px; font-weight: 700;
 color: var(--green-mid);
 font-family: 'Sora', sans-serif;
 }

 .progress-bar-bg {
 height: 5px; background: var(--progress-bg);
 border-radius: 99px; overflow: hidden;
 margin-bottom: 16px;
 }

 .progress-bar-fill {
 height: 100%;
 background: linear-gradient(90deg, var(--green-mid), var(--green-light));
 border-radius: 99px;
 transition: width 0.7s cubic-bezier(0.22,1,0.36,1);
 }

 .card-footer {
 display: flex; align-items: center; justify-content: space-between;
 }

 .card-updated {
 font-size: 10.5px; color: #b0c4b6;
 display: flex; align-items: center; gap: 5px;
 }

 .card-menu {
 background: none; border: none; cursor: pointer;
 color: #cdd9d1; padding: 4px 6px; border-radius: 7px;
 transition: color 0.18s, background 0.18s;
 display: flex; align-items: center; justify-content: center;
 }
 .card-menu:hover { color: var(--text-muted); background: var(--surface-2); }

 /* ── EMPTY / LOADING STATES ── */
 .empty-state {
 display: flex; flex-direction: column;
 align-items: center; justify-content: center;
 gap: 14px; padding: 80px 20px;
 text-align: center;
 animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
 }

 .empty-icon {
 width: 68px; height: 68px; border-radius: 18px;
 background: var(--progress-bg);
 display: flex; align-items: center; justify-content: center;
 color: var(--green-muted); margin-bottom: 8px;
 }

 .empty-title {
 font-family: 'Playfair Display', serif;
 font-size: 20px; font-weight: 700; color: var(--text-primary);
 }

 .empty-subtitle {
 font-size: 13px; color: var(--text-muted);
 max-width: 300px; line-height: 1.7;
 }

 .btn-empty-create {
 margin-top: 8px;
 display: flex; align-items: center; gap: 8px;
 padding: 12px 24px;
 background: linear-gradient(135deg, var(--green-bright), var(--green-light));
 color: #fff; border: none; border-radius: 12px;
 font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600;
 cursor: pointer;
 box-shadow: 0 4px 14px rgba(34,136,63,0.30);
 transition: box-shadow 0.2s, transform 0.15s, filter 0.2s;
 }
 .btn-empty-create:hover {
 box-shadow: 0 6px 20px rgba(34,136,63,0.40);
 transform: translateY(-1px);
 filter: brightness(1.05);
 }

 /* ── PLACEHOLDER PAGE ── */
 .placeholder-page {
 display: flex; flex-direction: column;
 align-items: center; justify-content: center;
 height: 100%; gap: 12px; color: var(--text-muted);
 }
 .placeholder-page svg { opacity: 0.25; }
 .placeholder-page h2 {
 font-family: 'Playfair Display', serif;
 font-size: 20px; color: var(--text-primary); opacity: 0.35;
 }
 .placeholder-page p { font-size: 13px; opacity: 0.45; }

 /* ── NEW PROJECT BUTTON ── */
 .btn-new-project {
 display: flex; align-items: center; gap: 8px;
 background: linear-gradient(135deg, var(--green-bright), var(--green-light));
 color: #fff; border: none; border-radius: 12px;
 padding: 11px 20px;
 font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
 cursor: pointer;
 box-shadow: 0 4px 14px rgba(34,136,63,0.30);
 transition: box-shadow 0.2s, transform 0.15s, filter 0.2s;
 white-space: nowrap; flex-shrink: 0;
 }
 .btn-new-project:hover {
 box-shadow: 0 6px 20px rgba(34,136,63,0.40);
 transform: translateY(-1px);
 filter: brightness(1.05);
 }
 .btn-new-project:active { transform: translateY(0); }

 /* ── MODAL ── */
 .modal-overlay {
 position: fixed; inset: 0;
 background: rgba(0,0,0,0.40);
 backdrop-filter: blur(6px);
 z-index: 100;
 display: flex; align-items: center; justify-content: center;
 padding: 20px;
 animation: fadeIn 0.2s ease both;
 }

 @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

 .modal {
 background: #fff; border-radius: 20px;
 padding: 36px 32px 28px;
 width: 100%; max-width: 440px;
 box-shadow: 0 24px 60px rgba(0,0,0,0.20);
 animation: slideUp 0.25s cubic-bezier(0.22,1,0.36,1) both;
 }

 @keyframes slideUp {
 from { opacity: 0; transform: translateY(20px); }
 to { opacity: 1; transform: translateY(0); }
 }

 .modal-title {
 font-family: 'Playfair Display', serif;
 font-size: 20px; font-weight: 700;
 color: var(--text-primary); margin-bottom: 6px;
 }

 .modal-subtitle { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }

 .modal-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }

 .modal-label {
 font-size: 10px; font-weight: 700;
 letter-spacing: 2px; text-transform: uppercase;
 color: var(--text-muted);
 }

 .modal-input {
 padding: 11px 14px;
 border: 1.5px solid #dde8df;
 border-radius: 10px;
 font-family: 'Sora', sans-serif; font-size: 14px;
 color: var(--text-primary); outline: none;
 transition: border-color 0.2s, box-shadow 0.2s;
 background: #fafcfa; width: 100%;
 -webkit-appearance: none;
 }

 .modal-input::placeholder { color: #b0c4b6; }

 .modal-input:focus {
 border-color: var(--green-mid);
 box-shadow: 0 0 0 3px rgba(26,102,52,0.10);
 background: #fff;
 }

 .modal-actions { display: flex; gap: 10px; margin-top: 24px; }

 .btn-cancel {
 flex: 1; padding: 12px;
 background: var(--surface-2); border: none;
 border-radius: 10px;
 font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600;
 color: var(--text-muted); cursor: pointer;
 transition: background 0.18s;
 }
 .btn-cancel:hover { background: #e4ece6; color: var(--text-primary); }

 .btn-confirm {
 flex: 1; padding: 12px;
 background: linear-gradient(135deg, var(--green-bright), var(--green-light));
 border: none; border-radius: 10px;
 font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600;
 color: #fff; cursor: pointer;
 box-shadow: 0 4px 14px rgba(34,136,63,0.30);
 transition: box-shadow 0.2s, transform 0.15s, filter 0.2s;
 }
 .btn-confirm:hover {
 box-shadow: 0 6px 20px rgba(34,136,63,0.40);
 transform: translateY(-1px);
 filter: brightness(1.05);
 }
 .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; transform: none; filter: none; }

 /* ── RESPONSIVE ── */
 .hamburger-btn {
 display: none; background: none; border: none;
 color: var(--text-primary); cursor: pointer;
 padding: 8px; border-radius: 8px;
 -webkit-tap-highlight-color: transparent;
 }
 .hamburger-btn:hover { background: rgba(0,0,0,0.05); }
 .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 15; }

 @media (max-width: 768px) {
 .hamburger-btn { display: flex; align-items: center; }
 .sidebar-overlay.active { display: block; }
 .sidebar {
 position: fixed; top: 0; left: -260px;
 height: 100vh; z-index: 20;
 transition: left 0.25s cubic-bezier(0.22,1,0.36,1);
 }
 .sidebar.open { left: 0; box-shadow: 6px 0 30px rgba(0,0,0,0.22); }
 .main { width: 100vw; }
 .topbar { padding: 20px 18px; gap: 10px; flex-wrap: wrap; }
 .topbar-title { font-size: 24px; }
 .content { padding: 0 18px 18px; }
 .projects-grid { grid-template-columns: 1fr; gap: 14px; }
 .stats-row { flex-wrap: wrap; }
 .empty-state { padding: 40px 16px; }
 .modal { padding: 24px 18px 20px; margin: 12px; }
 }

 @media (max-width: 480px) {
 .topbar-title { font-size: 20px; }
 .btn-new-project svg { display: none; }
 .project-card { padding: 16px 16px 14px; }
 .card-name { font-size: 14px; }
 .modal { border-radius: 14px; }
 .modal-title { font-size: 18px; }
 }
`;

type Page = "projetos" | "auditoria";

export default function Tela_Projetos() {
 const navigate = useNavigate();
 const { user, logout } = useAuth();
 const [activePage, setActivePage] = useState<Page>("projetos");
 const [projects, setProjects] = useState<ProjectData[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [showModal, setShowModal] = useState(false);
 const [newProjectName, setNewProjectName] = useState("");
 const [newProjectClient, setNewProjectClient] = useState("");
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [clientes, setClientes] = useState<{ id: number; nome: string; email: string }[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<number | "novo" | "">("");
 const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

 useEffect(() => {
 fetchProjects();
 }, []);

 const fetchProjects = async () => {
 try {
 setLoading(true);
 setError(null);
 const response = await projectsApi.list();
 setProjects(response.projetos);
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Erro ao carregar projetos');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 if (showModal) {
 authApi.listClientes().then(data => setClientes(data.clientes)).catch(() => {});
 }
 }, [showModal]);

 const handleLogout = () => {
 logout();
 navigate("/");
 };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      let cliente_id: number | undefined;
      let nome_cliente: string | undefined;
      if (selectedClienteId === "novo") {
        nome_cliente = newProjectClient.trim() || undefined;
      } else if (selectedClienteId) {
        cliente_id = selectedClienteId;
        const cli = clientes.find(c => c.id === selectedClienteId);
        nome_cliente = cli?.nome;
      }
      await projectsApi.create({
        nome: newProjectName.trim(),
        nome_cliente,
        cliente_id,
      });
      setNewProjectName("");
      setNewProjectClient("");
      setSelectedClienteId("");
      setShowModal(false);
      fetchProjects();
    } catch (err: any) {
      console.error("Erro ao criar projeto:", err.message);
    }
  };

  const openModal = () => {
    setNewProjectName("");
    setNewProjectClient("");
    setSelectedClienteId("");
    setShowModal(true);
  };

 const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "agora mesmo";
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return "ontem";
  if (diffDays < 30) return `há ${diffDays} dias`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "há 1 mês";
  return `há ${diffMonths} meses`;
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

 const calculateProgress = (project: ProjectData) => {
 if (project.requisitos_count === 0) return 0;
 return Math.round((project.aprovados_count / project.requisitos_count) * 100);
 };

 const getUserInitials = () => {
 if (!user?.nome) return "AN";
 return user.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
 };

 const getUserRole = () => {
 if (user?.perfil === "analista") return "Analista de Sistemas";
 return user?.perfil || "";
 };

 if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
 }

 const totalRequisitos = projects.reduce((s, p) => s + p.requisitos_count, 0);
 const totalAprovados = projects.reduce((s, p) => s + p.aprovados_count, 0);

 return (
 <>
 <style>{styles}</style>
 <div className="layout">
 {/* Mobile sidebar overlay */}
 <div className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)} />

 {/* ── SIDEBAR ── */}
 <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
 <div className="sidebar-logo">
 <img src={scopeplanLogo} alt="ScopePlan" />
 </div>

 <nav className="sidebar-nav">
 <span className="nav-label">Menu</span>

 <button
 className={`nav-item ${activePage === "projetos" ? "active" : ""}`}
 onClick={() => { setActivePage("projetos"); setSidebarOpen(false); }}
 >
 <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
 <rect x="2" y="3" width="8" height="8" rx="2" />
 <rect x="14" y="3" width="8" height="8" rx="2" />
 <rect x="2" y="13" width="8" height="8" rx="2" />
 <rect x="14" y="13" width="8" height="8" rx="2" />
 </svg>
 Projetos
 </button>

 <button
 className={`nav-item ${activePage === "auditoria" ? "active" : ""}`}
 onClick={() => { setActivePage("auditoria"); setSidebarOpen(false); }}
 >
 <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
 <path d="M9 12l2 2 4-4" />
 <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
 </svg>
 Auditoria
 </button>
 </nav>

 <div className="sidebar-user">
 <div className="user-avatar">{getUserInitials()}</div>
 <div className="user-info">
 <div className="user-name">{user?.nome || "Analista"}</div>
 <div className="user-role">{getUserRole()}</div>
 </div>
 <button className="btn-logout" onClick={() => { setSidebarOpen(false); handleLogout(); }} title="Encerrar sessão">
 <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
 <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
 </svg>
 </button>
 </div>
 </aside>

 {/* ── MAIN ── */}
 <div className="main">

 {activePage === "projetos" && (
 <>
 <header className="topbar">
 <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Menu">
 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
 <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
 </svg>
 </button>
 <div className="topbar-left">
 <div className="topbar-title-wrap">
 <div className="topbar-title">Painel de Projetos</div>
 <div className="title-accent-line" />
 </div>
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
 {/* Stats pills */}
 {!loading && !error && projects.length > 0 && (
 <div className="stats-row">
 <div className="stat-pill">
 <div className="stat-dot" />
 <span><strong>{projects.length}</strong> projetos</span>
 </div>
 <div className="stat-pill">
 <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--green-muted)' }}>
 <path d="M9 12l2 2 4-4M12 2a10 10 0 100 20A10 10 0 0012 2z" />
 </svg>
 <span><strong>{totalAprovados}</strong> / {totalRequisitos} requisitos aprovados</span>
 </div>
 </div>
 )}

 {loading ? (
 <div className="empty-state">
 <div className="empty-title" style={{ color: 'var(--text-muted)', fontFamily: 'Sora,sans-serif', fontWeight: 500, fontSize: 14 }}>
 Carregando projetos…
 </div>
 </div>
 ) : error ? (
 <div className="empty-state">
 <div className="empty-icon">
 <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
 <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
 </svg>
 </div>
 <div className="empty-title">Erro ao carregar projetos</div>
 <div className="empty-subtitle">{error}</div>
 </div>
 ) : projects.length === 0 ? (
 <div className="empty-state">
 <div className="empty-icon">
 <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
 {projects.map((p) => {
 const progress = calculateProgress(p);
 return (
 <div className="project-card" key={p.id} onClick={() => setSelectedProject(p)}>
 <div className="card-header">
 <div className="card-icon">
 <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
 <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
 </svg>
 </div>
 <span className="card-badge">ERS</span>
 </div>

 <div className="card-name">{p.nome}</div>
 <div className="card-client">
 <div className="card-client-dot" />
 {p.nome_cliente || "Sem cliente"}
 </div>

 <div className="card-progress-header">
 <span className="card-progress-label">Progresso da ERS</span>
 <span className="card-progress-pct">{progress}%</span>
 </div>
 <div className="progress-bar-bg">
 <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
 </div>

 <div className="card-footer">
 <div className="card-updated">
 <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <circle cx="12" cy="12" r="10" />
 <path d="M12 6v6l4 2" />
 </svg>
 Atualizado {formatRelativeTime(p.atualizado_em)} · {formatTime(p.atualizado_em)}
 </div>
 <button className="card-menu" onClick={(e) => e.stopPropagation()}>
 <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <circle cx="12" cy="5" r="1" fill="currentColor" />
 <circle cx="12" cy="12" r="1" fill="currentColor" />
 <circle cx="12" cy="19" r="1" fill="currentColor" />
 </svg>
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </>
 )}

 {activePage === "auditoria" && (
 <>
 <header className="topbar">
 <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Menu">
 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
 <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
 </svg>
 </button>
 <div className="topbar-left">
 <div className="topbar-title-wrap">
 <div className="topbar-title">Trilha de Auditoria</div>
 <div className="title-accent-line" />
 </div>
 <div className="topbar-subtitle">Registro cronológico de todas as ações realizadas nos projetos da plataforma.</div>
 </div>
 </header>
 <div className="content">
 <Auditoria />
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
              <select
                className="modal-input"
                value={selectedClienteId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "novo" || val === "") {
                    setSelectedClienteId(val as "novo" | "");
                    if (val !== "novo") setNewProjectClient("");
                  } else {
                    setSelectedClienteId(Number(val));
                    setNewProjectClient("");
                  }
                }}
              >
                <option value="">Sem cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>
                ))}
                <option value="novo">+ Digitar nome do cliente...</option>
              </select>
              {selectedClienteId === "novo" && (
                <input
                  className="modal-input"
                  style={{ marginTop: 8 }}
                  type="text"
                  placeholder="Nome do cliente"
                  value={newProjectClient}
                  onChange={(e) => setNewProjectClient(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                />
              )}
            </div>

 <div className="modal-actions">
 <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
 <button
 className="btn-confirm"
 onClick={handleCreateProject}
 disabled={!newProjectName.trim()}
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
