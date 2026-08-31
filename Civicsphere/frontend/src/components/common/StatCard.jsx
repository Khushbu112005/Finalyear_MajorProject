import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  colorScheme = 'blue',
  subtitle,
  onClick,
}) => {
  const themeStyles = {
    blue: {
      bg: 'bg-blue-50/70 text-blue-700 border-blue-100',
      iconBg: 'bg-blue-600 text-white shadow-blue-600/20',
    },
    indigo: {
      bg: 'bg-indigo-50/70 text-indigo-700 border-indigo-100',
      iconBg: 'bg-indigo-600 text-white shadow-indigo-600/20',
    },
    emerald: {
      bg: 'bg-emerald-50/70 text-emerald-700 border-emerald-100',
      iconBg: 'bg-emerald-600 text-white shadow-emerald-600/20',
    },
    amber: {
      bg: 'bg-amber-50/70 text-amber-700 border-amber-100',
      iconBg: 'bg-amber-600 text-white shadow-amber-600/20',
    },
    rose: {
      bg: 'bg-rose-50/70 text-rose-700 border-rose-100',
      iconBg: 'bg-rose-600 text-white shadow-rose-600/20',
    },
    cyan: {
      bg: 'bg-cyan-50/70 text-cyan-700 border-cyan-100',
      iconBg: 'bg-cyan-600 text-white shadow-cyan-600/20',
    },
  };

  const currentTheme = themeStyles[colorScheme] || themeStyles.blue;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-lg shadow-sm ${currentTheme.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900 font-heading">
          {value ?? 0}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              trend > 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend > 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      {(subtitle || trendLabel) && (
        <p className="mt-1 text-xs text-slate-400">
          {trendLabel || subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
