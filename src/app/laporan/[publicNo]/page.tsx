"use client";

import React, { use } from "react";
import { ReportDetail } from "@/components/reports/report-detail";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { mockReports } from "@/lib/mock-data";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ publicNo: string }>;
}) {
  const resolvedParams = use(params);
  const { role } = useAuth();
  const report = mockReports.find((r) => r.publicNo === resolvedParams.publicNo);

  if (!report) {
    return (
      <div className="py-8">
        <EmptyState
          title="Laporan Tidak Ditemukan"
          description={`Nomor laporan ${resolvedParams.publicNo} tidak terdaftar atau telah dipindahkan.`}
          actionLabel="Kembali ke Daftar Laporan"
          onAction={() => {
            window.location.href = "/laporan";
          }}
        />
      </div>
    );
  }

  // Warga (resident) TIDAK BISA ubah status laporan. Hanya Admin RT yang bisa.
  const isUserAdmin = role === "admin";

  return <ReportDetail report={report} isAdmin={isUserAdmin} />;
}
