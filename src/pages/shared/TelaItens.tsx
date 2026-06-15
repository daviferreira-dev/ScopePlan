import { useState, useEffect, useRef } from 'react';
import { requirementsApi, blocosApi, projectsApi } from '../../services/api';
import VisaoGeral from '../../components/VisaoGeral';
import type { RequirementData, ProjectData, BlocoPersonalizadoData, MembroData } from '../../services/api';
import AppLayout from '../../components/AppLayout';
import { REQUIREMENT_TOPICS, type RequirementTopic, type Perfil } from '../../utils/constants';
import Dashboard from './Dashboard';
import Diagramas from '../../components/Diagramas';
import ConvitesModal from '../../components/ConvitesModal';
import KanbanBoard from '../../components/KanbanBoard';
import styles from './TelaItens.module.css';

interface Topic extends RequirementTopic {
	count: number;
}

interface Props {
	project: ProjectData;
	onBack: () => void;
	perfil: Perfil;
	onTopicSelect: (topic: Topic, requirements: RequirementData[]) => void;
	onDownload: () => void;
	onAuditPage?: () => void;
}

const BASE_TOPICS = REQUIREMENT_TOPICS;

type Tab = 'visao_geral' | 'lista' | 'kanban' | 'painel' | 'diagramas' | 'equipe';

const PERFIL_LABEL: Record<string, string> = {
	analista: 'Analista',
	gestor: 'Gestor',
	cliente: 'Cliente',
	desenvolvedor: 'Desenvolvedor',
};

const PERFIL_COLOR: Record<string, { bg: string; text: string }> = {
	analista:     { bg: '#eff6ff', text: '#1d4ed8' },
	gestor:       { bg: '#f0fdf4', text: '#15803d' },
	cliente:      { bg: '#fefce8', text: '#a16207' },
	desenvolvedor:{ bg: '#faf5ff', text: '#7e22ce' },
};

function EquipeTab({ membros, loading }: { membros: MembroData[]; loading: boolean }) {
	if (loading) {
		return (
			<div className="empty-state">
				<div className="empty-title">Carregando equipe...</div>
			</div>
		);
	}
	if (!membros.length) {
		return (
			<div className="empty-state">
				<div className="empty-icon">
					<svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
						<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
						<path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
					</svg>
				</div>
				<div className="empty-title">Nenhum membro encontrado</div>
			</div>
		);
	}
	return (
		<div style={{ padding: '24px 0', maxWidth: 640 }}>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
				{membros.map(m => {
					const colors = PERFIL_COLOR[m.perfil] ?? { bg: '#f1f5f9', text: '#475569' };
					return (
						<div
							key={m.id}
							style={{
								display: 'flex', alignItems: 'center', gap: 14,
								padding: '14px 18px', borderRadius: 12,
								border: '1px solid var(--card-border, #e2e8f0)',
								background: 'var(--card-bg, #fff)',
							}}
						>
							<div style={{
								width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
								background: colors.bg, color: colors.text,
								display: 'flex', alignItems: 'center', justifyContent: 'center',
								fontWeight: 700, fontSize: 15, letterSpacing: '-0.5px',
							}}>
								{m.nome.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')}
							</div>
							<div style={{ flex: 1, minWidth: 0 }}>
								<div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
									{m.nome}
								</div>
								<div style={{ fontSize: 12.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
									{m.email}
								</div>
							</div>
							<span style={{
								padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
								background: colors.bg, color: colors.text, flexShrink: 0,
							}}>
								{PERFIL_LABEL[m.perfil] ?? m.perfil}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default function TelaItens({ project, onBack, perfil, onTopicSelect, onDownload, onAuditPage }: Props) {
	const [requirements, setRequirements] = useState<RequirementData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [tab, setTab] = useState<Tab>('visao_geral');
	const [blocos, setBlocos] = useState<BlocoPersonalizadoData[]>([]);
	const [membros, setMembros] = useState<MembroData[]>([]);
	const [membrosLoading, setMembrosLoading] = useState(false);
	const [showNewBlocoInput, setShowNewBlocoInput] = useState(false);
	const [newBlocoNome, setNewBlocoNome] = useState('');
	const [blocoLoading, setBlocoLoading] = useState(false);
	const [showConvites, setShowConvites] = useState(false);
	const newBlocoInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const controller = new AbortController();
		async function load() {
			try {
				setLoading(true);
				setError(null);
				const [reqResp, blocoResp] = await Promise.all([
					requirementsApi.list(project.id, 1, 50, undefined, { signal: controller.signal }),
					blocosApi.list(project.id, { signal: controller.signal }),
				]);
				if (controller.signal.aborted) return;
				setRequirements(reqResp.requisitos);
				setBlocos(blocoResp.blocos);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : 'Erro ao carregar requisitos');
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		}
		load();
		return () => controller.abort();
	}, [project.id]);

	useEffect(() => {
		if (tab !== 'equipe') return;
		const controller = new AbortController();
		setMembrosLoading(true);
		projectsApi.membros(project.id, { signal: controller.signal })
			.then(r => { if (!controller.signal.aborted) setMembros(r.membros); })
			.catch(() => {})
			.finally(() => { if (!controller.signal.aborted) setMembrosLoading(false); });
		return () => controller.abort();
	}, [tab, project.id]);

	useEffect(() => {
		if (showNewBlocoInput) newBlocoInputRef.current?.focus();
	}, [showNewBlocoInput]);

	const handleCreateBloco = async () => {
		const nome = newBlocoNome.trim();
		if (!nome) return;
		setBlocoLoading(true);
		try {
			const resp = await blocosApi.create(project.id, nome);
			setBlocos(prev => [...prev, resp.bloco]);
			setNewBlocoNome('');
			setShowNewBlocoInput(false);
		} catch {
			// ignore for now
		} finally {
			setBlocoLoading(false);
		}
	};

	const handleDeleteBloco = async (e: React.MouseEvent, blocoId: number) => {
		e.stopPropagation();
		try {
			await blocosApi.delete(project.id, blocoId);
			setBlocos(prev => prev.filter(b => b.id !== blocoId));
		} catch {
			// ignore
		}
	};

	const topicsWithCount: Topic[] = BASE_TOPICS.map(t => ({
		...t,
		count: requirements.filter(r => r.tipo === t.type).length,
	}));

	const customTopics: Topic[] = blocos.map(b => ({
		id: b.id + 1000,
		name: b.nome,
		type: b.tipo_chave,
		count: requirements.filter(r => r.tipo === b.tipo_chave).length,
	}));

	const canEdit = perfil === 'analista' || perfil === 'gestor';

	const handleKanbanStatusChange = async (id: number, oldStatus: string, newStatus: string) => {
		setRequirements(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
		try {
			await requirementsApi.moveStatus(project.id, id, newStatus);
		} catch {
			setRequirements(prev => prev.map(r => r.id === id ? { ...r, status: oldStatus } : r));
		}
	};

	const handleKanbanCardClick = (req: RequirementData) => {
		const allTopics = [...topicsWithCount, ...customTopics];
		const topic = allTopics.find(t => t.type === req.tipo);
		if (topic) onTopicSelect(topic, requirements);
	};

	const topbarTitle = project.nome;

	return (
		<>
		<AppLayout
			perfil={perfil}
			activePage="projetos"
			onBack={onBack}
			onPageChange={(p) => {
				if (p === 'auditoria' && onAuditPage) {
					onAuditPage();
				} else {
					onBack();
				}
			}}
			topbarTitle={topbarTitle}
			topbarSubtitle="Índice de Especificação"
			topbarActions={
				<div style={{ display: 'flex', gap: 8 }}>
					{canEdit && (
						<button
							className={`btn-download ${styles['topbar-btn']}`}
							onClick={() => setShowConvites(true)}
							style={{ background: 'transparent', color: 'var(--green-bright)', border: '1.5px solid var(--green-bright)' }}
							title="Convidar membro"
						>
							<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
								<circle cx="9" cy="7" r="4" />
								<line x1="19" y1="8" x2="19" y2="14" />
								<line x1="22" y1="11" x2="16" y2="11" />
							</svg>
							<span className={styles['btn-label']}>Convidar</span>
						</button>
					)}
					<button className={`btn-download ${styles['topbar-btn']}`} onClick={onDownload} title="Baixar ERS">
						<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
						</svg>
						<span className={styles['btn-label']}>Baixar ERS</span>
					</button>
				</div>
			}
		>
			<nav className={styles['view-tabs']}>
				<button className={`${styles['view-tab']} ${tab === 'visao_geral' ? styles['view-tab-active'] : ''}`} onClick={() => setTab('visao_geral')}>
					<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
						<circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
					</svg>
					<span className={styles['tab-label']}>Visão Geral</span>
				</button>
				<button className={`${styles['view-tab']} ${tab === 'lista' ? styles['view-tab-active'] : ''}`} onClick={() => setTab('lista')}>
					<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
						<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
						<line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
					</svg>
					<span className={styles['tab-label']}>Requisitos</span>
				</button>
				<button className={`${styles['view-tab']} ${tab === 'kanban' ? styles['view-tab-active'] : ''}`} onClick={() => setTab('kanban')}>
					<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
						<rect x="3" y="3" width="5" height="18" rx="1.5" /><rect x="10" y="3" width="5" height="12" rx="1.5" /><rect x="17" y="3" width="5" height="15" rx="1.5" />
					</svg>
					<span className={styles['tab-label']}>Kanban</span>
				</button>
				<button className={`${styles['view-tab']} ${tab === 'painel' ? styles['view-tab-active'] : ''}`} onClick={() => setTab('painel')}>
					<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
						<line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
					</svg>
					<span className={styles['tab-label']}>Painel</span>
				</button>
				<button className={`${styles['view-tab']} ${tab === 'diagramas' ? styles['view-tab-active'] : ''}`} onClick={() => setTab('diagramas')}>
					<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
						<rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
					</svg>
					<span className={styles['tab-label']}>Diagramas</span>
				</button>
				<button className={`${styles['view-tab']} ${tab === 'equipe' ? styles['view-tab-active'] : ''}`} onClick={() => setTab('equipe')}>
					<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
						<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
						<path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
					</svg>
					<span className={styles['tab-label']}>Equipe</span>
				</button>
			</nav>

			{tab === 'visao_geral' ? (
				<VisaoGeral projectId={project.id} perfil={perfil} />
			) : tab === 'equipe' ? (
				<EquipeTab membros={membros} loading={membrosLoading} />
			) : tab === 'painel' ? (
				<Dashboard projectId={project.id} />
			) : tab === 'diagramas' ? (
				<Diagramas projectId={project.id} canEdit={canEdit} />
			) : tab === 'kanban' ? (
				loading ? (
					<div className="empty-state">
						<div className="empty-icon">
							<svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
								<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
								<polyline points="14 2 14 8 20 8" />
							</svg>
						</div>
						<div className="empty-title">Carregando...</div>
					</div>
				) : (
					<KanbanBoard
						requirements={requirements}
						canEdit={canEdit}
						onCardClick={handleKanbanCardClick}
						onStatusChange={handleKanbanStatusChange}
					/>
				)
			) : loading ? (
				<div className="empty-state">
					<div className="empty-icon">
						<svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
							<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
							<polyline points="14 2 14 8 20 8" />
						</svg>
					</div>
					<div className="empty-title">Carregando requisitos...</div>
				</div>
			) : error ? (
				<div className="empty-state">
					<div className="empty-icon">
						<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
							<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<div className="empty-title">Erro ao carregar requisitos</div>
					<div className="empty-subtitle">{error}</div>
				</div>
			) : (
				<div className={styles['topics-grid']}>
					{topicsWithCount.map((t) => (
						<div className={styles['topic-card']} key={t.id} onClick={() => onTopicSelect(t, requirements)}>
							<div className={styles['topic-card-top']}>
								<div className={styles['topic-icon']}>
									<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
										<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
										<polyline points="14 2 14 8 20 8" />
										<line x1="16" y1="13" x2="8" y2="13" />
										<line x1="16" y1="17" x2="8" y2="17" />
									</svg>
								</div>
								<div className={styles['topic-name']}>{t.name}</div>
							</div>
							<div className={styles['topic-count']}>
								{t.count === 0 ? '0 requisitos' : t.count === 1 ? '1 requisito' : `${t.count} requisitos`}
							</div>
						</div>
					))}
					{customTopics.map((t) => {
						const bloco = blocos.find(b => b.tipo_chave === t.type);
						return (
							<div className={styles['topic-card']} key={t.id} onClick={() => onTopicSelect(t, requirements)} style={{ borderColor: 'rgba(99,102,241,0.25)' }}>
								<div className={styles['topic-card-top']}>
									<div className={styles['topic-icon']} style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
										<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
											<rect x="3" y="3" width="18" height="18" rx="3" />
											<path d="M9 12h6M12 9v6" />
										</svg>
									</div>
									<div className={styles['topic-name']}>{t.name}</div>
									{canEdit && bloco && (
										<button
											onClick={(e) => handleDeleteBloco(e, bloco.id)}
											style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
											title="Excluir bloco"
										>×</button>
									)}
								</div>
								<div className={styles['topic-count']}>
									{t.count === 0 ? '0 requisitos' : t.count === 1 ? '1 requisito' : `${t.count} requisitos`}
								</div>
							</div>
						);
					})}
					{canEdit && (
						showNewBlocoInput ? (
							<div className={styles['topic-card']} style={{ borderStyle: 'dashed', cursor: 'default' }} onClick={e => e.stopPropagation()}>
								<input
									ref={newBlocoInputRef}
									style={{ fontSize: 13, fontFamily: 'Sora,sans-serif', fontWeight: 600, border: 'none', outline: 'none', background: 'transparent', width: '100%', color: 'var(--text-primary)' }}
									placeholder="Nome do bloco..."
									value={newBlocoNome}
									onChange={e => setNewBlocoNome(e.target.value)}
									onKeyDown={e => { if (e.key === 'Enter') handleCreateBloco(); if (e.key === 'Escape') { setShowNewBlocoInput(false); setNewBlocoNome(''); } }}
									disabled={blocoLoading}
								/>
								<div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
									<button onClick={handleCreateBloco} disabled={!newBlocoNome.trim() || blocoLoading} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: 'none', background: 'var(--green-bright)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Criar</button>
									<button onClick={() => { setShowNewBlocoInput(false); setNewBlocoNome(''); }} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px solid var(--card-border)', background: 'transparent', cursor: 'pointer' }}>Cancelar</button>
								</div>
							</div>
						) : (
							<div className={styles['topic-card']} style={{ borderStyle: 'dashed', cursor: 'pointer', opacity: 0.7 }} onClick={() => setShowNewBlocoInput(true)}>
								<div className={styles['topic-card-top']}>
									<div className={styles['topic-icon']} style={{ background: 'transparent' }}>
										<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
											<path d="M12 5v14M5 12h14" />
										</svg>
									</div>
									<div className={styles['topic-name']}>Novo bloco</div>
								</div>
								<div className={styles['topic-count']}>bloco personalizado</div>
							</div>
						)
					)}
				</div>
			)}
			<div className={styles['bottom-nav-spacer']} />
		</AppLayout>

		{showConvites && (
			<ConvitesModal
				projectId={project.id}
				projectName={project.nome}
				onClose={() => setShowConvites(false)}
			/>
		)}
		</>
	);
}
