"use client";

import React from "react";
import Link from "next/link";
import { MapPin, CalendarBlank } from "@phosphor-icons/react";
import { Report } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";

interface ReportCardProps {
  report: Report;
}

export function ReportCard({ report }: ReportCardProps) {
  const dateFormatted = new Date(report.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="p-4 sm:p-5 bg-white hover:bg-[#F7F9F7] border border-[#E2E8E3] rounded-[18px] transition-all text-left flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#141916] tabular-nums">
              {report.publicNo}
            </span>
            <span className="text-[11px] text-[#7D8A82]">
              &bull; {report.categoryName}
            </span>
          </div>
          <StatusBadge group={report.statusGroup} label={report.statusLabel} />
        </div>

        <Link
          href={`/laporan/${report.publicNo}`}
          className="focus-visible:outline-2 focus-visible:outline-[#145C41] rounded-[4px] block group"
        >
          <h2 className="text-sm sm:text-base font-bold text-[#121915] group-hover:text-[#135E3F] transition-colors line-clamp-2">
            {report.title}
          </h2>
        </Link>

        <p className="text-xs sm:text-sm text-[#4A564F] line-clamp-2 mt-1.5 leading-relaxed">
          {report.description}
        </p>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8E3] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#7D8A82]">
        <div className="flex items-center gap-1">
          <MapPin size={14} weight="bold" className="shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[180px] sm:max-w-[260px]">
            {report.location.notes || "Koordinat GPS"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarBlank size={14} weight="regular" aria-hidden="true" />
          <span>{dateFormatted}</span>
        </div>
      </div>
    </article>
  );
}
