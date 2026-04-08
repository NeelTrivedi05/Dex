import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  id?: string;
  disabled?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  onClick,
  className,
  type = 'button',
  id,
  disabled,
}: ButtonProps) {
  return (
    <motion.button
      id={id}
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium px-4 py-2 transition-all duration-150 cursor-pointer',
        variant === 'primary' && 'bg-accent-blue text-white hover:opacity-90',
        variant === 'ghost' &&
          'bg-transparent text-text-secondary border border-border-default hover:bg-bg-surface hover:text-text-primary',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {children}
    </motion.button>
  );
}
