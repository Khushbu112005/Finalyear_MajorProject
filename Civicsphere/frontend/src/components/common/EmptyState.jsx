import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button from '../ui/Button';

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No items found',
  message = 'Get started by creating a new record or modifying your search filter.',
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4 ring-8 ring-blue-50/50">
        <Icon className="h-7 w-7 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-bold text-slate-900 font-heading">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs text-slate-500">{message}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button
            size="sm"
            onClick={onAction}
            leftIcon={actionIcon}
            variant="primary"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
