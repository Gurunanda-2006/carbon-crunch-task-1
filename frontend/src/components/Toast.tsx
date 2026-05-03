import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string[];
}

const icons: Record<Toast['type'], string> = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string, details?: string[]) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message, details }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000); // slightly longer for reading details
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} style={{ alignItems: t.details ? 'flex-start' : 'center' }}>
          <span className="toast-icon" style={{ marginTop: t.details ? '2px' : '0' }}>{icons[t.type]}</span>
          <div className="toast-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <span className="toast-message">{t.message}</span>
            {t.details && t.details.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-dim)', listStyleType: 'disc' }}>
                {t.details.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            )}
          </div>
          <button className="toast-close" onClick={() => onRemove(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
