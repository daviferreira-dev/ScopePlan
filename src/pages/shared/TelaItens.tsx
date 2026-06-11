import { useState, useEffect } from 'react';
import { requirementsApi } from '../../services/api';
import type { RequirementData, ProjectData } from '../../services/api';
import AppLayout from '../../components/AppLayout';
import { REQUIREMENT_TOPICS, type RequirementTopic } from '../../utils/constants';

const pageStyles = `
.topics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
}
.topic-card {
  background: #fff;
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 22px 22px 18px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.18s, border-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 110px;
  position: relative;
  overflow: hidden;
}
.topic-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2.5px;
  background: linear-gradient(90deg, var(--green-bright), var(--green-light));
  border-radius: 14px 14px 0 0;
  opacity: 0;
  transition: opacity 0.2s;
}
.topic-card:hover {
  box-shadow: 0 8px 28px rgba(26,102,52,0.12);
  transform: translateY(-2px);
  border-color: rgba(52,196,90,0.22);
}
.topic-card:hover::before { opacity: 1; }
.topic-card-top {
  display: flex; align-items: flex-start; gap: 12px; margin-bottom: auto;
}
.topic-icon {
  width: 34px; height: 34px; border-radius: 9px;
  background: var(--progress-bg);
  display: flex; align-items: center; justify-content: center;
  color: var(--green-mid); flex-shrink: 0;
}
.topic-name {
  font-size: 14px; font-weight: 600; color: var(--text-primary);
  line-height: 1.35; padding-top: 7px; font-family: 'Sora', sans-serif;
}
.topic-count {
  font-size: 11.5px; color: var(--text-muted); margin-top: 14px;
  font-weight: 500; letter-spacing: 0.2px;
}
@media (max-width: 768px) {
  .topics-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important; gap: 14px; }
  .topic-card { padding: 16px 14px; }
}
@media (max-width: 480px) {
  .topics-grid { grid-template-columns: 1fr !important; }
  .topic-card { padding: 14px 12px; }
}
`;

interface Topic extends RequirementTopic {
  count: number;
}

interface Props {
  project: ProjectData;
  onBack: () => void;
  perfil: 'analista' | 'cliente' | 'gestor' | 'desenvolvedor';
  onTopicSelect: (topic: Topic, requirements: RequirementData[]) => void;
  onDownload: () => void;
  onAuditPage?: () => void;
}

const BASE_TOPICS = REQUIREMENT_TOPICS;

export default function TelaItens({ project, onBack, perfil, onTopicSelect, onDownload, onAuditPage }: Props) {
  const [requirements, setRequirements] = useState<RequirementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<'projetos' | 'auditoria'>('projetos');

  useEffect(() => {
    fetchRequirements();
  }, [project.id]);

  async function fetchRequirements() {
    try {
      setLoading(true);
      setError(null);
      const response = await requirementsApi.list(project.id);
      setRequirements(response.requisitos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar requisitos');
    } finally {
      setLoading(false);
    }
  }

  const topicsWithCount: Topic[] = BASE_TOPICS.map(t => ({
    ...t,
    count: requirements.filter(r => r.tipo === t.type).length,
  }));

  const topbarTitle = project.nome;
  const topbarSubtitle = activePage === 'auditoria' ? 'Trilha de Auditoria' : 'Índice de Especificação';

  return (
    <>
      <style>{pageStyles}</style>
      <AppLayout
        perfil={perfil}
        activePage={activePage}
        onPageChange={(p) => {
          setActivePage(p as 'projetos' | 'auditoria');
          if (p === 'projetos') {
            onBack();
          }
          if (p === 'auditoria' && onAuditPage) {
            onAuditPage();
          }
        }}
        topbarTitle={topbarTitle}
        topbarSubtitle={topbarSubtitle}
        topbarActions={activePage === 'projetos' ? (
          <button className="btn-download" onClick={onDownload}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Baixar ERS
          </button>
        ) : undefined}
      >
        {activePage === 'auditoria' ? (
          onAuditPage ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Página de auditoria indisponível neste contexto.</p> : null
        ) : (
          <>
            {loading ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="empty-title">Carregando requisitos...</div>
              </div>
            ) : error ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="empty-title">Erro ao carregar requisitos</div>
                <div className="empty-subtitle">{error}</div>
              </div>
            ) : (
              <div className="topics-grid">
                {topicsWithCount.map((t) => (
                  <div className="topic-card" key={t.id} onClick={() => onTopicSelect(t, requirements)}>
                    <div className="topic-card-top">
                      <div className="topic-icon">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                      <div className="topic-name">{t.name}</div>
                    </div>
                    <div className="topic-count">
                      {t.count === 0 ? '0 requisitos' : t.count === 1 ? '1 requisito' : `${t.count} requisitos`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </AppLayout>
    </>
  );
}
