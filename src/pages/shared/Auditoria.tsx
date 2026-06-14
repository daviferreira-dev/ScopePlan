import { useState, useEffect } from "react";
import { auditApi, projectsApi, type AuditLogData, type ProjectData } from "../../services/api";
import { TYPE_COLORS, ACTION_LABELS, ENTITY_LABELS, TYPE_ICONS } from "../../utils/constants";
import AppLayout from "../../components/AppLayout";
import "../../styles/app.css";
import styles from './Auditoria.module.css';

interface Props {
	perfil: 'analista' | 'cliente' | 'gestor' | 'desenvolvedor';
	onBack?: () => void;
}

const formatEventTime = (dateString: string): string => {
	const date = new Date(dateString);
	const now = new Date();
	const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
	const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
	if (diffDays === 0) return `${time} · Hoje`;
	if (diffDays === 1) return `${time} · Ontem`;
	return `${time} · ${date.toLocaleDateString('pt-BR')}`;
};

const getTypeLabel = (type: string): string => ACTION_LABELS[type] || type;

// detalhes vem como objeto JSON do backend (ex.: {"titulo": "...", "tipo": "..."})
const formatDetalhes = (detalhes: AuditLogData['detalhes']): string => {
	if (!detalhes) return '';
	if (typeof detalhes === 'string') return detalhes;
	return Object.entries(detalhes)
		.filter(([key]) => key !== 'seed')
		.map(([key, value]) => `${key}: ${String(value)}`)
		.join(' · ');
};

export default function Auditoria({ perfil, onBack }: Props) {
	const useServerPagination = perfil === 'analista' || perfil === 'gestor';

	// ── State ──
	const [events, setEvents] = useState<AuditLogData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Server-pagination state (analista / gestor)
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [filterProject, setFilterProject] = useState<number | ''>('');
	const [filterType, setFilterType] = useState<string>('');
	const [filterDateFrom, setFilterDateFrom] = useState<string>('');
	const [filterDateTo, setFilterDateTo] = useState<string>('');
	const [projects, setProjects] = useState<ProjectData[]>([]);

	// Client-side-filter state (cliente / desenvolvedor)
	const [filterProjectLabel, setFilterProjectLabel] = useState<string>("Todos os Projetos");
	const [filterTypeLabel, setFilterTypeLabel] = useState<string>("Todos os Tipos");
	const [clientProjects, setClientProjects] = useState<string[]>([]);
	const [clientTypes, setClientTypes] = useState<string[]>([]);

	// Shared state
	const [searchText, setSearchText] = useState('');
	const [searchDebounced, setSearchDebounced] = useState('');
	const [selectedEvent, setSelectedEvent] = useState<AuditLogData | null>(null);

	// Debounce search text (300ms)
	useEffect(() => {
		const timer = setTimeout(() => setSearchDebounced(searchText), 300);
		return () => clearTimeout(timer);
	}, [searchText]);

	// ── Effects ──
	useEffect(() => {
		if (!useServerPagination) return;
		const controller = new AbortController();
		async function load() {
			try {
				const response = await projectsApi.list(1, 20, undefined, undefined, { signal: controller.signal });
				if (controller.signal.aborted) return;
				setProjects(response.projetos);
			} catch { /* ignore abort errors */ }
		}
		load();
		return () => controller.abort();
	}, []);

	useEffect(() => {
		const controller = new AbortController();
		async function load() {
			try {
				setLoading(true);
				setError(null);
				if (useServerPagination) {
					const filters: Record<string, string> = {};
					if (filterProject) filters.projeto_id = String(filterProject);
					if (filterType) filters.acao = filterType;
					if (filterDateFrom) filters.data_inicio = filterDateFrom;
					if (filterDateTo) filters.data_fim = filterDateTo;
					if (searchDebounced.trim()) filters.search = searchDebounced.trim();
					const response = await auditApi.list(page, 20, filters, { signal: controller.signal });
					if (controller.signal.aborted) return;
					setEvents(response.audit_logs);
					setTotalPages(response.pages || 1);
				} else {
					const response = await auditApi.list(1, 1000, undefined, { signal: controller.signal });
					if (controller.signal.aborted) return;
					setEvents(response.audit_logs);
					const uniqueProjects = Array.from(new Set(response.audit_logs.map(e => e.entidade_tipo)));
					const uniqueTypes = Array.from(new Set(response.audit_logs.map(e => e.acao)));
					setClientProjects(["Todos os Projetos", ...uniqueProjects]);
					setClientTypes(["Todos os Tipos", ...uniqueTypes.map(getTypeLabel)]);
				}
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : 'Erro ao carregar auditoria');
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		}
		load();
		return () => controller.abort();
	}, useServerPagination
		? [page, filterProject, filterType, filterDateFrom, filterDateTo, searchDebounced]
		: []
	);

	// ── Client-side filtered events ──
	const filteredEvents = useServerPagination
		? events
		: events.filter((ev) => {
			if (filterProjectLabel !== "Todos os Projetos" && ev.entidade_tipo !== filterProjectLabel) return false;
			if (filterTypeLabel !== "Todos os Tipos" && getTypeLabel(ev.acao) !== filterTypeLabel) return false;
			if (searchDebounced.trim()) {
				const q = searchDebounced.toLowerCase();
				const match =
					formatDetalhes(ev.detalhes).toLowerCase().includes(q) ||
					ev.acao.toLowerCase().includes(q) ||
					ev.usuario?.nome.toLowerCase().includes(q) ||
					ev.entidade_tipo.toLowerCase().includes(q);
				if (!match) return false;
			}
			return true;
		});

	const displayEvents = useServerPagination ? events : filteredEvents;

	const getTypeColor = (type: string) => TYPE_COLORS[type] || TYPE_COLORS.criacao;

	return (
		<AppLayout
			perfil={perfil}
			activePage="auditoria"
			onBack={onBack}
			onPageChange={(p) => { if (p === "projetos" && onBack) onBack(); }}
			topbarTitle="Trilha de Auditoria"
			topbarSubtitle="Registro de todas as acoes realizadas nos projetos."
		>
			{/* Filters */}
			<div className={styles['aud-filters']}>
				{useServerPagination ? (
					/* ── Project dropdown (by ID) ── */
					<select
						className={styles['aud-filter-select']}
						value={filterProject}
						onChange={(e) => { setFilterProject(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
					>
						<option value="">Todos os Projetos</option>
						{projects.map((p) => (
							<option key={p.id} value={p.id}>{p.nome}</option>
						))}
					</select>
				) : (
					/* ── Project dropdown (by label) ── */
					<select
						className={styles['aud-filter-select']}
						value={filterProjectLabel}
						onChange={(e) => setFilterProjectLabel(e.target.value)}
					>
						{clientProjects.map((name) => (
							<option key={name} value={name}>{name}</option>
						))}
					</select>
				)}

				{useServerPagination ? (
					/* ── Type dropdown (by key) ── */
					<select
						className={styles['aud-filter-select']}
						value={filterType}
						onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
					>
						<option value="">Todos os Tipos</option>
						{Object.entries(ACTION_LABELS).map(([key, label]) => (
							<option key={key} value={key}>{label}</option>
						))}
					</select>
				) : (
					/* ── Type dropdown (by label) ── */
					<select
						className={styles['aud-filter-select']}
						value={filterTypeLabel}
						onChange={(e) => setFilterTypeLabel(e.target.value)}
					>
						{clientTypes.map((label) => (
							<option key={label} value={label}>{label}</option>
						))}
					</select>
				)}

				{/* Date range (analista / gestor only) */}
				{useServerPagination && (
					<>
						<input
							type="date"
							className={styles['aud-filter-date']}
							value={filterDateFrom}
							onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
						/>
						<input
							type="date"
							className={styles['aud-filter-date']}
							value={filterDateTo}
							onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
						/>
					</>
				)}

				{/* Search (both modes) */}
				<div className={styles['aud-search-wrap']}>
					<span className={styles['aud-search-icon']}>
						<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
						</svg>
					</span>
					<input
						type="text"
						className={styles['aud-search']}
						placeholder="Buscar por requisito, documento ou descricao..."
						value={searchText}
						onChange={(e) => {
							setSearchText(e.target.value);
							if (useServerPagination) setPage(1);
						}}
					/>
				</div>
			</div>

			{/* Timeline */}
			{loading ? (
				<div className={styles['aud-loading']}>
					<div className={styles['aud-loading-spinner']} />
					<span className={styles['aud-loading-text']}>Carregando eventos de auditoria...</span>
				</div>
			) : error ? (
				<div className={styles['aud-empty']}>
					<div className={styles['aud-empty-icon']}>
						<svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
							<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<div className={styles['aud-empty-title']}>Erro ao carregar auditoria</div>
					<div className={styles['aud-empty-sub']}>{error}</div>
				</div>
			) : displayEvents.length === 0 ? (
				<div className={styles['aud-empty']}>
					<div className={styles['aud-empty-icon']}>
						<svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
							<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
						</svg>
					</div>
					<div className={styles['aud-empty-title']}>Nenhum evento encontrado</div>
					<div className={styles['aud-empty-sub']}>Tente ajustar os filtros ou a busca para encontrar registros.</div>
				</div>
			) : (
				<div className={styles['aud-timeline']}>
					{displayEvents.map((ev, i) => {
						const colors = getTypeColor(ev.acao);
						return (
							<div className={styles['aud-event']} key={ev.id} style={{ animationDelay: `${i * 0.045}s` }}>
								<div className={styles['aud-event-dot']} style={{ background: colors.dot, color: "#fff" }}>
									{TYPE_ICONS[ev.acao] || TYPE_ICONS.criacao}
								</div>
								<div className={styles['aud-event-card']} onClick={() => setSelectedEvent(ev)}>
									<div
										className={styles['aud-event-card-bar']}
										style={{ background: `linear-gradient(90deg, ${colors.dot}, ${colors.accent})` }}
									/>
									<div className={styles['aud-event-top']}>
										<span className={styles['aud-event-title']}>{getTypeLabel(ev.acao)}</span>
										<span className={styles['aud-event-time']}>{formatEventTime(ev.criado_em)}</span>
									</div>
									<div className={styles['aud-event-desc']}>{formatDetalhes(ev.detalhes) || ev.acao}</div>
									<div className={styles['aud-event-bottom']}>
										<span className={styles['aud-event-author']}>
											<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
												<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
												<circle cx="12" cy="7" r="4" />
											</svg>
											{ev.usuario?.nome || 'Sistema'}
										</span>
										<span className={styles['aud-event-project-badge']} style={{ background: colors.bg, color: colors.text }}>
											{ev.entidade_tipo}
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Pagination (analista / gestor only) */}
			{useServerPagination && totalPages > 1 && (
				<div className={styles['aud-pagination']}>
					<button className={styles['aud-page-btn']} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
					{Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
						<button key={p} className={`${styles['aud-page-btn']}${p === page ? ` ${styles.active}` : ''}`} onClick={() => setPage(p)}>{p}</button>
					))}
					<button className={styles['aud-page-btn']} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Proxima</button>
					<span className={styles['aud-page-info']}>Pagina {page} de {totalPages}</span>
				</div>
			)}

			{/* Detail Modal */}
			{selectedEvent && (() => {
				const colors = getTypeColor(selectedEvent.acao);
				return (
					<div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedEvent(null)}>
						<div className="modal modal--detail">
							<div className="modal-title">Detalhes do Evento</div>
							<div className="modal-subtitle">Informacoes completas da acao registrada.</div>
							<div className="modal-divider" />
							<div className={styles['aud-detail-row']}>
								<span className={styles['aud-detail-label']}>Tipo da Acao</span>
								<span className={styles['aud-detail-type']} style={{ background: colors.bg, color: colors.text }}>
									{getTypeLabel(selectedEvent.acao)}
								</span>
							</div>
							<div className={styles['aud-detail-row']}>
								<span className={styles['aud-detail-label']}>Entidade</span>
								<span className={styles['aud-detail-value']}>
									<strong>{ENTITY_LABELS[selectedEvent.entidade_tipo] || selectedEvent.entidade_tipo} #{selectedEvent.entidade_id || ''}</strong>
								</span>
							</div>
							<div className={styles['aud-detail-row']}>
								<span className={styles['aud-detail-label']}>Descricao</span>
								<span className={styles['aud-detail-value']}>{formatDetalhes(selectedEvent.detalhes) || selectedEvent.acao}</span>
							</div>
							<div className={styles['aud-detail-row']}>
								<span className={styles['aud-detail-label']}>Autor</span>
								<span className={styles['aud-detail-value']}>{selectedEvent.usuario?.nome || 'Sistema'}</span>
							</div>
							<div className={styles['aud-detail-row']}>
								<span className={styles['aud-detail-label']}>Data e Horario</span>
								<span className={styles['aud-detail-value']}>{new Date(selectedEvent.criado_em).toLocaleString('pt-BR')}</span>
							</div>
							<div className="modal-actions">
								<button className="btn-cancel--outlined" onClick={() => setSelectedEvent(null)}>Fechar</button>
							</div>
						</div>
					</div>
				);
			})()}
		</AppLayout>
	);
}
