"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

const PUBLIC_ROUTES = ["/login"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, role, isReady } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  React.useEffect(() => {
    if (!isReady) return;

    // Belum login: kunci seluruh halaman terlindungi
    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }

    // Halaman developer hanya untuk peran developer
    if (user && pathname.startsWith("/dev") && role !== "developer") {
      router.replace("/");
      return;
    }

    // Developer selalu diarahkan ke portal platform
    if (user && role === "developer" && !pathname.startsWith("/dev")) {
      router.replace("/dev");
    }
  }, [isReady, user, isPublic, pathname, role, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF2EE]">
        <p className="text-sm text-[#4A564F]">Memuat sesi akun...</p>
      </div>
    );
  }

  if (!user && !isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF2EE]">
        <p className="text-sm text-[#4A564F]">Mengalihkan ke halaman masuk...</p>
      </div>
    );
  }

  return <>{children}</>;
}
