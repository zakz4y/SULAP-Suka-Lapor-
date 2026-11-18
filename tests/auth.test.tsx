import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("Sesi akun SULAP (FR-AUTH-01, FR-AUTH-02)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("mulai tanpa sesi sehingga halaman terlindungi dialihkan ke login", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it("login warga menyimpan sesi dan peran resident", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login("resident");
    });

    expect(result.current.user?.role).toBe("resident");
    expect(localStorage.getItem("sulap_role")).toBe("resident");
  });

  it("login admin RT mendapat peran admin", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login("admin");
    });

    expect(result.current.role).toBe("admin");
  });

  it("logout mengakhiri sesi dan menghapus peran tersimpan", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login("admin");
    });
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("sulap_role")).toBeNull();
  });
});
