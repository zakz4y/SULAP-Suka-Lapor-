"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  House,
  SquaresFour,
  Files,
  PlusCircle,
  Users,
  Bell,
  Gear,
  User,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
} from "@phosphor-icons/react";

export function Sidebar() {
  const pathname = usePathname();
  const { role, switchRole } = useAuth();

  // Menu Warga (PRD §6.1) vs Menu Admin RT (PRD §6.2)
  const navItems =
    role === "admin"
      ? [
          { label: "Dashboard", href: "/", icon: SquaresFour },
          { label: "Laporan RT", href: "/laporan", icon: Files },
          { label: "Buat Laporan", href: "/laporan/buat", icon: PlusCircle },
          { label: "Warga & Anggota", href: "/warga", icon: Users },
          { label: "Notifikasi", href: "/notifikasi", icon: Bell, badge: 2 },
          { label: "Pengaturan", href: "/pengaturan", icon: Gear },
        ]
      : [
          { label: "Beranda Warga", href: "/", icon: House },
          { label: "Daftar Laporan", href: "/laporan", icon: Files },
          { label: "Buat Laporan", href: "/laporan/buat", icon: PlusCircle },
          { label: "Notifikasi", href: "/notifikasi", icon: Bell, badge: 1 },
          { label: "Profil Saya", href: "/profil", icon: User },
        ];

  return (
    <aside
      aria-label="Navigasi Utama Desktop"
      className="hidden lg:flex flex-col justify-between w-[220px] shrink-0 bg-[#141916] text-[#A3B1A8] rounded-[22px] p-3.5 select-none"
    >
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 px-3 py-3 mb-3">
          <div className="w-8 h-8 rounded-[10px] bg-[#D2F45A] flex items-center justify-center text-[#111812] font-black text-sm">
            S
          </div>
          <div>
            <span className="font-bold text-white tracking-wide text-base block">SULAP</span>
            <span className="text-[11px] text-[#A3B1A8] block">Suka Lapor RT</span>
          </div>
        </div>

        {/* Role Toggle Switcher for Testing/Demonstration */}
        <div className="px-2 mb-3">
          <div className="p-1 rounded-[12px] bg-[#1C231F] border border-[#27322B] flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => switchRole("resident")}
              className={`flex-1 py-1 rounded-[8px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                role === "resident"
                  ? "bg-[#D2F45A] text-[#111812]"
                  : "text-[#A3B1A8] hover:text-white"
              }`}
            >
              <UserCheck size={13} weight="bold" />
              <span>Warga</span>
            </button>
            <button
              type="button"
              onClick={() => switchRole("admin")}
              className={`flex-1 py-1 rounded-[8px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                role === "admin"
                  ? "bg-[#D2F45A] text-[#111812]"
                  : "text-[#A3B1A8] hover:text-white"
              }`}
            >
              <ShieldCheck size={13} weight="bold" />
              <span>Admin RT</span>
            </button>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-1.5" aria-label="Menu Aplikasi">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#D2F45A] text-[#111812] font-semibold"
                    : "text-[#A3B1A8] hover:text-white hover:bg-[#1E2521]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    size={18}
                    weight={isActive ? "fill" : "regular"}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && !isActive && (
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#9C3412] text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom PWA Info Box */}
      <div className="bg-[#1C231F] rounded-[16px] p-3 text-left border border-[#27322B]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-[#D2F45A] uppercase tracking-wider">
            {role === "admin" ? "Mode Admin RT" : "Mode Warga"}
          </span>
          <div className="w-6 h-6 rounded-full bg-[#D2F45A] text-[#111812] flex items-center justify-center">
            <ArrowUpRight size={13} weight="bold" aria-hidden="true" />
          </div>
        </div>
        <p className="text-xs text-white font-medium mb-0.5">Pasang SULAP (PWA)</p>
        <p className="text-[10px] text-[#89978E] leading-relaxed">
          Bisa digunakan warga langsung dari layar utama HP tanpa store.
        </p>
      </div>
    </aside>
  );
}
