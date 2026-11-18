"use client";

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "lime" | "secondary" | "destructive" | "quiet";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145C41]";

    // Touch target guarantee: min-h-[44px]
    const sizeStyles = {
      sm: "min-h-[44px] px-3 py-2 text-xs rounded-[10px] gap-1.5",
      md: "min-h-[44px] px-4 py-2.5 text-sm rounded-[12px] gap-2",
      lg: "min-h-[48px] px-5 py-3 text-base rounded-[14px] gap-2.5",
    }[size];

    const variantStyles = {
      primary: "bg-[#135E3F] hover:bg-[#0E4931] text-white active:bg-[#093523]",
      lime: "bg-[#D2F45A] hover:bg-[#C2E645] text-[#111812] active:bg-[#B3D637] font-semibold",
      secondary: "bg-[#F0F4F1] hover:bg-[#E5ECE7] text-[#121915] border border-[#E2E8E3]",
      destructive: "bg-[#9C3412] hover:bg-[#7F2A0E] text-white active:bg-[#66210A]",
      quiet: "bg-transparent hover:bg-[#EAEFEA] text-[#4A564F] active:bg-[#E0E7E1]",
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
