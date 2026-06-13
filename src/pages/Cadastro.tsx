import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from './Cadastro.module.css';
import { EyeOpen, EyeOff } from '../components/EyeIcons';

export default function CadastroPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam  = searchParams.get('email')  || '';
  const perfilParam = searchParams.get('perfil') || '';
  const redirect    = searchParams.get('redirect') || '';
  const viaConvite  = !!emailParam && !!perfilParam && !!redirect;

  const { register, user, isAuthenticated } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [perfil, setPerfil] = useState<string>(perfilParam || "analista");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (redirect) { navigate(redirect, { replace: true }); return; }
      const routes: Record<string, string> = {
        analista: "/analista/projetos",
        cliente: "/cliente/projetos",
        desenvolvedor: "/desenvolvedor/projetos",
        gestor: "/gestor/projetos",
      };
      navigate(routes[user.perfil] || "/analista/projetos");
    }
  }, [isAuthenticated, user, navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;
    if (!strongPassword.test(password)) {
      setError("A senha deve ter no mínimo 8 caracteres, com 1 maiúscula, 1 número e 1 caractere especial.");
      return;
    }
    if (password !== confirmPassword) { setError("As senhas não coincidem"); return; }
    setError(""); setLoading(true);
    try {
      await register(nome, email, password, perfil);
      setSuccess(true);
      setTimeout(() => navigate(redirect || '/login', { replace: true }), 1500);
    }
    catch (err: unknown) { setError((err instanceof Error ? err.message : String(err)) || "Erro ao criar conta. Tente novamente."); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles['sp-layout']}>

      {/* Left panel */}
      <aside className={styles['sp-left']}>
        <div className={styles['sp-grid']} /><div className={styles['sp-glow-b']} /><div className={styles['sp-glow-t']} />
        <div className={styles['sp-deco']}>S</div>

        <div className={styles['sp-brand']}>
          <img src={new URL('../assets/scopeplan.png', import.meta.url).href} alt="ScopePlan" className={styles['sp-logo']} />
        </div>

        <div className={styles['sp-mid']}>
          <span className={styles['sp-tag']}>Gestão de requisitos</span>
          <h2 className={styles['sp-title']}>Clareza em<br />cada <em>etapa</em> do<br />seu projeto</h2>
          <p className={styles['sp-desc']}>Centralize requisitos, alinhe equipes e entregue com confiança.</p>
        </div>

        <div className={styles['sp-pills']}>
          <span className={styles['sp-pill']}><span className={styles['sp-dot']} />Requisitos</span>
          <span className={styles['sp-pill']}><span className={styles['sp-dot']} />Aprovações</span>
          <span className={styles['sp-pill']}><span className={styles['sp-dot']} />Auditoria</span>
        </div>
      </aside>

      {/* Right panel */}
      <main className={styles['sp-right']}>
        <div className={styles['sp-form-wrap']}>
          <span className={styles['sp-eyebrow']}><span className={styles['sp-eyebrow-line']} />{viaConvite ? 'Convite recebido' : 'Nova conta'}</span>
          <h1 className={styles['sp-h1']}>Crie sua conta</h1>
          <p className={styles['sp-sub']}>{viaConvite ? 'Complete o cadastro para aceitar o convite.' : 'Preencha os dados abaixo para começar.'}</p>

          {viaConvite && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 4, fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
              Você foi convidado como <strong>{perfilParam === 'cliente' ? 'Cliente' : 'Desenvolvedor'}</strong>. Após criar a conta, o convite será aceito automaticamente.
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid #22c55e', borderRadius: 8, padding: '12px 16px', color: '#16a34a', fontWeight: 500, fontSize: 14, marginBottom: 16 }}>
              {viaConvite ? 'Conta criada! Redirecionando para o convite...' : 'Conta criada com sucesso! Redirecionando para o login...'}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Nome */}
            <div className={styles['sp-field']}>
              <label className={styles['sp-lbl']}>Nome Completo</label>
              <div className={styles['sp-iw']}>
                <span className={styles['sp-ico']}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </span>
                <input className={styles['sp-inp']} type="text" placeholder="Seu nome completo"
                  value={nome} onChange={e => setNome(e.target.value)}
                  autoComplete="name" required />
              </div>
            </div>

            {/* E-mail */}
            <div className={styles['sp-field']}>
              <label className={styles['sp-lbl']}>E-mail</label>
              <div className={styles['sp-iw']}>
                <span className={styles['sp-ico']}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 8l10 6 10-6" />
                  </svg>
                </span>
                <input className={styles['sp-inp']} type="email" placeholder="email@exemplo.com"
                  value={email} onChange={e => !viaConvite && setEmail(e.target.value)}
                  autoComplete="email" required
                  readOnly={viaConvite}
                  style={viaConvite ? { background: 'var(--sidebar-bg, #f1f5f9)', color: 'var(--text-muted)', cursor: 'not-allowed' } : undefined} />
              </div>
            </div>

            {/* Senha */}
            <div className={styles['sp-field']}>
              <label className={styles['sp-lbl']}>Senha</label>
              <div className={styles['sp-iw']}>
                <span className={styles['sp-ico']}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input className={styles['sp-inp']} type={showPassword ? "text" : "password"}
                  placeholder="Mín. 8: maiúscula, número e especial" value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password" required />
                <button type="button" className={styles['sp-eye']}
                  onClick={() => setShowPassword(v => !v)} aria-label="Alternar senha">
                  {showPassword ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div className={styles['sp-field']}>
              <label className={styles['sp-lbl']}>Confirmar Senha</label>
              <div className={styles['sp-iw']}>
                <span className={styles['sp-ico']}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input className={styles['sp-inp']} type={showPassword ? "text" : "password"}
                  placeholder="Repita a senha" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password" required />
                <button type="button" className={styles['sp-eye']}
                  onClick={() => setShowPassword(v => !v)} aria-label="Alternar senha">
                  {showPassword ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
              {error && (
                <span className={styles['sp-err']}>
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  {error}
                </span>
              )}
            </div>

            {/* Perfil */}
            <div className={styles['sp-div']}>
              <div className={styles['sp-div-line']} />
              <span className={styles['sp-div-lbl']}>Perfil de Acesso</span>
              <div className={styles['sp-div-line']} />
            </div>
            <div className={styles['sp-profiles']}>
              {(["analista", "cliente", "desenvolvedor"] as const).map(p => (
                <button key={p} type="button"
                  className={`${styles['sp-prf']}${perfil === p ? ` ${styles.active}` : ""}`}
                  onClick={() => !viaConvite && setPerfil(p)}
                  disabled={viaConvite}
                  style={viaConvite ? { opacity: p === perfil ? 1 : 0.35, cursor: 'not-allowed' } : undefined}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            <button type="submit" className={styles['sp-btn']} disabled={loading}>
              {loading ? "Criando conta..." : (
                <>Criar conta
                  <svg className={styles['sp-arr']} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className={styles['sp-foot']}>Já possui uma conta? <a onClick={() => navigate("/login")}>Acessar agora</a></p>
          <div className={styles['sp-home']}>
            <button className={styles['sp-home-btn']} onClick={() => navigate("/")}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M15 19l-7-7 7-7" />
              </svg>
              Voltar à Home
            </button>
          </div>
          <p className={styles['sp-copy']}>&copy; 2026 ScopePlan Inc. &middot; Todos os direitos reservados.</p>
        </div>
      </main>
    </div>
  );
}
