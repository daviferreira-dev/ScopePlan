import { useState, useEffect, useRef } from 'react';
import { convitesApi, type ConviteData } from '../services/api';

interface Props {
  projectId: number;
  projectName: string;
  onClose: () => void;
}

const PERFIL_LABELS: Record<string, string> = {
  cliente: 'Cliente',
  desenvolvedor: 'Desenvolvedor',
  analista: 'Analista',
  gestor: 'Gestor',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pendente: '#d97706',
  aceito: '#16a34a',
  cancelado: '#6b7280',
};

// Perfis que podem ser convidados
const PERFIS_CONVITE = ['desenvolvedor', 'cliente'] as const;

type UsuarioEncontrado = { nome: string; perfil: string } | null;

export default function ConvitesModal({ projectId, projectName, onClose }: Props) {
  const [convites, setConvites] = useState<ConviteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState<'cliente' | 'desenvolvedor'>('desenvolvedor');
  const [verificando, setVerificando] = useState(false);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState<UsuarioEncontrado>(null);
  const [perfilBloqueado, setPerfilBloqueado] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    convitesApi.list(projectId)
      .then(r => setConvites(r.convites))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  // Verifica o email com debounce enquanto o usuário digita
  useEffect(() => {
    setUsuarioEncontrado(null);
    setPerfilBloqueado(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;

    debounceRef.current = setTimeout(async () => {
      setVerificando(true);
      try {
        const res = await convitesApi.verificarEmail(trimmed);
        if (res.existe) {
          const pConvite = PERFIS_CONVITE.includes(res.perfil as 'cliente' | 'desenvolvedor')
            ? res.perfil as 'cliente' | 'desenvolvedor'
            : null;

          setUsuarioEncontrado({ nome: res.nome, perfil: res.perfil });

          if (pConvite) {
            setPerfil(pConvite);
            setPerfilBloqueado(true);
          } else {
            // Perfil não convidável (analista, gestor) — será bloqueado no envio
            setPerfilBloqueado(false);
          }
        } else {
          setUsuarioEncontrado(null);
          setPerfilBloqueado(false);
        }
      } catch {
        // silencia erros de verificação
      } finally {
        setVerificando(false);
      }
    }, 500);
  }, [email]);

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    // Bloqueia convite para perfis não permitidos
    if (usuarioEncontrado && !PERFIS_CONVITE.includes(usuarioEncontrado.perfil as 'cliente' | 'desenvolvedor')) {
      setError(`${usuarioEncontrado.nome} tem perfil "${PERFIL_LABELS[usuarioEncontrado.perfil] ?? usuarioEncontrado.perfil}" e não pode ser convidado para projetos.`);
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await convitesApi.criar(projectId, trimmed, perfil);
      setConvites(prev => [r.convite, ...prev]);
      setSuccess(`Convite enviado para ${trimmed}`);
      setEmail('');
      setUsuarioEncontrado(null);
      setPerfilBloqueado(false);
      setPerfil('desenvolvedor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar convite');
    } finally {
      setSending(false);
    }
  }

  async function handleCancelar(conviteId: number) {
    try {
      await convitesApi.cancelar(projectId, conviteId);
      setConvites(prev => prev.map(c => c.id === conviteId ? { ...c, status: 'cancelado' } : c));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar convite');
    }
  }

  function handleCopiarLink(convite: ConviteData) {
    const link = `${window.location.origin}/convite/${convite.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(convite.id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const naoConvidavel = usuarioEncontrado &&
    !PERFIS_CONVITE.includes(usuarioEncontrado.perfil as 'cliente' | 'desenvolvedor');

  const pendentes = convites.filter(c => c.status === 'pendente' && !c.expirado);
  const outros    = convites.filter(c => c.status !== 'pendente' || c.expirado);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--card-bg, #fff)', borderRadius: 14, width: '100%', maxWidth: 540, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '1px solid var(--card-border, #e2e8f0)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--card-border, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Convidar para o projeto</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{projectName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-muted)', lineHeight: 1, padding: '0 2px' }}>×</button>
        </div>

        <div style={{ overflow: 'auto', flex: 1 }}>
          {/* Formulário */}
          <div style={{ padding: '20px 24px 0' }}>
            <form onSubmit={handleEnviar} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Campo de email */}
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="E-mail do convidado"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); setSuccess(null); }}
                  required
                  disabled={sending}
                  style={{ width: '100%', padding: '9px 36px 9px 12px', borderRadius: 8, border: `1.5px solid ${naoConvidavel ? '#fca5a5' : usuarioEncontrado ? '#86efac' : 'var(--card-border, #e2e8f0)'}`, fontSize: 13, background: 'var(--input-bg, #f8fafc)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'Sora, sans-serif', boxSizing: 'border-box' }}
                />
                {/* Spinner / check */}
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>
                  {verificando ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>...</span>
                  ) : usuarioEncontrado && !naoConvidavel ? (
                    <span style={{ color: '#16a34a' }}>✓</span>
                  ) : naoConvidavel ? (
                    <span style={{ color: '#dc2626' }}>✕</span>
                  ) : null}
                </span>
              </div>

              {/* Feedback do usuário encontrado */}
              {usuarioEncontrado && !naoConvidavel && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12 }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}>
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <span style={{ color: '#166534' }}>
                    Conta encontrada: <strong>{usuarioEncontrado.nome}</strong> · perfil <strong>{PERFIL_LABELS[usuarioEncontrado.perfil] ?? usuarioEncontrado.perfil}</strong> detectado automaticamente
                  </span>
                </div>
              )}

              {naoConvidavel && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#dc2626' }}>
                  <strong>{usuarioEncontrado!.nome}</strong> tem perfil <strong>{PERFIL_LABELS[usuarioEncontrado!.perfil] ?? usuarioEncontrado!.perfil}</strong> e não pode ser convidado para projetos.
                </div>
              )}

              {/* Seletor de perfil */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Perfil:</span>
                <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                  {PERFIS_CONVITE.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => !perfilBloqueado && setPerfil(p)}
                      disabled={perfilBloqueado}
                      style={{
                        flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 12, fontWeight: 600,
                        border: `1.5px solid ${perfil === p ? 'var(--green-bright, #22c55e)' : 'var(--card-border, #e2e8f0)'}`,
                        background: perfil === p ? 'rgba(34,197,94,0.08)' : 'transparent',
                        color: perfil === p ? 'var(--green-bright, #22c55e)' : 'var(--text-muted)',
                        cursor: perfilBloqueado ? 'default' : 'pointer',
                        opacity: perfilBloqueado && perfil !== p ? 0.4 : 1,
                        fontFamily: 'Sora, sans-serif',
                        transition: 'all 0.15s',
                      }}
                    >
                      {PERFIL_LABELS[p]}
                    </button>
                  ))}
                </div>
                {perfilBloqueado && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>detectado</span>
                )}
              </div>

              {error && (
                <div style={{ fontSize: 12, color: '#dc2626', padding: '6px 10px', background: '#fef2f2', borderRadius: 6 }}>{error}</div>
              )}
              {success && (
                <div style={{ fontSize: 12, color: '#16a34a', padding: '6px 10px', background: '#f0fdf4', borderRadius: 6 }}>{success}</div>
              )}

              <button
                type="submit"
                disabled={sending || !email.trim() || verificando || !!naoConvidavel}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: (sending || verificando || !!naoConvidavel) ? '#a7f3d0' : 'var(--green-bright, #22c55e)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: (sending || verificando || !!naoConvidavel) ? 'not-allowed' : 'pointer', fontFamily: 'Sora, sans-serif', alignSelf: 'flex-start' }}
              >
                {sending ? 'Enviando...' : verificando ? 'Verificando...' : 'Enviar convite'}
              </button>
            </form>
          </div>

          {/* Pendentes */}
          <div style={{ padding: '20px 24px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Pendentes ({pendentes.length})
            </div>
            {loading ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>Carregando...</div>
            ) : pendentes.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>Nenhum convite pendente.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pendentes.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--card-border, #e2e8f0)', background: 'var(--sidebar-bg, #f8fafc)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {PERFIL_LABELS[c.perfil] ?? c.perfil} · expira {new Date(c.expira_em).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <button onClick={() => handleCopiarLink(c)} title="Copiar link" style={{ background: copied === c.id ? '#f0fdf4' : 'transparent', border: '1px solid var(--card-border, #e2e8f0)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: copied === c.id ? '#16a34a' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {copied === c.id ? 'Copiado!' : 'Copiar link'}
                    </button>
                    <button onClick={() => handleCancelar(c.id)} title="Cancelar" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1, padding: '0 2px' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Histórico */}
          {outros.length > 0 && (
            <div style={{ padding: '16px 24px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Histórico</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {outros.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 7, border: '1px solid var(--card-border, #e2e8f0)', opacity: 0.7 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {PERFIL_LABELS[c.perfil] ?? c.perfil} · {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: `${STATUS_COLORS[c.expirado ? 'cancelado' : c.status]}18`, color: STATUS_COLORS[c.expirado ? 'cancelado' : c.status] }}>
                      {c.expirado ? 'Expirado' : STATUS_LABELS[c.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {outros.length === 0 && <div style={{ height: 20 }} />}
        </div>
      </div>
    </div>
  );
}
