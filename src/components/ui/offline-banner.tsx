"use client";

import React, { useState, useEffect } from "react";
import { WifiSlash } from "@phosphor-icons/react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!window.navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#141916] text-[#D2F45A] px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b border-[#242E28]"
    >
      <WifiSlash size={18} weight="bold" aria-hidden="true" />
      <span>Koneksi internet terputus. Input Anda tetap tersimpan di perangkat ini.</span>
    </div>
  );
}
