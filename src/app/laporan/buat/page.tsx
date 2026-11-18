"use client";

import React from "react";
import Link from "next/link";
import { ReportForm } from "@/components/reports/report-form";
import { ArrowLeft } from "@phosphor-icons/react";

export default function BuatLaporanPage() {
  return (
    <div className="flex flex-col gap-4 text-left">
      <div>
        <Link
          href="/laporan"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#135E3F] hover:underline"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>Kembali ke Laporan</span>
        </Link>
      </div>

      <ReportForm />
    </div>
  );
}
