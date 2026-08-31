import React from 'react';

export const Input = ({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  className = '',
  rows = 3,
  options = [],
  children,
  ...props
}) => {
  const inputId = id || name;

  const baseInputStyles =
    'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all duration-150 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed';

  const borderStyles = error
    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
    : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-blue-100';

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          <span>{label}</span>
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}

        {type === 'textarea' ? (
          <textarea
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`${baseInputStyles} ${borderStyles} ${
              Icon ? 'pl-10' : ''
            } resize-y ${className}`}
            {...props}
          />
        ) : type === 'select' ? (
          <select
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`${baseInputStyles} ${borderStyles} ${
              Icon ? 'pl-10' : ''
            } appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,<svg%20xmlns%3D"http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg"%20width%3D"292.4"%20height%3D"292.4"><path%20fill%3D"%2394A3B8"%20d%3D"M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z"%2F><%2Fsvg>')] bg-[length:10px_10px] bg-[right_14px_center] bg-no-repeat pr-9 ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
        ) : (
          <input
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseInputStyles} ${borderStyles} ${
              Icon ? 'pl-10' : ''
            } ${className}`}
            {...props}
          />
        )}
      </div>

      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
