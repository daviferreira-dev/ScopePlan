import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from './Login.module.css';
import { EyeOpen, EyeOff } from '../components/EyeIcons';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    if (mounted && isAuthenticated && user) {
      const routes: Record<string, string> = {
        analista: "/analista/projetos",
        cliente: "/cliente/projetos",
        desenvolvedor: "/desenvolvedor/projetos",
        gestor: "/gestor/projetos",
      };
      navigate(routes[user.perfil] || "/analista/projetos");
    }
    return () => { mounted = false; };
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try { await login(email, password); }
    catch (err: unknown) { setError((err instanceof Error ? err.message : String(err)) || "Credenciais inválidas. Tente novamente."); }
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
          <span className={styles['sp-tag']}>Bem-vindo de volta</span>
          <h2 className={styles['sp-title']}>Onde projetos<br />ganham <em>forma</em><br />e direção</h2>
          <p className={styles['sp-desc']}>Acesse sua conta e retome o controle dos seus requisitos com clareza.</p>
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
          <span className={styles['sp-eyebrow']}><span className={styles['sp-eyebrow-line']} />Acesso à plataforma</span>
          <h1 className={styles['sp-h1']}>Entrar na conta</h1>
          <p className={styles['sp-sub']}>Insira suas credenciais para continuar.</p>

          <form onSubmit={handleSubmit}>
            <div className={styles['sp-field']}>
              <label className={styles['sp-lbl']}>E-mail</label>
              <div className={styles['sp-iw']}>
                <span className={styles['sp-ico']}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 8l10 6 10-6" />
                  </svg>
                </span>
                <input className={styles['sp-inp']} type="email" placeholder="email@exemplo.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email" required />
              </div>
            </div>

            <div className={styles['sp-field']}>
              <label className={styles['sp-lbl']}>Senha</label>
              <div className={styles['sp-iw']}>
                <span className={styles['sp-ico']}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input className={styles['sp-inp']} type={showPassword ? "text" : "password"}
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password" required />
                <button type="button" className={styles['sp-eye']}
                  onClick={() => setShowPassword(v => !v)} aria-label="Alternar senha">
                  {showPassword ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles['sp-err-box']}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className={styles['sp-btn']} disabled={loading}>
              {loading ? "Entrando..." : (
                <>Entrar na plataforma
                  <svg className={styles['sp-arr']} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className={styles['sp-foot']}>Não possui uma conta? <a onClick={() => navigate("/cadastro")}>Criar agora</a></p>
          <div className={styles['sp-home']}>
            <button className={styles['sp-home-btn']} onClick={() => navigate("/")}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M15 19l-7-7 7-7" />
              </svg>
              Voltar à Home
            </button>
          </div>
          <p className={styles['sp-copy']}>© 2026 ScopePlan Inc. · Todos os direitos reservados.</p>
        </div>
      </main>
    </div>
  );
}
