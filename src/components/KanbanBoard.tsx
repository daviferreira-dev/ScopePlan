import { useState } from 'react';
import type { RequirementData } from '../services/api';
import styles from './KanbanBoard.module.css';

const COLUMNS = [
  { key: 'rascunho',               label: 'Rascunho',        color: '#94a3b8' },
  { key: 'em_revisao',             label: 'Em Revisão',      color: '#3b82f6' },
  { key: 'aprovado',               label: 'Aprovado',        color: '#22c55e' },
  { key: 'aprovado_com_ressalvas', label: 'Com Ressalvas',   color: '#f59e0b' },
  { key: 'rejeitado',              label: 'Rejeitado',       color: '#ef4444' },
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

  const handleDragStart = (e: React.DragEvent, req: RequirementData) => {
    setDraggingId(req.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, target: KanbanStatus) => {
    e.preventDefault();
    setOverCol(null);
    if (draggingId === null) return;
    const req = requirements.find(r => r.id === draggingId);
    if (!req || req.status === target) { setDraggingId(null); return; }
    onStatusChange(draggingId, req.status, target);
    setDraggingId(null);
  };

  return (
    <div className={styles.board}>
      {COLUMNS.map(col => {
        const cards = requirements.filter(r => r.status === col.key);
        return (
          <div
            key={col.key}
            className={`${styles.col}${overCol === col.key ? ` ${styles.colOver}` : ''}`}
            onDragOver={e => { e.preventDefault(); setOverCol(col.key); }}
            onDragLeave={e => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null);
            }}
            onDrop={e => handleDrop(e, col.key)}
          >
            <div className={styles.colHead} style={{ '--c': col.color } as React.CSSProperties}>
              <span className={styles.dot} />
              <span className={styles.colLabel}>{col.label}</span>
              <span className={styles.badge}>{cards.length}</span>
            </div>

            <div className={styles.cards}>
              {cards.map(req => (
                <div
                  key={req.id}
                  className={`${styles.card}${draggingId === req.id ? ` ${styles.dragging}` : ''}`}
                  draggable={canEdit}
                  onDragStart={e => handleDragStart(e, req)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onCardClick(req)}
                  title={canEdit ? 'Arraste para mover · Clique para abrir' : 'Clique para abrir'}
                >
                  {req.codigo && <span className={styles.code}>{req.codigo}</span>}
                  <p className={styles.title}>{req.titulo || req.descricao || '—'}</p>
                  <div className={styles.meta}>
                    <span className={styles.type}>{TYPE_LABEL[req.tipo] ?? req.tipo}</span>
                    {req.autor && <span className={styles.author}>{req.autor.nome}</span>}
                  </div>
                </div>
              ))}

              {cards.length === 0 && (
                <p className={styles.empty}>Nenhum requisito</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
