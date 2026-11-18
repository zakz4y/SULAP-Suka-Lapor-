"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopHeader } from "@/components/navigation/top-header";
import { ReportCard } from "@/components/reports/report-card";
import { EmptyState } from "@/components/ui/empty-state";
import { mockReports, mockCategories, mockStatusDefinitions } from "@/lib/mock-data";
import { Plus, Funnel } from "@phosphor-icons/react";

export default function LaporanListPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredReports = mockReports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(search.toLowerCase()) ||
      report.publicNo.toLowerCase().includes(search.toLowerCase()) ||
      report.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || report.categoryId === selectedCategory;

    const matchesStatus =
      selectedStatus === "all" || report.statusKey === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-4 text-left">
      <TopHeader searchQuery={search} onSearchChange={setSearch} />

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8E3]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#121915]">
            Daftar Laporan Fasilitas RT
          </h2>
          <p className="text-xs text-[#4A564F]">
            Menampilkan {filteredReports.length} dari {mockReports.length} laporan di lingkungan RT 01
          </p>
        </div>

        <Link
          href="/laporan/buat"
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-[12px] bg-[#135E3F] text-white hover:bg-[#0E4931] font-semibold text-xs sm:text-sm gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus size={18} weight="bold" />
          <span>Buat Laporan Baru</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-[#F7F9F7] rounded-[14px] border border-[#E2E8E3]">
        <div className="flex items-center gap-1.5 text-xs text-[#4A564F] mr-2">
          <Funnel size={16} weight="bold" />
          <span className="font-semibold">Filter:</span>
        </div>

        {/* Status filter chips */}
        <button
          type="button"
          onClick={() => setSelectedStatus("all")}
          className={`min-h-[44px] px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors ${
            selectedStatus === "all"
              ? "bg-[#141916] text-[#D2F45A]"
              : "bg-white border border-[#C4CEC6] text-[#4A564F] hover:bg-[#EEF2EE]"
          }`}
        >
          Semua Status
        </button>

        {mockStatusDefinitions.slice(0, 4).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedStatus(s.key)}
            className={`min-h-[44px] px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors ${
              selectedStatus === s.key
                ? "bg-[#141916] text-[#D2F45A]"
                : "bg-white border border-[#C4CEC6] text-[#4A564F] hover:bg-[#EEF2EE]"
            }`}
          >
            {s.label}
          </button>
        ))}

        {/* Category dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Pilih kategori laporan"
          className="min-h-[44px] px-3 py-1.5 text-xs rounded-[8px] border border-[#C4CEC6] bg-white text-[#121915] ml-auto focus-visible:outline-2 focus-visible:outline-[#145C41]"
        >
          <option value="all">Semua Kategori</option>
          {mockCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Reports Feed */}
      {filteredReports.length === 0 ? (
        <EmptyState
          title="Tidak Ada Laporan yang Cocok"
          description="Coba ubah kata kunci pencarian atau bersihkan filter status dan kategori."
          actionLabel="Bersihkan Filter"
          onAction={() => {
            setSearch("");
            setSelectedCategory("all");
            setSelectedStatus("all");
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
