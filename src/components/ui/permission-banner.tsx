"use client";

import React from "react";
import { MapPin, Info } from "@phosphor-icons/react";

interface PermissionBannerProps {
  onSelectManual?: () => void;
}

export function PermissionBanner({ onSelectManual }: PermissionBannerProps) {
  return (
    <div
      role="region"
      aria-label="Pemberitahuan Izin Lokasi"
      className="flex items-start gap-3 p-3.5 bg-[#FDF4E2] border border-[#F5DEAF] rounded-[12px] text-left text-xs sm:text-sm text-[#8C5800]"
    >
      <Info size={20} weight="fill" className="shrink-0 mt-0.5 text-[#8C5800]" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-semibold text-[#121915]">Izin lokasi perangkat tidak aktif</p>
        <p className="text-[#4A564F] mt-0.5">
          Anda tetap dapat mengirim laporan dengan menuliskan patokan atau alamat jelas di kotak petunjuk lokasi.
        </p>
        {onSelectManual && (
          <button
            type="button"
            onClick={onSelectManual}
            className="mt-2 inline-flex items-center gap-1.5 font-semibold text-[#135E3F] hover:underline cursor-pointer"
          >
            <MapPin size={16} weight="bold" />
            <span>Tulis patokan lokasi manual</span>
          </button>
        )}
      </div>
    </div>
  );
}
