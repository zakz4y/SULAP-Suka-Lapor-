"use client";

import React from "react";
import { Tray, Wrench, CheckCircle } from "@phosphor-icons/react";
import { AdminOverview } from "@/lib/types";

interface MetricCardsProps {
  metrics: AdminOverview["metrics"];
}

export function MetricCards({ metrics }: MetricCardsProps) {
  const cards = [
    {
      title: "Laporan Baru",
      count: metrics.newReportsCount,
      detail: "Perlu ditinjau pengurus RT",
      icon: Tray,
      iconBg: "bg-[#E7EFF9]",
      iconFg: "text-[#1D5FA8]",
      badge: "Menunggu tindakan",
      badgeBg: "bg-[#E7EFF9] text-[#1D5FA8]",
    },
    {
      title: "Dalam Penanganan",
      count: metrics.inProgressCount,
      detail: "Sedang dikerjakan di lapangan",
      icon: Wrench,
      iconBg: "bg-[#E2F4EE]",
      iconFg: "text-[#0D6657]",
      badge: "Aktif",
      badgeBg: "bg-[#E2F4EE] text-[#0D6657]",
    },
    {
      title: "Selesai Ditangani",
      count: metrics.resolvedCount,
      detail: `Rata-rata selesai ${metrics.avgResolutionDays} hari kerja`,
      icon: CheckCircle,
      iconBg: "bg-[#E5F6E9]",
      iconFg: "text-[#1B6836]",
      badge: "Bulan ini",
      badgeBg: "bg-[#E5F6E9] text-[#1B6836]",
    },
  ];

  return (
    <section aria-label="Ringkasan Laporan RT" className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className="p-4 sm:p-5 bg-[#F7F9F7] hover:bg-[#F0F4F1] border border-[#E2E8E3] rounded-[18px] transition-colors text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-[12px] ${c.iconBg} ${c.iconFg} flex items-center justify-center`}
              >
                <Icon size={20} weight="bold" aria-hidden="true" />
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${c.badgeBg}`}>
                {c.badge}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#121915] tabular-nums tracking-tight">
              {c.count}
            </div>
            <h2 className="text-xs sm:text-sm font-semibold text-[#121915] mt-1">{c.title}</h2>
            <p className="text-[11px] text-[#4A564F] mt-0.5">{c.detail}</p>
          </div>
        );
      })}
    </section>
  );
}
