import { useNavigate } from "react-router-dom";
import styles from './Home.module.css';

export default function HomePage() {
	const navigate = useNavigate();

	return (
		<div className={styles['hp-root']}>

			<div className={styles['hp-grid']} />
			<div className={styles['hp-orb-1']} />
			<div className={styles['hp-orb-2']} />
			<div className={styles['hp-deco']}>S</div>

			{/* ── Left accents ── */}
			<div className={`${styles['hp-accent']} ${styles['hp-accent-tl']}`}>
				<span className={styles['hp-acc-tag']}>ERS · Documento</span>
				<div className={styles['hp-acc-icon-row']}>
					<span className={`${styles['hp-acc-ico']} ${styles.green}`}>
						<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
							<path d="M9 12h6M9 16h4M7 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8l-5-5H7z" />
							<path d="M14 3v4a1 1 0 001 1h4" />
						</svg>
					</span>
					<div>
						<p className={styles['hp-acc-title']}>Especificação<br />de Requisitos</p>
						<p className={styles['hp-acc-sub']}>IEEE 830 · v2.4</p>
					</div>
				</div>
				<div className={`${styles['hp-acc-status']} ${styles.ok}`}>
					<span className={styles['hp-acc-status-dot']} />Baseline aprovada
				</div>
			</div>

			<div className={`${styles['hp-accent']} ${styles['hp-accent-bl']}`}>
				<span className={styles['hp-acc-tag']}>UML · Caso de Uso</span>
				<div className={styles['hp-acc-icon-row']}>
					<span className={`${styles['hp-acc-ico']} ${styles.blue}`}>
						<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
							<ellipse cx="12" cy="5" rx="4" ry="2" />
							<path d="M8 5v4c0 1.1 1.79 2 4 2s4-.9 4-2V5" />
							<path d="M4 13c0 1.66 3.58 3 8 3s8-1.34 8-3" />
							<path d="M4 13v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" />
						</svg>
					</span>
					<div>
						<p className={styles['hp-acc-title']}>Diagrama<br />de Atores</p>
						<p className={styles['hp-acc-sub']}>4 perfis mapeados</p>
					</div>
				</div>
				<div className={`${styles['hp-acc-status']} ${styles.review}`}>
					<span className={styles['hp-acc-status-dot']} />Em revisão
				</div>
			</div>

			{/* ── Right accents ── */}
			<div className={`${styles['hp-accent']} ${styles['hp-accent-tr']}`}>
				<span className={styles['hp-acc-tag']}>Rastreabilidade</span>
				<div className={styles['hp-acc-icon-row']}>
					<span className={`${styles['hp-acc-ico']} ${styles.purple}`}>
						<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
							<path d="M10 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2v-4" />
							<path d="M14 3h7v7" />
							<path d="M21 3L9 15" />
						</svg>
					</span>
					<div>
						<p className={styles['hp-acc-title']}>Matriz RF → TC</p>
						<p className={styles['hp-acc-sub']}>100% cobertos</p>
					</div>
				</div>
				<div className={styles['hp-acc-code']}>
					<span className={styles.kw}>RF</span>-012 <span className={styles.str}>→</span> TC-047<br />
					<span className={styles.kw}>RF</span>-013 <span className={styles.str}>→</span> TC-048<br />
					<span className={styles.cmt}>// 2 pendentes</span>
				</div>
			</div>

			<div className={`${styles['hp-accent']} ${styles['hp-accent-br']}`}>
				<span className={styles['hp-acc-tag']}>Engenharia</span>
				<div className={styles['hp-acc-icon-row']}>
					<span className={`${styles['hp-acc-ico']} ${styles.gold}`}>
						<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
							<polyline points="16 18 22 12 16 6" />
							<polyline points="8 6 2 12 8 18" />
							<line x1="14" y1="4" x2="10" y2="20" />
						</svg>
					</span>
					<div>
						<p className={styles['hp-acc-title']}>Critérios<br />de Aceite</p>
						<p className={styles['hp-acc-sub']}>Gherkin · Given-When-Then</p>
					</div>
				</div>
				<div className={`${styles['hp-acc-status']} ${styles.ok}`}>
					<span className={styles['hp-acc-status-dot']} />Sprint 4 — fechado
				</div>
			</div>

			{/* Navbar */}
			<nav className={styles['hp-nav']}>
				<img src={new URL('../assets/scopeplan.png', import.meta.url).href} alt="ScopePlan" className={styles['hp-logo']} />
				<div className={styles['hp-nav-right']}>
					<button className={styles['hp-nav-link']} onClick={() => navigate("/login")}>Entrar</button>
					<button className={styles['hp-nav-btn']} onClick={() => navigate("/cadastro")}>Criar conta</button>
				</div>
			</nav>

			{/* Hero */}
			<section className={styles['hp-hero']}>
				<span className={styles['hp-eyebrow']}>
					<span className={styles['hp-eyebrow-line']} />
					Gestão de requisitos
					<span className={styles['hp-eyebrow-line']} />
				</span>

				<h1 className={styles['hp-title']}>
					Chega de escopo<br />virando <em>caos</em>
				</h1>

				<p className={styles['hp-sub']}>
					Centralize requisitos, alinhe sua equipe e entregue
					com a clareza que cada projeto exige.
				</p>

				<div className={styles['hp-ctas']}>
					<button className={styles['hp-cta-primary']} onClick={() => navigate("/cadastro")}>
						Comece agora, é gratuito
						<svg className={styles['hp-cta-arrow']} width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
							<path d="M5 12h14M13 6l6 6-6 6" />
						</svg>
					</button>
					<button className={styles['hp-cta-secondary']} onClick={() => navigate("/login")}>
						<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
						</svg>
						Já tenho conta
					</button>
				</div>
			</section>

			{/* Pills */}
			<div className={styles['hp-pills']}>
				<span className={styles['hp-pill']}><span className={styles['hp-dot']} />Requisitos</span>
				<span className={styles['hp-pill']}><span className={styles['hp-dot']} />Aprovações</span>
				<span className={styles['hp-pill']}><span className={styles['hp-dot']} />Auditoria</span>
				<span className={styles['hp-pill']}><span className={styles['hp-dot']} />Sprints</span>
				<span className={styles['hp-pill']}><span className={styles['hp-dot']} />Rastreabilidade</span>
			</div>

		</div>
	);
}
