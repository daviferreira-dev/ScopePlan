import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { requirementsApi, type RequirementData, type ProjectData } from "../services/api";
import DownloadERS from "./DownloadERS";
import ValidacaoRequisitos from "./ValidacaoRequisitos";

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

html, body { height: 100%; width: 100%; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; background: #f4f7f5; color: var(--text-primary); overflow: hidden; }
#root { height: 100%; width: 100%; margin: 0; padding: 0; }

.layout { display: flex; width: 100vw; height: 100vh; overflow: hidden; position: fixed; top: 0; left: 0; }
.sidebar { width: 220px; min-width: 220px; background: #2e7d32; display: flex; flex-direction: column; flex-shrink: 0; position: relative; z-index: 20; }
.sidebar-logo { padding: 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.sidebar-logo img { width: 150px; filter: brightness(0) invert(1); opacity: 0.95; }
.sidebar-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
.nav-label { font-size: 8px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.3); padding: 10px 8px 6px; margin-top: 4px; }
.nav-item { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 8px; cursor: pointer; color: var(--text-sidebar); font-size: 13px; font-weight: 500; transition: background 0.18s, color 0.18s; border: none; background: none; width: 100%; text-align: left; -webkit-tap-highlight-color: transparent; }
.nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
.nav-item.active { background: rgba(255,255,255,0.2); border-radius: 10px; color: #fff; font-weight: 600; }
.nav-item svg { flex-shrink: 0; opacity: 0.8; }
.nav-item.active svg { opacity: 1; }
.sidebar-user { padding: 12px; margin: 12px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.15); border-radius: 12px; }
.user-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--green-light); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--green-deep); flex-shrink: 0; }
.user-info { flex: 1; overflow: hidden; min-width: 0; }
.user-name { font-size: 12px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { font-size: 10px; color: rgba(255,255,255,0.45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.btn-logout { background: none; border: none; color: rgba(255,255,255,0.35); cursor: pointer; padding: 4px; border-radius: 6px; transition: color 0.2s, background 0.2s; display: flex; align-items: center; flex-shrink: 0; }
.btn-logout:hover { color: #ff8080; background: rgba(255,100,100,0.1); }
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #f1f3f2; min-width: 0; }
.topbar { background: transparent; border-bottom: none; padding: 32px; display: flex; flex-direction: column; gap: 8px; }
.topbar-back { font-size: 12px; color: var(--text-muted); cursor: pointer; background: none; border: none; padding: 0 0 8px; font-family: 'DM Sans', sans-serif; transition: color 0.18s; width: fit-content; }
.topbar-back:hover { color: var(--green-mid); }
.topbar-title-row { display: flex; justify-content: space-between; align-items: flex-start; width: 100%; }
.topbar-info { display: flex; flex-direction: column; }
.topbar-index-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; }
.topbar-project-name { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; color: var(--green-mid); line-height: 1.1; margin-bottom: 4px; }
.topbar-client { font-size: 13px; color: var(--text-muted); }
.topbar-client strong { color: var(--green-mid); font-weight: 600; }
.topbar-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.btn-download { display: flex; align-items: center; gap: 7px; padding: 10px 18px; background: var(--green-mid); color: #fff; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.18s, transform 0.12s; box-shadow: 0 4px 14px rgba(45,122,64,0.25); white-space: nowrap; }
.btn-download:hover { background: var(--green-bright); transform: translateY(-1px); }
.btn-add-topic { display: flex; align-items: center; gap: 7px; padding: 10px 18px; background: var(--green-mid); color: #fff; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.18s, transform 0.12s; box-shadow: 0 4px 14px rgba(45,122,64,0.25); white-space: nowrap; position: relative; }
.btn-add-topic:hover { background: var(--green-bright); transform: translateY(-1px); }
.btn-add-topic .divider-btn { width: 1px; height: 16px; background: rgba(255,255,255,0.3); margin: 0 2px 0 6px; }
.btn-add-topic .chevron { opacity: 0.8; }
.content { flex: 1; overflow-y: auto; padding: 0 28px 28px; }
.topics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.topic-card { background: #fff; border: 1px solid var(--card-border); border-radius: 14px; padding: 20px 20px 18px; cursor: pointer; transition: box-shadow 0.2s, transform 0.18s, border-color 0.2s; display: flex; flex-direction: column; gap: 0; min-height: 110px; position: relative; }
.topic-card:hover { box-shadow: 0 6px 24px rgba(45,122,64,0.1); transform: translateY(-2px); border-color: #c4dbc9; }
.topic-card-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: auto; }
.topic-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--progress-bg); display: flex; align-items: center; justify-content: center; color: var(--green-mid); flex-shrink: 0; }
.topic-name { font-size: 14px; font-weight: 600; color: var(--text-primary); line-height: 1.35; padding-top: 6px; }
.topic-count { font-size: 11.5px; color: var(--text-muted); margin-top: 14px; font-weight: 400; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease both; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal { background: #fff; border-radius: 18px; padding: 32px 28px 24px; width: 100%; max-width: 480px; box-shadow: 0 24px 60px rgba(0,0,0,0.15); animation: slideUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.modal-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.modal-subtitle { font-size: 12.5px; color: var(--text-muted); margin-bottom: 22px; }
.modal-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.modal-label { font-size: 9px; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; color: var(--text-muted); }
.modal-input, .modal-select { padding: 10px 13px; border: 1.5px solid #dde8df; border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text-primary); outline: none; transition: border-color 0.2s, box-shadow 0.2s; background: #fafcfa; width: 100%; }
.modal-input::placeholder, .modal-select::placeholder { color: #b0c4b6; }
.modal-input:focus, .modal-select:focus { border-color: var(--green-mid); box-shadow: 0 0 0 3px rgba(45,122,64,0.08); background: #fff; }
.modal-actions { display: flex; gap: 10px; margin-top: 22px; }
.btn-cancel { flex: 1; padding: 11px; background: #f0f4f1; border: none; border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: background 0.18s; }
.btn-cancel:hover { background: #e4ece6; color: var(--text-primary); }
.btn-confirm { flex: 1; padding: 11px; background: var(--green-mid); border: none; border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; color: #fff; cursor: pointer; transition: background 0.18s, transform 0.12s; box-shadow: 0 4px 14px rgba(45,122,64,0.22); }
.btn-confirm:hover { background: var(--green-bright); transform: translateY(-1px); }
.btn-confirm:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
.loading-spinner { width: 24px; height: 24px; border: 3px solid var(--progress-bg); border-top-color: var(--green-mid); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

const CATEGORY_OPTIONS = [
  "Requisitos Funcionais",
  "Regras de Negócio",
  "Requisitos Não-Funcionais",
  "Modelagem de Dados",
  "Integrações de Sistema",
  "Glossário Técnico",
  "Gestão de Erros",
  "UI/UX e Protótipos",
  "Segurança",
  "Performance",
];

const PRIORITY_OPTIONS = ["alta", "média", "baixa"];

interface TopicGroup {
  category: string;
  requirements: RequirementData[];
}

interface Props {
  project: ProjectData;
  onBack: () => void;
}

export default function Tela_Itens({ project, onBack }: Props) {
  const navigate = useNavigate();
  const { user, logout, isAnalista } = useAuth();

  const [requirements, setRequirements] = useState<RequirementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDownload, setShowDownload] = useState(false);

  // New requirement form
  const [newReqCode, setNewReqCode] = useState("");
  const [newReqTitle, setNewReqTitle] = useState("");
  const [newReqDesc, setNewReqDesc] = useState("");
  const [newReqCategory, setNewReqCategory] = useState(CATEGORY_OPTIONS[0]);
  const [newReqPriority, setNewReqPriority] = useState("média");
  const [creating, setCreating] = useState(false);

  // Load requirements from API
  const loadRequirements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requirementsApi.list(project.id);
      setRequirements(data.requisitos);
    } catch {
      // silently fail, show empty
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  // Group requirements by category
  const topicGroups: TopicGroup[] = [];
  const categoryMap = new Map<string, RequirementData[]>();
  for (const req of requirements) {
    const cat = req.categoria || "Outros";
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(req);
  }
  // Also show empty categories from defaults
  for (const cat of CATEGORY_OPTIONS) {
    topicGroups.push({ category: cat, requirements: categoryMap.get(cat) || [] });
  }
  // Add any categories from API not in defaults
  for (const [cat, reqs] of categoryMap) {
    if (!CATEGORY_OPTIONS.includes(cat)) {
      topicGroups.push({ category: cat, requirements: reqs });
    }
  }

  const handleAddRequirement = async () => {
    if (!newReqCode.trim() || !newReqTitle.trim() || !newReqDesc.trim()) return;
    setCreating(true);
    try {
      const data = await requirementsApi.create({
        titulo: newReqTitle.trim(),
        descricao: newReqDesc.trim(),
        projeto_id: project.id,
        codigo: newReqCode.trim(),
        categoria: newReqCategory,
        prioridade: newReqPriority,
      });
      setRequirements((prev) => [...prev, data.requirement]);
      setNewReqCode("");
      setNewReqTitle("");
      setNewReqDesc("");
      setShowAddModal(false);
    } catch {
      // silently fail
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userInitials = user?.nome
    ? user.nome.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "??";
  const userRoleDisplay = isAnalista ? "Analista de Sistemas" : "Cliente";

  // When a topic/category is clicked, show its requirements
  if (showDownload) {
    return (
      <DownloadERS
        project={project}
        topicGroups={topicGroups}
        onBack={() => setShowDownload(false)}
      />
    );
  }

  if (activeCategory) {
    const group = topicGroups.find((g) => g.category === activeCategory);
    return (
      <ValidacaoRequisitos
        project={project}
        category={activeCategory}
        requirements={group?.requirements || []}
        onBack={() => setActiveCategory(null)}
        onRequirementsChange={loadRequirements}
      />
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src="./src/assets/logo_scope_plan.svg" alt="ScopePlan" />
          </div>
          <nav className="sidebar-nav">
            <span className="nav-label">Menu</span>
            <button className="nav-item active" onClick={onBack}>
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
            <div className="user-avatar">{userInitials}</div>
            <div className="user-info">
              <div className="user-name">{user?.nome || "Usuário"}</div>
              <div className="user-role">{userRoleDisplay}</div>
            </div>
            <button className="btn-logout" onClick={handleLogout} title="Encerrar sessão">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
              Voltar para Projetos
            </button>
            <div className="topbar-title-row">
              <div className="topbar-info">
                <div className="topbar-index-label">Índice de Especificação</div>
                <div className="topbar-project-name">{project.name}</div>
                <div className="topbar-client">
                  <strong>Cliente:</strong> {project.nome_cliente || "—"}
                </div>
              </div>
              <div className="topbar-actions">
                <button className="btn-download" onClick={() => setShowDownload(true)}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Baixar ERS
                </button>
                {isAnalista && (
                  <button className="btn-add-topic" onClick={() => setShowAddModal(true)}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Novo Requisito
                    <span className="divider-btn" />
                    <svg className="chevron" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="content">
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
                <div className="loading-spinner" />
              </div>
            ) : (
              <div className="topics-grid">
                {topicGroups.map((group) => (
                  <div className="topic-card" key={group.category} onClick={() => setActiveCategory(group.category)}>
                    <div className="topic-card-top">
                      <div className="topic-icon">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                      <div className="topic-name">{group.category}</div>
                    </div>
                    <div className="topic-count">
                      {group.requirements.length === 0
                        ? "0 requisitos"
                        : group.requirements.length === 1
                        ? "1 requisito"
                        : `${group.requirements.length} requisitos`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL NOVO REQUISITO */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !creating && setShowAddModal(false)}>
          <div className="modal">
            <div className="modal-title">Novo Requisito</div>
            <div className="modal-subtitle">Adicione um requisito ao projeto.</div>

            <div className="modal-field">
              <label className="modal-label">Código</label>
              <input className="modal-input" type="text" placeholder="Ex: RF-001" value={newReqCode} onChange={(e) => setNewReqCode(e.target.value)} disabled={creating} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Título</label>
              <input className="modal-input" type="text" placeholder="Ex: Autenticação Múltipla" value={newReqTitle} onChange={(e) => setNewReqTitle(e.target.value)} disabled={creating} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Descrição</label>
              <input className="modal-input" type="text" placeholder="Descrição detalhada" value={newReqDesc} onChange={(e) => setNewReqDesc(e.target.value)} disabled={creating} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Categoria</label>
              <select className="modal-select" value={newReqCategory} onChange={(e) => setNewReqCategory(e.target.value)} disabled={creating}>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="modal-field">
              <label className="modal-label">Prioridade</label>
              <select className="modal-select" value={newReqPriority} onChange={(e) => setNewReqPriority(e.target.value)} disabled={creating}>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)} disabled={creating}>Cancelar</button>
              <button className="btn-confirm" onClick={handleAddRequirement} disabled={!newReqCode.trim() || !newReqTitle.trim() || !newReqDesc.trim() || creating}>
                {creating ? "Criando..." : "Criar Requisito"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}