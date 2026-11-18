"use client";

import React from "react";
import { TopHeader } from "@/components/navigation/top-header";
import { RoleGuard } from "@/components/providers/role-guard";
import { Gear, ShieldCheck } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function PengaturanContent() {
  return (
    <div className="flex flex-col gap-4 text-left w-full">
      <TopHeader />

      <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8E3]">
        <div className="w-8 h-8 rounded-[10px] bg-[#EEF2EE] text-[#121915] flex items-center justify-center">
          <Gear size={18} weight="bold" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#121915]">
            Pengaturan Lingkungan RT
          </h2>
          <p className="text-xs text-[#4A564F]">Konfigurasi wilayah dan alur kerja pelaporan</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-white p-5 rounded-[18px] border border-[#E2E8E3]">
        <Input
          label="Nama Lingkungan RT"
          defaultValue="RT 01 RW 04 Melati"
          helperText="Nama resmi yang tampil di kop tiket dan laporan warga."
        />

        <Input
          label="Kode Undangan Warga (Invite Code)"
          defaultValue="MELATI-01-2026"
          helperText="Bagikan kode ini khusus kepada warga resmi RT 01."
        />

        <div className="p-3 bg-[#F7F9F7] rounded-[12px] border border-[#E2E8E3] flex items-center gap-3">
          <ShieldCheck size={24} weight="bold" className="text-[#135E3F] shrink-0" />
          <div className="text-xs text-[#4A564F]">
            <span className="font-bold text-[#121915] block">Integritas Riwayat Aktif</span>
            Sesuai aturan PRD, laporan yang telah masuk tidak dapat dihapus oleh Pengurus RT.
          </div>
        </div>

        <div className="pt-3 border-t border-[#E2E8E3] flex justify-end">
          <Button variant="primary" size="md">
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PengaturanPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <PengaturanContent />
    </RoleGuard>
  );
}
