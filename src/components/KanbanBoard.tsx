import { useState } from 'react';
import type { RequirementData } from '../services/api';
import styles from './KanbanBoard.module.css';

const COLUMNS = [
  { key: 'rascunho',               label: 'Rascunho',      color: '#94a3b8' },
  { key: 'em_revisao',             label: 'Em Revisão',    color: '#3b82f6' },
  { key: 'aprovado',               label: 'Aprovado',      color: '#22c55e' },
  { key: 'aprovado_com_ressalvas', label: 'Com Ressalvas', color: '#f59e0b' },
  { key: 'rejeitado',              label: 'Rejeitado',     color: '#ef4444' },
] as const;

type KanbanStatus = typeof COLUMNS[number]['key'];

const TYPE_LABEL: Record<string, string> = {
  funcional:     'RF',
  nao_funcional: 'RNF',
  negocio:       'RN',
  restricao:     'REST',
};

interface Props {
  requirements: RequirementData[];
  canEdit: boolean;
  onCardClick: (req: RequirementData) => void;
  onStatusChange: (id: number, oldStatus: string, newStatus: string) => void;
}

export default function KanbanBoard({ requirements, canEdit, onCardClick, onStatusChange }: Props) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<KanbanStatus | null>(null);
  const [mobileCol, setMobileCol] = useState<KanbanStatus>('rascunho');
  const [moveMenuId, setMoveMenuId] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, req: RequirementData) => {
    setDraggingId(req.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => { setDraggingId(null); setOverCol(null); };

  const handleDrop = (e: React.DragEvent, target: KanbanStatus) => {
    e.preventDefault();
    setOverCol(null);
    if (draggingId === null) return;
    const req = requirements.find(r => r.id === draggingId);
    if (!req || req.status === target) { setDraggingId(null); return; }
    onStatusChange(draggingId, req.status, target);
    setDraggingId(null);
  };

  const handleMove = (req: RequirementData, target: KanbanStatus) => {
    if (req.status === target) return;
    onStatusChange(req.id, req.status, target);
    setMoveMenuId(null);
  };

  const renderCard = (req: RequirementData, mobile = false) => (
    <div
      key={req.id}
      className={`${styles.card}${draggingId === req.id ? ` ${styles.dragging}` : ''}`}
      draggable={canEdit && !mobile}
      onDragStart={e => handleDragStart(e, req)}
      onDragEnd={handleDragEnd}
      onClick={() => { if (moveMenuId !== req.id) onCardClick(req); }}
    >
      {req.codigo && <span className={styles.code}>{req.codigo}</span>}
      <p className={styles.title}>{req.titulo || req.descricao || '—'}</p>
      <div className={styles.meta}>
        <span className={styles.type}>{TYPE_LABEL[req.tipo] ?? req.tipo}</span>
        {req.autor && <span className={styles.author}>{req.autor.nome}</span>}
      </div>

      {/* Mobile move button */}
      {mobile && canEdit && (
        <div className={styles.moveWrap} onClick={e => e.stopPropagation()}>
          <button
            className={styles.moveBtn}
            onClick={() => setMoveMenuId(moveMenuId === req.id ? null : req.id)}
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            Mover para
          </button>
          {moveMenuId === req.id && (
            <div className={styles.moveMenu}>
              {COLUMNS.filter(c => c.key !== req.status).map(c => (
                <button
                  key={c.key}
                  className={styles.moveOption}
                  style={{ '--mc': c.color } as React.CSSProperties}
                  onClick={() => handleMove(req, c.key)}
                >
                  <span className={styles.moveDot} />
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop layout ── */}
      <div className={styles.board}>
        {COLUMNS.map(col => {
          const cards = requirements.filter(r => r.status === col.key);
          return (
            <div
              key={col.key}
              className={`${styles.col}${overCol === col.key ? ` ${styles.colOver}` : ''}`}
              onDragOver={e => { e.preventDefault(); setOverCol(col.key); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null); }}
              onDrop={e => handleDrop(e, col.key)}
            >
              <div className={styles.colHead} style={{ '--c': col.color } as React.CSSProperties}>
                <span className={styles.dot} />
                <span className={styles.colLabel}>{col.label}</span>
                <span className={styles.badge}>{cards.length}</span>
              </div>
              <div className={styles.cards}>
                {cards.map(req => renderCard(req, false))}
                {cards.length === 0 && <p className={styles.empty}>Nenhum requisito</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mobile layout ── */}
      <div className={styles.mobileboard}>
        {/* Column tabs */}
        <div className={styles.mobiletabs}>
          {COLUMNS.map(col => {
            const count = requirements.filter(r => r.status === col.key).length;
            return (
              <button
                key={col.key}
                className={`${styles.mobiletab}${mobileCol === col.key ? ` ${styles.mobiletabActive}` : ''}`}
                style={{ '--c': col.color } as React.CSSProperties}
                onClick={() => setMobileCol(col.key)}
              >
                <span className={styles.mobiledot} />
                <span className={styles.mobiletabLabel}>{col.label}</span>
                {count > 0 && <span className={styles.mobilebadge}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Active column cards */}
        {(() => {
          const col = COLUMNS.find(c => c.key === mobileCol)!;
          const cards = requirements.filter(r => r.status === col.key);
          return (
            <div className={styles.mobilecards}>
              {cards.map(req => renderCard(req, true))}
              {cards.length === 0 && (
                <div className={styles.mobileempty}>
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3} opacity={0.35}>
                    <rect x="3" y="3" width="5" height="18" rx="1.5"/><rect x="10" y="3" width="5" height="12" rx="1.5"/><rect x="17" y="3" width="5" height="15" rx="1.5"/>
                  </svg>
                  <span>Nenhum requisito nesta coluna</span>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </>
  );
}
