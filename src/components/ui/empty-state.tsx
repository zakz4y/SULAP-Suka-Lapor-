"use client";

import React from "react";
import { Tray } from "@phosphor-icons/react";
import { Button } from "./button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#F7F9F7] rounded-[18px] border border-[#E2E8E3]">
      <div className="w-12 h-12 flex items-center justify-center rounded-[12px] bg-[#EEF2EE] text-[#4A564F] mb-3">
        <Tray size={24} weight="regular" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[#121915] mb-1">{title}</h3>
      <p className="text-sm text-[#4A564F] max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
