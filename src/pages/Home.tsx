import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --forest:       #0d3320;
    --emerald:      #14532d;
    --leaf:         #166534;
    --sage:         #4ade80;
    --gold:         #d4a853;
    --gold-lt:      #e8c87a;
    --glass-bg:     rgba(10, 40, 18, 0.55);
    --glass-border: rgba(255,255,255,0.10);
    --text-main:    #ffffff;
    --text-soft:    rgba(255,255,255,0.60);
    --text-muted:   rgba(255,255,255,0.35);
  }

  /* ─── Root ─── */
  .hp-root {
    position: fixed; inset: 0;
    font-family: 'Plus Jakarta Sans', sans-serif;
    display: flex; flex-direction: column;
    overflow: hidden;
    animation: hp-fadeIn 0.7s cubic-bezier(0.22,1,0.36,1) both;
    background:
      radial-gradient(ellipse 55% 65% at 10% 55%, #2d8c45 0%, transparent 58%),
      radial-gradient(ellipse 45% 55% at 90% 15%, #3aaa56 0%, transparent 52%),
      radial-gradient(ellipse 38% 48% at 68% 85%, #1e7035 0%, transparent 48%),
      linear-gradient(140deg, #1a5c2a 0%, #0f3d1c 50%, #1a6030 100%);
  }
  @keyframes hp-fadeIn { from{opacity:0} to{opacity:1} }

  .hp-grid {
    position: absolute; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 56px 56px;
  }

  .hp-orb-1 {
    position: absolute; top: -140px; left: -100px;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(212,168,83,0.11) 0%, transparent 68%);
    pointer-events: none; z-index: 0;
  }
  .hp-orb-2 {
    position: absolute; bottom: -160px; right: -120px;
    width: 560px; height: 560px; border-radius: 50%;
    background: radial-gradient(circle, rgba(74,222,128,0.11) 0%, transparent 63%);
    pointer-events: none; z-index: 0;
  }

  .hp-deco {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Playfair Display', serif;
    font-size: clamp(260px, 42vw, 580px);
    font-weight: 900;
    color: rgba(255,255,255,0.025);
    user-select: none; pointer-events: none; z-index: 0;
    line-height: 1;
  }

  /* ─── Navbar ─── */
  .hp-nav {
    /* Absolute: sai do fluxo flex para não deslocar o centro do hero */
    position: absolute; top: 0; left: 0; right: 0;
    z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 24px clamp(20px, 5vw, 72px);
    animation: hp-down 0.6s 0.1s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes hp-down { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }

  .hp-logo {
    width: clamp(100px, 12.5vw, 172px); height: auto;
    filter: brightness(0) invert(1); opacity: 0.93;
  }

  .hp-nav-right { display: flex; align-items: center; gap: 8px; }

  .hp-nav-link {
    font-size: clamp(12px, 1vw, 14px);
    font-weight: 500;
    color: rgba(255,255,255,0.52); background: none; border: none;
    cursor: pointer; padding: 7px 16px; border-radius: 8px;
    transition: color 0.18s, background 0.18s;
    font-family: 'Plus Jakarta Sans', sans-serif;
    -webkit-tap-highlight-color: transparent;
  }
  .hp-nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }

  .hp-nav-btn {
    font-size: clamp(12px, 1vw, 14px);
    font-weight: 600; color: #fff;
    background: linear-gradient(135deg, #166534 0%, #14532d 100%);
    border: 1px solid rgba(255,255,255,0.12);
    cursor: pointer; padding: 8px 22px; border-radius: 9px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    box-shadow: 0 3px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.10);
    transition: all 0.2s; -webkit-tap-highlight-color: transparent;
  }
  .hp-nav-btn:hover {
    background: linear-gradient(135deg, #1a7a3e 0%, #166534 100%);
    transform: translateY(-1px);
    box-shadow: 0 5px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12);
  }
  .hp-nav-btn:active { transform: translateY(0); }

  /* ─── Floating side accents ─── */
  .hp-accent {
    position: absolute; z-index: 4;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    padding: 16px 18px;
    backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08);
    display: flex; flex-direction: column; gap: 10px;
    width: 172px;
  }

  .hp-accent-tl {
    top: clamp(90px, 16vh, 178px);
    left: clamp(16px, 3.5vw, 52px);
    animation: hp-floatL 0.75s 0.55s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hp-accent-bl {
    bottom: clamp(72px, 14vh, 150px);
    left: clamp(16px, 3.5vw, 52px);
    animation: hp-floatL 0.75s 0.68s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hp-accent-tr {
    top: clamp(90px, 16vh, 178px);
    right: clamp(16px, 3.5vw, 52px);
    animation: hp-floatR 0.75s 0.55s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hp-accent-br {
    bottom: clamp(72px, 14vh, 150px);
    right: clamp(16px, 3.5vw, 52px);
    animation: hp-floatR 0.75s 0.68s cubic-bezier(0.22,1,0.36,1) both;
  }

  @keyframes hp-floatL { from{opacity:0;transform:translateX(-16px) translateY(8px)} to{opacity:1;transform:translateX(0) translateY(0)} }
  @keyframes hp-floatR { from{opacity:0;transform:translateX(16px) translateY(8px)} to{opacity:1;transform:translateX(0) translateY(0)} }

  /* Card internals */
  .hp-acc-tag {
    font-size: clamp(7.5px, 0.65vw, 9px);
    font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase;
    color: var(--gold); margin-bottom: 2px;
  }
  .hp-acc-icon-row { display: flex; align-items: center; gap: 9px; }
  .hp-acc-ico {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .hp-acc-ico.green  { background: rgba(74,222,128,0.13); color: var(--sage); }
  .hp-acc-ico.gold   { background: rgba(212,168,83,0.13);  color: var(--gold); }
  .hp-acc-ico.blue   { background: rgba(147,197,253,0.13); color: #93c5fd; }
  .hp-acc-ico.purple { background: rgba(196,181,253,0.13); color: #c4b5fd; }

  .hp-acc-title {
    font-size: clamp(10px, 0.85vw, 12px);
    font-weight: 700; color: #fff;
    margin-bottom: 2px; line-height: 1.2;
  }
  .hp-acc-sub {
    font-size: clamp(9px, 0.75vw, 11px);
    color: var(--text-muted); line-height: 1.4;
  }

  .hp-acc-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: clamp(8.5px, 0.7vw, 10px);
    line-height: 1.7;
    color: rgba(255,255,255,0.45);
    background: rgba(0,0,0,0.20);
    border-radius: 7px; padding: 8px 10px;
    border: 1px solid rgba(255,255,255,0.07);
  }
  .hp-acc-code .kw  { color: #93c5fd; }
  .hp-acc-code .str { color: var(--sage); }
  .hp-acc-code .cmt { color: rgba(255,255,255,0.28); }

  .hp-acc-status {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 9px; border-radius: 100px;
    font-size: clamp(8.5px, 0.72vw, 10px);
    font-weight: 600; width: fit-content;
  }
  .hp-acc-status.ok     { background: rgba(74,222,128,0.12); color: var(--sage); }
  .hp-acc-status.review { background: rgba(212,168,83,0.14);  color: var(--gold-lt); }
  .hp-acc-status-dot { width: 4px; height: 4px; border-radius: 50%; background: currentColor; }

  /* ─── Hero ─── */
  .hp-hero {
    /* Cobre todo o viewport — centralização real, independente da navbar */
    position: absolute; inset: 0;
    z-index: 5;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    padding: 0 clamp(24px, 8vw, 120px);
    pointer-events: none; /* deixa navbar e accents clicáveis */
  }
  /* Reabilita pointer nos elementos interativos dentro do hero */
  .hp-hero .hp-ctas,
  .hp-hero .hp-cta-primary,
  .hp-hero .hp-cta-secondary { pointer-events: auto; }

  .hp-eyebrow {
    display: inline-flex; align-items: center; gap: 9px;
    font-size: clamp(9px, 0.8vw, 11px);
    font-weight: 600;
    letter-spacing: 2.8px; text-transform: uppercase;
    color: var(--gold); margin-bottom: 20px;
    animation: hp-up 0.65s 0.28s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hp-eyebrow-line { width: 22px; height: 1.5px; background: var(--gold); border-radius: 2px; opacity: 0.8; }

  .hp-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(38px, 7vw, 88px);
    font-weight: 900; color: #fff;
    line-height: 1.06; letter-spacing: -0.5px;
    margin-bottom: 22px; max-width: 780px;
    animation: hp-up 0.65s 0.38s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hp-title em { font-style: italic; color: var(--gold-lt); }

  .hp-sub {
    font-size: clamp(13px, 1.5vw, 17px);
    color: var(--text-soft); line-height: 1.8;
    max-width: 420px; margin: 0 auto 40px;
    animation: hp-up 0.65s 0.46s cubic-bezier(0.22,1,0.36,1) both;
  }

  @keyframes hp-up { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }

  /* ─── CTAs ─── */
  .hp-ctas {
    display: flex; align-items: center; gap: 12px;
    flex-wrap: wrap; justify-content: center;
    animation: hp-up 0.65s 0.54s cubic-bezier(0.22,1,0.36,1) both;
  }

  .hp-cta-primary {
    display: flex; align-items: center; gap: 9px;
    padding: 15px 34px;
    background: #fff;
    color: #000; border: 1px solid rgba(255,255,255,0.13);
    border-radius: 11px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(13px, 1.2vw, 16px);
    font-weight: 700;
    cursor: pointer; transition: all 0.22s;
    box-shadow: 0 4px 22px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.10);
    -webkit-tap-highlight-color: transparent; white-space: nowrap;
  }
  .hp-cta-primary:hover {
    background: linear-gradient(135deg, #1a7a3e 0%, #166534 100%);
    transform: translateY(-2px);
    box-shadow: 0 10px 32px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.13);
  }
  .hp-cta-primary:active { transform: translateY(0); }
  .hp-cta-arrow { transition: transform 0.22s; }
  .hp-cta-primary:hover .hp-cta-arrow { transform: translateX(4px); }

  .hp-cta-secondary {
    display: flex; align-items: center; gap: 8px;
    padding: 14px 28px;
    background: rgba(255,255,255,0.055);
    color: rgba(255,255,255,0.72);
    border: 1.5px solid rgba(255,255,255,0.13);
    border-radius: 11px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(13px, 1.2vw, 16px);
    font-weight: 500;
    cursor: pointer; transition: all 0.22s;
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    -webkit-tap-highlight-color: transparent; white-space: nowrap;
  }
  .hp-cta-secondary:hover {
    background: rgba(255,255,255,0.10); color: #fff;
    border-color: rgba(255,255,255,0.22); transform: translateY(-2px);
  }
  .hp-cta-secondary:active { transform: translateY(0); }

  /* ─── Pills ─── */
  .hp-pills {
    position: absolute; bottom: 20px;
    left: 50%; transform: translateX(-50%);
    display: flex; gap: 7px; flex-wrap: wrap; justify-content: center;
    z-index: 5;
    animation: hp-up 0.65s 0.62s cubic-bezier(0.22,1,0.36,1) both;
    /* Não empurra o hero: é absolute sobre o layout */
  }
  .hp-pill {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 14px; border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(6px);
    font-size: clamp(9px, 0.8vw, 11px);
    letter-spacing: 0.3px;
    color: rgba(255,255,255,0.42);
  }
  .hp-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--sage); flex-shrink: 0; }

  /* ─── Responsivo ─── */
  @media (max-width: 1024px) {
    .hp-accent { display: none; }
    .hp-hero { padding: 0 clamp(24px, 6vw, 80px); }
  }

  @media (max-width: 768px) {
    .hp-title { font-size: clamp(36px, 9vw, 56px); }
    .hp-sub { font-size: clamp(14px, 3.5vw, 17px); }
    .hp-nav { padding: 20px clamp(16px, 4vw, 32px); }
    .hp-pills { bottom: 16px; gap: 5px; }
  }

  @media (max-width: 640px) {
    .hp-hero { padding: 0 24px; }
    .hp-pills { display: none; }
    .hp-eyebrow { font-size: 11px; letter-spacing: 2.4px; margin-bottom: 18px; }
    .hp-title { font-size: clamp(38px, 11vw, 52px); letter-spacing: -0.2px; margin-bottom: 18px; }
    .hp-sub { font-size: 15px; line-height: 1.7; max-width: 88%; margin-bottom: 32px; }
    .hp-ctas { flex-direction: column; width: 100%; gap: 10px; }
    .hp-cta-primary { width: 100%; justify-content: center; font-size: 16px; padding: 16px 28px; }
    .hp-cta-secondary { width: 100%; justify-content: center; font-size: 15px; padding: 14px 28px; }
    .hp-nav-link { display: none; }
    .hp-nav-btn { padding: 9px 18px; font-size: 14px; }
    .hp-logo { width: clamp(100px, 28vw, 140px); }
  }

  @media (max-width: 400px) {
    .hp-nav { padding: 16px; }
    .hp-title { font-size: 34px; }
    .hp-sub { font-size: 14px; }
    .hp-eyebrow { font-size: 10px; margin-bottom: 14px; }
    .hp-cta-primary { font-size: 15px; padding: 14px 20px; }
    .hp-cta-secondary { font-size: 14px; padding: 13px 20px; }
  }
`;

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <div className="hp-root">

        <div className="hp-grid" />
        <div className="hp-orb-1" />
        <div className="hp-orb-2" />
        <div className="hp-deco">S</div>

        {/* ── Left accents ── */}
        <div className="hp-accent hp-accent-tl">
          <span className="hp-acc-tag">ERS · Documento</span>
          <div className="hp-acc-icon-row">
            <span className="hp-acc-ico green">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M9 12h6M9 16h4M7 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8l-5-5H7z" />
                <path d="M14 3v4a1 1 0 001 1h4" />
              </svg>
            </span>
            <div>
              <p className="hp-acc-title">Especificação<br />de Requisitos</p>
              <p className="hp-acc-sub">IEEE 830 · v2.4</p>
            </div>
          </div>
          <div className="hp-acc-status ok">
            <span className="hp-acc-status-dot" />Baseline aprovada
          </div>
        </div>

        <div className="hp-accent hp-accent-bl">
          <span className="hp-acc-tag">UML · Caso de Uso</span>
          <div className="hp-acc-icon-row">
            <span className="hp-acc-ico blue">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <ellipse cx="12" cy="5" rx="4" ry="2" />
                <path d="M8 5v4c0 1.1 1.79 2 4 2s4-.9 4-2V5" />
                <path d="M4 13c0 1.66 3.58 3 8 3s8-1.34 8-3" />
                <path d="M4 13v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" />
              </svg>
            </span>
            <div>
              <p className="hp-acc-title">Diagrama<br />de Atores</p>
              <p className="hp-acc-sub">4 perfis mapeados</p>
            </div>
          </div>
          <div className="hp-acc-status review">
            <span className="hp-acc-status-dot" />Em revisão
          </div>
        </div>

        {/* ── Right accents ── */}
        <div className="hp-accent hp-accent-tr">
          <span className="hp-acc-tag">Rastreabilidade</span>
          <div className="hp-acc-icon-row">
            <span className="hp-acc-ico purple">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M10 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2v-4" />
                <path d="M14 3h7v7" />
                <path d="M21 3L9 15" />
              </svg>
            </span>
            <div>
              <p className="hp-acc-title">Matriz RF → TC</p>
              <p className="hp-acc-sub">100% cobertos</p>
            </div>
          </div>
          <div className="hp-acc-code">
            <span className="kw">RF</span>-012 <span className="str">→</span> TC-047<br />
            <span className="kw">RF</span>-013 <span className="str">→</span> TC-048<br />
            <span className="cmt">// 2 pendentes</span>
          </div>
        </div>

        <div className="hp-accent hp-accent-br">
          <span className="hp-acc-tag">Engenharia</span>
          <div className="hp-acc-icon-row">
            <span className="hp-acc-ico gold">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
                <line x1="14" y1="4" x2="10" y2="20" />
              </svg>
            </span>
            <div>
              <p className="hp-acc-title">Critérios<br />de Aceite</p>
              <p className="hp-acc-sub">Gherkin · Given-When-Then</p>
            </div>
          </div>
          <div className="hp-acc-status ok">
            <span className="hp-acc-status-dot" />Sprint 4 — fechado
          </div>
        </div>

        {/* Navbar */}
        <nav className="hp-nav">
          <img src="./src/assets/scopeplan.png" alt="ScopePlan" className="hp-logo" />
          <div className="hp-nav-right">
            <button className="hp-nav-link" onClick={() => navigate("/login")}>Entrar</button>
            <button className="hp-nav-btn" onClick={() => navigate("/cadastro")}>Criar conta</button>
          </div>
        </nav>

        {/* Hero */}
        <section className="hp-hero">
          <span className="hp-eyebrow">
            <span className="hp-eyebrow-line" />
            Gestão de requisitos
            <span className="hp-eyebrow-line" />
          </span>

          <h1 className="hp-title">
            Chega de escopo<br />virando <em>caos</em>
          </h1>

          <p className="hp-sub">
            Centralize requisitos, alinhe sua equipe e entregue
            com a clareza que cada projeto exige.
          </p>

          <div className="hp-ctas">
            <button className="hp-cta-primary" onClick={() => navigate("/cadastro")}>
              Comece agora, é gratuito
              <svg className="hp-cta-arrow" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <button className="hp-cta-secondary" onClick={() => navigate("/login")}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Já tenho conta
            </button>
          </div>
        </section>

        {/* Pills */}
        <div className="hp-pills">
          <span className="hp-pill"><span className="hp-dot" />Requisitos</span>
          <span className="hp-pill"><span className="hp-dot" />Aprovações</span>
          <span className="hp-pill"><span className="hp-dot" />Auditoria</span>
          <span className="hp-pill"><span className="hp-dot" />Sprints</span>
          <span className="hp-pill"><span className="hp-dot" />Rastreabilidade</span>
        </div>

      </div>
    </>
  );
}