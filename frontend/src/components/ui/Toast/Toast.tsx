import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissable?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  clearAll: () => void;
  success: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
  error: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
  warning: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
  info: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const noOp = () => '';

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [],
      addToast: noOp,
      removeToast: () => {},
      updateToast: () => {},
      clearAll: () => {},
      success: noOp,
      error: noOp,
      warning: noOp,
      info: noOp,
    };
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export function ToastProvider({ children, position = 'top-right', maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId('toast');
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
      dismissable: toast.dismissable ?? true,
    };

    setToasts((prev) => {
      // Limit number of toasts
      const updated = [...prev, newToast];
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });

    // Auto dismiss
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const createToast = useCallback(
    (type: ToastType) =>
      (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => {
        return addToast({
          type,
          title,
          message,
          ...options,
        });
      },
    [addToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      addToast,
      removeToast,
      updateToast,
      clearAll,
      success: createToast('success'),
      error: createToast('error'),
      warning: createToast('warning'),
      info: createToast('info'),
    }),
    [toasts, addToast, removeToast, updateToast, clearAll, createToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} position={position} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  position: ToastPosition;
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, position, onRemove }: ToastContainerProps) {
  const positionClasses: Record<ToastPosition, string> = {
    'top-left': styles.containerTopLeft,
    'top-center': styles.containerTopCenter,
    'top-right': styles.containerTopRight,
    'bottom-left': styles.containerBottomLeft,
    'bottom-center': styles.containerBottomCenter,
    'bottom-right': styles.containerBottomRight,
  };

  return (
    <div className={cn(styles.container, positionClasses[position])} role="region" aria-label="Notifications">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  const iconColors: Record<ToastType, string> = {
    success: styles.iconSuccess,
    error: styles.iconError,
    warning: styles.iconWarning,
    info: styles.iconInfo,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(styles.toast, styles[toast.type])}
      role="alert"
      aria-live="polite"
    >
      <div className={cn(styles.iconWrapper, iconColors[toast.type])}>
        {icons[toast.type]}
      </div>

      <div className={styles.content}>
        <p className={styles.title}>{toast.title}</p>
        {toast.message && <p className={styles.message}>{toast.message}</p>}
        
        {toast.action && (
          <button
            className={styles.actionButton}
            onClick={toast.action.onClick}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {toast.dismissable && (
        <button
          className={styles.dismissButton}
          onClick={() => onRemove(toast.id)}
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
}
