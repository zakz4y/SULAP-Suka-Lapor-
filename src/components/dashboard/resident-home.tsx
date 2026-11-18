"use client";

"use client";

import React from "react";
import Link from "next/link";
import { PlusCircle, Files, CheckCircle, Clock, MapPin, CaretRight, Info } from "@phosphor-icons/react";
import { Report } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";

interface ResidentHomeProps {
  reports: Report[];
}

export function ResidentHome({ reports }: ResidentHomeProps) {
  // Laporan milik warga ini (simulasi 1 laporan aktif)
  const myReports = reports.filter((r) => r.publicNo === "SULAP-RT01-0028");
  const neighborhoodReports = reports.slice(0, 4);

  return (
    <div className="flex flex-col gap-5 text-left">
      {/* Hero Banner Warga: Aksi Utama Buat Laporan (PRD §6.1) */}
      <div className="p-5 sm:p-7 rounded-[22px] bg-gradient-to-r from-[#141916] to-[#1E2621] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#27322B]">
        <div className="max-w-xl">
          <span className="text-[11px] font-bold text-[#D2F45A] uppercase tracking-wider block mb-1">
            Layanan Warga RT 01 Melati
          </span>
          <h2 className="text-lg sm:text-2xl font-extrabold text-white leading-snug">
            Ada fasilitas rusak atau masalah lingkungan?
          </h2>
          <p className="text-xs sm:text-sm text-[#A3B1A8] mt-1 leading-relaxed">
            Laporkan lampu jalan padam, saluran air mampet, atau jalan berlubang. Pengurus RT akan meninjau dalam 2 hari kerja.
          </p>
        </div>

        <Link
          href="/laporan/buat"
          className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-[14px] bg-[#D2F45A] hover:bg-[#C2E645] text-[#111812] font-bold text-sm gap-2 transition-transform active:scale-95 shrink-0 shadow-md"
        >
          <PlusCircle size={20} weight="bold" />
          <span>Buat Laporan Sekarang</span>
        </Link>
      </div>

      {/* Status Laporan Saya (PRD §6.1) */}
      <section aria-label="Status Laporan Saya" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#121915]">
              Perkembangan Laporan Saya
            </h2>
            <p className="text-xs text-[#4A564F]">
              Pantau laporan yang pernah Anda kirimkan ke pengurus RT
            </p>
          </div>
        </div>

        {myReports.length === 0 ? (
          <div className="p-6 rounded-[16px] bg-[#F7F9F7] border border-[#E2E8E3] text-center">
            <p className="text-xs text-[#7D8A82]">
              Anda belum memiliki laporan aktif.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {myReports.map((report) => (
              <Link
                key={report.id}
                href={`/laporan/${report.publicNo}`}
                className="p-4 rounded-[16px] bg-[#F7F9F7] hover:bg-[#F0F4F1] border border-[#C4CEC6] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#135E3F] tabular-nums">
                      {report.publicNo}
                    </span>
                    <span className="text-xs text-[#7D8A82]">&bull; {report.categoryName}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#121915] mt-0.5 group-hover:text-[#135E3F]">
                    {report.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#4A564F] mt-1">
                    <MapPin size={14} weight="bold" className="text-[#7D8A82]" />
                    <span>{report.location.notes}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-[#E2E8E3]">
                  <StatusBadge group={report.statusGroup} label={report.statusLabel} />
                  <div className="w-8 h-8 rounded-full bg-white group-hover:bg-[#135E3F] group-hover:text-white flex items-center justify-center text-[#7D8A82] transition-colors">
                    <CaretRight size={14} weight="bold" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Laporan Terkini di Lingkungan RT (PRD §6.1) */}
      <section aria-label="Laporan Lingkungan RT" className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#121915]">
              Laporan Terkini di RT 01 Melati
            </h2>
            <p className="text-xs text-[#4A564F]">
              Kondisi fasilitas lingkungan yang sedang dalam penanganan bersama
            </p>
          </div>
          <Link
            href="/laporan"
            className="text-xs font-semibold text-[#135E3F] hover:underline"
          >
            Lihat Semua &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {neighborhoodReports.map((report) => (
            <Link
              key={report.id}
              href={`/laporan/${report.publicNo}`}
              className="p-4 rounded-[16px] bg-white hover:bg-[#F7F9F7] border border-[#E2E8E3] transition-colors flex flex-col justify-between text-left group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-[#4A564F] tabular-nums">
                    {report.publicNo}
                  </span>
                  <StatusBadge group={report.statusGroup} label={report.statusLabel} />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#121915] group-hover:text-[#135E3F] line-clamp-1">
                  {report.title}
                </h3>
                <p className="text-xs text-[#7D8A82] line-clamp-2 mt-1">
                  {report.description}
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-[#7D8A82] mt-3 pt-2 border-t border-[#E2E8E3]">
                <MapPin size={12} weight="bold" className="shrink-0" />
                <span className="truncate">{report.location.notes || "Lingkungan RT 01"}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Info Privasi Pelapor (PRD §2.4 Prinsip 5) */}
      <div className="p-3.5 rounded-[12px] bg-[#F7F9F7] border border-[#E2E8E3] flex items-center gap-2.5 text-xs text-[#4A564F]">
        <Info size={18} weight="fill" className="text-[#135E3F] shrink-0" />
        <span>
          <strong>Privasi Dijaga:</strong> Identitas nama pelapor tidak ditampilkan kepada sesama warga lain.
        </span>
      </div>
    </div>
  );
}
