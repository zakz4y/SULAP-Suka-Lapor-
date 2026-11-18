"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/navigation/sidebar";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { AuthGate } from "@/components/providers/auth-gate";
import { OfflineBanner } from "@/components/ui/offline-banner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith("/login");
  const isDevPage = pathname.startsWith("/dev");

  // Halaman login tampil tanpa sidebar dan tanpa bottom nav
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Portal developer terpisah dari navigasi operasional RT (PRD §6.3)
  if (isDevPage) {
    return (
      <>
        <OfflineBanner />
        <AuthGate>
          <div className="w-full min-h-screen p-2.5">
            <main
              id="main-content"
              className="w-full min-h-[calc(100vh-1.25rem)] bg-white border border-[#E2E8E3] rounded-[22px] sm:rounded-[26px] shadow-xs p-4 sm:p-6 lg:p-7"
            >
              {children}
            </main>
          </div>
        </AuthGate>
      </>
    );
  }

  return (
    <>
      <OfflineBanner />
      <AuthGate>
        <div className="w-full lg:h-screen flex gap-2.5 p-2.5 lg:overflow-hidden">
          <Sidebar />

          <main
            id="main-content"
            className="flex-1 min-w-0 w-full bg-white border border-[#E2E8E3] rounded-[22px] sm:rounded-[26px] shadow-xs flex flex-col lg:h-full lg:overflow-hidden"
          >
            <div className="flex-1 lg:overflow-y-auto p-4 sm:p-6 lg:p-7 pb-24 lg:pb-7">
              {children}
            </div>
          </main>
        </div>

        <BottomNav />
      </AuthGate>
    </>
  );
}
