"use client";

import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  charCount?: number;
  maxChars?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, charCount, maxChars, id, className = "", ...props }, ref) => {
    const textareaId = id || React.useId();
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        <div className="flex justify-between items-center">
          <label htmlFor={textareaId} className="text-sm font-medium text-[#121915]">
            {label}
          </label>
          {maxChars !== undefined && charCount !== undefined && (
            <span className="text-xs tabular-nums text-[#7D8A82]">
              {charCount}/{maxChars}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`min-h-[100px] w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] text-[#121915] placeholder:text-[#7D8A82] transition-colors focus-visible:outline-2 focus-visible:outline-[#145C41] ${
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

Textarea.displayName = "Textarea";
