import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'sm',
  withDot = false,
  className = '',
}) => {
  // Normalize string variant keys if uppercase status passed
  const key = String(children || variant).toUpperCase();

  const variantStyles = {
    // Statuses
    OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/10',
    CLOSED: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/10',

    // Priorities
    HIGH: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/10',
    LOW: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10',

    // Document Statuses
    UPLOADED: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10',
    PROCESSING: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-600/10',
    READY: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10',
    FAILED: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10',

    // Roles
    CITIZEN: 'bg-cyan-50 text-cyan-800 border-cyan-200 ring-cyan-600/10',
    LAWYER: 'bg-indigo-50 text-indigo-800 border-indigo-200 ring-indigo-600/10',

    // Generic
    DEFAULT: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
    PRIMARY: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10',
  };

  const dotColors = {
    OPEN: 'bg-emerald-500',
    IN_PROGRESS: 'bg-amber-500 animate-pulse',
    CLOSED: 'bg-slate-400',
    HIGH: 'bg-rose-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-blue-500',
    READY: 'bg-emerald-500',
    PROCESSING: 'bg-indigo-500 animate-pulse',
    FAILED: 'bg-rose-500',
    CITIZEN: 'bg-cyan-500',
    LAWYER: 'bg-indigo-500',
  };

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 font-semibold',
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-sm px-3 py-1 font-medium',
  };

  const selectedVariant = variantStyles[key] || variantStyles[variant.toUpperCase()] || variantStyles.DEFAULT;
  const dotColor = dotColors[key] || dotColors[variant.toUpperCase()] || 'bg-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ring-1 ring-inset ${selectedVariant} ${
        sizeStyles[size] || sizeStyles.sm
      } ${className}`}
    >
      {withDot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
