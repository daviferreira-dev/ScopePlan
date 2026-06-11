import { useState, useEffect } from "react";
import { requirementsApi } from "../../services/api";
import type { RequirementData, ProjectData } from "../../services/api";
import AppLayout from "../../components/AppLayout";
import { statusClass, statusLabel } from "../../utils/helpers";
import { TOPIC_TYPE_MAP } from "../../utils/constants";
import { useToast } from "../../hooks/useToast";
import ToastContainer from "../../components/ToastContainer";
import styles from './ValidacaoRequisitos.module.css';

interface Topic {
	id: number;
	name: string;
	type: string;
	requirements: RequirementData[];
}

interface Props {
	project: ProjectData;
	topic: Topic;
	onBack: () => void;
	perfil: 'analista' | 'cliente' | 'gestor' | 'desenvolvedor';
}

function normalizeStr(s: string): string {
	const map: Record<string, string> = {
		a: "a", á: "a", ã: "a", â: "a", à: "a",
		e: "e", é: "e", ê: "e",
		i: "i", í: "i",
		o: "o", ó: "o", õ: "o", ô: "o",
		u: "u", ú: "u", ü: "u",
		c: "c", ç: "c", n: "n", ñ: "n",
	};
	return s.toLowerCase().split("").map((c) => map[c] ?? c).join("");
}

function isRequirementTopic(name: string): boolean {
	return normalizeStr(name).includes("requisitos");
}

const EMPTY_FORM = {
	title: "",
	description: "",
	status: "Pendente" as string,
};

function AddRequirementModal({
	topicName,
	onClose,
	onSave,
}: {
	topicName: string;
	onClose: () => void;
	onSave: (data: typeof EMPTY_FORM) => void;
}) {
	const [form, setForm] = useState({ ...EMPTY_FORM });

	const set =
		(field: keyof typeof EMPTY_FORM) =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
			setForm((prev) => ({ ...prev, [field]: e.target.value }));

	const isValid = form.title.trim() !== "" && form.description.trim() !== "";

	return (
		<div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
			<div className="modal modal--structured">
				<div className="modal-header">
					<span className="modal-title">Novo Requisito — {topicName}</span>
					<button className="modal-close" onClick={onClose} aria-label="Fechar">
						<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div className="modal-body">
					<div className="form-group">
						<label className="form-label">Nome / Título *</label>
						<input
							className="form-input"
							placeholder="Ex: Autenticação Múltipla"
							value={form.title}
							onChange={set("title")}
						/>
					</div>

					<div className="form-group">
						<label className="form-label">Descrição *</label>
						<textarea
							className="form-textarea"
							placeholder="Descreva o requisito em detalhe..."
							value={form.description}
							onChange={set("description")}
						/>
					</div>

					<div className="form-group">
						<label className="form-label">Status</label>
						<select className="form-select" value={form.status} onChange={set("status")}>
							<option value="Pendente">Pendente</option>
							<option value="Em Revisão">Em Revisão</option>
							<option value="Aprovado">Aprovado</option>
						</select>
					</div>
				</div>

				<div className="modal-footer">
					<button className="btn-cancel--outlined" onClick={onClose}>
						Cancelar
					</button>
					<button className="btn-save" onClick={() => isValid && onSave(form)} disabled={!isValid}>
						Salvar Requisito
					</button>
				</div>
			</div>
		</div>
	);
}

export default function ValidacaoRequisitos({ project, topic, onBack, perfil }: Props) {
	const { toasts, addToast, removeToast } = useToast();

	const canAddRequirements = (perfil === 'analista' || perfil === 'desenvolvedor') && isRequirementTopic(topic.name);
	const canValidate = perfil === 'cliente';
	const showObservation = perfil === 'cliente';

	const [requirements, setRequirements] = useState<RequirementData[]>(topic.requirements || []);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [loadingAction, setLoadingAction] = useState<number | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [observationInputs, setObservationInputs] = useState<Record<string, string>>({});
	const [showObservationFor, setShowObservationFor] = useState<Record<number, boolean>>({});

	const refreshRequirements = async (signal?: AbortSignal) => {
		const response = await requirementsApi.list(project.id, 1, 50, undefined, signal ? { signal } : undefined);
		return response.requisitos.filter((r: RequirementData) => r.tipo === topic.type);
	};

	useEffect(() => {
		const controller = new AbortController();
		async function load() {
			try {
				setLoading(true);
				setError(null);
				const topicReqs = await refreshRequirements(controller.signal);
				if (controller.signal.aborted) return;
				setRequirements(topicReqs);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : 'Erro ao carregar requisitos');
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		}
		load();
		return () => controller.abort();
	}, [project.id, topic.type]);

	const handleApprove = async (reqId: number) => {
		setLoadingAction(reqId);
		try {
			await requirementsApi.createValidacao(reqId, { resultado: "aprovado" });
			setRequirements(prev => prev.map(r => r.id === reqId ? { ...r, status: "aprovado" } : r));
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Erro desconhecido";
			addToast("Erro ao aprovar: " + msg, "error");
		} finally {
			setLoadingAction(null);
		}
	};

	const handleReject = async (reqId: number) => {
		setLoadingAction(reqId);
		try {
			await requirementsApi.createValidacao(reqId, { resultado: "rejeitado" });
			const topicReqs = await refreshRequirements();
			setRequirements(topicReqs);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Erro desconhecido";
			console.error("Erro ao rejeitar:", msg);
			addToast("Erro ao rejeitar requisito", "error");
		} finally {
			setLoadingAction(null);
		}
	};

	const handleAddObservation = async (reqId: number) => {
		const text = observationInputs[reqId]?.trim();
		if (!text) return;
		try {
			setLoadingAction(reqId);
			await requirementsApi.createValidacao(reqId, { resultado: 'aprovado_com_ressalvas', comentario: text });
			setObservationInputs(prev => ({ ...prev, [reqId]: "" }));
		} catch (err) {
			console.error('Erro ao adicionar observacao:', err);
			addToast("Erro ao adicionar observação", "error");
		} finally {
			setLoadingAction(null);
		}
	};

	const handleSaveRequirement = async (data: typeof EMPTY_FORM) => {
		try {
			const tipo = TOPIC_TYPE_MAP[topic.id] || topic.type || "funcional";
			await requirementsApi.create(project.id, {
				titulo: data.title,
				descricao: data.description,
				tipo,
			});
			const res = await requirementsApi.list(project.id);
			setRequirements(res.requisitos.filter(r => r.tipo === tipo));
			setShowModal(false);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Erro desconhecido";
			console.error("Erro ao criar requisito:", msg);
			addToast("Erro ao criar requisito", "error");
		}
	};

	return (
		<>
			<AppLayout
				perfil={perfil}
				activePage="projetos"
				onPageChange={() => onBack()}
				topbarTitle={topic.name}
				topbarSubtitle={project.nome_cliente || "Sem cliente"}
			>
				<div className={styles['content-inner']}>
				<div className={styles['section-header']}>
					<h2 className={styles['section-title']}>
						{requirements.length} requisitos documentados
					</h2>
					{canAddRequirements && (
						<button className={styles['btn-add-req']} onClick={() => setShowModal(true)}>
							<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
								<path d="M12 5v14M5 12h14" />
							</svg>
							Adicionar Requisito
						</button>
					)}
				</div>

				{loading ? (
					<div className={styles['empty-state']}>
						<div className={styles['empty-icon']}>
							<svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
								<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
							</svg>
						</div>
						<h3>Carregando requisitos...</h3>
					</div>
				) : error ? (
					<div className={styles['empty-state']}>
						<div className={styles['empty-icon']}>
							<svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
								<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
							</svg>
						</div>
						<h3>Erro ao carregar</h3>
						<p>{error}</p>
					</div>
				) : requirements.length > 0 ? (
					requirements.map((req) => (
						<div className={`${styles['req-card']} ${styles[`status-${statusClass(req.status)}`]}`} key={req.id}>
							<div className={styles['req-header']}>
								<span className={styles['req-id']}>{req.codigo || req.id}</span>
								<span className={`${styles['req-status']} ${styles[statusClass(req.status)]}`}>
									{statusLabel(req.status)}
								</span>
							</div>

							<h3 className={styles['req-title']}>{req.titulo}</h3>
							<div className={styles['req-desc']}>
								<p>{req.descricao}</p>
							</div>

							{showObservation && (
								<div className={styles['req-meta-row']}>
									<span className={styles['req-meta-item']}>
										<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
										</svg>
										Comentarios ({req.validacoes_count})
									</span>
									<span className={styles['req-meta-item']}>
										<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
										</svg>
										Historico de Versoes
									</span>
								</div>
							)}

							{(canValidate || canAddRequirements) && (
								<div className={styles['req-actions']}>
									<button className={styles['btn-reject']} onClick={() => handleReject(req.id)} disabled={loadingAction === req.id}>
										<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
											<path d="M18 6L6 18M6 6l12 12"/>
										</svg>
										{loadingAction === req.id ? "Rejeitando..." : "Reprovar"}
									</button>
									<button className={styles['btn-approve']} onClick={() => handleApprove(req.id)} disabled={loadingAction === req.id}>
										<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
											<path d="M5 13l4 4L19 7"/>
										</svg>
										{loadingAction === req.id ? "Aprovando..." : "Aprovar"}
									</button>
									{showObservation && (
										<button
											className={styles['btn-observe']}
											onClick={() => setShowObservationFor(prev => ({ ...prev, [req.id]: !prev[req.id] }))}
											disabled={loadingAction === req.id}
										>
											<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
												<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
												<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
											</svg>
											Observar
										</button>
									)}
								</div>
							)}

							<div className={styles['req-footer']}>
								<span>Modificado por: <strong>{req.autor?.nome || "Sistema"}</strong></span>
								<span>
									{new Date(req.atualizado_em || req.criado_em || Date.now()).toLocaleString('pt-BR', {
										hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
									})}
								</span>
							</div>

							{showObservationFor[req.id] && (
								<div className={styles['req-observations']}>
									<div className={styles['observations-title']}>
										<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
											<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
											<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
										</svg>
										Adicionar Observacao
									</div>
									<div className={styles['observation-input-wrap']}>
										<input
											className={styles['observation-input']}
											placeholder="Escreva uma observacao..."
											value={observationInputs[req.id] || ""}
											onChange={(e) => setObservationInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
											onKeyDown={(e) => { if (e.key === "Enter") handleAddObservation(req.id); }}
										/>
										<button
											className={styles['btn-send-obs']}
											onClick={() => handleAddObservation(req.id)}
											disabled={!observationInputs[req.id]?.trim() || loadingAction === req.id}
										>
											Enviar
										</button>
									</div>
								</div>
							)}
						</div>
					))
				) : (
					<div className={styles['empty-state']}>
						<div className={styles['empty-icon']}>
							<svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
								<rect x="2" y="3" width="8" height="8" rx="2"/><rect x="14" y="3" width="8" height="8" rx="2"/>
								<rect x="2" y="13" width="8" height="8" rx="2"/><rect x="14" y="13" width="8" height="8" rx="2"/>
							</svg>
						</div>
						<h3>Nenhum requisito documentado</h3>
						<p>
							{canAddRequirements
								? 'Clique em "Adicionar Requisito" para comecar.'
								: "Este topico ainda nao possui requisitos."}
						</p>
					</div>
				)}
			</div>
			</AppLayout>

			{showModal && (
				<AddRequirementModal
					topicName={topic.name}
					onClose={() => setShowModal(false)}
					onSave={handleSaveRequirement}
				/>
			)}

			<ToastContainer toasts={toasts} onRemove={removeToast} />
		</>
	);
}
