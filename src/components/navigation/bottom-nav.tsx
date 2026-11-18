"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, SquaresFour, Files, Plus, Bell, User } from "@phosphor-icons/react";
import { useAuth } from "@/components/providers/auth-provider";

export function BottomNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  const items =
    role === "admin"
      ? [
          { label: "Dashboard", href: "/", icon: SquaresFour },
          { label: "Laporan", href: "/laporan", icon: Files },
          { label: "Lapor", href: "/laporan/buat", icon: Plus, isAction: true },
          { label: "Notif", href: "/notifikasi", icon: Bell, badge: 2 },
          { label: "Akun", href: "/profil", icon: User },
        ]
      : [
          { label: "Beranda", href: "/", icon: House },
          { label: "Laporan", href: "/laporan", icon: Files },
          { label: "Lapor", href: "/laporan/buat", icon: Plus, isAction: true },
          { label: "Notif", href: "/notifikasi", icon: Bell, badge: 1 },
          { label: "Profil", href: "/profil", icon: User },
        ];

  return (
    <nav
      aria-label="Navigasi Bawah Ponsel"
      className="lg:hidden fixed bottom-3 inset-x-3 z-40 bg-[#141916] text-[#A3B1A8] rounded-[20px] px-2 py-1.5 shadow-lg border border-[#27322B] select-none"
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label="Buat Laporan Baru"
                className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] -mt-5 rounded-full bg-[#D2F45A] text-[#111812] shadow-md hover:bg-[#C2E645] transition-transform active:scale-95"
              >
                <Icon size={24} weight="bold" aria-hidden="true" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 rounded-xl text-[10px] font-medium transition-colors ${
                isActive ? "text-[#D2F45A]" : "text-[#A3B1A8] hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon
                  size={20}
                  weight={isActive ? "fill" : "regular"}
                  aria-hidden="true"
                />
                {item.badge && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#9C3412]" />
                )}
              </div>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
