import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { requirementsApi, type RequirementData, type ProjectData } from "../services/api";

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
.topbar-bottom { display: flex; justify-content: space-between; align-items: flex-start; width: 100%; }
.topbar-index-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; }
.topbar-project-name { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; color: var(--green-mid); line-height: 1.1; margin-bottom: 4px; }
.topbar-client { font-size: 13px; color: var(--text-muted); }
.topbar-client strong { color: var(--green-mid); font-weight: 600; }
.content { flex: 1; overflow-y: auto; padding: 0 28px 28px; }
.content-inner { max-width: 900px; margin: 0 auto; }
.section-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--card-border); }
.req-card { background: #fff; border: 1px solid var(--card-border); border-radius: 14px; padding: 22px 24px; margin-bottom: 16px; transition: box-shadow 0.15s; }
.req-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.req-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.req-id { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; background: #f0f2f5; color: #4a5568; padding: 3px 10px; border-radius: 4px; letter-spacing: 0.3px; }
.req-status { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 4px; }
.req-status.approved { background: #f0f7f2; color: #2d7a40; }
.req-status.review { background: #fef9f0; color: #b45309; }
.req-status.pending { background: #f8f9fa; color: #6b7280; }
.req-status.rejected { background: #fef2f2; color: #b91c1c; }
.req-title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; }
.req-desc { font-size: 14px; color: #4a5568; line-height: 1.7; padding: 14px 18px; background: #fafcfa; border-radius: 8px; margin-bottom: 16px; border-left: 3px solid #dde8df; }
.req-meta { display: flex; gap: 16px; font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
.req-meta span { display: flex; align-items: center; gap: 4px; }
.req-footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted); padding-top: 12px; border-top: 1px solid #f0f2f5; }
.req-actions { display: flex; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid #f0f2f5; }
.btn-reject { flex: 1; padding: 10px 16px; background: #fff; color: #b91c1c; border: 1.5px solid #fecaca; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: background 0.15s; font-family: 'DM Sans', sans-serif; }
.btn-reject:hover { background: #fef2f2; }
.btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-approve { flex: 1; padding: 10px 16px; background: var(--green-mid); color: #fff; border: none; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: background 0.15s; font-family: 'DM Sans', sans-serif; }
.btn-approve:hover { background: var(--green-bright); }
.btn-approve:disabled { opacity: 0.5; cursor: not-allowed; }
.empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
.empty-state h3 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.empty-state p { font-size: 13px; }
.validation-notes { width: 100%; padding: 8px 12px; border: 1.5px solid #dde8df; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-primary); outline: none; resize: vertical; min-height: 60px; margin-bottom: 12px; background: #fafcfa; }
.validation-notes:focus { border-color: var(--green-mid); }
`;

interface Props {
  project: ProjectData;
  category: string;
  requirements: RequirementData[];
  onBack: () => void;
  onRequirementsChange: () => void;
}

export default function ValidacaoRequisitos({
  project,
  category,
  requirements,
  onBack,
  onRequirementsChange,
}: Props) {
  const navigate = useNavigate();
  const { user, logout, isAnalista, isCliente } = useAuth();
  const [reqs, setReqs] = useState<RequirementData[]>(requirements);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [validating, setValidating] = useState<Record<number, boolean>>({});

  const handleValidate = async (reqId: number, status: string) => {
    setValidating((prev) => ({ ...prev, [reqId]: true }));
    try {
      const validationNotes = notes[reqId] || undefined;
      await requirementsApi.createValidacao(reqId, {
        resultado: status,
        comentario: validationNotes,
      });
      setReqs((prev) =>
        prev.map((r) =>
          r.id === reqId
            ? { ...r, resultado: status, validated: status === "approved", comentario: validationNotes || null }
            : r
        )
      );
      onRequirementsChange();
    } catch {
      // silently fail
    } finally {
      setValidating((prev) => ({ ...prev, [reqId]: false }));
    }
  };

  const statusClass = (status: string) => {
    if (status === "approved") return "approved";
    if (status === "rejected" || status === "revisao") return "review";
    return "pending";
  };

  const statusLabel = (status: string) => {
    if (status === "approved") return "Aprovado";
    if (status === "rejected") return "Reprovado";
    if (status === "revisao" || status === "Em Revisão") return "Em Revisão";
    return "Pendente";
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userInitials = user?.nome
    ? user.nome.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "??";
  const userRoleDisplay = isAnalista ? "Analista de Sistemas" : "Cliente / Validador";

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
              Voltar ao Índice
            </button>
            <div className="topbar-bottom">
              <div>
                <div className="topbar-index-label">{category}</div>
                <div className="topbar-project-name">{project.name}</div>
                <div className="topbar-client">
                  <strong>Cliente:</strong> {project.nome_cliente || "—"}
                </div>
              </div>
            </div>
          </header>

          <div className="content">
            <div className="content-inner">
              {reqs.length > 0 ? (
                <>
                  <h2 className="section-title">Requisitos Documentados</h2>
                  {reqs.map((req) => (
                    <div className="req-card" key={req.id}>
                      <div className="req-header">
                        <span className="req-id">{req.codigo}</span>
                        <span className={`req-status ${statusClass(req.status)}`}>
                          {statusLabel(req.status)}
                        </span>
                      </div>
                      <h3 className="req-title">{req.titulo}</h3>
                      <div className="req-desc">
                        <p>{req.descricao}</p>
                      </div>
                      <div className="req-meta">
                        <span>
                          <strong>Prioridade:</strong> {req.prioridade}
                        </span>
                        <span>
                          <strong>Categoria:</strong> {req.categoria}
                        </span>
                        {req.tipo && (
                          <span>
                            <strong>Fonte:</strong> {req.tipo}
                          </span>
                        )}
                      </div>
                      {req.ultima_validacao?.comentario && (
                        <div className="req-desc" style={{ borderLeftColor: "#f59e0b", marginBottom: 12 }}>
                          <strong>Notas de validação:</strong> {req.ultima_validacao?.comentario}
                        </div>
                      )}
                      <div className="req-footer">
                        <span>
                          Atualizado: {req.atualizado_em ? new Date(req.atualizado_em).toLocaleDateString("pt-BR") : "—"}
                        </span>
                      </div>

                      {/* Validation actions - available for clientes */}
                      {isCliente && (
                        <div className="req-actions">
                          <textarea
                            className="validation-notes"
                            placeholder="Adicione notas de validação (opcional)..."
                            value={notes[req.id] || ""}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                            disabled={validating[req.id]}
                          />
                          <button
                            className="btn-reject"
                            onClick={() => handleValidate(req.id, "rejected")}
                            disabled={validating[req.id]}
                          >
                            {validating[req.id] ? "..." : "Reprovar"}
                          </button>
                          <button
                            className="btn-approve"
                            onClick={() => handleValidate(req.id, "approved")}
                            disabled={validating[req.id]}
                          >
                            {validating[req.id] ? "..." : "Aprovar"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="empty-state">
                  <h3>Nenhum requisito nesta categoria</h3>
                  <p>Esta categoria ainda não possui requisitos documentados.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}