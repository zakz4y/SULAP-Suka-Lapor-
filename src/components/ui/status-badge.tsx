"use client";

import React from "react";
import {
  Tray,
  MagnifyingGlass,
  ClipboardText,
  Wrench,
  CheckCircle,
  Archive,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { InternalStatusGroup } from "@/lib/types";

interface StatusBadgeProps {
  group: InternalStatusGroup;
  label: string;
  className?: string;
}

export function StatusBadge({ group, label, className = "" }: StatusBadgeProps) {
  const configs: Record<
    InternalStatusGroup,
    { icon: React.ReactNode; bg: string; text: string; border: string }
  > = {
    new: {
      icon: <Tray size={14} weight="bold" aria-hidden="true" />,
      bg: "bg-[#E7EFF9]",
      text: "text-[#1D5FA8]",
      border: "border-[#C6DAF3]",
    },
    triaged: {
      icon: <MagnifyingGlass size={14} weight="bold" aria-hidden="true" />,
      bg: "bg-[#FDF4E2]",
      text: "text-[#8C5800]",
      border: "border-[#F5DEAF]",
    },
    inspection: {
      icon: <ClipboardText size={14} weight="bold" aria-hidden="true" />,
      bg: "bg-[#EFEBF8]",
      text: "text-[#5B4A8A]",
      border: "border-[#D7CEF0]",
    },
    in_progress: {
      icon: <Wrench size={14} weight="bold" aria-hidden="true" />,
      bg: "bg-[#E2F4EE]",
      text: "text-[#0D6657]",
      border: "border-[#BEE5D9]",
    },
    resolved: {
      icon: <CheckCircle size={14} weight="bold" aria-hidden="true" />,
      bg: "bg-[#E5F6E9]",
      text: "text-[#1B6836]",
      border: "border-[#BFECBA]",
    },
    closed: {
      icon: <Archive size={14} weight="bold" aria-hidden="true" />,
      bg: "bg-[#ECEEEB]",
      text: "text-[#4F5B54]",
      border: "border-[#D6DCD7]",
    },
    reopened: {
      icon: <ArrowCounterClockwise size={14} weight="bold" aria-hidden="true" />,
      bg: "bg-[#FDEEE9]",
      text: "text-[#9C3412]",
      border: "border-[#F8D0C3]",
    },
  };

  const current = configs[group] || configs.new;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[8px] border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      {current.icon}
      <span>{label}</span>
    </span>
  );
}
