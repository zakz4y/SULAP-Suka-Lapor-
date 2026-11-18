"use client";

import React from "react";
import Link from "next/link";
import { Warning, CaretRight } from "@phosphor-icons/react";
import { Report } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";

interface UrgentReportsProps {
  reports: Report[];
}

export function UrgentReports({ reports }: UrgentReportsProps) {
  return (
    <div className="p-4 sm:p-5 bg-[#F7F9F7] border border-[#E2E8E3] rounded-[18px] text-left">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-[#FDEEE9] text-[#9C3412] flex items-center justify-center">
            <Warning size={18} weight="bold" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-[#121915]">
              Laporan Perlu Perhatian
            </h2>
            <p className="text-xs text-[#4A564F]">Masalah lingkungan aktif di lingkungan RT</p>
          </div>
        </div>
        <Link
          href="/laporan"
          className="text-xs font-semibold text-[#135E3F] hover:underline"
        >
          Semua Laporan &rarr;
        </Link>
      </div>

      <div className="flex flex-col gap-2.5 mt-3">
        {reports.map((report) => {
          // Calculate step progress (1 to 4)
          const stepMap: Record<string, number> = {
            new: 1,
            triaged: 2,
            inspection: 2,
            in_progress: 3,
            resolved: 4,
            closed: 4,
          };
          const currentStep = stepMap[report.statusGroup] || 1;

          return (
            <Link
              key={report.id}
              href={`/laporan/${report.publicNo}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[14px] bg-white hover:bg-[#F0F4F1] border border-[#E2E8E3] transition-colors group"
            >
              <div className="flex items-start gap-3 min-w-0">
                {/* Photo or Category Fallback */}
                <div className="w-12 h-12 rounded-[10px] bg-[#EEF2EE] border border-[#E2E8E3] overflow-hidden shrink-0 flex items-center justify-center text-[#7D8A82] text-[10px] font-bold">
                  {report.categoryName.slice(0, 3).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#4A564F] tabular-nums">
                      {report.publicNo}
                    </span>
                    <span className="text-[11px] text-[#7D8A82]">
                      {report.categoryName}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-[#121915] truncate mt-0.5">
                    {report.title}
                  </h3>
                  <p className="text-[11px] text-[#7D8A82] truncate mt-0.5">
                    Lokasi: {report.location.notes || "Sesuai koordinat GPS"}
                  </p>
                </div>
              </div>

              {/* Status and Progress Pipeline */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#E2E8E3]">
                {/* 4-dot progress pipeline */}
                <div
                  className="flex items-center gap-1.5"
                  aria-label={`Tahap penanganan ${currentStep} dari 4`}
                >
                  {[1, 2, 3, 4].map((step) => (
                    <span
                      key={step}
                      className={`w-2 h-2 rounded-full ${
                        step <= currentStep ? "bg-[#135E3F]" : "bg-[#E2E8E3]"
                      }`}
                    />
                  ))}
                </div>

                <StatusBadge group={report.statusGroup} label={report.statusLabel} />

                <div className="w-7 h-7 rounded-full bg-[#F4F6F4] group-hover:bg-[#D2F45A] group-hover:text-[#111812] flex items-center justify-center text-[#7D8A82] transition-colors shrink-0">
                  <CaretRight size={14} weight="bold" aria-hidden="true" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
