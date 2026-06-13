import { useState, useEffect } from 'react';
import { projectsApi, authApi, type ProjectData } from '../../services/api';
import { formatRelativeTime, formatTime, calculateProgress } from '../../utils/helpers';
import AppLayout from '../../components/AppLayout';
import type { Perfil } from '../../utils/constants';
type Page = 'projetos' | 'auditoria';

interface Props {
  perfil: Perfil;
  topbarTitle?: string;
  topbarSubtitle?: string;
  showCreateButton?: boolean;
  onProjectSelect: (project: ProjectData) => void;
  auditoriaContent?: React.ReactNode;
}

export default function TelaProjetos({
  perfil,
  topbarTitle: customTitle,
  topbarSubtitle: customSubtitle,
  showCreateButton = false,
  onProjectSelect,
  auditoriaContent,
}: Props) {
  const [activePage, setActivePage] = useState<Page>('projetos');
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [clientes, setClientes] = useState<{ id: number; nome: string; email: string }[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<number | 'novo' | ''>('');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await projectsApi.list(1, 20, undefined, undefined, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setProjects(response.projetos);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar projetos');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!showModal || (perfil !== 'analista' && perfil !== 'gestor')) return;
    const controller = new AbortController();
    authApi.listClientes({ signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setClientes(data.clientes); })
      .catch(() => {});
    return () => controller.abort();
  }, [showModal, perfil]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      let cliente_id: number | undefined;
      let nome_cliente: string | undefined;
      if (selectedClienteId === 'novo') {
        nome_cliente = newProjectClient.trim() || undefined;
      } else if (selectedClienteId) {
        cliente_id = selectedClienteId;
        const cli = clientes.find(c => c.id === selectedClienteId);
        nome_cliente = cli?.nome;
      }
      await projectsApi.create({ nome: newProjectName.trim(), nome_cliente, cliente_id });
      setNewProjectName('');
      setNewProjectClient('');
      setSelectedClienteId('');
      setShowModal(false);
      // Reload projects after creation
      try {
        const response = await projectsApi.list(1, 20);
        setProjects(response.projetos);
      } catch { /* ignore refetch error */ }
    } catch (err: unknown) {
      console.error('Erro ao criar projeto:', err instanceof Error ? err.message : String(err));
    }
  };

  const openModal = () => {
    setNewProjectName('');
    setNewProjectClient('');
    setSelectedClienteId('');
    setShowModal(true);
  };

  const totalRequisitos = projects.reduce((s, p) => s + (p.requisitos_count || 0), 0);
  const totalAprovados = projects.reduce((s, p) => s + (p.aprovados_count || 0), 0);

  const topbarTitle = activePage === 'auditoria'
    ? 'Trilha de Auditoria'
    : customTitle || `Painel de Projetos`;

  const topbarSubtitle = activePage === 'auditoria'
    ? 'Registro cronológico de todas as ações realizadas nos projetos da plataforma.'
    : customSubtitle || 'Visão geral dos documentos ativos.';

  return (
    <>
      <AppLayout
        perfil={perfil}
        activePage={activePage}
        onPageChange={(p) => setActivePage(p as Page)}
        topbarTitle={topbarTitle}
        topbarSubtitle={topbarSubtitle}
        topbarActions={activePage === 'projetos' && showCreateButton ? (
          <button className="btn-new-project" onClick={openModal}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo Projeto
          </button>
        ) : undefined}
      >
        {activePage === 'projetos' && (
          <>
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
                  {showCreateButton
                    ? 'Crie seu primeiro projeto para começar a gerenciar documentos e acompanhar o progresso da ERS.'
                    : 'Nenhum projeto disponível no momento.'
                  }
                </div>
                {showCreateButton && (
                  <button className="btn-empty-create" onClick={openModal}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Criar primeiro projeto
                  </button>
                )}
              </div>
            ) : (
              <div className="projects-grid">
                {projects.map((p) => {
                  const progress = calculateProgress(p);
                  return (
                    <div className="project-card" key={p.id} onClick={() => onProjectSelect(p)}>
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
                        {p.nome_cliente || 'Sem cliente'}
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
                          Atualizado {formatRelativeTime(p.atualizado_em || p.criado_em || '')} · {formatTime(p.atualizado_em || p.criado_em || '')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        {activePage === 'auditoria' && (auditoriaContent || null)}
      </AppLayout>

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
                  if (val === 'novo' || val === '') {
                    setSelectedClienteId(val as 'novo' | '');
                    if (val !== 'novo') setNewProjectClient('');
                  } else {
                    setSelectedClienteId(Number(val));
                    setNewProjectClient('');
                  }
                }}
              >
                <option value="">Sem cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>
                ))}
                <option value="novo">+ Digitar nome do cliente...</option>
              </select>
              {selectedClienteId === 'novo' && (
                <input
                  className="modal-input"
                  style={{ marginTop: 8 }}
                  type="text"
                  placeholder="Nome do cliente"
                  value={newProjectClient}
                  onChange={(e) => setNewProjectClient(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-confirm" onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                Criar Projeto
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
