import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import styles from './Login.module.css';
import { EyeOpen, EyeOff } from '../components/EyeIcons';

const STRONG_PW = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

type Step = 'email' | 'code' | 'password' | 'done';

export default function ResetSenhaPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Etapa 1 — solicita o código por e-mail
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setDevCode(res.reset_code ?? null);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao solicitar recuperação.");
    } finally { setLoading(false); }
  };

  // Etapa 2 — confere o código
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await authApi.verifyResetCode(email, code);
      setStep('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido ou expirado.");
    } finally { setLoading(false); }
  };

  // Etapa 3 — define a nova senha
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!STRONG_PW.test(password)) {
      setError("A senha deve ter no mínimo 8 caracteres, com 1 maiúscula, 1 número e 1 caractere especial.");
      return;
    }
    if (password !== confirm) { setError("As senhas não coincidem"); return; }
    setError(""); setLoading(true);
    try {
      await authApi.resetPassword(email, code, password);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível redefinir a senha.");
    } finally { setLoading(false); }
  };

  const lockIcon = (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );

  return (
    <div className={styles['sp-layout']}>
      <aside className={styles['sp-left']}>
        <div className={styles['sp-grid']} /><div className={styles['sp-glow-b']} /><div className={styles['sp-glow-t']} />
        <div className={styles['sp-deco']}>S</div>
        <div className={styles['sp-brand']}>
          <img src={new URL('../assets/scopeplan.png', import.meta.url).href} alt="ScopePlan" className={styles['sp-logo']} />
        </div>
        <div className={styles['sp-mid']}>
          <span className={styles['sp-tag']}>Recuperação de acesso</span>
          <h2 className={styles['sp-title']}>Recupere o<br />acesso à sua<br /><em>conta</em></h2>
          <p className={styles['sp-desc']}>Enviaremos um código seguro para o seu e-mail cadastrado.</p>
        </div>
      </aside>

      <main className={styles['sp-right']}>
        <div className={styles['sp-form-wrap']}>

          {/* ───── ETAPA 1: E-MAIL ───── */}
          {step === 'email' && (
            <>
              <span className={styles['sp-eyebrow']}><span className={styles['sp-eyebrow-line']} />Esqueci a senha</span>
              <h1 className={styles['sp-h1']}>Recuperar senha</h1>
              <p className={styles['sp-sub']}>Informe seu e-mail para receber o código de recuperação.</p>
              <form onSubmit={handleRequest}>
                <div className={styles['sp-field']}>
                  <label className={styles['sp-lbl']}>E-mail</label>
                  <div className={styles['sp-iw']}>
                    <span className={styles['sp-ico']}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 8l10 6 10-6" />
                      </svg>
                    </span>
                    <input className={styles['sp-inp']} type="email" placeholder="email@exemplo.com"
                      value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
                  </div>
                </div>
                {error && <div className={styles['sp-err-box']}>{error}</div>}
                <button type="submit" className={styles['sp-btn']} disabled={loading}>
                  {loading ? "Enviando..." : "Enviar código"}
                </button>
              </form>
            </>
          )}

          {/* ───── ETAPA 2: CÓDIGO ───── */}
          {step === 'code' && (
            <>
              <span className={styles['sp-eyebrow']}><span className={styles['sp-eyebrow-line']} />Verificação</span>
              <h1 className={styles['sp-h1']}>Digite o código</h1>
              <p className={styles['sp-sub']}>Enviamos um código de 6 dígitos para <strong>{email}</strong> (válido por 15 min).</p>
              {devCode && (
                <div className={styles['sp-err-box']} style={{ background: '#e6f5eb', color: '#1a6634', border: '1px solid #c9e8cf' }}>
                  <span style={{ fontSize: 12 }}>[dev] Código: <strong>{devCode}</strong></span>
                </div>
              )}
              <form onSubmit={handleVerify}>
                <div className={styles['sp-field']}>
                  <label className={styles['sp-lbl']}>Código de 6 dígitos</label>
                  <div className={styles['sp-iw']}>
                    <span className={styles['sp-ico']}>{lockIcon}</span>
                    <input className={styles['sp-inp']} type="text" inputMode="numeric" maxLength={6}
                      placeholder="000000" value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      autoComplete="one-time-code" required
                      style={{ letterSpacing: '0.4em', fontWeight: 600 }} />
                  </div>
                </div>
                {error && <div className={styles['sp-err-box']}>{error}</div>}
                <button type="submit" className={styles['sp-btn']} disabled={loading || code.length !== 6}>
                  {loading ? "Verificando..." : "Verificar código"}
                </button>
              </form>
              <p className={styles['sp-foot']}>
                Não recebeu? <a onClick={() => { setStep('email'); setCode(''); setError(''); }}>Reenviar</a>
              </p>
            </>
          )}

          {/* ───── ETAPA 3: NOVA SENHA ───── */}
          {step === 'password' && (
            <>
              <span className={styles['sp-eyebrow']}><span className={styles['sp-eyebrow-line']} />Nova senha</span>
              <h1 className={styles['sp-h1']}>Definir nova senha</h1>
              <p className={styles['sp-sub']}>Código verificado. Escolha uma senha forte para sua conta.</p>
              <form onSubmit={handleReset}>
                <div className={styles['sp-field']}>
                  <label className={styles['sp-lbl']}>Nova senha</label>
                  <div className={styles['sp-iw']}>
                    <span className={styles['sp-ico']}>{lockIcon}</span>
                    <input className={styles['sp-inp']} type={showPw ? "text" : "password"}
                      placeholder="Mín. 8: maiúscula, número e especial"
                      value={password} onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password" required />
                    <button type="button" className={styles['sp-eye']} onClick={() => setShowPw(v => !v)} aria-label="Alternar senha">
                      {showPw ? <EyeOff /> : <EyeOpen />}
                    </button>
                  </div>
                </div>
                <div className={styles['sp-field']}>
                  <label className={styles['sp-lbl']}>Confirmar senha</label>
                  <div className={styles['sp-iw']}>
                    <span className={styles['sp-ico']}>{lockIcon}</span>
                    <input className={styles['sp-inp']} type={showPw ? "text" : "password"}
                      placeholder="Repita a senha" value={confirm}
                      onChange={e => setConfirm(e.target.value)} autoComplete="new-password" required />
                  </div>
                </div>
                {error && <div className={styles['sp-err-box']}>{error}</div>}
                <button type="submit" className={styles['sp-btn']} disabled={loading}>
                  {loading ? "Salvando..." : "Redefinir senha"}
                </button>
              </form>
            </>
          )}

          {/* ───── CONCLUÍDO ───── */}
          {step === 'done' && (
            <>
              <h1 className={styles['sp-h1']}>Senha redefinida</h1>
              <p className={styles['sp-sub']}>Sua senha foi alterada com sucesso.</p>
              <button className={styles['sp-btn']} onClick={() => navigate("/login")}>Ir para o login</button>
            </>
          )}

          <p className={styles['sp-foot']}>Lembrou a senha? <a onClick={() => navigate("/login")}>Acessar agora</a></p>
          <p className={styles['sp-copy']}>© 2026 ScopePlan Inc. · Todos os direitos reservados.</p>
        </div>
      </main>
    </div>
  );
}
