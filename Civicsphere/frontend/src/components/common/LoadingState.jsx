import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({
  message = 'Loading CivicSphere data...',
  fullScreen = false,
  className = '',
}) => {
  const content = (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-blue-100 border-t-blue-600 animate-spin" />
        <div className="absolute h-6 w-6 rounded-full bg-blue-600/10" />
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-600 tracking-wide uppercase">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/90 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingState;
