import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs,
  className = '',
}) => {
  return (
    <div className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        {breadcrumbs && (
          <div className="mb-2 text-xs font-medium text-slate-500">
            {breadcrumbs}
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
