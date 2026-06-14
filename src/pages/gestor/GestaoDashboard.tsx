import { useEffect, useMemo, useState } from 'react';
import { projectsApi, type ProjectData, type ProjectMetrics } from '../../services/api';
import { calculateProgress, formatRelativeTime } from '../../utils/helpers';

interface Props {
  onOpenProject?: (project: ProjectData) => void;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  aprovado: { label: 'Aprovado', color: '#16a34a' },
  aprovado_com_ressalvas: { label: 'Aprovado c/ Ressalvas', color: '#65a30d' },
  em_revisao: { label: 'Em Revisão', color: '#3b82f6' },
  em_analise: { label: 'Em Análise', color: '#6366f1' },
  rejeitado: { label: 'Rejeitado', color: '#dc2626' },
  pendente: { label: 'Pendente', color: '#f59e0b' },
  rascunho: { label: 'Rascunho', color: '#6b7280' },
  implementado: { label: 'Implementado', color: '#0ea5e9' },
};

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  critica: { label: 'Crítica', color: '#dc2626' },
  alta: { label: 'Alta', color: '#eab308' },
  media: { label: 'Média', color: '#3b82f6' },
  baixa: { label: 'Baixa', color: '#6b7280' },
  indefinida: { label: 'Indefinida', color: '#94a3b8' },
};

const TIPO_LABELS: Record<string, string> = {
  funcional: 'Funcional',
  nao_funcional: 'Não Funcional',
  negocio: 'Regra de Negócio',
  restricao: 'Restrição',
  indefinido: 'Indefinido',
};

const EMPTY_METRICS: ProjectMetrics = {
  total: 0, aprovados: 0, taxa_aprovacao: 0,
  por_status: {}, por_tipo: {}, por_prioridade: {}, por_categoria: {},
  evolucao_semanal: [],
  tempo_medio_aprovacao_horas: null, aprovacao_amostras: 0,
};

// Formata uma duração em horas para algo legível (min / h / dias)
function formatDuracao(horas: number | null): string {
  if (horas == null) return '—';
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  if (horas < 48) return `${horas % 1 === 0 ? horas : horas.toFixed(1)} h`;
  return `${(horas / 24).toFixed(1)} dias`;
}

function mergeCounts(target: Record<string, number>, src: Record<string, number>) {
  for (const [k, v] of Object.entries(src)) target[k] = (target[k] || 0) + v;
  return target;
}

function aggregateMetrics(list: ProjectMetrics[]): ProjectMetrics {
  if (list.length === 0) return EMPTY_METRICS;
  const acc: ProjectMetrics = {
    total: 0, aprovados: 0, taxa_aprovacao: 0,
    por_status: {}, por_tipo: {}, por_prioridade: {}, por_categoria: {},
    evolucao_semanal: [],
    tempo_medio_aprovacao_horas: null, aprovacao_amostras: 0,
  };
  const semanas: Record<string, number> = {};
  let somaHoras = 0;
  let amostras = 0;
  for (const m of list) {
    acc.total += m.total;
    acc.aprovados += m.aprovados;
    mergeCounts(acc.por_status, m.por_status);
    mergeCounts(acc.por_tipo, m.por_tipo);
    mergeCounts(acc.por_prioridade, m.por_prioridade);
    mergeCounts(acc.por_categoria, m.por_categoria);
    for (const e of m.evolucao_semanal) semanas[e.semana] = (semanas[e.semana] || 0) + e.total;
    // Média global ponderada pelo nº de requisitos aprovados de cada projeto
    if (m.tempo_medio_aprovacao_horas != null && m.aprovacao_amostras > 0) {
      somaHoras += m.tempo_medio_aprovacao_horas * m.aprovacao_amostras;
      amostras += m.aprovacao_amostras;
    }
  }
  acc.taxa_aprovacao = acc.total ? Math.round((acc.aprovados / acc.total) * 1000) / 10 : 0;
  acc.evolucao_semanal = Object.keys(semanas).sort().map(s => ({ semana: s, total: semanas[s] }));
  acc.aprovacao_amostras = amostras;
  acc.tempo_medio_aprovacao_horas = amostras ? Math.round((somaHoras / amostras) * 10) / 10 : null;
  return acc;
}

// ── Bloco de barras de distribuição ──────────────────────────────────────────
function DistributionBars({ title, data, meta, labels }: {
  title: string;
  data: Record<string, number>;
  meta?: Record<string, { label: string; color: string }>;
  labels?: Record<string, string>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>{title}</div>
      {entries.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Sem dados.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          {entries.map(([key, value]) => {
            const color = meta?.[key]?.color || '#1a6634';
            const label = meta?.[key]?.label || labels?.[key] || key;
            const pct = total ? Math.round((value / total) * 100) : 0;
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4, color: 'var(--text-primary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
                    {label}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{value} · {pct}%</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .3s' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
  borderRadius: 14, padding: '18px 20px',
};
const cardTitleStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
  fontFamily: 'Sora, sans-serif', marginBottom: 6,
};

function KpiCard({ label, value, accent, hint }: { label: string; value: string | number; accent?: string; hint?: string }) {
  return (
    <div style={{ ...cardStyle, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Sora, sans-serif', color: accent || 'var(--text-primary)', marginTop: 4, lineHeight: 1.1 }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export default function GestaoDashboard({ onOpenProject }: Props) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [metricsById, setMetricsById] = useState<Record<number, ProjectMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<'geral' | number>('geral');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const resp = await projectsApi.list(1, 100, undefined, undefined, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setProjects(resp.projetos);

        const results = await Promise.allSettled(
          resp.projetos.map(p => projectsApi.metrics(p.id, { signal: controller.signal }))
        );
        if (controller.signal.aborted) return;
        const map: Record<number, ProjectMetrics> = {};
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') map[resp.projetos[i].id] = r.value;
        });
        setMetricsById(map);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados de gestão');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const metrics = useMemo(() => {
    if (selected === 'geral') return aggregateMetrics(Object.values(metricsById));
    return metricsById[selected] || EMPTY_METRICS;
  }, [selected, metricsById]);

  const selectedProject = selected === 'geral' ? null : projects.find(p => p.id === selected) || null;

  const emRevisao = metrics.por_status['em_revisao'] || 0;
  const rejeitados = metrics.por_status['rejeitado'] || 0;
  const maxEvol = Math.max(1, ...metrics.evolucao_semanal.map(e => e.total));

  if (loading) {
    return <div className="empty-state"><div className="empty-title" style={{ color: 'var(--text-muted)', fontFamily: 'Sora,sans-serif', fontWeight: 500, fontSize: 14 }}>Carregando dados de gestão…</div></div>;
  }
  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-title">Erro ao carregar gestão</div>
        <div className="empty-subtitle">{error}</div>
      </div>
    );
  }
  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-title">Nenhum projeto para gerir</div>
        <div className="empty-subtitle">Crie um projeto para visualizar os dados de gestão.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Seletor: Geral ou projeto específico */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Escopo</label>
        <select
          value={String(selected)}
          onChange={e => setSelected(e.target.value === 'geral' ? 'geral' : Number(e.target.value))}
          style={{
            padding: '9px 14px', borderRadius: 10, border: '1px solid var(--card-border)',
            background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: 13.5,
            fontFamily: 'Sora, sans-serif', fontWeight: 600, cursor: 'pointer', minWidth: 260,
          }}
        >
          <option value="geral">📊 Geral — todos os projetos ({projects.length})</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
        {selectedProject && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Cliente: <strong style={{ color: 'var(--green-mid)' }}>{selectedProject.nome_cliente || '—'}</strong>
            {selectedProject.atualizado_em && <> · Atualizado {formatRelativeTime(selectedProject.atualizado_em)}</>}
          </span>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
        {selected === 'geral' && <KpiCard label="Projetos" value={projects.length} accent="var(--green-mid)" />}
        <KpiCard label="Requisitos" value={metrics.total} />
        <KpiCard label="Aprovados" value={metrics.aprovados} accent="#16a34a" />
        <KpiCard label="Taxa de Aprovação" value={`${metrics.taxa_aprovacao}%`} accent="#1a6634" />
        <KpiCard
          label="Tempo Médio p/ Aprovação"
          value={formatDuracao(metrics.tempo_medio_aprovacao_horas)}
          accent="#0ea5e9"
          hint={metrics.aprovacao_amostras > 0 ? `Baseado em ${metrics.aprovacao_amostras} requisito(s)` : 'Sem aprovações ainda'}
        />
        <KpiCard label="Em Revisão" value={emRevisao} accent="#3b82f6" />
        <KpiCard label="Rejeitados" value={rejeitados} accent="#dc2626" />
      </div>

      {/* Distribuições */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <DistributionBars title="Por Status" data={metrics.por_status} meta={STATUS_META} />
        <DistributionBars title="Por Prioridade" data={metrics.por_prioridade} meta={PRIORITY_META} />
        <DistributionBars title="Por Tipo" data={metrics.por_tipo} labels={TIPO_LABELS} />
      </div>

      {/* Evolução semanal */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>Evolução — requisitos criados (últimas 8 semanas)</div>
        {metrics.evolucao_semanal.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Sem dados.</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130, marginTop: 12 }}>
            {metrics.evolucao_semanal.map(e => {
              const h = Math.round((e.total / maxEvol) * 100);
              const d = new Date(e.semana);
              const lbl = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
              return (
                <div key={e.semana} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{e.total}</span>
                  <div title={`${e.total} requisito(s)`} style={{ width: '100%', maxWidth: 38, height: `${Math.max(h, 3)}%`, background: 'linear-gradient(180deg, #34c45a, #1a6634)', borderRadius: '6px 6px 0 0', minHeight: 3 }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{lbl}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabela por projeto (apenas no modo Geral) */}
      {selected === 'geral' && (
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Detalhamento por Projeto</div>
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={thStyle}>Projeto</th>
                  <th style={thStyle}>Cliente</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Requisitos</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Aprovados</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Em Revisão</th>
                  <th style={{ ...thStyle, width: 160 }}>Progresso</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => {
                  const m = metricsById[p.id];
                  const progress = m ? (m.total ? Math.round((m.aprovados / m.total) * 100) : 0) : calculateProgress(p);
                  const rev = m?.por_status['em_revisao'] || 0;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onOpenProject?.(p)}
                      style={{ borderTop: '1px solid var(--card-border)', cursor: onOpenProject ? 'pointer' : 'default' }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{p.nome}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{p.nome_cliente || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{m?.total ?? p.requisitos_count}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{m?.aprovados ?? p.aprovados_count}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#3b82f6' }}>{rev}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #34c45a, #1a6634)', borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-mid)', minWidth: 34, textAlign: 'right' }}>{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '8px 10px', fontWeight: 700 };
const tdStyle: React.CSSProperties = { padding: '11px 10px', verticalAlign: 'middle' };
