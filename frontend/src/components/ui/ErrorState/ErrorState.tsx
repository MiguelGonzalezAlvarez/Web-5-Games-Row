import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Mail, ChevronRight } from 'lucide-react';
import { Button } from '../Button';
import { cn } from '@/lib/utils';
import styles from './ErrorState.module.css';

export interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error message */
  message?: string;
  /** The actual error object */
  error?: Error | unknown;
  /** Callback for retry action */
  onRetry?: () => void;
  /** Callback for contact support */
  onContact?: () => void;
  /** Show technical details in development */
  showDetails?: boolean;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  onContact,
  showDetails = import.meta.env.DEV,
  icon,
  className,
}: ErrorStateProps) {
  const errorMessage = message || (error instanceof Error ? error.message : 'An unexpected error occurred');

  return (
    <motion.div
      className={cn(styles.container, className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.iconWrapper}>
        {icon || <AlertCircle size={48} className={styles.icon} />}
      </div>

      <h3 className={styles.title}>{title}</h3>

      <p className={styles.message}>{errorMessage}</p>

      <div className={styles.actions}>
        {onRetry && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw size={16} />}
          >
            Try Again
          </Button>
        )}

        {onContact && (
          <Button
            variant="outline"
            size="sm"
            onClick={onContact}
            leftIcon={<Mail size={16} />}
          >
            Contact Support
          </Button>
        )}
      </div>

      {showDetails && error && (
        <details className={styles.details}>
          <summary className={styles.detailsSummary}>
            Technical Details
          </summary>
          <pre className={styles.detailsContent}>
            {error instanceof Error
              ? error.stack || error.message
              : JSON.stringify(error, null, 2)}
          </pre>
        </details>
      )}
    </motion.div>
  );
}

export default ErrorState;
