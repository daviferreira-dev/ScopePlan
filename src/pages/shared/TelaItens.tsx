import { useState, useEffect } from 'react';
import { requirementsApi } from '../../services/api';
import type { RequirementData, ProjectData } from '../../services/api';
import AppLayout from '../../components/AppLayout';
import { REQUIREMENT_TOPICS, type RequirementTopic, type Perfil } from '../../utils/constants';
import Dashboard from './Dashboard';
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

export default function TelaItens({ project, onBack, perfil, onTopicSelect, onDownload, onAuditPage }: Props) {
	const [requirements, setRequirements] = useState<RequirementData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [tab, setTab] = useState<'lista' | 'painel'>('lista');

	useEffect(() => {
		const controller = new AbortController();
		async function load() {
			try {
				setLoading(true);
				setError(null);
				const response = await requirementsApi.list(project.id, 1, 50, undefined, { signal: controller.signal });
				if (controller.signal.aborted) return;
				setRequirements(response.requisitos);
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

	const topicsWithCount: Topic[] = BASE_TOPICS.map(t => ({
		...t,
		count: requirements.filter(r => r.tipo === t.type).length,
	}));

	const topbarTitle = project.nome;

	return (
		<AppLayout
			perfil={perfil}
			activePage="projetos"
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
				<button className="btn-download" onClick={onDownload}>
					<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
					</svg>
					Baixar ERS
				</button>
			}
		>
			<div className={styles['view-tabs']}>
				<button
					className={`${styles['view-tab']} ${tab === 'lista' ? styles['view-tab-active'] : ''}`}
					onClick={() => setTab('lista')}
				>
					<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
						<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
						<line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
					</svg>
					Requisitos
				</button>
				<button
					className={`${styles['view-tab']} ${tab === 'painel' ? styles['view-tab-active'] : ''}`}
					onClick={() => setTab('painel')}
				>
					<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
						<line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
					</svg>
					Painel
				</button>
			</div>

			{tab === 'painel' ? (
				<Dashboard projectId={project.id} />
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
				</div>
			)}
		</AppLayout>
	);
}