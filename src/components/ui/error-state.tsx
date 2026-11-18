"use client";

import React from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Terjadi Kendala",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center p-6 text-center bg-[#FDF4F2] rounded-[18px] border border-[#F8D0C3]"
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-[12px] bg-[#FDEEE9] text-[#9C3412] mb-3">
        <WarningCircle size={28} weight="fill" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[#121915] mb-1">{title}</h3>
      <p className="text-sm text-[#4A564F] max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="md" onClick={onRetry}>
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
