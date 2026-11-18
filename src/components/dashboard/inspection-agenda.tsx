"use client";

import React from "react";
import Link from "next/link";
import { ClipboardText, CaretRight, MapPin } from "@phosphor-icons/react";
import { AdminOverview } from "@/lib/types";

interface InspectionAgendaProps {
  inspections: AdminOverview["pendingInspections"];
}

export function InspectionAgenda({ inspections }: InspectionAgendaProps) {
  return (
    <div className="p-4 sm:p-5 bg-[#F7F9F7] border border-[#E2E8E3] rounded-[18px] text-left flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-[#EFEBF8] text-[#5B4A8A] flex items-center justify-center">
              <ClipboardText size={18} weight="bold" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[#121915]">
                Agenda Inspeksi Lapangan
              </h2>
              <p className="text-xs text-[#4A564F]">Perlu cek fisik pengurus</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EFEBF8] text-[#5B4A8A]">
            {inspections.length} Antrean
          </span>
        </div>

        {inspections.length === 0 ? (
          <p className="text-xs text-[#7D8A82] py-6 text-center">
            Semua inspeksi fisik sudah selesai diperiksa.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 mt-2">
            {inspections.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/laporan/${item.publicNo}`}
                  className="flex items-center justify-between p-3 rounded-[12px] bg-white hover:bg-[#F0F4F1] border border-[#E2E8E3] transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[11px] font-semibold text-[#5B4A8A] tabular-nums block">
                      {item.publicNo}
                    </span>
                    <span className="text-xs font-semibold text-[#121915] truncate block mt-0.5">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-[#4A564F] mt-1">
                      <MapPin size={12} weight="bold" className="shrink-0 text-[#7D8A82]" />
                      <span className="truncate">{item.addressNotes}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#F4F6F4] group-hover:bg-[#D2F45A] group-hover:text-[#111812] flex items-center justify-center text-[#7D8A82] transition-colors shrink-0">
                    <CaretRight size={14} weight="bold" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8E3] text-right">
        <Link
          href="/laporan?status=inspection"
          className="text-xs font-semibold text-[#135E3F] hover:underline"
        >
          Lihat semua inspeksi RT &rarr;
        </Link>
      </div>
    </div>
  );
}
