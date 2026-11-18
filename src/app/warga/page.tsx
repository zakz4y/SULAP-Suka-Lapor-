"use client";

import React from "react";
import { TopHeader } from "@/components/navigation/top-header";
import { RoleGuard } from "@/components/providers/role-guard";
import { Users, CheckCircle, Clock } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

function WargaContent() {
  const members = [
    { id: "m1", name: "Bambang Sutrisno", role: "Admin RT", status: "Aktif", rumah: "Blok A1 No. 04" },
    { id: "m2", name: "Siti Rahmawati", role: "Warga", status: "Aktif", rumah: "Blok B2 No. 11" },
    { id: "m3", name: "Ahmad Dahlan", role: "Warga", status: "Aktif", rumah: "Blok C1 No. 02" },
    { id: "m4", name: "Dewi Lestari", role: "Warga", status: "Menunggu Persetujuan", rumah: "Blok D3 No. 08" },
  ];

  return (
    <div className="flex flex-col gap-4 text-left">
      <TopHeader />

      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E3]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-[#E2F4EE] text-[#0D6657] flex items-center justify-center">
            <Users size={18} weight="bold" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#121915]">
              Daftar Anggota & Warga RT 01
            </h2>
            <p className="text-xs text-[#4A564F]">Kelola keanggotaan warga lingkungan</p>
          </div>
        </div>

        <Button variant="secondary" size="sm">
          Undang Warga Baru
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8E3] text-[#7D8A82]">
              <th className="py-2.5 px-3 font-semibold">Nama Warga</th>
              <th className="py-2.5 px-3 font-semibold">Alamat Rumah</th>
              <th className="py-2.5 px-3 font-semibold">Peran</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-3 font-semibold text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-[#E2E8E3] hover:bg-[#F7F9F7]">
                <td className="py-3 px-3 font-bold text-[#121915]">{m.name}</td>
                <td className="py-3 px-3 text-[#4A564F]">{m.rumah}</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2EE] text-[#135E3F]">
                    {m.role}
                  </span>
                </td>
                <td className="py-3 px-3">
                  {m.status === "Aktif" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B6836]">
                      <CheckCircle size={14} weight="bold" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C5800]">
                      <Clock size={14} weight="bold" />
                      Menunggu
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    type="button"
                    className="min-h-[44px] px-2 text-xs font-semibold text-[#135E3F] hover:underline cursor-pointer"
                  >
                    Kelola
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function WargaPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <WargaContent />
    </RoleGuard>
  );
}
