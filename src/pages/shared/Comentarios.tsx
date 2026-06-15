import { useState, useEffect, useCallback } from 'react';
import { commentsApi, type CommentData } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Comentarios.module.css';

interface Props {
  requirementId: number;
}

const MAX_DEPTH = 3;
const EDIT_WINDOW_MS = 15 * 60 * 1000;

interface TreeNode extends CommentData {
  children: TreeNode[];
}

function buildTree(flat: CommentData[]): TreeNode[] {
  const byId = new Map<number, TreeNode>();
  flat.forEach(c => byId.set(c.id, { ...c, children: [] }));
  const roots: TreeNode[] = [];
  byId.forEach(node => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function fmt(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function initials(nome?: string): string {
  if (!nome) return '?';
  const parts = nome.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export default function Comentarios({ requirementId }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [novo, setNovo] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const canModerate = user?.perfil === 'analista' || user?.perfil === 'gestor';

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await commentsApi.list(requirementId, signal ? { signal } : undefined);
      if (signal?.aborted) return;
      setComments(data.comentarios);
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Erro ao carregar comentários');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [requirementId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const addComment = async (texto: string, parentId?: number) => {
    if (!texto.trim()) return;
    setSending(true);
    try {
      await commentsApi.create(requirementId, texto.trim(), parentId);
      await load();
      setNovo('');
      setReplyText('');
      setReplyTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar comentário');
    } finally {
      setSending(false);
    }
  };

  const saveEdit = async (id: number) => {
    if (!editText.trim()) return;
    try {
      await commentsApi.update(id, editText.trim());
      await load();
      setEditId(null);
      setEditText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao editar');
    }
  };

  const hide = async (id: number) => {
    try {
      await commentsApi.hide(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ocultar');
    }
  };

  const renderNode = (node: TreeNode, depth: number) => {
    const isOwn = node.autor_id === user?.id;
    const editable = isOwn && !node.oculto && node.criado_em &&
      (Date.now() - new Date(node.criado_em).getTime() < EDIT_WINDOW_MS);
    const canReply = depth < MAX_DEPTH && !node.oculto;

    return (
      <div key={node.id} className={styles.node} style={{ marginLeft: depth > 0 ? 22 : 0 }}>
        <div className={styles.comment}>
          <div className={styles.avatar}>{initials(node.autor?.nome)}</div>
          <div className={styles.body}>
            <div className={styles.metaLine}>
              <strong>{node.autor?.nome || 'Usuário'}</strong>
              <span className={styles.time}>{fmt(node.criado_em)}</span>
              {node.editado_em && <span className={styles.edited}>(editado)</span>}
            </div>

            {editId === node.id ? (
              <div className={styles.editBox}>
                <textarea className={styles.textarea} value={editText}
                  onChange={e => setEditText(e.target.value)} rows={2} />
                <div className={styles.editActions}>
                  <button className={styles.btnGhost} onClick={() => setEditId(null)}>Cancelar</button>
                  <button className={styles.btnPrimary} onClick={() => saveEdit(node.id)}>Salvar</button>
                </div>
              </div>
            ) : (
              <p className={`${styles.text} ${node.oculto ? styles.hidden : ''}`}>{node.texto}</p>
            )}

            <div className={styles.actions}>
              {canReply && (
                <button className={styles.actionBtn}
                  onClick={() => { setReplyTo(replyTo === node.id ? null : node.id); setReplyText(''); }}>
                  Responder
                </button>
              )}
              {editable && editId !== node.id && (
                <button className={styles.actionBtn}
                  onClick={() => { setEditId(node.id); setEditText(node.texto); }}>
                  Editar
                </button>
              )}
              {canModerate && !node.oculto && (
                <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => hide(node.id)}>
                  Ocultar
                </button>
              )}
            </div>

            {replyTo === node.id && (
              <div className={styles.replyBox}>
                <textarea className={styles.textarea} rows={2} placeholder="Escreva uma resposta..."
                  value={replyText} onChange={e => setReplyText(e.target.value)} />
                <div className={styles.editActions}>
                  <button className={styles.btnGhost} onClick={() => setReplyTo(null)}>Cancelar</button>
                  <button className={styles.btnPrimary} disabled={sending || !replyText.trim()}
                    onClick={() => addComment(replyText, node.id)}>Responder</button>
                </div>
              </div>
            )}
          </div>
        </div>
        {node.children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  const tree = buildTree(comments);

  return (
    <div className={styles.wrap}>
      <div className={styles.newBox}>
        <textarea className={styles.textarea} rows={2} placeholder="Adicionar um comentário..."
          value={novo} onChange={e => setNovo(e.target.value)} />
        <button className={styles.btnPrimary} disabled={sending || !novo.trim()}
          onClick={() => addComment(novo)}>
          {sending ? 'Enviando...' : 'Comentar'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.muted}>Carregando comentários…</div>
      ) : tree.length === 0 ? (
        <div className={styles.muted}>Nenhum comentário ainda. Seja o primeiro.</div>
      ) : (
        <div className={styles.thread}>{tree.map(n => renderNode(n, 0))}</div>
      )}
    </div>
  );
}
