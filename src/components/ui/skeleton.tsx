import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#E5EAE6] rounded-[10px] ${className}`} />;
}
