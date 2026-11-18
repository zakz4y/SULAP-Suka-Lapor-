"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Role } from "@/lib/types";

/**
 * Menjaga halaman agar hanya peran tertentu yang bisa membuka.
 * Server tetap wajib memeriksa izin; ini hanya lapisan tampilan.
 */
export function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { user, role, isReady } = useAuth();
  const router = useRouter();
  const isAllowed = user !== null && allow.includes(role);

  React.useEffect(() => {
    if (isReady && !isAllowed) {
      router.replace("/");
    }
  }, [isReady, isAllowed, router]);

  if (!isReady || !isAllowed) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[#4A564F]">
          Halaman ini hanya untuk pengurus RT. Mengalihkan...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
