import { useState, useEffect } from 'react';
import { projectsApi, requirementsApi, authApi, type ProjectData } from '../../services/api';
import { formatRelativeTime, formatTime, calculateProgress } from '../../utils/helpers';
import AppLayout from '../../components/AppLayout';
import type { Perfil } from '../../utils/constants';
import { SECTOR_TEMPLATES } from '../../utils/sectorTemplates';
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
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateProgress, setTemplateProgress] = useState('');

  // Edit / delete state
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editClienteId, setEditClienteId] = useState<number | 'novo' | ''>('');
  const [editClienteName, setEditClienteName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deleteProject, setDeleteProject] = useState<ProjectData | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    if ((!showModal && !editingProject) || (perfil !== 'analista' && perfil !== 'gestor')) return;
    const controller = new AbortController();
    authApi.listClientes({ signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setClientes(data.clientes); })
      .catch(() => {});
    return () => controller.abort();
  }, [showModal, editingProject, perfil]);

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

      const resp = await projectsApi.create({ nome: newProjectName.trim(), descricao: newProjectDesc.trim() || undefined, nome_cliente, cliente_id });
      const projectId = resp.projeto.id;

      if (selectedTemplate) {
        const tpl = SECTOR_TEMPLATES.find(t => t.id === selectedTemplate);
        if (tpl) {
          for (let i = 0; i < tpl.requirements.length; i++) {
            setTemplateProgress(`Adicionando requisitos… ${i + 1}/${tpl.requirements.length}`);
            const r = tpl.requirements[i];
            try {
              await requirementsApi.create(projectId, { tipo: r.tipo, titulo: r.titulo, descricao: r.descricao });
            } catch {
              // falha individual: continua para o próximo
            }
          }
        }
      }

      // sempre fecha e reseta após projeto criado
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectClient('');
      setSelectedClienteId('');
      setSelectedTemplate(null);
      setTemplateProgress('');
      setShowModal(false);
      try {
        const response = await projectsApi.list(1, 20);
        setProjects(response.projetos);
      } catch { /* ignore refetch error */ }
    } catch (err: unknown) {
      console.error('Erro ao criar projeto:', err instanceof Error ? err.message : String(err));
      setTemplateProgress('');
    }
  };

  const openModal = () => {
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectClient('');
    setSelectedClienteId('');
    setSelectedTemplate(null);
    setTemplateProgress('');
    setShowModal(true);
  };

  const openEditModal = (p: ProjectData) => {
    setEditName(p.nome);
    setEditDesc(p.descricao || '');
    setEditClienteId(p.cliente_id ?? '');
    setEditClienteName('');
    setEditingProject(p);
  };

  const handleEditProject = async () => {
    if (!editingProject || !editName.trim()) return;
    setEditSaving(true);
    try {
      let cliente_id: number | undefined;
      let nome_cliente: string | undefined;
      if (editClienteId === 'novo') {
        nome_cliente = editClienteName.trim() || undefined;
      } else if (editClienteId) {
        cliente_id = editClienteId as number;
        const cli = clientes.find(c => c.id === cliente_id);
        nome_cliente = cli?.nome;
      }
      const resp = await projectsApi.update(editingProject.id, {
        nome: editName.trim(),
        descricao: editDesc.trim() || undefined,
        cliente_id,
        nome_cliente,
      });
      setProjects(prev => prev.map(p => p.id === editingProject.id ? resp.projeto : p));
      setEditingProject(null);
    } catch (err) {
      console.error('Erro ao editar projeto:', err instanceof Error ? err.message : String(err));
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProject) return;
    setDeleting(true);
    try {
      await projectsApi.delete(deleteProject.id);
      setProjects(prev => prev.filter(p => p.id !== deleteProject.id));
      setDeleteProject(null);
    } catch (err) {
      console.error('Erro ao excluir projeto:', err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
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
                    <div className="project-card" key={p.id} style={{ position: 'relative' }} onClick={() => onProjectSelect(p)}>
                      {showCreateButton && (
                        <div
                          style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4, zIndex: 2 }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            title="Editar projeto"
                            onClick={() => openEditModal(p)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--card-bg)', cursor: 'pointer', color: 'var(--text-muted)' }}
                          >
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            title="Excluir projeto"
                            onClick={() => setDeleteProject(p)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--card-bg)', cursor: 'pointer', color: '#ef4444' }}
                          >
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M3 6h18M19 6l-1 14H6L5 6M10 6V4h4v2" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <div className="card-header">
                        <div className="card-icon">
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                            <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                          </svg>
                        </div>
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

      {/* MODAL EDITAR PROJETO */}
      {editingProject && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !editSaving && setEditingProject(null)}>
          <div className="modal">
            <div className="modal-title">Editar Projeto</div>
            <div className="modal-subtitle">Altere as informações do projeto.</div>
            <div className="modal-field">
              <label className="modal-label">Nome do Projeto</label>
              <input
                className="modal-input"
                type="text"
                placeholder="Ex: Sistema ERP Integrado"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                disabled={editSaving}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Descrição</label>
              <textarea
                className="modal-input"
                placeholder="Descreva o projeto, contexto ou objetivos..."
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                style={{ resize: 'vertical', minHeight: 72 }}
                disabled={editSaving}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Cliente</label>
              <select
                className="modal-input"
                value={editClienteId}
                disabled={editSaving}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'novo' || val === '') {
                    setEditClienteId(val as 'novo' | '');
                    if (val !== 'novo') setEditClienteName('');
                  } else {
                    setEditClienteId(Number(val));
                    setEditClienteName('');
                  }
                }}
              >
                <option value="">Sem cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>
                ))}
                <option value="novo">+ Digitar nome do cliente...</option>
              </select>
              {editClienteId === 'novo' && (
                <input
                  className="modal-input"
                  style={{ marginTop: 8 }}
                  type="text"
                  placeholder="Nome do cliente"
                  value={editClienteName}
                  onChange={(e) => setEditClienteName(e.target.value)}
                  disabled={editSaving}
                />
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditingProject(null)} disabled={editSaving}>Cancelar</button>
              <button className="btn-confirm" onClick={handleEditProject} disabled={!editName.trim() || editSaving}>
                {editSaving ? 'Salvando…' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO */}
      {deleteProject && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !deleting && setDeleteProject(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-title" style={{ color: '#ef4444' }}>Excluir Projeto</div>
            <div className="modal-subtitle" style={{ marginTop: 8 }}>
              Tem certeza que deseja excluir <strong>"{deleteProject.nome}"</strong>?
              <br />
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>O projeto será arquivado (exclusão lógica) e não aparecerá mais na listagem.</span>
            </div>
            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button className="btn-cancel" onClick={() => setDeleteProject(null)} disabled={deleting}>Cancelar</button>
              <button
                onClick={handleDeleteProject}
                disabled={deleting}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontSize: 13, opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO PROJETO */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !templateProgress && setShowModal(false)}>
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
              <label className="modal-label">Descrição / Texto Corporativo</label>
              <textarea
                className="modal-input"
                placeholder="Descreva o projeto, contexto ou objetivos..."
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                rows={3}
                style={{ resize: 'vertical', minHeight: 72 }}
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
            {/* Template de Setor */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Template de Setor <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {SECTOR_TEMPLATES.map(tpl => {
                  const active = selectedTemplate === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(active ? null : tpl.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                        padding: '10px 8px', borderRadius: 11, cursor: 'pointer',
                        border: active ? `2px solid ${tpl.color}` : '1.5px solid var(--card-border)',
                        background: active ? tpl.bg : '#fff',
                        transition: 'all 0.18s', fontFamily: 'Sora, sans-serif',
                        boxShadow: active ? `0 0 0 3px ${tpl.color}22` : 'none',
                      }}
                    >
                      <span style={{ fontSize: 22, lineHeight: 1 }}>{tpl.emoji}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: active ? tpl.color : 'var(--text-primary)', lineHeight: 1.2, textAlign: 'center' }}>{tpl.label}</span>
                      <span style={{ fontSize: 9.5, color: 'var(--text-muted)', lineHeight: 1.3, textAlign: 'center' }}>{tpl.requirements.length} requisitos</span>
                    </button>
                  );
                })}
              </div>
              {selectedTemplate && (
                <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 8, background: SECTOR_TEMPLATES.find(t => t.id === selectedTemplate)?.bg, border: `1px solid ${SECTOR_TEMPLATES.find(t => t.id === selectedTemplate)?.color}33`, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {SECTOR_TEMPLATES.find(t => t.id === selectedTemplate)?.summary}
                </div>
              )}
            </div>

            {templateProgress && (
              <div style={{ fontSize: 12, color: 'var(--green-mid)', fontWeight: 500, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                {templateProgress}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => { setShowModal(false); setTemplateProgress(''); }} disabled={!!templateProgress}>Cancelar</button>
              <button className="btn-confirm" onClick={handleCreateProject} disabled={!newProjectName.trim() || !!templateProgress}>
                {templateProgress ? 'Criando…' : 'Criar Projeto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
