"use client";

import React, { useState } from "react";
import { TopHeader } from "@/components/navigation/top-header";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { WeeklyTrendChart } from "@/components/dashboard/weekly-trend-chart";
import { InspectionAgenda } from "@/components/dashboard/inspection-agenda";
import { UrgentReports } from "@/components/dashboard/urgent-reports";
import { ResidentHome } from "@/components/dashboard/resident-home";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useAuth } from "@/components/providers/auth-provider";
import { mockAdminOverview, mockReports } from "@/lib/mock-data";

export default function DashboardPage() {
  const { role } = useAuth();
  const [viewState, setViewState] = useState<"ready" | "loading" | "empty" | "error">("ready");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUrgentReports = mockReports.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.publicNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      <TopHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Simulator Switcher for Required States */}
      <div
        role="region"
        aria-label="Pengalih Simulasi State Antarmuka"
        className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[12px] bg-[#F7F9F7] border border-[#E2E8E3] text-xs text-[#4A564F]"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#121915]">Uji State UI:</span>
          <button
            type="button"
            onClick={() => setViewState("ready")}
            className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
              viewState === "ready"
                ? "bg-[#135E3F] text-white"
                : "bg-white border border-[#C4CEC6] text-[#121915]"
            }`}
          >
            Normal (Success)
          </button>
          <button
            type="button"
            onClick={() => setViewState("loading")}
            className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
              viewState === "loading"
                ? "bg-[#135E3F] text-white"
                : "bg-white border border-[#C4CEC6] text-[#121915]"
            }`}
          >
            Loading
          </button>
          <button
            type="button"
            onClick={() => setViewState("empty")}
            className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
              viewState === "empty"
                ? "bg-[#135E3F] text-white"
                : "bg-white border border-[#C4CEC6] text-[#121915]"
            }`}
          >
            Empty
          </button>
          <button
            type="button"
            onClick={() => setViewState("error")}
            className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
              viewState === "error"
                ? "bg-[#9C3412] text-white"
                : "bg-white border border-[#C4CEC6] text-[#121915]"
            }`}
          >
            Error
          </button>
        </div>

        <div className="text-[11px] text-[#7D8A82]">
          Tampilan saat ini: <strong className="text-[#121915]">{role === "admin" ? "Dashboard Pengurus Admin RT" : "Beranda Pelaporan Warga"}</strong>
        </div>
      </div>

      {/* Loading State */}
      {viewState === "loading" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-52" />
        </div>
      )}

      {/* Error State */}
      {viewState === "error" && (
        <ErrorState
          title="Gagal Memuat Data Laporan RT"
          message="Terjadi gangguan saat mengambil data laporan dari server. Silakan muat ulang halaman."
          onRetry={() => setViewState("ready")}
        />
      )}

      {/* Empty State */}
      {viewState === "empty" && (
        <EmptyState
          title="Belum Ada Laporan Aktif di RT 01"
          description="Seluruh fasilitas lingkungan dalam keadaan baik atau belum ada laporan baru dari warga."
          actionLabel="Buat Laporan Baru"
          onAction={() => {
            window.location.href = "/laporan/buat";
          }}
        />
      )}

      {/* Ready State */}
      {viewState === "ready" && (
        <>
          {role === "resident" ? (
            /* TAMPILAN RESMI KHUSUS WARGA (PRD §6.1) */
            <ResidentHome reports={mockReports} />
          ) : (
            /* TAMPILAN RESMI KHUSUS ADMIN RT (PRD §6.2 Bento Dashboard) */
            <>
              {/* Row 1: 3 Metric Cards */}
              <MetricCards metrics={mockAdminOverview.metrics} />

              {/* Row 2: Bento Grid (Tren Mingguan + Agenda Inspeksi) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 mb-4">
                <div className="lg:col-span-7">
                  <WeeklyTrendChart activity={mockAdminOverview.weeklyActivity} />
                </div>
                <div className="lg:col-span-5">
                  <InspectionAgenda inspections={mockAdminOverview.pendingInspections} />
                </div>
              </div>

              {/* Row 3: Urgent Reports */}
              <UrgentReports reports={filteredUrgentReports} />
            </>
          )}
        </>
      )}
    </div>
  );
}
