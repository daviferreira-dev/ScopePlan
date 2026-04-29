import { useState } from "react";
import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :root {
    --green-deep: #1a5c2a;
    --green-mid: #2d7a40;
    --green-bright: #3a9e52;
    --green-light: #4ebb68;
    --card-bg: rgba(255,255,255,0.10);
    --card-border: rgba(255,255,255,0.18);
    --input-bg: rgba(0,0,0,0.22);
    --input-border: rgba(255,255,255,0.12);
    --input-border-focus: rgba(255,255,255,0.5);
    --text-primary: #ffffff;
    --text-muted: rgba(255,255,255,0.55);
  }

  html {
    height: 100%;
    width: 100%;
    -webkit-text-size-adjust: 100%;
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--green-mid);
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow-x: hidden;
    overflow-y: auto;
  }

  #root {
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bg-wrapper {
    position: fixed;
    inset: 0;
    z-index: 0;
    background: radial-gradient(ellipse 80% 70% at 20% 30%, #3dab57 0%, transparent 60%),
                radial-gradient(ellipse 60% 60% at 80% 70%, #28883c 0%, transparent 55%),
                radial-gradient(ellipse 50% 50% at 60% 10%, #4ebb68 0%, transparent 50%),
                linear-gradient(160deg, #2d7a40 0%, #1e6030 50%, #1a5c2a 100%);
  }

  .noise {
    position: fixed;
    inset: 0;
    z-index: 1;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 200px;
    pointer-events: none;
  }

  .page {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(14px, 3.5vw, 32px);
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    padding: clamp(20px, 6vw, 48px) clamp(14px, 5vw, 24px);
    justify-content: center;
    animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .logo-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: fadeUp 0.7s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

 .logo-img {
  width: clamp(200px, 50vw, 380px);
  max-width: 100%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 16px rgba(0,0,0,0.2));
  margin-bottom: -120px;
  margin-top: -130px;
}

  .card {
    width: 100%;
    max-width: 420px;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: clamp(14px, 3vw, 20px);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    padding: clamp(20px, 5vw, 40px) clamp(16px, 5vw, 36px) clamp(18px, 4vw, 32px);
    box-shadow: 0 32px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.06) inset;
    animation: fadeUp 0.7s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .card-title {
    font-family: 'Fraunces', serif;
    font-weight: 700;
    font-size: clamp(17px, 4vw, 22px);
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .card-subtitle {
    font-size: clamp(12px, 2.8vw, 13px);
    color: var(--text-muted);
    margin-bottom: clamp(18px, 4vw, 28px);
    font-weight: 300;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: clamp(12px, 3vw, 16px);
  }

  .field-label {
    font-size: clamp(9px, 2vw, 10px);
    font-weight: 600;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 13px;
    color: rgba(255,255,255,0.4);
    display: flex;
    align-items: center;
    pointer-events: none;
    z-index: 1;
  }

  .input-eye {
    position: absolute;
    right: 6px;
    color: rgba(255,255,255,0.4);
    display: flex;
    align-items: center;
    cursor: pointer;
    background: none;
    border: none;
    padding: 8px;
    transition: color 0.2s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    z-index: 1;
  }

  .input-eye:hover {
    color: rgba(255,255,255,0.8);
  }

  input {
    width: 100%;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 10px;
    padding: clamp(11px, 2.5vw, 13px) 44px clamp(11px, 2.5vw, 13px) 42px;
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    color: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
    appearance: none;
    position: relative;
    z-index: 0;
  }

  input::placeholder {
    color: rgba(255,255,255,0.28);
  }

  input:focus {
    border-color: var(--input-border-focus);
    box-shadow: 0 0 0 3px rgba(255,255,255,0.07);
  }

  .btn-primary {
    width: 100%;
    margin-top: clamp(6px, 2vw, 8px);
    padding: clamp(13px, 3vw, 15px);
    background: rgba(255,255,255,0.92);
    color: var(--green-deep);
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: clamp(14px, 3.5vw, 15px);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.12s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(0,0,0,0.18);
    letter-spacing: 0.2px;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .btn-primary:hover {
    background: #fff;
    box-shadow: 0 8px 28px rgba(0,0,0,0.22);
    transform: translateY(-1px);
  }

  .btn-primary:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(0,0,0,0.14);
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: clamp(16px, 4vw, 24px) 0 clamp(12px, 3vw, 16px);
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.12);
  }

  .divider-label {
    font-size: clamp(9px, 2vw, 10px);
    font-weight: 600;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.38);
    text-transform: uppercase;
    white-space: nowrap;
  }

  .quick-access {
    display: flex;
    gap: 10px;
  }

  .btn-quick {
    flex: 1;
    padding: clamp(10px, 2.5vw, 11px);
    background: transparent;
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: clamp(13px, 3vw, 14px);
    font-weight: 500;
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .btn-quick:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.3);
    color: #fff;
  }

  .btn-quick.active {
    background: rgba(255,255,255,0.14);
    border-color: rgba(255,255,255,0.4);
    color: #fff;
    font-weight: 600;
  }

  .footer {
    font-size: clamp(10px, 2.2vw, 11px);
    color: rgba(255,255,255,0.32);
    letter-spacing: 0.2px;
    text-align: center;
    animation: fadeUp 0.7s 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @media (max-width: 390px) {
    .page {
      gap: 12px;
      padding: 16px 12px;
    }
    .card {
      padding: 18px 14px 16px;
      border-radius: 14px;
    }
    .logo-img {
      width: 400px;
    }
  }

  @media (max-height: 680px) {
    .page {
      justify-content: flex-start;
      padding-top: 20px;
      padding-bottom: 20px;
      min-height: unset;
      margin-bottom: 20px;
    }
  }

  @media (min-width: 768px) {
  .logo-img {
    width: 380px;
    padding-top: -100px;
  }
}
`;

type Role = "analista" | "cliente";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("cliente");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Entrando como ${role}: ${email}`);
    navigate("/Tela_Projetos");
  };

  return (
    <>
      <style>{styles}</style>
      <div className="bg-wrapper" />
      <div className="noise" />

      <div className="page">
        <div className="logo-block">
          <img
            src="./src/assets/scopeplan.png"
            alt="ScopePlan"
            className="logo-img"
          />
        </div>

        <div className="card">
          <h1 className="card-title">Acessar a plataforma</h1>
          <p className="card-subtitle">Insira as suas credenciais para continuar.</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label">E-mail</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="2" y="4" width="20" height="16" rx="3" />
                    <path d="M2 8l10 6 10-6" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="email@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Senha</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M17.94 17.94A10.94 10.94 0 0112 20C7 20 2.73 16.39 1 12a11.06 11.06 0 012.94-4.94M9.9 4.24A9.12 9.12 0 0112 4c5 0 9.27 3.61 11 8a10.93 10.93 0 01-1.29 2.59M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M1 12C2.73 7.61 7 4 12 4s9.27 3.61 11 8c-1.73 4.39-6 8-11 8S2.73 16.39 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary">
              Entrar na Plataforma
            </button>
          </form>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-label">Acesso Rápido</span>
            <div className="divider-line" />
          </div>

          <div className="quick-access">
            <button
              type="button"
              className={`btn-quick ${role === "analista" ? "active" : ""}`}
              onClick={() => setRole("analista")}
            >
              Analista
            </button>
            <button
              type="button"
              className={`btn-quick ${role === "cliente" ? "active" : ""}`}
              onClick={() => setRole("cliente")}
            >
              Cliente
            </button>
          </div>
  <p className="footer">
  Não possui uma conta? <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => navigate('/cadastro')}>Crie</span>
  </p>
        </div>

        <p className="footer">© 2026 ScopePlan Inc. · Todos os direitos reservados.</p>
      </div>
    </>
  );
}