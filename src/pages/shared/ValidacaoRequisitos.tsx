import { useState, useEffect } from "react";
import { requirementsApi, commentsApi } from "../../services/api";
import type { RequirementData, ProjectData, AssinaturaData } from "../../services/api";
import AppLayout from "../../components/AppLayout";
import { statusClass, statusLabel } from "../../utils/helpers";
import { TOPIC_TYPE_MAP } from "../../utils/constants";
import { useToast } from "../../hooks/useToast";
import ToastContainer from "../../components/ToastContainer";
import styles from './ValidacaoRequisitos.module.css';
import RequirementHistory from "./RequirementHistory";
import Comentarios from "./Comentarios";
import RequistoAnexos from "../../components/RequistoAnexos";
import RequirementEditor from "../../components/RequirementEditor";

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
	currentUser?: { id: number; nome: string };
}


const EMPTY_TITLE = "";

type Prioridade = 'baixa' | 'media' | 'alta' | 'critica';

const PRIORIDADES: { key: Prioridade; label: string; color: string }[] = [
	{ key: 'baixa', label: 'Baixa', color: '#6b7280' },
	{ key: 'media', label: 'Média', color: '#3b82f6' },
	{ key: 'alta', label: 'Alta', color: '#eab308' },
	{ key: 'critica', label: 'Crítica', color: '#dc2626' },
];

function AddRequirementModal({
	topicName,
	onClose,
	onSave,
}: {
	topicName: string;
	onClose: () => void;
	onSave: (title: string, description: string, prioridade: Prioridade) => void;
}) {
	const [title, setTitle] = useState(EMPTY_TITLE);
	const [description, setDescription] = useState("");
	const [prioridade, setPrioridade] = useState<Prioridade>('media');

	const isValid = title.trim() !== "" && description.trim() !== "";

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
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>

					<div className="form-group">
						<label className="form-label">Prioridade</label>
						<div style={{ display: 'flex', gap: 8 }}>
							{PRIORIDADES.map((p) => (
								<button
									key={p.key}
									type="button"
									onClick={() => setPrioridade(p.key)}
									style={{
										flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
										cursor: 'pointer', fontFamily: 'Sora, sans-serif',
										border: `1.5px solid ${prioridade === p.key ? p.color : 'var(--card-border, #e2e8f0)'}`,
										background: prioridade === p.key ? `${p.color}14` : 'transparent',
										color: prioridade === p.key ? p.color : 'var(--text-muted)',
										transition: 'all 0.15s',
									}}
								>
									{p.label}
								</button>
							))}
						</div>
					</div>

					<div className="form-group">
						<label className="form-label">Descrição *</label>
						<textarea
							className="form-textarea"
							placeholder="Descreva o requisito em detalhe..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
				</div>

				<div className="modal-footer">
					<button className="btn-cancel--outlined" onClick={onClose}>
						Cancelar
					</button>
					<button className="btn-save" onClick={() => isValid && onSave(title, description, prioridade)} disabled={!isValid}>
						Salvar Requisito
					</button>
				</div>
			</div>
		</div>
	);
}

export default function ValidacaoRequisitos({ project, topic, onBack, perfil, currentUser }: Props) {
	const { toasts, addToast, removeToast } = useToast();

	const canAddRequirements = perfil === 'analista';
	const canValidate = perfil === 'cliente';
	const showObservation = perfil === 'cliente';
	const canEditInline = perfil === 'analista';

	const [requirements, setRequirements] = useState<RequirementData[]>(topic.requirements || []);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [loadingAction, setLoadingAction] = useState<number | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [observationInputs, setObservationInputs] = useState<Record<string, string>>({});
	const [showObservationFor, setShowObservationFor] = useState<Record<number, boolean>>({});
	const [rejectInputs, setRejectInputs] = useState<Record<number, string>>({});
	const [showRejectFor, setShowRejectFor] = useState<Record<number, boolean>>({});
	const [viewingHistory, setViewingHistory] = useState<{ id: number; title: string } | null>(null);
	const [editingReqId, setEditingReqId] = useState<number | null>(null);
	const [editTitulo, setEditTitulo] = useState('');
	const [editDescricao, setEditDescricao] = useState('');
	const [editPrioridade, setEditPrioridade] = useState<Prioridade>('media');
	const [editSaving, setEditSaving] = useState(false);
	const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
	const [assinaturas, setAssinaturas] = useState<Record<number, AssinaturaData[]>>({});
	const [jaAssinei, setJaAssinei] = useState<Set<number>>(new Set());
	const [signingReqId, setSigningReqId] = useState<number | null>(null);
	const [signDeclaracao, setSignDeclaracao] = useState('');
	const [signLoading, setSignLoading] = useState(false);

	const canSign = perfil === 'analista' || perfil === 'gestor';

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
				loadAssinaturas(topicReqs);
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
		const motivo = rejectInputs[reqId]?.trim();
		if (!motivo) {
			addToast("Descreva o motivo da reprovação para o analista ajustar.", "error");
			return;
		}
		setLoadingAction(reqId);
		try {
			// Registra a reprovação com a devolutiva e publica o comentário do cliente
			await requirementsApi.createValidacao(reqId, { resultado: "rejeitado", comentario: motivo });
			await commentsApi.create(reqId, `Reprovação do cliente: ${motivo}`);
			const topicReqs = await refreshRequirements();
			setRequirements(topicReqs);
			setRejectInputs(prev => ({ ...prev, [reqId]: "" }));
			setShowRejectFor(prev => ({ ...prev, [reqId]: false }));
			setOpenComments(prev => ({ ...prev, [reqId]: true }));
			addToast("Requisito reprovado. Devolutiva enviada ao analista.", "success");
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
			// Observação é um comentário ao analista — NÃO aprova/reprova nem muda o status,
			// então o cliente continua podendo aprovar ou reprovar depois.
			await commentsApi.create(reqId, `Observação do cliente: ${text}`);
			setObservationInputs(prev => ({ ...prev, [reqId]: "" }));
			setShowObservationFor(prev => ({ ...prev, [reqId]: false }));
			setOpenComments(prev => ({ ...prev, [reqId]: true }));
			addToast("Observação enviada ao analista.", "success");
		} catch (err) {
			console.error('Erro ao adicionar observacao:', err);
			addToast("Erro ao enviar observação", "error");
		} finally {
			setLoadingAction(null);
		}
	};

	const handleSubmitReview = async (reqId: number) => {
		setLoadingAction(reqId);
		try {
			await requirementsApi.submitReview(reqId);
			setRequirements(prev => prev.map(r => r.id === reqId ? { ...r, status: 'em_revisao' } : r));
			addToast('Requisito enviado para aprovação do cliente', 'success');
		} catch (err: unknown) {
			addToast('Erro ao enviar para revisão: ' + (err instanceof Error ? err.message : ''), 'error');
		} finally {
			setLoadingAction(null);
		}
	};

	const handleSaveRequirement = async (title: string, description: string, prioridade: string) => {
		try {
			const tipo = TOPIC_TYPE_MAP[topic.id] || topic.type || "funcional";
			await requirementsApi.create(project.id, {
				titulo: title,
				descricao: description,
				tipo,
				prioridade,
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

	const loadAssinaturas = async (reqs: RequirementData[]) => {
		const aprovados = reqs.filter(r => r.status === 'aprovado' || r.status === 'aprovado_com_ressalvas');
		if (aprovados.length === 0) return;
		const results = await Promise.allSettled(
			aprovados.map(r => requirementsApi.listarAssinaturas(project.id, r.id))
		);
		const map: Record<number, AssinaturaData[]> = {};
		aprovados.forEach((r, i) => {
			const res = results[i];
			if (res.status === 'fulfilled') map[r.id] = res.value.assinaturas;
		});
		setAssinaturas(map);
	};

	const handleAssinar = async () => {
		if (signingReqId === null) return;
		setSignLoading(true);
		try {
			const resp = await requirementsApi.assinar(project.id, signingReqId, signDeclaracao.trim() || undefined);
			setAssinaturas(prev => ({
				...prev,
				[signingReqId]: [...(prev[signingReqId] || []), resp.assinatura],
			}));
			setJaAssinei(prev => new Set([...prev, signingReqId]));
			addToast('Requisito assinado com sucesso', 'success');
			setSigningReqId(null);
			setSignDeclaracao('');
		} catch (err: unknown) {
			addToast((err instanceof Error ? err.message : 'Erro ao assinar requisito'), 'error');
		} finally {
			setSignLoading(false);
		}
	};

	const startEdit = (req: RequirementData) => {
		setEditingReqId(req.id);
		setEditTitulo(req.titulo || '');
		setEditDescricao(req.descricao || '');
		setEditPrioridade((req.prioridade as Prioridade) || 'media');
	};

	const handleSaveEdit = async (reqId: number) => {
		if (!editTitulo.trim()) { addToast("O título é obrigatório", "error"); return; }
		setEditSaving(true);
		try {
			const resp = await requirementsApi.update(project.id, reqId, {
				titulo: editTitulo.trim(),
				descricao: editDescricao,
				prioridade: editPrioridade,
			});
			const updated = resp.requisito;
			setRequirements(prev => prev.map(r => r.id === reqId ? { ...r, ...updated } : r));
			setEditingReqId(null);
			addToast("Requisito atualizado", "success");
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Erro desconhecido";
			addToast("Erro ao atualizar requisito: " + msg, "error");
		} finally {
			setEditSaving(false);
		}
	};

	return (
		<>
			{viewingHistory ? (
				<RequirementHistory
					requirementId={viewingHistory.id}
					requirementTitle={viewingHistory.title}
					onBack={() => setViewingHistory(null)}
					perfil={perfil}
				/>
			) : (
			<AppLayout
				perfil={perfil}
				activePage="projetos"
				onBack={onBack}
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
								{req.prioridade && (
									<span className={`${styles['req-prioridade']} ${styles[`prio-${req.prioridade}`]}`}>
										{req.prioridade === 'critica' ? 'Crítica' : req.prioridade === 'alta' ? 'Alta' : req.prioridade === 'media' ? 'Média' : 'Baixa'}
									</span>
								)}
							</div>

							<h3 className={styles['req-title']}>{req.titulo}</h3>
							{editingReqId === req.id ? (
								<div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
									<div className="form-group">
										<label className="form-label">Título *</label>
										<input
											className="form-input"
											value={editTitulo}
											onChange={(e) => setEditTitulo(e.target.value)}
										/>
									</div>
									<div className="form-group">
										<label className="form-label">Prioridade</label>
										<div style={{ display: 'flex', gap: 8 }}>
											{PRIORIDADES.map((p) => (
												<button
													key={p.key}
													type="button"
													onClick={() => setEditPrioridade(p.key)}
													style={{
														flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
														cursor: 'pointer', fontFamily: 'Sora, sans-serif',
														border: `1.5px solid ${editPrioridade === p.key ? p.color : 'var(--card-border, #e2e8f0)'}`,
														background: editPrioridade === p.key ? `${p.color}14` : 'transparent',
														color: editPrioridade === p.key ? p.color : 'var(--text-muted)',
														transition: 'all 0.15s',
													}}
												>
													{p.label}
												</button>
											))}
										</div>
									</div>
									<div className="form-group">
										<label className="form-label">Descrição</label>
										{currentUser ? (
											<RequirementEditor
												requirementId={req.id}
												initialContent={editDescricao}
												currentUser={currentUser}
												hideActions
												onContentChange={setEditDescricao}
												onSave={() => {}}
												onCancel={() => setEditingReqId(null)}
											/>
										) : (
											<textarea
												className="form-textarea"
												value={editDescricao}
												onChange={(e) => setEditDescricao(e.target.value)}
												rows={4}
											/>
										)}
									</div>
									<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
										<button className="btn-cancel--outlined" onClick={() => setEditingReqId(null)} disabled={editSaving}>
											Cancelar
										</button>
										<button className="btn-save" onClick={() => handleSaveEdit(req.id)} disabled={editSaving || !editTitulo.trim()}>
											{editSaving ? 'Salvando...' : 'Salvar alterações'}
										</button>
									</div>
								</div>
							) : (
								<div className={styles['req-desc']}>
									<p>{req.descricao}</p>
									{canEditInline && (
										<button
											className={styles['req-meta-button']}
											style={{ marginTop: 4 }}
											onClick={() => startEdit(req)}
										>
											<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
												<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
												<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
											</svg>
											Editar requisito
										</button>
									)}
								</div>
							)}

							<RequistoAnexos reqId={req.id} canEdit={canAddRequirements || perfil === 'gestor'} />

							{/* Devolutiva: requisito reprovado pelo cliente */}
							{req.status === 'rejeitado' && (
								<div
									style={{
										display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
										gap: 10, margin: '10px 0', padding: '10px 14px', borderRadius: 10,
										background: '#fef2f2', border: '1px solid #fecaca',
									}}
								>
									<span style={{ fontSize: 13, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 8 }}>
										<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
										</svg>
										Reprovado pelo cliente.&nbsp;
										{canAddRequirements ? 'Ajuste o requisito e reenvie para aprovação.' : 'Aguardando ajuste do analista.'}
									</span>
									<span style={{ display: 'flex', gap: 8 }}>
										<button
											className={styles['req-meta-button']}
											onClick={() => setOpenComments(prev => ({ ...prev, [req.id]: true }))}
										>
											Ver devolutiva
										</button>
										{canAddRequirements && (
											<button
												className={styles['btn-approve']}
												onClick={() => handleSubmitReview(req.id)}
												disabled={loadingAction === req.id}
												style={{ background: 'var(--blue-500, #3b82f6)', borderColor: 'var(--blue-500, #3b82f6)' }}
											>
												{loadingAction === req.id ? 'Reenviando...' : 'Reenviar para aprovação'}
											</button>
										)}
									</span>
								</div>
							)}

							{/* Analista: enviar para aprovação (só quando rascunho) */}
							{canAddRequirements && req.status === 'rascunho' && (
								<div className={styles['req-actions']}>
									<button
										className={styles['btn-approve']}
										onClick={() => handleSubmitReview(req.id)}
										disabled={loadingAction === req.id}
										style={{ background: 'var(--blue-500, #3b82f6)', borderColor: 'var(--blue-500, #3b82f6)' }}
									>
										<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
											<path d="M5 12h14M12 5l7 7-7 7"/>
										</svg>
										{loadingAction === req.id ? 'Enviando...' : 'Enviar para aprovação'}
									</button>
								</div>
							)}

							{/* Cliente: aprovar ou reprovar (só quando em revisão) */}
							{canValidate && req.status === 'em_revisao' && (
								<>
									<div className={styles['req-actions']}>
										<button
											className={styles['btn-reject']}
											onClick={() => setShowRejectFor(prev => ({ ...prev, [req.id]: !prev[req.id] }))}
											disabled={loadingAction === req.id}
										>
											<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
												<path d="M18 6L6 18M6 6l12 12"/>
											</svg>
											Reprovar
										</button>
										<button className={styles['btn-approve']} onClick={() => handleApprove(req.id)} disabled={loadingAction === req.id}>
											<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
												<path d="M5 13l4 4L19 7"/>
											</svg>
											{loadingAction === req.id ? 'Aprovando...' : 'Aprovar'}
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
									{showRejectFor[req.id] && (
										<div className={styles['req-observations']}>
											<div className={styles['observations-title']}>
												<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
													<path d="M18 6L6 18M6 6l12 12"/>
												</svg>
												Motivo da reprovação (devolutiva para o analista)
											</div>
											<div className={styles['observation-input-wrap']}>
												<input
													className={styles['observation-input']}
													placeholder="Explique o que precisa ser ajustado..."
													value={rejectInputs[req.id] || ""}
													onChange={(e) => setRejectInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
													onKeyDown={(e) => { if (e.key === "Enter") handleReject(req.id); }}
												/>
												<button
													className={styles['btn-send-obs']}
													onClick={() => handleReject(req.id)}
													disabled={!rejectInputs[req.id]?.trim() || loadingAction === req.id}
												>
													{loadingAction === req.id ? 'Reprovando...' : 'Confirmar reprovação'}
												</button>
											</div>
										</div>
									)}
								</>
							)}

							<div className={styles['req-meta-row']} style={{ borderTop: '1px solid var(--card-border)', paddingTop: 10, marginTop: 4 }}>
								<button
									className={styles['req-meta-button']}
									onClick={() => setOpenComments(prev => ({ ...prev, [req.id]: !prev[req.id] }))}
								>
									<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
									</svg>
									{openComments[req.id] ? 'Ocultar comentários' : 'Comentários'}
								</button>
								<button
									className={styles['req-meta-button']}
									onClick={() => setViewingHistory({ id: req.id, title: req.titulo || 'Requisito' })}
								>
									<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
									</svg>
									Histórico de Versões
								</button>
							</div>

							{openComments[req.id] && <Comentarios requirementId={req.id} />}

							{/* Assinaturas digitais */}
							{(req.status === 'aprovado' || req.status === 'aprovado_com_ressalvas') && (
								<div className={styles['assinaturas-block']}>
									<div className={styles['assinaturas-header']}>
										<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
										</svg>
										<span>Assinaturas digitais</span>
										{canSign && !jaAssinei.has(req.id) && (
											<button
												className={styles['btn-assinar']}
												onClick={() => { setSigningReqId(req.id); setSignDeclaracao(''); }}
											>
												+ Assinar
											</button>
										)}
									</div>
									{(assinaturas[req.id] || []).length === 0 ? (
										<p className={styles['assinaturas-empty']}>Nenhuma assinatura ainda.</p>
									) : (
										<ul className={styles['assinaturas-list']}>
											{(assinaturas[req.id] || []).map(a => (
												<li key={a.id} className={styles['assinatura-item']}>
													<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
														<path d="M9 12l2 2 4-4"/>
														<circle cx="12" cy="12" r="10"/>
													</svg>
													<div className={styles['assinatura-info']}>
														<span className={styles['assinatura-nome']}>{a.signatario?.nome || 'Usuário'}</span>
														{a.declaracao && <span className={styles['assinatura-decl']}>"{a.declaracao}"</span>}
														<span className={styles['assinatura-data']}>
															{new Date(a.assinado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
														</span>
													</div>
												</li>
											))}
										</ul>
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
			)}

			{showModal && !viewingHistory && (
				<AddRequirementModal
					topicName={topic.name}
					onClose={() => setShowModal(false)}
					onSave={handleSaveRequirement}
				/>
			)}

			{signingReqId !== null && (
				<div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !signLoading && setSigningReqId(null)}>
					<div className="modal" style={{ maxWidth: 440 }}>
						<div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
							</svg>
							Assinar Requisito Digitalmente
						</div>
						<div className="modal-subtitle" style={{ marginBottom: 16 }}>
							Sua assinatura confirma que você revisou e concorda com este requisito. O registro ficará permanente na trilha de auditoria.
						</div>
						<div className="modal-field">
							<label className="modal-label">Declaração <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span></label>
							<textarea
								className="modal-input"
								placeholder="Ex: Declaro que revisei e aprovo este requisito conforme especificado."
								value={signDeclaracao}
								onChange={(e) => setSignDeclaracao(e.target.value)}
								rows={3}
								style={{ resize: 'vertical', minHeight: 68 }}
								disabled={signLoading}
							/>
						</div>
						<div className="modal-actions">
							<button className="btn-cancel" onClick={() => setSigningReqId(null)} disabled={signLoading}>
								Cancelar
							</button>
							<button
								className="btn-confirm"
								onClick={handleAssinar}
								disabled={signLoading}
								style={{ display: 'flex', alignItems: 'center', gap: 6 }}
							>
								<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
								</svg>
								{signLoading ? 'Assinando…' : 'Assinar'}
							</button>
						</div>
					</div>
				</div>
			)}

			<ToastContainer toasts={toasts} onRemove={removeToast} />
		</>
	);
}
