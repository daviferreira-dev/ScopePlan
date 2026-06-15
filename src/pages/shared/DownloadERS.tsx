import { useState, useEffect } from "react";
import { projectsApi, diagramasApi, type ProjectData, type RequirementData, type DiagramaData } from "../../services/api";
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

// Espelham os rótulos/cores usados na geração do PDF (ers_generator.py)
const STATUS_LABELS: Record<string, string> = {
	rascunho: 'Rascunho', em_revisao: 'Em Revisão', aprovado: 'Aprovado',
	aprovado_com_ressalvas: 'Aprovado c/ Ressalvas', rejeitado: 'Rejeitado',
};
const PRIORITY_LABELS: Record<string, string> = {
	baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica',
};
const STATUS_COLORS: Record<string, string> = {
	aprovado: '#16a34a', aprovado_com_ressalvas: '#eab308', rejeitado: '#dc2626',
	em_revisao: '#3b82f6', rascunho: '#6b7280',
};
const PRIORITY_COLORS: Record<string, string> = {
	critica: '#dc2626', alta: '#eab308', media: '#3b82f6', baixa: '#6b7280',
};
const APPROVED = new Set(['aprovado', 'aprovado_com_ressalvas']);

export default function DownloadERS({ project, requirements, onBack, perfil }: Props) {
	const canFilterTopics = perfil === 'analista' || perfil === 'gestor';

	const topicsWithCount: TopicInfo[] = BASE_TOPICS.map(t => ({
		...t,
		count: requirements.filter(r => r.tipo === t.type).length,
		requirements: requirements.filter(r => r.tipo === t.type),
	}));

	const [selectedIds, setSelectedIds] = useState<number[]>(BASE_TOPICS.map(t => t.id));
	const [format, setFormat] = useState<Format>("pdf");
	const [incluirDiagramas, setIncluirDiagramas] = useState(true);
	const [incluirTodos, setIncluirTodos] = useState(true);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [diagramas, setDiagramas] = useState<DiagramaData[]>([]);
	const [diagramaUrls, setDiagramaUrls] = useState<Record<number, string>>({});

	useEffect(() => {
		diagramasApi.list(project.id).then(async (res) => {
			setDiagramas(res.diagramas);
			const urls: Record<number, string> = {};
			await Promise.all(res.diagramas.map(async (d) => {
				try {
					const blob = await diagramasApi.getImageBlob(project.id, d.id);
					urls[d.id] = URL.createObjectURL(blob);
				} catch { /* ignora erros individuais */ }
			}));
			setDiagramaUrls(urls);
		}).catch(() => {});
	}, [project.id]);

	const toggleTopic = (id: number) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	};

	const selectedTopics = topicsWithCount.filter((t) => selectedIds.includes(t.id));
	const previewTopics = canFilterTopics ? selectedTopics : topicsWithCount;

	const sortReqs = (reqs: RequirementData[]) =>
		[...reqs].sort((a, b) => {
			const num = (r: RequirementData) => { const m = (r.codigo || '').match(/(\d+)$/); return m ? parseInt(m[1]) : 1e9; };
			return num(a) - num(b) || (a.id - b.id);
		});

	// ── Espelha exatamente o que o PDF gera: aplica o filtro "incluir não aprovados"
	//    e mantém só seções com requisitos (igual a _group_by_topic no backend) ──
	const previewGroups = previewTopics
		.map((t) => ({
			...t,
			reqs: sortReqs(incluirTodos ? t.requirements : t.requirements.filter((r) => APPROVED.has(r.status))),
		}))
		.filter((g) => g.reqs.length > 0);

	const totalReqs = previewGroups.reduce((acc, g) => acc + g.reqs.length, 0);
	const totalAprov = previewGroups.reduce((acc, g) => acc + g.reqs.filter((r) => APPROVED.has(r.status)).length, 0);

	// Numeração das seções (igual section_num no gerador)
	let n = 0;
	const descNum = project.descricao ? ++n : null;
	const numberedGroups = previewGroups.map((g) => ({ ...g, num: ++n }));
	const diagNum = incluirDiagramas ? ++n : null;
	const resumoNum = ++n;

	const now = new Date();
	const dataHoje = now.toLocaleDateString("pt-BR");
	const geradoEm = `${dataHoje} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

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
					{
						...(selectedTypes.length !== BASE_TOPICS.length ? { topicIds: selectedTypes } : {}),
						incluir_diagramas: incluirDiagramas,
						incluir_nao_aprovados: incluirTodos,
					}
				);
			} else {
				blob = await projectsApi.downloadERS(project.id, format, { incluir_diagramas: incluirDiagramas, incluir_nao_aprovados: incluirTodos });
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
			onBack={onBack}
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

							<div className={styles['section-label']}>Opções</div>
							<label className={`${styles['topic-checkbox']}${incluirTodos ? ` ${styles.selected}` : ''}`}>
								<input
									type="checkbox"
									checked={incluirTodos}
									onChange={e => setIncluirTodos(e.target.checked)}
								/>
								<span className={styles['topic-name']}>Incluir todos os requisitos</span>
								<span className={styles['topic-count']}>não apenas aprovados</span>
							</label>
							<label className={`${styles['topic-checkbox']}${incluirDiagramas ? ` ${styles.selected}` : ''}`}>
								<input
									type="checkbox"
									checked={incluirDiagramas}
									onChange={e => setIncluirDiagramas(e.target.checked)}
								/>
								<span className={styles['topic-name']}>Incluir diagramas</span>
								<span className={styles['topic-count']}>imagens do projeto</span>
							</label>

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
						{/* ── CAPA (espelha _on_first_page) ── */}
						<div className={styles['doc-sheet']}>
							<div className={styles['doc-cover']}>
								<div className={styles['doc-cover-label']}>ESPECIFICAÇÃO DE REQUISITOS DE SOFTWARE</div>
								<div className={styles['doc-cover-title']}>{project.nome}</div>
								<div className={styles['doc-cover-rule']} />
								<div className={styles['doc-cover-sub']}>Cliente: {project.nome_cliente || "—"}</div>
								<div className={styles['doc-cover-sub']}>Gestor: {project.gestor?.nome || "N/A"}</div>
								<div className={styles['doc-cover-sub']}>Data: {dataHoje}</div>
								<table className={styles['doc-stats']}>
									<thead>
										<tr><th>Requisitos</th><th>Aprovados</th><th>Seções</th></tr>
									</thead>
									<tbody>
										<tr><td>{totalReqs}</td><td>{totalAprov}</td><td>{previewGroups.length}</td></tr>
									</tbody>
								</table>
							</div>
						</div>

						{/* ── PÁGINA DE CONTEÚDO (espelha _on_page + corpo) ── */}
						<div className={styles['doc-sheet']}>
							<div className={styles['doc-header']}>
								<b>ERS — Especificação de Requisitos de Software</b>
								<span>{project.nome}</span>
							</div>

							<div className={styles['doc-content']}>
								{/* Sumário */}
								<div className={styles['doc-toc-title']}>Sumário</div>
								<div className={styles['doc-rule-strong']} />
								{descNum && (
									<div className={styles['doc-toc-item']}>
										<span>{descNum}. Descrição do Projeto</span>
										<span className={styles['doc-toc-dots']} />
										<span className={styles['doc-toc-count']} />
									</div>
								)}
								{numberedGroups.map((g) => (
									<div className={styles['doc-toc-item']} key={g.id}>
										<span>{g.num}. {g.name}</span>
										<span className={styles['doc-toc-dots']} />
										<span className={styles['doc-toc-count']}>{g.reqs.length} item(s)</span>
									</div>
								))}
								{diagNum && (
									<div className={styles['doc-toc-item']}>
										<span>{diagNum}. Diagramas</span>
										<span className={styles['doc-toc-dots']} />
										<span className={styles['doc-toc-count']} />
									</div>
								)}
								<div className={styles['doc-toc-item']}>
									<span>{resumoNum}. Resumo</span>
									<span className={styles['doc-toc-dots']} />
									<span className={styles['doc-toc-count']} />
								</div>

								{/* Descrição do Projeto */}
								{descNum && (
									<div className={styles['doc-section']}>
										<div className={styles['doc-h1']}>{descNum}. Descrição do Projeto</div>
										<div className={styles['doc-rule-light']} />
										<p className={styles['doc-desc']}>{project.descricao}</p>
									</div>
								)}

								{/* Seções de requisitos */}
								{numberedGroups.map((g) => (
									<div className={styles['doc-section']} key={g.id}>
										<div className={styles['doc-h1']}>{g.num}. {g.name}</div>
										<div className={styles['doc-rule-light']} />
										<p className={styles['doc-intro']}>
											Esta seção contém {g.reqs.length} item(s) do tipo <i>{g.name}</i>.
										</p>
										{g.reqs.map((req, idx) => {
											const prio = req.prioridade || 'media';
											const status = req.status || 'rascunho';
											const codigo = req.codigo || `${g.num}.${String(idx + 1).padStart(3, '0')}`;
											return (
												<div className={styles['doc-card']} key={req.id}>
													<div className={styles['doc-card-head']}>
														<span className={styles['doc-card-code']}>{codigo}</span>{'  '}
														<strong>{req.titulo}</strong>
													</div>
													<div className={styles['doc-card-desc']}>
														{req.descricao || <i>Sem descrição.</i>}
													</div>
													<div className={styles['doc-card-meta']}>
														<span style={{ color: PRIORITY_COLORS[prio] }}>
															<strong>Prioridade:</strong> {PRIORITY_LABELS[prio] || prio}
														</span>
														<span style={{ color: STATUS_COLORS[status] }}>
															<strong>Status:</strong> {STATUS_LABELS[status] || status}
														</span>
														<span><strong>Categoria:</strong> {req.categoria || '—'}</span>
													</div>
												</div>
											);
										})}
									</div>
								))}

								{/* Diagramas */}
								{diagNum && (
									<div className={styles['doc-section']}>
										<div className={styles['doc-h1']}>{diagNum}. Diagramas</div>
										<div className={styles['doc-rule-light']} />
										{diagramas.length === 0 ? (
											<p className={styles['doc-intro']}>Nenhum diagrama anexado ao projeto.</p>
										) : (
											diagramas.map((d, i) => (
												<div key={d.id} style={{ marginBottom: 24 }}>
													<div className={styles['doc-h2']}>{diagNum}.{i + 1}. {d.nome || `Diagrama ${i + 1}`}</div>
													{diagramaUrls[d.id] ? (
														<img
															src={diagramaUrls[d.id]}
															alt={d.nome || `Diagrama ${i + 1}`}
															style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 6, border: '1px solid #e2e8f0', marginTop: 8, display: 'block' }}
														/>
													) : (
														<p className={styles['doc-intro']} style={{ color: '#9ca3af' }}>Carregando imagem...</p>
													)}
												</div>
											))
										)}
									</div>
								)}

								{/* Resumo */}
								<div className={styles['doc-section']}>
									<div className={styles['doc-h1']}>{resumoNum}. Resumo</div>
									<div className={styles['doc-rule-light']} />
									<table className={styles['doc-summary']}>
										<thead>
											<tr><th>Seção</th><th>Quantidade</th></tr>
										</thead>
										<tbody>
											{numberedGroups.map((g) => (
												<tr key={g.id}><td>{g.name}</td><td>{g.reqs.length}</td></tr>
											))}
											<tr className={styles['doc-summary-total']}><td>Total</td><td>{totalReqs}</td></tr>
										</tbody>
									</table>
								</div>
							</div>

							<div className={styles['doc-footer']}>
								<span>Gerado em {geradoEm} · ScopePlan</span>
								<span>Página 1</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}
