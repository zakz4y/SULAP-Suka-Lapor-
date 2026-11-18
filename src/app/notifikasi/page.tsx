"use client";

import React, { useState } from "react";
import { TopHeader } from "@/components/navigation/top-header";
import { Bell, Check, Info } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function NotifikasiPage() {
  const [notifications, setNotifications] = useState([
    {
      id: "n1",
      title: "Laporan Baru Diterima",
      message: "Laporan SULAP-RT01-0028 (Lampu Penerangan Mati) baru saja dikirim oleh warga.",
      time: "10 menit lalu",
      isUnread: true,
    },
    {
      id: "n2",
      title: "Permintaan Bergabung Warga",
      message: "Dewi Lestari mengajukan bergabung ke RT 01 Melati.",
      time: "1 jam lalu",
      isUnread: true,
    },
    {
      id: "n3",
      title: "Pekerjaan Selesai",
      message: "Laporan SULAP-RT01-0025 (Bak Sampah Utama) telah ditandai Selesai.",
      time: "Kemarin",
      isUnread: false,
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <TopHeader />

      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E3]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-[#E7EFF9] text-[#1D5FA8] flex items-center justify-center">
            <Bell size={18} weight="bold" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#121915]">
              Pusat Notifikasi RT
            </h2>
            <p className="text-xs text-[#4A564F]">Pemberitahuan aktivitas dan pembaruan laporan</p>
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
          <Check size={16} weight="bold" />
          <span>Tandai Semua Dibaca</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-[14px] border transition-colors flex items-start gap-3 ${
              n.isUnread
                ? "bg-[#F7F9F7] border-[#C4CEC6]"
                : "bg-white border-[#E2E8E3] opacity-80"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#EEF2EE] flex items-center justify-center text-[#135E3F] shrink-0 mt-0.5">
              <Info size={16} weight="bold" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-[#121915]">
                  {n.title}
                </h3>
                <span className="text-[11px] text-[#7D8A82] tabular-nums">{n.time}</span>
              </div>
              <p className="text-xs text-[#4A564F] mt-1 leading-relaxed">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
