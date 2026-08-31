import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

export const ErrorState = ({
  title = 'Failed to load content',
  message = 'An unexpected error occurred while communicating with the CivicSphere network.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/40 p-8 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3 ring-6 ring-rose-100/50">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900 font-heading">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-slate-600">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            leftIcon={RefreshCw}
          >
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
