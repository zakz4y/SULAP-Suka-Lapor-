"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, UserCheck, Cpu, ArrowRight, GoogleLogo } from "@phosphor-icons/react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>("resident");
  const [inviteCode, setInviteCode] = useState("MELATI-01-2026");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (selectedRole !== "developer" && inviteCode.trim().length < 5) {
      setErrorMessage("Kode undangan RT wajib diisi minimal 5 karakter.");
      return;
    }

    setIsLoading(true);

    // Simulasi jabat tangan Google OAuth pada mode prototipe
    await new Promise((resolve) => setTimeout(resolve, 600));

    login(selectedRole);
    router.replace(selectedRole === "developer" ? "/dev" : "/");
  };

  const roleCards: Array<{ key: Role; label: string; icon: React.ReactNode; description: string }> = [
    {
      key: "resident",
      label: "Warga",
      icon: <UserCheck size={20} weight="bold" />,
      description: "Lapor masalah dan pantau status",
    },
    {
      key: "admin",
      label: "Admin RT",
      icon: <ShieldCheck size={20} weight="bold" />,
      description: "Kelola laporan dan anggota RT",
    },
    {
      key: "developer",
      label: "Developer",
      icon: <Cpu size={20} weight="bold" />,
      description: "Akses platform lintas RT",
    },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md bg-white border border-[#E2E8E3] rounded-[24px] p-6 sm:p-8 shadow-xs">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-[12px] bg-[#D2F45A] flex items-center justify-center text-[#111812] font-black text-lg">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#121915] leading-none">SULAP</h1>
            <p className="text-xs text-[#4A564F] mt-1">Suka Lapor &bull; Fasilitas Lingkungan RT</p>
          </div>
        </div>

        <div className="mb-5">
          <h2 className="text-base font-bold text-[#121915]">Masuk ke lingkungan RT</h2>
          <p className="text-xs text-[#7D8A82] mt-1 leading-relaxed">
            Gunakan akun Google Anda, lalu masuk sebagai warga atau pengurus RT yang sudah terverifikasi.
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
          {/* Pilih peran (mode prototipe) */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-semibold text-[#121915] mb-1">
              Pilih peran masuk
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {roleCards.map((roleCard) => {
                const isSelected = selectedRole === roleCard.key;
                return (
                  <label
                    key={roleCard.key}
                    className={`p-3 rounded-[12px] border text-left transition-colors cursor-pointer flex flex-col gap-1.5 min-h-[44px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#145C41] ${
                      isSelected
                        ? roleCard.key === "developer"
                          ? "border-[#141916] bg-[#141916] text-[#D2F45A]"
                          : "border-[#135E3F] bg-[#E2F4EE] text-[#135E3F]"
                        : "border-[#E2E8E3] bg-[#F7F9F7] text-[#4A564F] hover:bg-[#EEF2EE]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={roleCard.key}
                      checked={isSelected}
                      onChange={() => setSelectedRole(roleCard.key)}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      {roleCard.icon}
                      {roleCard.label}
                    </span>
                    <span
                      className={`text-[10px] leading-snug ${
                        isSelected
                          ? roleCard.key === "developer"
                            ? "text-[#C7D8CC]"
                            : "text-[#0D6657]"
                          : "text-[#7D8A82]"
                      }`}
                    >
                      {roleCard.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {selectedRole !== "developer" && (
            <Input
              label="Kode undangan RT"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              helperText="Kode diperoleh dari pengurus RT. Contoh: MELATI-01-2026"
              autoComplete="off"
            />
          )}

          {errorMessage && (
            <p role="alert" className="text-xs font-medium text-[#9C3412]">
              {errorMessage}
            </p>
          )}

          <Button
            type="submit"
            variant={selectedRole === "developer" ? "lime" : "primary"}
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            <GoogleLogo size={18} weight="bold" />
            <span>Masuk dengan Google</span>
            <ArrowRight size={16} weight="bold" />
          </Button>
        </form>

        <div className="mt-5 p-3 rounded-[10px] bg-[#F7F9F7] border border-[#E2E8E3]">
          <p className="text-[11px] text-[#4A564F] leading-relaxed">
            <strong className="text-[#121915]">Mode prototipe:</strong> masuk belum terhubung ke Google
            dan belum menyimpan data nyata. Pilih peran di atas untuk mencoba tampilan tiap pengguna.
          </p>
        </div>

        <p className="text-[11px] text-[#7D8A82] text-center mt-4 leading-relaxed">
          Identitas pelapor tidak ditampilkan kepada warga lain. Data hanya untuk anggota RT terverifikasi.
        </p>
      </div>
    </div>
  );
}
