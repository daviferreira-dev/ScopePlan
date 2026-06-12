import type { Toast } from '../hooks/useToast';
import styles from './ToastContainer.module.css';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

const TOAST_COLORS: Record<string, string> = {
  error: '#b91c1c',
  success: '#1a6634',
  info: '#1e40af',
};

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onRemove(toast.id)}
          className={styles.toast}
          style={{ background: TOAST_COLORS[toast.type] || TOAST_COLORS.info }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
