import { motion } from 'framer-motion';
import { Inbox, Search, Users, FileText, Image, Trophy } from 'lucide-react';
import { Button } from '../Button';
import { cn } from '@/lib/utils';
import styles from './EmptyState.module.css';

export type EmptyStateVariant = 'default' | 'search' | 'users' | 'files' | 'images' | 'trophy' | 'custom';

export interface EmptyStateProps {
  /** Empty state title */
  title: string;
  /** Optional description */
  description?: string;
  /** Visual variant */
  variant?: EmptyStateVariant;
  /** Custom icon (overrides variant) */
  icon?: React.ReactNode;
  /** Primary action */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional CSS classes */
  className?: string;
}

const variantIcons: Record<EmptyStateVariant, React.ReactNode> = {
  default: <Inbox size={48} />,
  search: <Search size={48} />,
  users: <Users size={48} />,
  files: <FileText size={48} />,
  images: <Image size={48} />,
  trophy: <Trophy size={48} />,
  custom: <Inbox size={48} />,
};

const variantClasses: Record<EmptyStateVariant, string> = {
  default: styles.iconDefault,
  search: styles.iconSearch,
  users: styles.iconUsers,
  files: styles.iconFiles,
  images: styles.iconImages,
  trophy: styles.iconTrophy,
  custom: styles.iconDefault,
};

export function EmptyState({
  title,
  description,
  variant = 'default',
  icon,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const displayIcon = icon || variantIcons[variant];
  const iconClass = variantClasses[variant];

  return (
    <motion.div
      className={cn(styles.container, className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={cn(styles.iconWrapper, iconClass)}>
        {displayIcon}
      </div>

      <h3 className={styles.title}>{title}</h3>

      {description && (
        <p className={styles.description}>{description}</p>
      )}

      <div className={styles.actions}>
        {action && (
          <Button variant="primary" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )}

        {secondaryAction && (
          <Button variant="outline" size="sm" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default EmptyState;
