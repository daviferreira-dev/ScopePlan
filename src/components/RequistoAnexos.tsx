import { useState, useEffect, useRef } from 'react';
import { anexosApi } from '../services/api';
import type { AnexoData } from '../services/api';

interface Props {
  reqId: number;
  canEdit: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RequistoAnexos({ reqId, canEdit }: Props) {
  const [anexos, setAnexos] = useState<AnexoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    anexosApi.list(reqId, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) { setAnexos(data.anexos); setLoading(false); } })
      .catch(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reqId, open]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const resp = await anexosApi.upload(reqId, file);
      setAnexos(prev => [resp.anexo, ...prev]);
    } catch {
      // ignore
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (anexo: AnexoData) => {
    try {
      const blob = await anexosApi.getFileBlob(reqId, anexo.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = anexo.nome;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (anexoId: number) => {
    try {
      await anexosApi.delete(reqId, anexoId);
      setAnexos(prev => prev.filter(a => a.id !== anexoId));
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
          fontFamily: 'Sora, sans-serif',
        }}
      >
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
        </svg>
        {open ? 'Ocultar anexos' : `Anexos${anexos.length > 0 && !open ? ` (${anexos.length})` : ''}`}
      </button>

      {open && (
        <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--progress-bg)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
          {loading ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Carregando...</div>
          ) : anexos.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum anexo ainda.</div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {anexos.map(a => (
                <li key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--green-mid)', flexShrink: 0 }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                  <button onClick={() => handleDownload(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green-mid)', fontWeight: 600, fontSize: 12, padding: 0, textAlign: 'left', textDecoration: 'underline' }}>
                    {a.nome}
                  </button>
                  <span style={{ color: 'var(--text-muted)' }}>{formatBytes(a.tamanho)}</span>
                  {canEdit && (
                    <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: '0 2px', lineHeight: 1 }} title="Excluir anexo">×</button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canEdit && (
            <div style={{ marginTop: 8 }}>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6,
                  border: '1px dashed var(--card-border)', background: 'transparent',
                  cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif',
                }}
              >
                {uploading ? 'Enviando...' : '+ Anexar arquivo'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
