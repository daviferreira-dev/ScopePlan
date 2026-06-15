import { useState, useEffect, useRef } from 'react';
import { visaoGeralApi, type VisaoGeralData } from '../services/api';
import type { Perfil } from '../utils/constants';
import styles from './VisaoGeral.module.css';

interface Props {
  projectId: number;
  perfil: Perfil;
}

const CAMPOS: { key: keyof VisaoGeralData; sigla: string; titulo: string; cor: string; descricao: string }[] = [
  { key: 'o_que',   sigla: 'WHAT',  titulo: 'O quê?',       cor: '#1a6634', descricao: 'O que será desenvolvido ou entregue neste projeto?' },
  { key: 'por_que', sigla: 'WHY',   titulo: 'Por quê?',     cor: '#2563eb', descricao: 'Qual a justificativa ou necessidade que motivou este projeto?' },
  { key: 'quem',    sigla: 'WHO',   titulo: 'Quem?',        cor: '#7c3aed', descricao: 'Quem são os responsáveis e stakeholders envolvidos?' },
  { key: 'onde',    sigla: 'WHERE', titulo: 'Onde?',        cor: '#0891b2', descricao: 'Onde o projeto será executado ou implantado?' },
  { key: 'quando',  sigla: 'WHEN',  titulo: 'Quando?',      cor: '#d97706', descricao: 'Qual o prazo ou cronograma previsto para execução?' },
  { key: 'como',    sigla: 'HOW',   titulo: 'Como?',        cor: '#be123c', descricao: 'Como o projeto será executado? Quais métodos e recursos?' },
  { key: 'quanto',  sigla: 'HOW $', titulo: 'Quanto custa?', cor: '#15803d', descricao: 'Qual o custo estimado ou orçamento disponível?' },
];

export default function VisaoGeral({ projectId, perfil }: Props) {
  const canEdit = perfil === 'analista' || perfil === 'gestor';

  const [data, setData] = useState<VisaoGeralData>({});
  const [editing, setEditing] = useState<keyof VisaoGeralData | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    visaoGeralApi.get(projectId, { signal: ctrl.signal })
      .then(r => { if (r.visao_geral) setData(r.visao_geral); })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [projectId]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editing]);

  const startEdit = (key: keyof VisaoGeralData) => {
    if (!canEdit) return;
    setDraft((data[key] as string) || '');
    setEditing(key);
  };

  const cancelEdit = () => { setEditing(null); setDraft(''); setSaveError(null); };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await visaoGeralApi.save(projectId, { [editing]: draft.trim() || null });
      setData(res.visao_geral);
      setEditing(null);
      setDraft('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') cancelEdit();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit();
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Carregando visão geral…</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>5W2H — Visão Geral do Projeto</h2>
          <p className={styles.subtitle}>Metodologia de planejamento que estrutura o projeto em 7 dimensões essenciais.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {CAMPOS.map(({ key, sigla, titulo, cor, descricao }) => {
          const value = (data[key] as string) || '';
          const isEditing = editing === key;

          return (
            <div
              key={key}
              className={`${styles.card} ${isEditing ? styles.cardEditing : ''} ${canEdit && !isEditing ? styles.cardClickable : ''}`}
              style={{ '--card-accent': cor } as React.CSSProperties}
              onClick={() => !isEditing && startEdit(key)}
            >
              <div className={styles.cardTop}>
                <span className={styles.sigla} style={{ background: cor }}>{sigla}</span>
                <span className={styles.cardTitle}>{titulo}</span>
                {canEdit && !isEditing && (
                  <span className={styles.editHint}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar
                  </span>
                )}
              </div>

              <p className={styles.descricao}>{descricao}</p>

              {isEditing ? (
                <div className={styles.editArea} onClick={e => e.stopPropagation()}>
                  <textarea
                    ref={textareaRef}
                    className={styles.textarea}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Descreva ${titulo.toLowerCase()}…`}
                    rows={4}
                  />
                  {saveError && (
                    <div className={styles.saveError}>{saveError}</div>
                  )}
                  <div className={styles.editActions}>
                    <span className={styles.hint}>Ctrl+Enter para salvar · Esc para cancelar</span>
                    <button className={styles.btnCancel} onClick={cancelEdit} disabled={saving}>Cancelar</button>
                    <button className={styles.btnSave} onClick={saveEdit} disabled={saving}>
                      {saving ? 'Salvando…' : 'Salvar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`${styles.content} ${!value ? styles.contentEmpty : ''}`}>
                  {value || (canEdit ? 'Clique para preencher…' : 'Não preenchido.')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
