import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --forest:       #0d3320;
    --emerald:      #14532d;
    --leaf:         #166534;
    --mid-green:    #1e6b3a;
    --sage:         #4ade80;
    --gold:         #d4a853;
    --gold-lt:      #e8c87a;
    --bg-main:      #1a5c2a;
    --bg-dark:      #0f3d1c;
    --glass-bg:     rgba(10, 40, 18, 0.55);
    --glass-border: rgba(255,255,255,0.10);
    --inp-bg:       rgba(8, 34, 15, 0.70);
    --inp-border:   rgba(255,255,255,0.12);
    --inp-focus:    rgba(74,222,128,0.35);
    --text-main:    #ffffff;
    --text-soft:    rgba(255,255,255,0.60);
    --text-muted:   rgba(255,255,255,0.35);
    --err:          #f87171;
  }

  /* ─── Layout ─── */
  .sp-layout {
    position: fixed; inset: 0;
    display: flex;
    font-family: 'Plus Jakarta Sans', sans-serif;
    overflow: hidden;
    animation: fadeIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
    background:
      radial-gradient(ellipse 60% 70% at 15% 50%, #2d8c45 0%, transparent 60%),
      radial-gradient(ellipse 50% 60% at 85% 20%, #3aaa56 0%, transparent 55%),
      radial-gradient(ellipse 40% 50% at 70% 80%, #1e7035 0%, transparent 50%),
      linear-gradient(140deg, #1a5c2a 0%, #0f3d1c 50%, #1a6030 100%);
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  /* ─── Left panel ─── */
  .sp-left {
    position: relative;
    flex: 0 0 42%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: space-between;
    text-align: center;
    padding: 44px 36px;
    overflow: hidden;
  }

  .sp-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  .sp-left::after {
    content: '';
    position: absolute;
    top: 10%; right: 0; bottom: 10%;
    width: 1px;
    background: linear-gradient(
      to bottom,
      transparent,
      rgba(255,255,255,0.12) 30%,
      rgba(255,255,255,0.12) 70%,
      transparent
    );
  }

  .sp-glow-b {
    position: absolute; bottom: -100px; right: -100px;
    width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 65%);
    pointer-events: none;
  }
  .sp-glow-t {
    position: absolute; top: -80px; left: -60px;
    width: 280px; height: 280px; border-radius: 50%;
    background: radial-gradient(circle, rgba(212,168,83,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .sp-deco {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    font-family: 'Playfair Display', serif;
    font-size: clamp(180px, 22vw, 300px);
    font-weight: 900;
    color: rgba(255,255,255,0.04);
    user-select: none; pointer-events: none;
  }

  .sp-brand { position: relative; z-index: 2; }
  .sp-logo {
    width: clamp(110px, 13vw, 160px); height: auto;
    filter: brightness(0) invert(1); opacity: 0.95;
  }

  .sp-mid {
    position: relative; z-index: 2;
    display: flex; flex-direction: column; align-items: center;
  }

  /* ── Left panel typography – matched to HomePage scale ── */
  .sp-tag {
    font-size: clamp(9px, 0.8vw, 11px);
    font-weight: 600;
    letter-spacing: 2.8px; text-transform: uppercase;
    color: var(--gold); margin-bottom: 16px;
  }
  .sp-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 3.8vw, 52px);
    font-weight: 900; color: #fff;
    line-height: 1.08; letter-spacing: -0.3px;
    margin-bottom: 16px;
  }
  .sp-title em { font-style: italic; color: var(--gold-lt); }
  .sp-desc {
    font-size: clamp(13px, 1.2vw, 16px);
    color: var(--text-soft);
    line-height: 1.75; max-width: 300px;
  }

  .sp-pills {
    position: relative; z-index: 2;
    display: flex; gap: 7px; flex-wrap: wrap; justify-content: center;
  }
  .sp-pill {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 14px; border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(6px);
    font-size: clamp(10px, 0.85vw, 12px);
    color: rgba(255,255,255,0.42);
  }
  .sp-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--sage); flex-shrink: 0; }

  /* ─── Right panel ─── */
  .sp-right {
    flex: 1;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    padding: 0 clamp(20px, 5vw, 64px);
    background: linear-gradient(135deg, #f6fcf8 0%, #0f3d1c 50%, #1a6030 100%);
  }

  .sp-form-wrap {
    width: 100%; max-width: 400px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    padding: 32px 32px 28px;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow:
      0 8px 40px rgba(0,0,0,0.35),
      inset 0 1px 0 rgba(255,255,255,0.08);
    animation: slideUp 0.55s 0.1s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes slideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

  /* ── Form header typography ── */
  .sp-eyebrow {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: clamp(9px, 0.75vw, 11px);
    font-weight: 600;
    letter-spacing: 2.4px; text-transform: uppercase;
    color: var(--gold); margin-bottom: 8px;
  }
  .sp-eyebrow-line { width: 18px; height: 1.5px; background: var(--gold); border-radius: 2px; }

  .sp-h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(22px, 2.6vw, 34px);
    font-weight: 700; color: var(--text-main);
    line-height: 1.1; margin-bottom: 4px;
  }
  .sp-sub {
    font-size: clamp(12px, 1vw, 14px);
    color: var(--text-soft); margin-bottom: 16px;
    line-height: 1.6;
  }

  /* ─── Fields ─── */
  .sp-field { margin-bottom: 10px; }
  .sp-lbl {
    display: block;
    font-size: clamp(9px, 0.7vw, 11px);
    font-weight: 600;
    letter-spacing: 1.6px; text-transform: uppercase;
    color: rgba(255,255,255,0.55); margin-bottom: 5px;
  }
  .sp-iw { position: relative; display: flex; align-items: center; }
  .sp-ico {
    position: absolute; left: 12px; color: rgba(255,255,255,0.35);
    display: flex; align-items: center;
    pointer-events: none; z-index: 1;
  }
  .sp-eye {
    position: absolute; right: 3px; color: rgba(255,255,255,0.35);
    display: flex; align-items: center;
    cursor: pointer; background: none; border: none;
    padding: 9px; transition: color 0.18s;
    -webkit-tap-highlight-color: transparent; z-index: 1;
  }
  .sp-eye:hover { color: var(--text-main); }

  .sp-inp {
    width: 100%;
    background: var(--inp-bg);
    border: 1.5px solid var(--inp-border);
    border-radius: 9px;
    padding: 10px 38px 10px 38px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(13px, 1vw, 15px);
    color: var(--text-main);
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    -webkit-appearance: none; appearance: none;
  }
  .sp-inp::placeholder { color: rgba(255,255,255,0.22); }
  .sp-inp:focus {
    border-color: rgba(74,222,128,0.55);
    background: rgba(8,34,15,0.85);
    box-shadow: 0 0 0 3px var(--inp-focus);
  }

  /* Inline error */
  .sp-err {
    font-size: clamp(11px, 0.8vw, 13px);
    color: var(--err);
    margin-top: 4px; display: flex; align-items: center; gap: 4px;
  }

  /* Divider */
  .sp-div {
    display: flex; align-items: center; gap: 10px;
    margin: 12px 0 9px;
  }
  .sp-div-line { flex: 1; height: 1px; background: rgba(255,255,255,0.10); }
  .sp-div-lbl {
    font-size: clamp(8px, 0.65vw, 10px);
    font-weight: 600;
    letter-spacing: 1.8px; color: rgba(255,255,255,0.30);
    text-transform: uppercase; white-space: nowrap;
  }

  /* Profile selector */
  .sp-profiles { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .sp-prf {
    padding: 8px;
    background: rgba(255,255,255,0.05);
    border: 1.5px solid rgba(255,255,255,0.10);
    border-radius: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(11px, 0.85vw, 13px);
    font-weight: 500;
    color: rgba(255,255,255,0.45);
    cursor: pointer; transition: all 0.18s; text-align: center;
    -webkit-tap-highlight-color: transparent;
  }
  .sp-prf:hover {
    border-color: rgba(74,222,128,0.30);
    color: rgba(255,255,255,0.80);
    background: rgba(74,222,128,0.08);
  }
  .sp-prf.active {
    background: rgba(22,101,52,0.60);
    border-color: rgba(74,222,128,0.40);
    color: #fff; font-weight: 600;
    box-shadow: 0 3px 10px rgba(0,0,0,0.25);
  }

  /* Submit */
  .sp-btn {
    width: 100%; margin-top: 13px; padding: 12px;
    background: linear-gradient(135deg, #166534 0%, #14532d 100%);
    color: #fff; border: 1px solid rgba(255,255,255,0.10);
    border-radius: 9px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(13px, 1vw, 15px);
    font-weight: 600; letter-spacing: 0.3px;
    cursor: pointer; transition: all 0.2s;
    -webkit-tap-highlight-color: transparent;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.10);
  }
  .sp-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #1a7a3e 0%, #166534 100%);
    box-shadow: 0 6px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12);
    transform: translateY(-1px);
  }
  .sp-btn:active:not(:disabled) { transform: translateY(0); }
  .sp-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .sp-arr { transition: transform 0.2s; }
  .sp-btn:hover:not(:disabled) .sp-arr { transform: translateX(3px); }

  .sp-foot {
    margin-top: 13px;
    font-size: clamp(11px, 0.85vw, 13px);
    color: var(--text-muted); text-align: center;
  }
  .sp-foot a {
    color: var(--sage); font-weight: 600;
    text-decoration: none; cursor: pointer; transition: color 0.18s;
  }
  .sp-foot a:hover { color: #fff; text-decoration: underline; }
  .sp-home { margin-top: 14px; text-align: center; }
  .sp-home-btn {
    font-size: clamp(11px, 0.85vw, 13px);
    font-weight: 500; color: var(--text-muted);
    background: none; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    display: inline-flex; align-items: center; gap: 5px;
    transition: color 0.18s; padding: 0;
  }
  .sp-home-btn:hover { color: rgba(255,255,255,0.65); }
  .sp-copy {
    margin-top: 10px;
    font-size: clamp(9px, 0.7vw, 11px);
    color: rgba(255,255,255,0.18); text-align: center;
  }

  /* ── Mobile ── */
  @media (max-width: 1024px) {
    .sp-title { font-size: clamp(28px, 4.5vw, 48px); }
  }

  @media (max-width: 768px) {
    .sp-layout { flex-direction: column; overflow-y: auto; position: relative; min-height: 100svh; }
    .sp-left { flex: none; padding: 32px 24px; }
    .sp-left::after { display: none; }
    .sp-right { flex: none; padding: 16px 16px 40px; overflow-y: visible; align-items: flex-start; }
    .sp-form-wrap { max-width: 100%; }
    .sp-title { font-size: clamp(26px, 7vw, 36px); }
    .sp-desc { font-size: 13px; }
    .sp-h1 { font-size: clamp(20px, 6vw, 28px); }
    .sp-sub { font-size: 12px; }
    .sp-inp { font-size: 14px; }
    .sp-btn { font-size: 14px; }
    .sp-prf { font-size: 12px; }
    .sp-foot { font-size: 12px; }
    .sp-home-btn { font-size: 12px; }
  }

  @media (max-width: 480px) {
    .sp-left { padding: 24px 20px; }
    .sp-right { padding: 12px 12px 36px; }
    .sp-form-wrap { padding: 24px 18px 22px; }
    .sp-tag { letter-spacing: 2px; }
    .sp-profiles { gap: 6px; }
  }
`;

export default function CadastroPage() {
  const navigate = useNavigate();
  const { register, user, isAuthenticated } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [perfil, setPerfil] = useState<string>("analista");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const routes: Record<string, string> = {
        analista: "/analista/projetos",
        cliente: "/cliente/projetos",
        desenvolvedor: "/desenvolvedor/projetos",
        gestor: "/analista/projetos",
      };
      navigate(routes[user.perfil] || "/analista/projetos");
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("As senhas não coincidem"); return; }
    setError(""); setLoading(true);
    try { await register(nome, email, password, perfil); }
    catch (err: any) { setError(err.message || "Erro ao criar conta. Tente novamente."); }
    finally { setLoading(false); }
  };

  const EyeOpen = () => (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M1 12C2.73 7.61 7 4 12 4s9.27 3.61 11 8c-1.73 4.39-6 8-11 8S2.73 16.39 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
  const EyeOff = () => (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17.94 17.94A10.94 10.94 0 0112 20C7 20 2.73 16.39 1 12a11.06 11.06 0 012.94-4.94M9.9 4.24A9.12 9.12 0 0112 4c5 0 9.27 3.61 11 8a10.93 10.93 0 01-1.29 2.59M3 3l18 18" />
    </svg>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="sp-layout">

        {/* Left panel */}
        <aside className="sp-left">
          <div className="sp-grid" /><div className="sp-glow-b" /><div className="sp-glow-t" />
          <div className="sp-deco">S</div>

          <div className="sp-brand">
            <img src="./src/assets/scopeplan.png" alt="ScopePlan" className="sp-logo" />
          </div>

          <div className="sp-mid">
            <span className="sp-tag">Gestão de requisitos</span>
            <h2 className="sp-title">Clareza em<br />cada <em>etapa</em> do<br />seu projeto</h2>
            <p className="sp-desc">Centralize requisitos, alinhe equipes e entregue com confiança.</p>
          </div>

          <div className="sp-pills">
            <span className="sp-pill"><span className="sp-dot" />Requisitos</span>
            <span className="sp-pill"><span className="sp-dot" />Aprovações</span>
            <span className="sp-pill"><span className="sp-dot" />Auditoria</span>
          </div>
        </aside>

        {/* Right panel */}
        <main className="sp-right">
          <div className="sp-form-wrap">
            <span className="sp-eyebrow"><span className="sp-eyebrow-line" />Nova conta</span>
            <h1 className="sp-h1">Crie sua conta</h1>
            <p className="sp-sub">Preencha os dados abaixo para começar.</p>

            <form onSubmit={handleSubmit}>
              {/* Nome */}
              <div className="sp-field">
                <label className="sp-lbl">Nome Completo</label>
                <div className="sp-iw">
                  <span className="sp-ico">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </span>
                  <input className="sp-inp" type="text" placeholder="Seu nome completo"
                    value={nome} onChange={e => setNome(e.target.value)}
                    autoComplete="name" required />
                </div>
              </div>

              {/* E-mail */}
              <div className="sp-field">
                <label className="sp-lbl">E-mail</label>
                <div className="sp-iw">
                  <span className="sp-ico">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 8l10 6 10-6" />
                    </svg>
                  </span>
                  <input className="sp-inp" type="email" placeholder="email@exemplo.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    autoComplete="email" required />
                </div>
              </div>

              {/* Senha */}
              <div className="sp-field">
                <label className="sp-lbl">Senha</label>
                <div className="sp-iw">
                  <span className="sp-ico">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </span>
                  <input className="sp-inp" type={showPassword ? "text" : "password"}
                    placeholder="Mín. 8 caracteres" value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password" required />
                  <button type="button" className="sp-eye"
                    onClick={() => setShowPassword(v => !v)} aria-label="Alternar senha">
                    {showPassword ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div className="sp-field">
                <label className="sp-lbl">Confirmar Senha</label>
                <div className="sp-iw">
                  <span className="sp-ico">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </span>
                  <input className="sp-inp" type={showPassword ? "text" : "password"}
                    placeholder="Repita a senha" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password" required />
                  <button type="button" className="sp-eye"
                    onClick={() => setShowPassword(v => !v)} aria-label="Alternar senha">
                    {showPassword ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
                {error && (
                  <span className="sp-err">
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                    </svg>
                    {error}
                  </span>
                )}
              </div>

              {/* Perfil */}
              <div className="sp-div">
                <div className="sp-div-line" />
                <span className="sp-div-lbl">Perfil de Acesso</span>
                <div className="sp-div-line" />
              </div>
              <div className="sp-profiles">
                {(["analista", "cliente", "desenvolvedor", "gestor"] as const).map(p => (
                  <button key={p} type="button"
                    className={`sp-prf${perfil === p ? " active" : ""}`}
                    onClick={() => setPerfil(p)}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>

              <button type="submit" className="sp-btn" disabled={loading}>
                {loading ? "Criando conta..." : (
                  <>Criar conta
                    <svg className="sp-arr" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="sp-foot">Já possui uma conta? <a onClick={() => navigate("/login")}>Acessar agora</a></p>
            <div className="sp-home">
              <button className="sp-home-btn" onClick={() => navigate("/")}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M15 19l-7-7 7-7" />
                </svg>
                Voltar à Home
              </button>
            </div>
            <p className="sp-copy">© 2026 ScopePlan Inc. · Todos os direitos reservados.</p>
          </div>
        </main>
      </div>
    </>
  );
}