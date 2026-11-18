"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { TopHeader } from "@/components/navigation/top-header";
import { Shield, SignOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export default function ProfilPage() {
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
    <div className="flex flex-col gap-4 text-left w-full">
      <TopHeader />

      <div className="p-5 sm:p-6 bg-white border border-[#E2E8E3] rounded-[22px] flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#141916] text-[#D2F45A] font-extrabold text-lg flex items-center justify-center border-2 border-[#D2F45A]">
            {initials}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#121915]">
              {user?.displayName || "Pengguna SULAP"}
            </h2>
            <p className="text-xs text-[#7D8A82]">ID akun: {user?.id || "-"}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Shield size={14} weight="bold" className="text-[#135E3F]" />
              <span className="text-xs font-semibold text-[#135E3F]">
                {role === "admin" ? "Pengurus / Admin RT" : "Warga Terverifikasi"}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8E3] flex flex-col gap-2 text-xs">
          <div className="flex justify-between py-2 border-b border-[#E2E8E3] gap-4">
            <span className="text-[#7D8A82]">Wilayah RT aktif</span>
            <span className="font-semibold text-[#121915] text-right">{user?.rtName || "-"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#E2E8E3] gap-4">
            <span className="text-[#7D8A82]">Status keanggotaan</span>
            <span className="font-semibold text-[#1B6836]">Aktif terverifikasi</span>
          </div>
          <div className="flex justify-between py-2 gap-4">
            <span className="text-[#7D8A82]">Bahasa antarmuka</span>
            <span className="font-semibold text-[#121915]">Bahasa Indonesia (id-ID)</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8E3]">
          <Button
            variant="destructive"
            size="md"
            className="w-full sm:w-auto"
            onClick={handleLogout}
          >
            <SignOut size={16} weight="bold" />
            <span>Keluar Akun</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
