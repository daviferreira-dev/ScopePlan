import { useState, useEffect, useRef } from "react";
import { auditApi, projectsApi, type AuditLogData, type ProjectData } from "../../services/api";
import { TYPE_COLORS, ACTION_LABELS, ENTITY_LABELS, TYPE_ICONS } from "../../utils/constants";
import AppLayout from "../../components/AppLayout";
import "../../styles/app.css";
import styles from './Auditoria.module.css';

interface Props {
	perfil: 'analista' | 'cliente' | 'gestor' | 'desenvolvedor';
	onBack?: () => void;
}

const BRT = { timeZone: 'America/Sao_Paulo' };

const formatEventTime = (dateString: string): string => {
	const date = new Date(dateString);
	const now = new Date();
	const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
	const time = date.toLocaleTimeString('pt-BR', { ...BRT, hour: '2-digit', minute: '2-digit' });
	if (diffDays === 0) return `${time} · Hoje`;
	if (diffDays === 1) return `${time} · Ontem`;
	return `${time} · ${date.toLocaleDateString('pt-BR', BRT)}`;
};

const getTypeLabel = (type: string): string => ACTION_LABELS[type] || type;

// Rótulo do evento no formato "Projeto - Ação" (ex.: "ScopePlan - Requisito criado")
const getEventLabel = (ev: AuditLogData): string =>
	ev.projeto_nome ? `${ev.projeto_nome} - ${getTypeLabel(ev.acao)}` : getTypeLabel(ev.acao);

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
	const [totalEvents, setTotalEvents] = useState<number | null>(null);
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
					const response = await auditApi.list(page, 1000, filters, { signal: controller.signal });
					if (controller.signal.aborted) return;
					setEvents(response.audit_logs);
					setTotalPages(response.pages || 1);
					setTotalEvents(response.total ?? null);
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
	const norm = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
	const filteredEvents = useServerPagination
		? events
		: events.filter((ev) => {
			if (filterProjectLabel !== "Todos os Projetos" && ev.entidade_tipo !== filterProjectLabel) return false;
			if (filterTypeLabel !== "Todos os Tipos" && getTypeLabel(ev.acao) !== filterTypeLabel) return false;
			if (searchDebounced.trim()) {
				const q = norm(searchDebounced);
				const match =
					norm(formatDetalhes(ev.detalhes)).includes(q) ||
					norm(ev.acao).includes(q) ||
					norm(getTypeLabel(ev.acao)).includes(q) ||
					norm(ev.usuario_nome || ev.usuario?.nome || '').includes(q) ||
					norm(ev.entidade_tipo).includes(q);
				if (!match) return false;
			}
			return true;
		});

	const displayEvents = useServerPagination ? events : filteredEvents;

	const getTypeColor = (type: string) => TYPE_COLORS[type] || TYPE_COLORS.criacao;

	const now = new Date();

	const getDayLabel = (date: Date): string => {
		const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
		if (diffDays === 0) return 'Hoje';
		if (diffDays === 1) return 'Ontem';
		return date.toLocaleDateString('pt-BR', { ...BRT, weekday: 'short', day: '2-digit', month: 'short' });
	};

	const getDayKey = (date: Date): string =>
		date.toLocaleDateString('pt-BR', BRT);

	const getWeekOfMonth = (date: Date): number =>
		Math.ceil(date.getDate() / 7);

	const getWeekRange = (date: Date): string => {
		const week = getWeekOfMonth(date);
		const starts = (week - 1) * 7 + 1;
		const ends = Math.min(week * 7, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
		return `${String(starts).padStart(2, '0')}–${String(ends).padStart(2, '0')}`;
	};

	const getWeekKey = (date: Date): string =>
		`${date.getFullYear()}-${date.getMonth()}-w${getWeekOfMonth(date)}`;

	const getMonthKey = (date: Date): string =>
		`${date.getFullYear()}-${date.getMonth()}`;

	const getMonthLabel = (date: Date): string =>
		date.toLocaleDateString('pt-BR', { ...BRT, month: 'long', year: 'numeric' })
			.replace(/^\w/, c => c.toUpperCase());

	// Estrutura: Mês → Semana → Dia
	type DayGroup   = { dayLabel: string; dayKey: string; events: AuditLogData[] };
	type WeekGroup  = { weekKey: string; weekNum: number; weekRange: string; days: DayGroup[] };
	type MonthGroup = { monthKey: string; monthLabel: string; weeks: WeekGroup[] };

	const schedule = displayEvents.reduce<MonthGroup[]>((months, ev) => {
		const date = new Date(ev.criado_em);
		const monthKey = getMonthKey(date);
		const weekKey  = getWeekKey(date);
		const dayKey   = getDayKey(date);

		let month = months.find(m => m.monthKey === monthKey);
		if (!month) {
			month = { monthKey, monthLabel: getMonthLabel(date), weeks: [] };
			months.push(month);
		}

		let week = month.weeks.find(w => w.weekKey === weekKey);
		if (!week) {
			week = { weekKey, weekNum: getWeekOfMonth(date), weekRange: getWeekRange(date), days: [] };
			month.weeks.push(week);
		}

		let day = week.days.find(d => d.dayKey === dayKey);
		if (!day) {
			day = { dayLabel: getDayLabel(date), dayKey, events: [] };
			week.days.push(day);
		}

		day.events.push(ev);
		return months;
	}, []);

	const todayCount = displayEvents.filter(ev =>
		new Date(ev.criado_em).toDateString() === now.toDateString()
	).length;

	// ── Nav panel state ──
	const [navOpen, setNavOpen] = useState(true);
	const [openMonths, setOpenMonths] = useState<Set<string>>(() => {
		const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
		return new Set([currentMonthKey]);
	});
	const [activeSection, setActiveSection] = useState<string>('');
	const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

	const toggleMonth = (key: string) =>
		setOpenMonths(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

	const scrollTo = (key: string) => {
		const el = sectionRefs.current[key];
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		setActiveSection(key);
	};

	// Intersection observer para destacar seção visível
	useEffect(() => {
		const obs = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) { setActiveSection(entry.target.id); break; }
				}
			},
			{ threshold: 0.2, rootMargin: '-60px 0px -60% 0px' }
		);
		Object.values(sectionRefs.current).forEach(el => { if (el) obs.observe(el); });
		return () => obs.disconnect();
	}, [schedule.length]);

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
				{/* Projeto */}
				<div className={styles['aud-filter-item']}>
					<span className={styles['aud-filter-label']}>
						<svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
						Projeto
					</span>
					{useServerPagination ? (
						<select className={styles['aud-filter-select']} value={filterProject} onChange={(e) => { setFilterProject(e.target.value ? Number(e.target.value) : ''); setPage(1); }}>
							<option value="">Todos os Projetos</option>
							{projects.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
						</select>
					) : (
						<select className={styles['aud-filter-select']} value={filterProjectLabel} onChange={(e) => setFilterProjectLabel(e.target.value)}>
							{clientProjects.map((name) => <option key={name} value={name}>{name}</option>)}
						</select>
					)}
				</div>

				{/* Tipo */}
				<div className={styles['aud-filter-item']}>
					<span className={styles['aud-filter-label']}>
						<svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
						Tipo de ação
					</span>
					{useServerPagination ? (
						<select className={styles['aud-filter-select']} value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
							<option value="">Todos os Tipos</option>
							{Object.entries(ACTION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
						</select>
					) : (
						<select className={styles['aud-filter-select']} value={filterTypeLabel} onChange={(e) => setFilterTypeLabel(e.target.value)}>
							{clientTypes.map((label) => <option key={label} value={label}>{label}</option>)}
						</select>
					)}
				</div>

				{/* Datas */}
				{useServerPagination && (
					<div className={styles['aud-filter-dates']}>
						<div className={styles['aud-filter-date-item']}>
							<span className={styles['aud-filter-label']}>
								<svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
								De
							</span>
							<input type="date" className={styles['aud-filter-date']} value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }} />
						</div>
						<span className={styles['aud-filter-date-sep']}>→</span>
						<div className={styles['aud-filter-date-item']}>
							<span className={styles['aud-filter-label']}>
								<svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
								Até
							</span>
							<input type="date" className={styles['aud-filter-date']} value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }} />
						</div>
					</div>
				)}

				{/* Busca */}
				<div className={styles['aud-search-wrap']}>
					<span className={styles['aud-search-label']}>
						<svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
						Busca
					</span>
					<div className={styles['aud-search-inner']}>
						<span className={styles['aud-search-icon']}>
							<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
							</svg>
						</span>
						<input type="text" className={styles['aud-search']} placeholder="Ação, autor ou descrição..." value={searchText} onChange={(e) => { setSearchText(e.target.value); if (useServerPagination) setPage(1); }} />
					</div>
				</div>
			</div>

			{/* Stats strip */}
			{!loading && !error && displayEvents.length > 0 && (
				<div className={styles['aud-stats']}>
					<div className={styles['aud-stat']}>
						<span className={styles['aud-stat-value']}>{totalEvents ?? displayEvents.length}</span>
						<span className={styles['aud-stat-label']}>eventos no total</span>
					</div>
					<div className={styles['aud-stat-divider']} />
					<div className={styles['aud-stat']}>
						<span className={styles['aud-stat-value']}>{todayCount}</span>
						<span className={styles['aud-stat-label']}>registrados hoje</span>
					</div>
				</div>
			)}

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
				<div className={styles['aud-body']}>

					{/* ── Painel de navegação ── */}
					<aside className={`${styles['aud-nav']}${navOpen ? '' : ` ${styles['aud-nav--closed']}`}`}>
						<div className={styles['aud-nav-header']}>
							<span className={styles['aud-nav-title']}>
								<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
								Navegação
							</span>
							<button className={styles['aud-nav-toggle']} onClick={() => setNavOpen(o => !o)}>
								<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
									{navOpen ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
								</svg>
							</button>
						</div>

						<nav className={styles['aud-nav-tree']}>
							{schedule.map((month) => {
								const monthTotal = month.weeks.reduce((s, w) => s + w.days.reduce((ds, d) => ds + d.events.length, 0), 0);
								const isMonthOpen = openMonths.has(month.monthKey);
								return (
									<div key={month.monthKey} className={styles['aud-nav-month']}>
										<button
											className={`${styles['aud-nav-month-btn']}${activeSection === month.monthKey ? ` ${styles.active}` : ''}`}
											onClick={() => { toggleMonth(month.monthKey); scrollTo(month.monthKey); }}
										>
											<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={`${styles['aud-nav-chevron']}${isMonthOpen ? ` ${styles.open}` : ''}`}>
												<path d="M9 18l6-6-6-6" />
											</svg>
											<span className={styles['aud-nav-month-label']}>{month.monthLabel}</span>
											<span className={styles['aud-nav-badge']}>{monthTotal}</span>
										</button>

										{isMonthOpen && (
											<div className={styles['aud-nav-weeks']}>
												{month.weeks.map((week) => {
													const weekTotal = week.days.reduce((s, d) => s + d.events.length, 0);
													return (
														<button
															key={week.weekKey}
															className={`${styles['aud-nav-week-btn']}${activeSection === week.weekKey ? ` ${styles.active}` : ''}`}
															onClick={() => scrollTo(week.weekKey)}
														>
															<span className={styles['aud-nav-week-dot']} />
															<span className={styles['aud-nav-week-label']}>Sem. {week.weekNum} · {week.weekRange}</span>
															<span className={styles['aud-nav-badge']}>{weekTotal}</span>
														</button>
													);
												})}
											</div>
										)}
									</div>
								);
							})}
						</nav>
					</aside>

					{/* ── Conteúdo da timeline ── */}
					<div className={styles['aud-content']}>
						{schedule.map((month) => (
							<div
								key={month.monthKey}
								id={month.monthKey}
								ref={el => { sectionRefs.current[month.monthKey] = el; }}
								className={styles['aud-month']}
							>
								<div className={styles['aud-month-header']}>
									<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
									</svg>
									{month.monthLabel}
									<span className={styles['aud-month-count']}>
										{month.weeks.reduce((s, w) => s + w.days.reduce((ds, d) => ds + d.events.length, 0), 0)} eventos
									</span>
								</div>

								{month.weeks.map((week) => (
									<div
										key={week.weekKey}
										id={week.weekKey}
										ref={el => { sectionRefs.current[week.weekKey] = el; }}
										className={styles['aud-week']}
									>
										<div className={styles['aud-week-header']}>
											<span className={styles['aud-week-label']}>Semana {week.weekNum}</span>
											<span className={styles['aud-week-range']}>{week.weekRange}</span>
											<span className={styles['aud-week-count']}>
												{week.days.reduce((s, d) => s + d.events.length, 0)} eventos
											</span>
										</div>

										{week.days.map((day) => (
											<div key={day.dayKey} className={styles['aud-day']}>
												<div className={styles['aud-day-sep']}>
													<span className={styles['aud-day-sep-dot']} />
													<span className={styles['aud-day-sep-label']}>{day.dayLabel}</span>
													<span className={styles['aud-day-sep-line']} />
													<span className={styles['aud-day-sep-count']}>{day.events.length}</span>
												</div>

												<div className={styles['aud-timeline']}>
													{day.events.map((ev, i) => {
														const colors = getTypeColor(ev.acao);
														const entityLabel = ENTITY_LABELS[ev.entidade_tipo] || ev.entidade_tipo;
														return (
															<div className={styles['aud-event']} key={ev.id} style={{ animationDelay: `${i * 0.04}s` }}>
																<div className={styles['aud-event-dot']} style={{ background: colors.dot }}>
																	{TYPE_ICONS[ev.acao] || TYPE_ICONS.criacao}
																</div>
																<div className={styles['aud-event-card']} style={{ borderLeftColor: colors.dot }} onClick={() => setSelectedEvent(ev)}>
																	<div className={styles['aud-event-top']}>
																		<span className={styles['aud-event-badge']} style={{ background: colors.bg, color: colors.text }}>
																			{TYPE_ICONS[ev.acao] || TYPE_ICONS.criacao}
																			{getEventLabel(ev)}
																		</span>
																		<span className={styles['aud-event-time']}>
																			<svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
																			{new Date(ev.criado_em).toLocaleTimeString('pt-BR', { ...BRT, hour: '2-digit', minute: '2-digit' })}
																		</span>
																	</div>
																	<div className={styles['aud-event-desc']}>
																		{formatDetalhes(ev.detalhes) || getTypeLabel(ev.acao)}
																	</div>
																	<div className={styles['aud-event-bottom']}>
																		<span className={styles['aud-event-author']}>
																			<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
																				<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
																			</svg>
																			{ev.usuario?.nome || 'Sistema'}
																		</span>
																		{ev.entidade_id && (
																			<span className={styles['aud-event-entity']}>{entityLabel} #{ev.entidade_id}</span>
																		)}
																	</div>
																</div>
															</div>
														);
													})}
												</div>
											</div>
										))}
									</div>
								))}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Pagination */}
			{useServerPagination && totalPages > 1 && (
				<div className={styles['aud-pagination']}>
					<button className={styles['aud-page-btn']} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
						<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6" /></svg>
						Anterior
					</button>
					{Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
						<button key={p} className={`${styles['aud-page-btn']}${p === page ? ` ${styles.active}` : ''}`} onClick={() => setPage(p)}>{p}</button>
					))}
					{totalPages > 7 && <span className={styles['aud-page-info']}>...</span>}
					<button className={styles['aud-page-btn']} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
						Próxima
						<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 18l6-6-6-6" /></svg>
					</button>
					<span className={styles['aud-page-info']}>Página {page} de {totalPages}</span>
				</div>
			)}

			{/* Detail Modal */}
			{selectedEvent && (() => {
				const colors = getTypeColor(selectedEvent.acao);
				const detalhesObj = typeof selectedEvent.detalhes === 'object' && selectedEvent.detalhes !== null ? selectedEvent.detalhes : null;
				return (
					<div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedEvent(null)}>
						<div className={`modal ${styles['aud-modal']}`}>
							<div className={styles['aud-modal-header']} style={{ borderLeftColor: colors.dot }}>
								<span className={styles['aud-modal-badge']} style={{ background: colors.bg, color: colors.text }}>
									{TYPE_ICONS[selectedEvent.acao] || TYPE_ICONS.criacao}
									{getEventLabel(selectedEvent)}
								</span>
								<button className={styles['aud-modal-close']} onClick={() => setSelectedEvent(null)}>
									<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" /></svg>
								</button>
							</div>

							<div className={styles['aud-modal-grid']}>
								<div className={styles['aud-detail-row']}>
									<span className={styles['aud-detail-label']}>Entidade</span>
									<span className={styles['aud-detail-value']}>
										{ENTITY_LABELS[selectedEvent.entidade_tipo] || selectedEvent.entidade_tipo}
										{selectedEvent.entidade_id && <span className={styles['aud-detail-id']}>#{selectedEvent.entidade_id}</span>}
									</span>
								</div>
								<div className={styles['aud-detail-row']}>
									<span className={styles['aud-detail-label']}>Autor</span>
									<span className={styles['aud-detail-value']}>
										<span className={styles['aud-detail-author']}>
											<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
											{selectedEvent.usuario?.nome || 'Sistema'}
										</span>
									</span>
								</div>
								<div className={styles['aud-detail-row']}>
									<span className={styles['aud-detail-label']}>Data e Horário</span>
									<span className={styles['aud-detail-value']}>{new Date(selectedEvent.criado_em).toLocaleString('pt-BR', { ...BRT, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
								</div>
							</div>

							{(detalhesObj || selectedEvent.detalhes) && (
								<div className={styles['aud-modal-detalhes']}>
									<span className={styles['aud-detail-label']}>Detalhes</span>
									{detalhesObj ? (
										<div className={styles['aud-detail-kv']}>
											{Object.entries(detalhesObj).filter(([k]) => k !== 'seed').map(([k, v]) => (
												<div key={k} className={styles['aud-detail-kv-row']}>
													<span className={styles['aud-detail-kv-key']}>{k}</span>
													<span className={styles['aud-detail-kv-val']}>{String(v)}</span>
												</div>
											))}
										</div>
									) : (
										<span className={styles['aud-detail-value']}>{String(selectedEvent.detalhes)}</span>
									)}
								</div>
							)}

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
