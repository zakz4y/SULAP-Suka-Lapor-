"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Cpu,
  ClockCounterClockwise,
  WarningOctagon,
  SignOut,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function DevPortalPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "rts" | "audit" | "moderasi">("overview");
  const [softDeleteTarget, setSoftDeleteTarget] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [logs, setLogs] = useState([
    {
      id: "log_1",
      actor: "dev_superadmin@sulap.id",
      action: "UPDATE_PLATFORM_CONFIG",
      target: "RT 01 Melati",
      reason: "Penyesuaian batas unggah foto ke 5MB",
      time: "18 Nov 2026, 14:10 UTC",
    },
    {
      id: "log_2",
      actor: "dev_superadmin@sulap.id",
      action: "SOFT_DELETE_REPORT",
      target: "SULAP-RT02-0004",
      reason: "Permintaan warga: foto memuat dokumen privasi",
      time: "17 Nov 2026, 09:25 UTC",
    },
  ]);

  const handleSoftDelete = (e: React.FormEvent) => {    e.preventDefault();
    if (!softDeleteTarget || deleteReason.length < 10) {
      alert("Masukkan nomor laporan dan alasan penghapusan minimal 10 karakter.");
      return;
    }

    const newLog = {
      id: `log_${Date.now()}`,
      actor: "dev_superadmin@sulap.id",
      action: "SOFT_DELETE_REPORT",
      target: softDeleteTarget,
      reason: deleteReason,
      time: new Date().toUTCString(),
    };

    setLogs([newLog, ...logs]);
    alert(`Laporan ${softDeleteTarget} berhasil di-soft delete dan dicatat ke Audit Log.`);
    setSoftDeleteTarget("");
    setDeleteReason("");
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex flex-col gap-5 text-left w-full">
      {/* Banner Khusus Developer */}
      <div className="bg-[#141916] text-white p-4 rounded-[16px] flex items-center justify-between border-2 border-[#D2F45A]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#D2F45A] text-[#111812] flex items-center justify-center font-bold">
            <Cpu size={20} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#D2F45A] uppercase tracking-wider">
                Portal Developer & Super Admin
              </span>
              <span className="text-[10px] bg-[#27322B] text-[#A3B1A8] px-2 py-0.5 rounded-full">
                Lintas RT & Platform
              </span>
            </div>
            <p className="text-xs text-[#A3B1A8] mt-0.5">
              Akses khusus teknis, audit log, moderasi darurat, dan manajemen seluruh RT.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Keluar dari akun developer"
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-[10px] text-xs font-semibold text-[#A3B1A8] hover:text-white hover:bg-[#27322B] transition-colors shrink-0 cursor-pointer"
        >
          <SignOut size={14} weight="bold" aria-hidden="true" />
          <span>Keluar</span>
        </button>
      </div>

      {/* Dev Tabs */}
      <div className="flex gap-2 border-b border-[#E2E8E3] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`min-h-[44px] px-4 py-2 rounded-[10px] text-xs font-bold transition-colors ${
            activeTab === "overview"
              ? "bg-[#135E3F] text-white"
              : "bg-[#F7F9F7] text-[#4A564F] hover:bg-[#EEF2EE]"
          }`}
        >
          Ringkasan Platform
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("moderasi")}
          className={`min-h-[44px] px-4 py-2 rounded-[10px] text-xs font-bold transition-colors ${
            activeTab === "moderasi"
              ? "bg-[#9C3412] text-white"
              : "bg-[#F7F9F7] text-[#4A564F] hover:bg-[#EEF2EE]"
          }`}
        >
          Soft Delete Laporan (FR-DEV-02)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`min-h-[44px] px-4 py-2 rounded-[10px] text-xs font-bold transition-colors ${
            activeTab === "audit"
              ? "bg-[#135E3F] text-white"
              : "bg-[#F7F9F7] text-[#4A564F] hover:bg-[#EEF2EE]"
          }`}
        >
          Audit Log Platform (FR-DEV-04)
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-white border border-[#E2E8E3] rounded-[16px]">
            <span className="text-xs text-[#7D8A82]">Total Wilayah RT Terdaftar</span>
            <div className="text-2xl font-black text-[#121915] mt-1 tabular-nums">4 RT</div>
            <span className="text-[11px] text-[#135E3F] font-semibold">1 RT Pilot Aktif (RT 01)</span>
          </div>
          <div className="p-4 bg-white border border-[#E2E8E3] rounded-[16px]">
            <span className="text-xs text-[#7D8A82]">Total Pengguna Platform</span>
            <div className="text-2xl font-black text-[#121915] mt-1 tabular-nums">128 Akun</div>
            <span className="text-[11px] text-[#4A564F]">Warga + Pengurus RT</span>
          </div>
          <div className="p-4 bg-white border border-[#E2E8E3] rounded-[16px]">
            <span className="text-xs text-[#7D8A82]">Total Laporan Sejak Rilis</span>
            <div className="text-2xl font-black text-[#121915] mt-1 tabular-nums">48 Tiket</div>
            <span className="text-[11px] text-[#1B6836] font-semibold">95.8% Tingkat Selesai</span>
          </div>
        </div>
      )}

      {/* Tab: Moderasi / Soft Delete */}
      {activeTab === "moderasi" && (
        <div className="p-5 bg-white border border-[#F8D0C3] rounded-[18px]">
          <div className="flex items-center gap-2 mb-3 text-[#9C3412]">
            <WarningOctagon size={22} weight="bold" />
            <h2 className="text-sm font-bold text-[#121915]">
              Penghapusan Laporan Terbatas (Soft Delete dengan Audit Log)
            </h2>
          </div>
          <p className="text-xs text-[#4A564F] mb-4 leading-relaxed">
            Sesuai aturan PRD §8.6 dan §9.6: Admin RT dilarang menghapus laporan. Penghapusan darurat hanya dapat dilakukan Developer/Super Admin dengan alasan wajib dan terekam di audit log.
          </p>

          <form onSubmit={handleSoftDelete} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-[#121915] block mb-1">
                Nomor Tiket Laporan *
              </label>
              <input
                type="text"
                value={softDeleteTarget}
                onChange={(e) => setSoftDeleteTarget(e.target.value)}
                placeholder="Contoh: SULAP-RT01-0028"
                className="w-full min-h-[44px] px-3 text-sm rounded-[10px] border border-[#C4CEC6]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#121915] block mb-1">
                Alasan Wajib Penghapusan (Audit) *
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Jelaskan alasan resmi (misal: pelanggaran privasi NIK, data palsu terbukti)..."
                className="w-full min-h-[80px] p-3 text-sm rounded-[10px] border border-[#C4CEC6]"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="destructive" size="md">
                Jalankan Soft Delete & Simpan ke Audit Log
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Audit Log */}
      {activeTab === "audit" && (
        <div className="p-5 bg-white border border-[#E2E8E3] rounded-[18px]">
          <div className="flex items-center gap-2 mb-3">
            <ClockCounterClockwise size={20} weight="bold" className="text-[#135E3F]" />
            <h2 className="text-sm font-bold text-[#121915]">
              Audit Log Tindakan Sensitif Platform
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-[#F7F9F7] rounded-[12px] border border-[#E2E8E3] text-xs"
              >
                <div className="flex justify-between items-center text-[#7D8A82]">
                  <span className="font-mono text-[#135E3F] font-bold">{log.action}</span>
                  <span className="tabular-nums">{log.time}</span>
                </div>
                <div className="font-semibold text-[#121915] mt-1">
                  Target: {log.target} &bull; Aktor: {log.actor}
                </div>
                <p className="text-[#4A564F] mt-0.5">Alasan: {log.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
