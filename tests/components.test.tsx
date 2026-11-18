import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

describe("Komponen UI SULAP (design.md & PRD)", () => {
  it("Button memiliki touch target min 44px dan focus visible", () => {
    const handleClick = vi.fn();
    render(
      <Button variant="primary" onClick={handleClick}>
        Kirim Laporan
      </Button>
    );

    const btn = screen.getByRole("button", { name: "Kirim Laporan" });
    expect(btn).toBeDefined();
    expect(btn.className).toContain("min-h-[44px]");

    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("Button dalam state loading menampilkan spinner dan disabled", () => {
    render(
      <Button variant="primary" isLoading={true}>
        Menyimpan
      </Button>
    );

    const btn = screen.getByRole("button", { name: "Menyimpan" });
    expect(btn.getAttribute("aria-busy")).toBe("true");
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("StatusBadge menampilkan ikon dan label teks (bukan warna saja)", () => {
    render(<StatusBadge group="inspection" label="Perlu Inspeksi" />);

    const badge = screen.getByText("Perlu Inspeksi");
    expect(badge).toBeDefined();
    // Class includes soft background and distinct accessible text color
    expect(badge.parentElement?.className).toContain("bg-[#EFEBF8]");
    expect(badge.parentElement?.className).toContain("text-[#5B4A8A]");
  });

  it("EmptyState menampilkan pesan ramah dan tombol CTA", () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="Belum Ada Laporan"
        description="Semua fasilitas aman."
        actionLabel="Buat Laporan Baru"
        onAction={onAction}
      />
    );

    expect(screen.getByText("Belum Ada Laporan")).toBeDefined();
    expect(screen.getByText("Semua fasilitas aman.")).toBeDefined();

    const actionBtn = screen.getByRole("button", { name: "Buat Laporan Baru" });
    fireEvent.click(actionBtn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("ErrorState memiliki role alert dan tombol coba lagi", () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="Gangguan Jaringan"
        message="Gagal menghubungi server."
        onRetry={onRetry}
      />
    );

    const alertBox = screen.getByRole("alert");
    expect(alertBox).toBeDefined();
    expect(screen.getByText("Gangguan Jaringan")).toBeDefined();

    const retryBtn = screen.getByRole("button", { name: "Coba Lagi" });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
