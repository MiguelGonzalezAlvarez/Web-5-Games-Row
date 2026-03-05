import { motion, HTMLMotionProps } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';

interface SkeletonProps extends HTMLMotionProps<"div"> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ 
  width, 
  height, 
  borderRadius = '8px', 
  className = '',
  style = {},
  ...props 
}: SkeletonProps) {
  return (
    <motion.div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--color-gray-200) 0%, var(--color-gray-100) 50%, var(--color-gray-200) 100%)',
        backgroundSize: '200% 100%',
        ...style
      }}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
      {...props}
    />
  );
}

export function TableRowSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', gap: '12px', padding: '16px 0', borderBottom: '1px solid var(--color-gray-100)', alignItems: 'center' }}
    >
      <Skeleton width={24} height={20} />
      <Skeleton width={32} height={32} borderRadius="50%" />
      <Skeleton width={120} height={20} />
      <Skeleton width={30} height={20} />
      <Skeleton width={30} height={20} />
      <Skeleton width={30} height={20} />
      <Skeleton width={30} height={20} />
      <Skeleton width={40} height={20} />
    </motion.div>
  );
}

export function MatchSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', borderBottom: '1px solid var(--color-gray-100)' }}
    >
      <Skeleton width={60} height={16} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Skeleton width={36} height={36} borderRadius="50%" />
          <Skeleton width={80} height={16} />
        </div>
        <Skeleton width={60} height={32} borderRadius="8px" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: 'row-reverse' }}>
          <Skeleton width={36} height={36} borderRadius="50%" />
          <Skeleton width={80} height={16} />
        </div>
      </div>
    </motion.div>
  );
}

interface SkeletonListProps {
  count?: number;
  skeleton?: 'table' | 'match' | 'card' | 'text';
}

export function SkeletonList({ count = 5, skeleton = 'table' }: SkeletonListProps) {
  const renderSkeleton = () => {
    switch (skeleton) {
      case 'table': return <TableRowSkeleton />;
      case 'match': return <MatchSkeleton />;
      default: return <TableRowSkeleton />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          {renderSkeleton()}
        </motion.div>
      ))}
    </motion.div>
  );
}
