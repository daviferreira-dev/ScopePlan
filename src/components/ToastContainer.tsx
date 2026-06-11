import type { Toast } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onRemove(toast.id)}
          style={{
            padding: '12px 20px',
            borderRadius: 8,
            fontFamily: 'Sora, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            color: '#fff',
            background:
              toast.type === 'error'
                ? '#b91c1c'
                : toast.type === 'success'
                  ? '#1a6634'
                  : '#1e40af',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            maxWidth: 400,
            wordBreak: 'break-word',
            animation: 'toast-in 0.25s ease-out',
          }}
        >
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
