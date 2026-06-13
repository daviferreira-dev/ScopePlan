import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { convitesApi, type ConviteData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PERFIL_LABELS: Record<string, string> = {
  cliente: 'Cliente',
  desenvolvedor: 'Desenvolvedor',
};

const PERFIL_DESC: Record<string, string> = {
  cliente: 'Poderá visualizar os requisitos e o progresso do projeto.',
  desenvolvedor: 'Poderá criar e editar requisitos do projeto.',
};

export default function AceitarConvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [convite, setConvite] = useState<ConviteData | null>(null);
  const [projeto, setProjeto] = useState<{ id: number; nome: string; descricao?: string } | null>(null);
  const [emailExiste, setEmailExiste] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    convitesApi.info(token)
      .then(r => {
        setConvite(r.convite);
        setProjeto(r.projeto);
        setEmailExiste(r.email_existe);
      })
      .catch(() => setLoadError('Convite não encontrado ou inválido.'))
      .finally(() => setLoading(false));
  }, [token]);

  // Redireciona automaticamente quem não tem conta para o cadastro
  useEffect(() => {
    if (!convite || !token || user || emailExiste !== false) return;
    if (convite.status !== 'pendente' || convite.expirado) return;

    const params = new URLSearchParams({
      email: convite.email,
      perfil: convite.perfil,
      redirect: `/convite/${token}`,
    });
    navigate(`/cadastro?${params.toString()}`, { replace: true });
  }, [convite, emailExiste, token, user, navigate]);

  async function handleAceitar() {
    if (!token) return;
    setAccepting(true);
    setAcceptError(null);
    try {
      const r = await convitesApi.aceitar(token);
      setDone(true);
      setTimeout(() => {
        const perfilPath = r.perfil === 'cliente' ? '/cliente/projetos'
          : r.perfil === 'desenvolvedor' ? '/desenvolvedor/projetos'
          : '/';
        navigate(perfilPath, { replace: true });
      }, 2000);
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : 'Erro ao aceitar convite');
    } finally {
      setAccepting(false);
    }
  }

  const isExpiredOrCancelled = convite && (convite.status !== 'pendente' || convite.expirado);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg, #f0fdf4)', padding: 24, fontFamily: 'Sora, sans-serif',
    }}>
      <div style={{
        background: 'var(--card-bg, #fff)', borderRadius: 16, padding: 40,
        width: '100%', maxWidth: 460,
        boxShadow: '0 8px 40px rgba(26,102,52,0.10)',
        border: '1.5px solid var(--card-border, #e2e8f0)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #1a6634, #22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#1a6634', letterSpacing: '-0.5px' }}>
            ScopePlan
          </span>
        </div>

        {/* Estados */}
        {loading ? (
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Verificando convite...</div>

        ) : loadError ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#dc2626', marginBottom: 8 }}>Convite inválido</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{loadError}</div>
            <Link to="/" style={{ color: '#1a6634', fontSize: 13, textDecoration: 'underline' }}>Voltar para o início</Link>
          </div>

        ) : done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#16a34a', marginBottom: 8 }}>Convite aceito!</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Redirecionando para seus projetos...</div>
          </div>

        ) : convite && (
          <>
            {/* Info do projeto */}
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                Convite de <strong style={{ color: 'var(--text-primary)' }}>{convite.convidado_por?.nome}</strong>
              </div>
              <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', marginBottom: 4 }}>
                {projeto?.nome}
              </div>
              {projeto?.descricao && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {projeto.descricao}
                </div>
              )}
            </div>

            {/* Badge do perfil */}
            <div style={{
              width: '100%', padding: '14px 18px', borderRadius: 10,
              background: '#f0fdf4', border: '1.5px solid #bbf7d0',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, background: '#22c55e', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>
                  Perfil: {PERFIL_LABELS[convite.perfil]}
                </div>
                <div style={{ fontSize: 12, color: '#166534', marginTop: 2, lineHeight: 1.5 }}>
                  {PERFIL_DESC[convite.perfil]}
                </div>
              </div>
            </div>

            {/* Convite expirado / cancelado */}
            {isExpiredOrCancelled ? (
              <div style={{
                width: '100%', padding: '12px 16px', borderRadius: 8, textAlign: 'center',
                background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#dc2626',
              }}>
                {convite.expirado ? 'Este convite expirou.' : 'Este convite foi cancelado ou já foi utilizado.'}
              </div>

            ) : !user ? (
              /* Não logado e tem conta — mostra botão de login */
              <div style={{ width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                  O convite é para <strong>{convite.email}</strong>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
                  Entre na sua conta para aceitar.
                </div>
                <Link
                  to={`/login?redirect=/convite/${token}`}
                  style={{
                    display: 'inline-block', width: '100%', padding: '12px', borderRadius: 10,
                    background: '#1a6634', color: '#fff', fontWeight: 700, fontSize: 15,
                    textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box',
                  }}
                >
                  Entrar na conta
                </Link>
              </div>

            ) : user.perfil !== convite.perfil ? (
              /* Logado com perfil errado */
              <div style={{
                width: '100%', padding: '12px 16px', borderRadius: 8, textAlign: 'center',
                background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 13, color: '#c2410c', lineHeight: 1.5,
              }}>
                Este convite é para um <strong>{PERFIL_LABELS[convite.perfil]}</strong>, mas sua conta
                é do tipo <strong>{user.perfil}</strong>. Acesse com a conta correta para aceitar.
              </div>

            ) : (
              /* Logado com perfil correto — aceitar */
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {acceptError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#dc2626',
                  }}>
                    {acceptError}
                  </div>
                )}
                <button
                  onClick={handleAceitar}
                  disabled={accepting}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                    background: accepting ? '#a7f3d0' : '#1a6634',
                    color: '#fff', fontWeight: 700, fontSize: 15,
                    cursor: accepting ? 'not-allowed' : 'pointer',
                    fontFamily: 'Sora, sans-serif',
                  }}
                >
                  {accepting ? 'Aceitando...' : 'Aceitar e entrar no projeto'}
                </button>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                  Logado como <strong>{user.nome}</strong> ({user.email})
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
