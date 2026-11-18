"use client";

import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className = "", ...props }, ref) => {
    const inputId = id || React.useId();
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        <label htmlFor={inputId} className="text-sm font-medium text-[#121915]">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`min-h-[44px] w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] text-[#121915] placeholder:text-[#7D8A82] transition-colors focus-visible:outline-2 focus-visible:outline-[#145C41] ${
            error
              ? "border-[#9C3412] focus-visible:outline-[#9C3412]"
              : "border-[#C4CEC6] hover:border-[#9AA79E]"
          } ${className}`}
          {...props}
        />
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

Input.displayName = "Input";
