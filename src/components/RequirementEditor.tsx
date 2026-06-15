import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import { getSocket } from '../services/socket';
import { SocketIoYjsProvider, presenceColor } from '../utils/socketYjsProvider';
import type { PresenceUser } from '../utils/socketYjsProvider';
import styles from './RequirementEditor.module.css';

interface CurrentUser {
  id: number;
  nome: string;
}

interface Props {
  requirementId: number;
  initialContent: string;
  readOnly?: boolean;
  onSave: (text: string) => void;
  onCancel: () => void;
  currentUser: CurrentUser;
  hideActions?: boolean;
  onContentChange?: (text: string) => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function RequirementEditor({
  requirementId,
  initialContent,
  readOnly = false,
  onSave,
  onCancel,
  currentUser,
  hideActions = false,
  onContentChange,
}: Props) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<SocketIoYjsProvider | null>(null);
  const [synced, setSynced] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const roomId = `req-${requirementId}`;

  // Initialize Y.Doc once per component lifetime
  if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
  }

  const editor = useEditor({
    extensions: [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (StarterKit as any).configure({ history: false }),
      Collaboration.configure({ document: ydocRef.current }),
    ],
    editable: !readOnly,
    editorProps: {
      attributes: {
        'data-placeholder': 'Descreva o requisito em detalhe...',
      },
    },
    onUpdate: ({ editor: e }) => {
      onContentChange?.(e.getText());
    },
  });

  // Provider setup — runs once per requirementId
  useEffect(() => {
    const ydoc = ydocRef.current!;
    const socket = getSocket();
    const provider = new SocketIoYjsProvider(ydoc, socket, roomId);
    providerRef.current = provider;

    provider.onPresence(setPresenceUsers);
    provider.onSynced((serverHasHistory) => {
      setHasHistory(serverHasHistory);
      setSynced(true);
    });

    const userColor = presenceColor(currentUser.id);
    provider.join({ name: currentUser.nome, color: userColor });

    return () => {
      provider.destroy();
      providerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirementId]);

  // Seed initial content once both editor and sync are ready
  // Runs whenever editor or synced changes — avoids stale closure on editor
  useEffect(() => {
    if (!synced || !editor || hasHistory || !initialContent) return;
    const html = initialContent.trimStart().startsWith('<')
      ? initialContent
      : `<p>${initialContent}</p>`;
    editor.commands.setContent(html);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synced, editor]);

  const handleSave = () => {
    if (!editor) return;
    onSave(editor.getText());
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.presenceList}>
          {presenceUsers.map((u, i) => (
            <span
              key={i}
              className={styles.presenceAvatar}
              style={{ backgroundColor: u.color }}
              title={u.name}
            >
              {initials(u.name)}
            </span>
          ))}
          {presenceUsers.length > 1 && (
            <span className={styles.presenceLabel}>
              {presenceUsers.length} editando
            </span>
          )}
        </div>
        {!synced && <span className={styles.syncBadge}>sincronizando...</span>}
      </div>

      {!readOnly && (
        <div className={styles.toolbar}>
          <button
            type="button"
            className={`${styles.toolbarBtn}${editor?.isActive('bold') ? ' ' + styles.active : ''}`}
            onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }}
            title="Negrito"
          >
            B
          </button>
          <button
            type="button"
            className={`${styles.toolbarBtn}${editor?.isActive('italic') ? ' ' + styles.active : ''}`}
            onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }}
            title="Itálico"
            style={{ fontStyle: 'italic' }}
          >
            I
          </button>
          <div className={styles.toolbarSep} />
          <button
            type="button"
            className={`${styles.toolbarBtn}${editor?.isActive('bulletList') ? ' ' + styles.active : ''}`}
            onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }}
            title="Lista"
          >
            ≡
          </button>
        </div>
      )}

      <div className={styles.editorContent}>
        <EditorContent editor={editor} />
      </div>

      {!readOnly && !hideActions && (
        <div className="modal-footer" style={{ padding: '10px 14px', borderTop: '1px solid #e8f0e9' }}>
          <button className="btn-cancel--outlined" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn-save" onClick={handleSave} disabled={!synced}>
            Salvar Requisito
          </button>
        </div>
      )}
    </div>
  );
}
