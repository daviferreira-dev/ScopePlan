import { useState, useEffect } from "react";
import { requirementsApi, type Validacao } from "../../services/api";
import AppLayout from "../../components/AppLayout";
import { statusClass, statusLabel } from "../../utils/helpers";
import { useToast } from "../../hooks/useToast";
import ToastContainer from "../../components/ToastContainer";
import styles from './RequirementHistory.module.css';

interface VersionData {
	numero_versao: number;
	titulo: string;
	descricao: string;
	status: string;
	criado_em: string | null;
}

interface HistoryResponse {
	versions: VersionData[];
	validacoes?: (Validacao & { versao_numero?: number })[];
}

interface Props {
	requirementId: number;
	requirementTitle: string;
	onBack: () => void;
	perfil: 'analista' | 'cliente' | 'gestor' | 'desenvolvedor';
}

export default function RequirementHistory({ requirementId, requirementTitle, onBack, perfil }: Props) {
	const { toasts, addToast, removeToast } = useToast();
	const [history, setHistory] = useState<HistoryResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

	useEffect(() => {
		async function loadHistory() {
			try {
				setLoading(true);
				setError(null);
				const data = await requirementsApi.versionHistory(requirementId) as HistoryResponse;
				setHistory(data);
				if (data.versions && data.versions.length > 0) {
					setSelectedVersion(data.versions[0].numero_versao);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Erro ao carregar historico');
				addToast('Erro ao carregar historico de versoes', 'error');
			} finally {
				setLoading(false);
			}
		}

		loadHistory();
	}, [requirementId, addToast]);

	const getVersionInfo = (versionNum: number) => {
		if (!history?.versions) return null;
		return history.versions.find(v => v.numero_versao === versionNum) || null;
	};

	const getValidacoesByVersion = () => {
		if (!history?.validacoes) return {};
		return history.validacoes.reduce((acc, v) => {
			const versao = v.versao_numero || 0;
			if (!acc[versao]) acc[versao] = [];
			acc[versao].push(v);
			return acc;
		}, {} as Record<number, typeof history.validacoes>);
	};

	const validacoesByVersion = getValidacoesByVersion();

	const formatDate = (dateString: string | null | undefined) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const resultClass = (resultado: string) => {
		switch (resultado) {
			case 'aprovado': return styles['resultado-aprovado'];
			case 'rejeitado': return styles['resultado-rejeitado'];
			case 'aprovado_com_ressalvas': return styles['resultado-ressalva'];
			default: return '';
		}
	};

	const resultLabel = (resultado: string) => {
		switch (resultado) {
			case 'aprovado': return 'Aprovado';
			case 'rejeitado': return 'Rejeitado';
			case 'aprovado_com_ressalvas': return 'Aprovado com Ressalvas';
			default: return resultado;
		}
	};

	const currentVersionInfo = selectedVersion ? getVersionInfo(selectedVersion) : null;

	return (
		<>
			<AppLayout
				perfil={perfil}
				activePage="projetos"
				onBack={onBack}
				onPageChange={onBack}
				topbarTitle={`Historico: ${requirementTitle}`}
				topbarSubtitle="Visualizar versoes"
			>
				<div className={styles['content-inner']}>
					{loading ? (
						<div className={styles['empty-state']}>
							<div className={styles['empty-icon']}>
								<svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
									<circle cx="12" cy="12" r="10" />
									<path d="M12 6v6l4 2" />
								</svg>
							</div>
							<h3>Carregando historico...</h3>
						</div>
					) : error ? (
						<div className={styles['empty-state']}>
							<div className={styles['empty-icon']}>
								<svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
									<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
							</div>
							<h3>Erro ao carregar</h3>
							<p>{error}</p>
						</div>
					) : !history || history.versions.length === 0 ? (
						<div className={styles['empty-state']}>
							<div className={styles['empty-icon']}>
								<svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
									<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</div>
							<h3>Nenhuma versao anterior</h3>
							<p>Este requisito ainda nao possui historico de versionamento.</p>
						</div>
					) : (
						<>
							<div className={styles['versions-timeline']}>
								<h3 className={styles['section-title']}>Versoes ({history.versions.length})</h3>
								<div className={styles['versions-list']}>
									{history.versions.map((version) => (
										<div
											key={version.numero_versao}
											className={`${styles['version-item']} ${selectedVersion === version.numero_versao ? styles['selected'] : ''}`}
											onClick={() => setSelectedVersion(version.numero_versao)}
										>
											<div className={styles['version-header']}>
												<span className={styles['version-badge']}>v{version.numero_versao}</span>
												<span className={`${styles['version-status']} ${styles[statusClass(version.status)]}`}>
													{statusLabel(version.status)}
												</span>
											</div>
											<div className={styles['version-meta']}>
												<span className={styles['version-date']}>{formatDate(version.criado_em)}</span>
											</div>
											<p className={styles['version-title']}>{version.titulo}</p>
										</div>
									))}
								</div>
							</div>

							{currentVersionInfo && (
								<div className={styles['version-detail']}>
									<div className={styles['detail-header']}>
										<h3 className={styles['detail-title']}>
											Detalhes da Versao {currentVersionInfo.numero_versao}
										</h3>
										<span className={`${styles['detail-status']} ${styles[statusClass(currentVersionInfo.status)]}`}>
											{statusLabel(currentVersionInfo.status)}
										</span>
									</div>

									<div className={styles['detail-body']}>
										<div className={styles['detail-row']}>
											<label>Titulo:</label>
											<span>{currentVersionInfo.titulo}</span>
										</div>
										<div className={styles['detail-row']}>
											<label>Descricao:</label>
											<span>{currentVersionInfo.descricao}</span>
										</div>
										<div className={styles['detail-row']}>
											<label>Criado em:</label>
											<span>{formatDate(currentVersionInfo.criado_em)}</span>
										</div>
									</div>

									{selectedVersion && validacoesByVersion[selectedVersion]?.length > 0 && (
										<div className={styles['validacoes-section']}>
											<h4 className={styles['validacoes-title']}>
												Validacoes ({validacoesByVersion[selectedVersion].length})
											</h4>
											<div className={styles['validacoes-list']}>
												{validacoesByVersion[selectedVersion].map((validacao: Validacao & { versao_numero?: number }, idx: number) => (
													<div key={idx} className={styles['validacao-card']}>
														<div className={styles['validacao-header']}>
															<span className={styles['validacao-estado'] + resultClass(validacao.resultado)}>
																{resultLabel(validacao.resultado)}
															</span>
															<span className={styles['validacao-data']}>
																{formatDate(validacao.criado_em)}
															</span>
														</div>
														{validacao.comentario && (
															<div className={styles['validacao-comentario']}>
																<strong>Comentario:</strong>
																<p>{validacao.comentario}</p>
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							)}
						</>
					)}
				</div>
			</AppLayout>
			<ToastContainer toasts={toasts} onRemove={removeToast} />
		</>
	);
}