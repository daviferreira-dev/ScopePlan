import { useState, useEffect, useRef } from 'react';
import { projectsApi, type ProjectMetrics } from '../../services/api';
import styles from './Dashboard.module.css';

interface Props {
  projectId: number;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  aprovado: { label: 'Aprovado', color: '#22883f' },
  aprovado_com_ressalvas: { label: 'Aprovado c/ ressalvas', color: '#d4a853' },
  em_revisao: { label: 'Em revisão', color: '#3b82f6' },
  rascunho: { label: 'Rascunho', color: '#9ca3af' },
  rejeitado: { label: 'Rejeitado', color: '#f43f5e' },
};

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  critica: { label: 'Crítica', color: '#f43f5e' },
  alta: { label: 'Alta', color: '#f59e0b' },
  media: { label: 'Média', color: '#3b82f6' },
  baixa: { label: 'Baixa', color: '#9ca3af' },
  indefinida: { label: 'Indefinida', color: '#cbd5e1' },
};

const TYPE_LABELS: Record<string, string> = {
  funcional: 'Funcional',
  nao_funcional: 'Não Funcional',
  negocio: 'Regra de Negócio',
  restricao: 'Restrição',
  indefinido: 'Indefinido',
};

const POLL_MS = 10000; // RF07: atualização em tempo real (máx. 10s)

function fmtWeek(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/** Donut chart (SVG puro) a partir de pares [label, valor, cor]. */
function Donut({ segments, total }: { segments: { color: string; value: number }[]; total: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className={styles.donut}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#eef3ef" strokeWidth="16" />
      {total > 0 && segments.map((s, i) => {
        const len = (s.value / total) * circ;
        const dash = `${len} ${circ - len}`;
        const el = (
          <circle
            key={i}
            cx="70" cy="70" r={r} fill="none"
            stroke={s.color} strokeWidth="16"
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            transform="rotate(-90 70 70)"
          />
        );
        offset += len;
        return el;
      })}
      <text x="70" y="64" textAnchor="middle" className={styles.donutNum}>{total}</text>
      <text x="70" y="84" textAnchor="middle" className={styles.donutLbl}>requisitos</text>
    </svg>
  );
}

/** Barra horizontal proporcional. */
function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.barValue}>{value}</span>
    </div>
  );
}

export default function Dashboard({ projectId }: Props) {
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      try {
        if (firstLoad.current) setLoading(true);
        const data = await projectsApi.metrics(projectId, { signal: controller.signal });
        if (!active) return;
        setMetrics(data);
        setError(null);
        setUpdatedAt(new Date());
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar métricas');
      } finally {
        if (active) { setLoading(false); firstLoad.current = false; }
      }
    }

    load();
    const id = setInterval(load, POLL_MS);
    return () => { active = false; controller.abort(); clearInterval(id); };
  }, [projectId]);

  if (loading) {
    return <div className={styles.empty}>Carregando métricas…</div>;
  }
  if (error || !metrics) {
    return <div className={styles.empty}>{error || 'Sem dados.'}</div>;
  }

  const statusSegments = Object.entries(metrics.por_status)
    .map(([k, v]) => ({ value: v, color: STATUS_META[k]?.color || '#cbd5e1', key: k }))
    .sort((a, b) => b.value - a.value);

  const prioOrder = ['critica', 'alta', 'media', 'baixa', 'indefinida'];
  const prioEntries = Object.entries(metrics.por_prioridade)
    .sort((a, b) => prioOrder.indexOf(a[0]) - prioOrder.indexOf(b[0]));
  const prioMax = Math.max(1, ...prioEntries.map(([, v]) => v));

  const tipoEntries = Object.entries(metrics.por_tipo).sort((a, b) => b[1] - a[1]);
  const tipoMax = Math.max(1, ...tipoEntries.map(([, v]) => v));

  const evoMax = Math.max(1, ...metrics.evolucao_semanal.map(e => e.total));
  const emRevisao = metrics.por_status['em_revisao'] || 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.liveRow}>
        <span className={styles.liveDot} />
        <span className={styles.liveText}>
          Atualização automática a cada 10s
          {updatedAt && ` · ${updatedAt.toLocaleTimeString('pt-BR')}`}
        </span>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Total de requisitos</span>
          <span className={styles.kpiValue}>{metrics.total}</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Aprovados</span>
          <span className={styles.kpiValue} style={{ color: '#22883f' }}>{metrics.aprovados}</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Taxa de aprovação</span>
          <span className={styles.kpiValue}>{metrics.taxa_aprovacao}%</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Em revisão</span>
          <span className={styles.kpiValue} style={{ color: '#3b82f6' }}>{emRevisao}</span>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        {/* Status donut */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Distribuição por status</h3>
          <div className={styles.donutWrap}>
            <Donut segments={statusSegments} total={metrics.total} />
            <ul className={styles.legend}>
              {statusSegments.map(s => (
                <li key={s.key}>
                  <span className={styles.legendDot} style={{ background: s.color }} />
                  {STATUS_META[s.key]?.label || s.key}
                  <strong>{s.value}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Prioridade */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Por prioridade</h3>
          <div className={styles.bars}>
            {prioEntries.map(([k, v]) => (
              <Bar key={k} label={PRIORITY_META[k]?.label || k} value={v} max={prioMax}
                color={PRIORITY_META[k]?.color || '#cbd5e1'} />
            ))}
          </div>
        </div>

        {/* Tipo */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Por tipo</h3>
          <div className={styles.bars}>
            {tipoEntries.map(([k, v]) => (
              <Bar key={k} label={TYPE_LABELS[k] || k} value={v} max={tipoMax} color="#22883f" />
            ))}
          </div>
        </div>

        {/* Evolução semanal */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Criados por semana (8 semanas)</h3>
          <div className={styles.evo}>
            {metrics.evolucao_semanal.map((e) => (
              <div key={e.semana} className={styles.evoCol} title={`${e.total} requisito(s)`}>
                <div className={styles.evoBarWrap}>
                  <div className={styles.evoBar} style={{ height: `${(e.total / evoMax) * 100}%` }}>
                    {e.total > 0 && <span className={styles.evoVal}>{e.total}</span>}
                  </div>
                </div>
                <span className={styles.evoLbl}>{fmtWeek(e.semana)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categorias */}
      {Object.keys(metrics.por_categoria).length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Principais categorias</h3>
          <div className={styles.catGrid}>
            {Object.entries(metrics.por_categoria).map(([cat, v]) => (
              <span key={cat} className={styles.catPill}>{cat}<strong>{v}</strong></span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
