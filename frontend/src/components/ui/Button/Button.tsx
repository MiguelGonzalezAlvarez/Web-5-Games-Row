import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type SVGProps } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  /** Button content */
  children?: ReactNode;
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Show loading spinner */
  isLoading?: boolean;
  /** Disable the button */
  isDisabled?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon before text */
  leftIcon?: ReactNode;
  /** Icon after text */
  rightIcon?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Button type attribute */
  type?: 'button' | 'submit' | 'reset';
  /** Accessibility label */
  ariaLabel?: string;
  /** Make button unstyled */
  unstyled?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      type = 'button',
      ariaLabel,
      unstyled = false,
      disabled,
      whileHover = { scale: 1.02 },
      whileTap = { scale: 0.98 },
      ...props
    },
    ref
  ) => {
    const isButtonDisabled = disabled || isLoading || isDisabled;

    const buttonClasses = cn(
      !unstyled && styles.button,
      !unstyled && styles[variant],
      !unstyled && styles[size],
      fullWidth && styles.fullWidth,
      isLoading && styles.loading,
      className
    );

    const iconSize = getIconSize(size);

    return (
      <motion.button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={isButtonDisabled}
        aria-busy={isLoading}
        aria-disabled={isButtonDisabled}
        aria-label={ariaLabel}
        whileHover={!isButtonDisabled ? whileHover : undefined}
        whileTap={!isButtonDisabled ? whileTap : undefined}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {isLoading && (
          <span className={styles.spinner} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className={styles.spinnerIcon}
              {...iconSize}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="31.4 31.4"
              />
            </svg>
          </span>
        )}
        
        {!isLoading && leftIcon && (
          <span className={styles.icon} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {children && (
          <span className={styles.label}>
            {children}
          </span>
        )}
        
        {!isLoading && rightIcon && (
          <span className={styles.icon} aria-hidden="true">
            {rightIcon}
          </span>
        )}
        
        {/* Screen reader text for loading state */}
        {isLoading && (
          <span className="sr-only">
            Loading
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Get icon size based on button size
 */
function getIconSize(size: ButtonSize): SVGProps<SVGSVGElement> {
  const sizes = {
    xs: { width: 12, height: 12 },
    sm: { width: 14, height: 14 },
    md: { width: 16, height: 16 },
    lg: { width: 18, height: 18 },
    xl: { width: 20, height: 20 },
  };
  return sizes[size];
}

export { Button };
export default Button;
