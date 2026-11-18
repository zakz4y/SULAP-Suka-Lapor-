"use client";

import React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, id, className = "", ...props }, ref) => {
    const selectId = id || React.useId();
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        <label htmlFor={selectId} className="text-sm font-medium text-[#121915]">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`min-h-[44px] w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] text-[#121915] transition-colors focus-visible:outline-2 focus-visible:outline-[#145C41] ${
            error
              ? "border-[#9C3412] focus-visible:outline-[#9C3412]"
              : "border-[#C4CEC6] hover:border-[#9AA79E]"
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {helperText && !error && (
          <p id={helperId} className="text-xs text-[#4A564F]">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-[#9C3412]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
