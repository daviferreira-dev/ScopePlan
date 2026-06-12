import { useState } from "react";
import { projectsApi, type ProjectData, type RequirementData } from "../../services/api";
import AppLayout from "../../components/AppLayout";
import { REQUIREMENT_TOPICS as BASE_TOPICS, TOPIC_TYPE_MAP } from "../../utils/constants";
import styles from './DownloadERS.module.css';

interface TopicInfo {
	id: number;
	name: string;
	type: string;
	count: number;
	requirements: RequirementData[];
}

interface Props {
	project: ProjectData;
	requirements: RequirementData[];
	onBack: () => void;
	perfil: 'analista' | 'cliente' | 'gestor' | 'desenvolvedor';
}

type Format = "pdf" | "docx";

export default function DownloadERS({ project, requirements, onBack, perfil }: Props) {
	const canFilterTopics = perfil === 'analista' || perfil === 'gestor';

	const topicsWithCount: TopicInfo[] = BASE_TOPICS.map(t => ({
		...t,
		count: requirements.filter(r => r.tipo === t.type).length,
		requirements: requirements.filter(r => r.tipo === t.type),
	}));

	const [selectedIds, setSelectedIds] = useState<number[]>(BASE_TOPICS.map(t => t.id));
	const [format, setFormat] = useState<Format>("pdf");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const toggleTopic = (id: number) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	};

	const selectedTopics = topicsWithCount.filter((t) => selectedIds.includes(t.id));
	const previewTopics = canFilterTopics ? selectedTopics : topicsWithCount;

	const handleDownload = async () => {
		if (selectedIds.length === 0) {
			setError("Selecione pelo menos um tópico.");
			return;
		}

		setError("");
		setLoading(true);

		try {
			let blob: Blob;

			if (canFilterTopics) {
				const selectedTypes = selectedIds.map(id => TOPIC_TYPE_MAP[id]).filter(Boolean);
				blob = await projectsApi.downloadERS(
					project.id,
					format,
					selectedTypes.length === BASE_TOPICS.length ? undefined : { topicIds: selectedTypes }
				);
			} else {
				blob = await projectsApi.downloadERS(project.id, format);
			}

			const blobUrl = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = `${project.nome.replace(/\s+/g, "_")}_ERS.${format}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
		} catch (err: unknown) {
			setError((err instanceof Error ? err.message : String(err)) || "Erro inesperado ao gerar download.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<AppLayout
			perfil={perfil}
			activePage="projetos"
			onPageChange={() => onBack()}
			topbarTitle="Download da ERS"
			topbarSubtitle={project.nome}
		>
			<div className={styles.content}>
				<div className={styles['download-layout']}>
					<div className={styles['download-left']}>
						<div className={styles['download-left-inner']}>
							<h2 className={styles['download-title']}>Exportar Documento ERS</h2>
							<p className={styles['download-subtitle']}>Selecione os tópicos e o formato para gerar o arquivo.</p>

							{canFilterTopics && (
								<>
									<div className={styles['section-label']}>Tópicos da ERS</div>
									<div className={styles['topic-list']}>
										{topicsWithCount.map((topic) => (
											<label key={topic.id} className={`${styles['topic-checkbox']}${selectedIds.includes(topic.id) ? ` ${styles.selected}` : ""}`}>
												<input
													type="checkbox"
													checked={selectedIds.includes(topic.id)}
													onChange={() => toggleTopic(topic.id)}
												/>
												<span className={styles['topic-name']}>{topic.name}</span>
												<span className={styles['topic-count']}>{topic.count} requisitos</span>
											</label>
										))}
									</div>
								</>
							)}

							<div className={styles['section-label']}>Formato</div>
							<div className={styles['format-options']}>
								<div className={`${styles['format-option']}${format === "pdf" ? ` ${styles.selected}` : ""}`} onClick={() => setFormat("pdf")}>
									<div className={styles['format-name']}>PDF</div>
									<div className={styles['format-desc']}>Documento portável</div>
								</div>
								<div className={`${styles['format-option']}${format === "docx" ? ` ${styles.selected}` : ""}`} onClick={() => setFormat("docx")}>
									<div className={styles['format-name']}>DOCX</div>
									<div className={styles['format-desc']}>Microsoft Word</div>
								</div>
							</div>

							{error && <div className={styles['error-message']}>{error}</div>}

							<div className={styles.actions}>
								<button className={styles.btnCancel} onClick={onBack}>
									Cancelar
								</button>
								<button className="btn-download" onClick={handleDownload} disabled={loading || (canFilterTopics && selectedIds.length === 0)}>
									<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
									</svg>
									{loading ? "Gerando..." : "Baixar ERS"}
								</button>
							</div>
						</div>
					</div>

					<div className={styles['download-right']}>
						<div className={styles['preview-panel']}>
							<div className={styles['abnt-cover']}>
								<h1>Especificação de Requisitos de Software</h1>
								<div className="subtitle">ERS</div>
								<div className="project-name">{project.nome}</div>
								<div className="client">Cliente: {project.nome_cliente || "—"}</div>
								<div className="date">{new Date().toLocaleDateString("pt-BR")}</div>
							</div>

							<div className={styles['abnt-toc']}>
								<h2>Sumário</h2>
								{previewTopics.map((topic, index) => (
									<div className={styles['abnt-toc-item']} key={topic.id}>
										<span>{index + 1}. {topic.name}</span>
										<span className={styles['abnt-toc-dots']}></span>
										<span>{topic.count}</span>
									</div>
								))}
							</div>

							{previewTopics.map((topic, index) => (
								<div className={styles['abnt-section']} key={topic.id}>
									<h2>{index + 1}. {topic.name}</h2>
									{topic.requirements.length === 0 ? (
										<p className={styles['abnt-no-reqs']}>Nenhum requisito documentado neste tópico.</p>
									) : (
										<ul className={styles['abnt-req-list']}>
											{topic.requirements.map((req) => (
												<li className={styles['abnt-req-item']} key={req.id}>
													<span className={styles['abnt-req-code']}>{req.codigo || `REQ-${req.id}`}</span>
													<span className={styles['abnt-req-title']}>{req.titulo}</span>
													<div className={styles['abnt-req-desc']}>{req.descricao}</div>
												</li>
											))}
										</ul>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}
