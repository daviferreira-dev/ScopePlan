import { useState, useEffect, useRef, useCallback } from 'react';
import { diagramasApi, type DiagramaData } from '../services/api';
import styles from './Diagramas.module.css';

interface Props {
  projectId: number;
  canEdit: boolean;
}

export default function Diagramas({ projectId, canEdit }: Props) {
  const [diagramas, setDiagramas] = useState<DiagramaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<{ diagrama: DiagramaData; blobUrl: string } | null>(null);
  const [blobUrls, setBlobUrls] = useState<Record<number, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    diagramasApi.list(projectId, { signal: controller.signal })
      .then(data => {
        if (!controller.signal.aborted) setDiagramas(data.diagramas);
      })
      .catch(err => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Erro ao carregar diagramas');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [projectId]);

  // Load thumbnails as blob URLs
  useEffect(() => {
    const toLoad = diagramas.filter(d => !blobUrls[d.id] && !loadingImages[d.id]);
    if (toLoad.length === 0) return;

    setLoadingImages(prev => {
      const next = { ...prev };
      toLoad.forEach(d => { next[d.id] = true; });
      return next;
    });

    toLoad.forEach(d => {
      if (d.tipo_mime === 'application/pdf') {
        setLoadingImages(prev => ({ ...prev, [d.id]: false }));
        return;
      }
      diagramasApi.getImageBlob(projectId, d.id).catch(() => null).then(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setBlobUrls(prev => ({ ...prev, [d.id]: url }));
        setLoadingImages(prev => ({ ...prev, [d.id]: false }));
      });
    });
  }, [diagramas]);

  // Revoke blob URLs on unmount
  useEffect(() => {
    return () => { Object.values(blobUrls).forEach(URL.revokeObjectURL); };
  }, []);

  const fetchBlob = useCallback(async (diagrama: DiagramaData) => {
    const blob = await diagramasApi.getImageBlob(projectId, diagrama.id);
    const url = URL.createObjectURL(blob);
    if (diagrama.tipo_mime === 'application/pdf') {
      const link = document.createElement('a');
      link.href = url;
      link.download = diagrama.nome;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    setBlobUrls(prev => ({ ...prev, [diagrama.id]: url }));
    setLightbox({ diagrama, blobUrl: url });
  }, [projectId]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const result = await diagramasApi.upload(projectId, file);
        setDiagramas(prev => [result.diagrama, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (diagrama: DiagramaData) => {
    if (!confirm(`Excluir diagrama "${diagrama.nome}"?`)) return;
    try {
      await diagramasApi.delete(projectId, diagrama.id);
      setDiagramas(prev => prev.filter(d => d.id !== diagrama.id));
      if (blobUrls[diagrama.id]) {
        URL.revokeObjectURL(blobUrls[diagrama.id]);
        setBlobUrls(prev => { const next = { ...prev }; delete next[diagrama.id]; return next; });
      }
      if (lightbox?.diagrama.id === diagrama.id) setLightbox(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir diagrama');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Diagramas</h3>
          <p className={styles.subtitle}>Imagens de diagramas do projeto — incluídas automaticamente no PDF/DOCX.</p>
        </div>
        {canEdit && (
          <button
            className={styles.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            {uploading ? 'Enviando...' : 'Adicionar imagem'}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,application/pdf"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files)}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <div className={styles.emptyText}>Carregando diagramas...</div>
        </div>
      ) : diagramas.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <div className={styles.emptyText}>Nenhum diagrama ainda</div>
          {canEdit && (
            <div className={styles.emptyHint}>Clique em "Adicionar imagem" para enviar diagramas do projeto.</div>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {diagramas.map(d => (
            <div
              key={d.id}
              className={styles.card}
              onClick={() => fetchBlob(d)}
            >
              <div className={styles.thumb}>
                {d.tipo_mime === 'application/pdf' ? (
                  <div className={styles.thumbPdf}>
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="9" y1="13" x2="15" y2="13" />
                      <line x1="9" y1="17" x2="15" y2="17" />
                    </svg>
                    <span>PDF</span>
                  </div>
                ) : blobUrls[d.id] ? (
                  <img src={blobUrls[d.id]} alt={d.nome} className={styles.thumbImg} />
                ) : (
                  <div className={styles.thumbLoading}>
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}
                <div className={styles.thumbOverlay}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </div>
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardName} title={d.nome}>{d.nome}</div>
                <div className={styles.cardMeta}>{formatSize(d.tamanho)}</div>
              </div>
              {canEdit && (
                <button
                  className={styles.deleteBtn}
                  onClick={e => { e.stopPropagation(); handleDelete(d); }}
                  title="Excluir"
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 6h18M19 6l-1 14H6L5 6M10 6V4h4v2" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <div className={styles.lightboxHeader}>
              <span className={styles.lightboxName}>{lightbox.diagrama.nome}</span>
              <div className={styles.lightboxActions}>
                <a
                  href={lightbox.blobUrl}
                  download={lightbox.diagrama.nome}
                  className={styles.lightboxDownload}
                  title="Baixar"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </a>
                <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={styles.lightboxBody}>
              <img src={lightbox.blobUrl} alt={lightbox.diagrama.nome} className={styles.lightboxImg} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
