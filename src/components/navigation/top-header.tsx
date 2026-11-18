"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, Plus, Bell, SignOut } from "@phosphor-icons/react";
import { useAuth } from "@/components/providers/auth-provider";

interface TopHeaderProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export function TopHeader({ searchQuery = "", onSearchChange }: TopHeaderProps) {
  const { user, role, logout } = useAuth();
  const router = useRouter();

  const initials =
    user?.displayName
      .split(" ")
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("") || "SU";

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E2E8E3]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E2F4EE] text-[#0D6657]">
            {user?.rtName || "RT 01 RW 04 Melati"}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              role === "admin"
                ? "bg-[#FDF4E2] text-[#8C5800]"
                : "bg-[#EEF2EE] text-[#135E3F]"
            }`}
          >
            {role === "admin" ? "Peran: Admin RT" : "Peran: Warga RT"}
          </span>
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-[#121915] mt-1">
          {role === "admin"
            ? `Selamat bertugas, ${user?.displayName || "Admin RT"} 👋`
            : `Halo, ${user?.displayName || "Warga RT"} 👋`}
        </h1>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Search Input Pill */}
        <div className="relative flex-1 sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7D8A82]">
            <MagnifyingGlass size={16} weight="bold" aria-hidden="true" />
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Cari nomor, fasilitas..."
            aria-label="Cari nomor laporan atau fasilitas"
            className="w-full min-h-[42px] pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-[#F4F6F4] hover:bg-[#EEF2EE] border-0 rounded-full text-[#121915] placeholder:text-[#7D8A82] transition-colors focus-visible:outline-2 focus-visible:outline-[#145C41]"
          />
        </div>

        {/* Quick Create Report CTA on Mobile */}
        <Link
          href="/laporan/buat"
          className="inline-flex sm:hidden items-center justify-center min-h-[42px] min-w-[42px] rounded-full bg-[#135E3F] text-white hover:bg-[#0E4931]"
          aria-label="Buat Laporan Baru"
        >
          <Plus size={18} weight="bold" />
        </Link>

        {/* Notification Bell */}
        <Link
          href="/notifikasi"
          aria-label="Pemberitahuan"
          className="relative inline-flex items-center justify-center min-h-[42px] min-w-[42px] rounded-full bg-[#F4F6F4] text-[#121915] hover:bg-[#E5ECE7] transition-colors"
        >
          <Bell size={18} weight="bold" aria-hidden="true" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#9C3412]" />
        </Link>

        {/* Profil + Keluar Akun */}
        <div className="flex items-center gap-1.5 pl-1 border-l border-[#E2E8E3]">
          <div
            role="img"
            aria-label={`Profil ${user?.displayName || "Pengguna"}`}
            className="w-9 h-9 rounded-full bg-[#141916] text-[#D2F45A] font-bold text-[11px] flex items-center justify-center"
          >
            {initials}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Keluar akun"
            title="Keluar akun"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-[#4A564F] hover:bg-[#FDEEE9] hover:text-[#9C3412] transition-colors cursor-pointer"
          >
            <SignOut size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
