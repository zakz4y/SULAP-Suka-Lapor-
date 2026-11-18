import { describe, it, expect } from "vitest";
import { createReportSchema, updateStatusSchema } from "@/lib/schemas";

describe("Validasi Skema Zod SULAP (api-contract.md)", () => {
  it("menolak laporan jika judul kurang dari 8 karakter", () => {
    const invalid = {
      title: "Lampu",
      categoryId: "cat_pju",
      description: "Lampu mati sejak kemarin malam dan area gelap.",
      locationNotes: "Depan rumah no 12",
      locationSource: "manual" as const,
      attachments: [{ id: "1", url: "/img.jpg", name: "foto.jpg" }],
    };

    const res = createReportSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("minimal 8 karakter");
    }
  });

  it("menolak laporan jika deskripsi kurang dari 20 karakter", () => {
    const invalid = {
      title: "Lampu PJU Mati Total",
      categoryId: "cat_pju",
      description: "Pendek sekali",
      locationNotes: "Depan rumah no 12",
      locationSource: "manual" as const,
      attachments: [{ id: "1", url: "/img.jpg", name: "foto.jpg" }],
    };

    const res = createReportSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("minimal 20 karakter");
    }
  });

  it("menolak laporan jika tidak ada foto bukti (min 1 foto)", () => {
    const invalid = {
      title: "Lampu PJU Mati Total",
      categoryId: "cat_pju",
      description: "Lampu mati sejak kemarin malam dan membahayakan pengendara motor.",
      locationNotes: "Depan rumah no 12",
      locationSource: "manual" as const,
      attachments: [],
    };

    const res = createReportSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("minimal 1 foto");
    }
  });

  it("menerima laporan yang memenuhi seluruh kriteria PRD", () => {
    const valid = {
      title: "Lampu Penerangan Padam di Gang Melati 3",
      categoryId: "cat_pju",
      description: "Lampu PJU padam sejak kemarin malam sehingga lingkungan gelap dan rawan kejahatan.",
      locationNotes: "Tiang PJU persis depan pagar rumah Bu Ratna",
      locationSource: "gps" as const,
      lat: -6.2297,
      lng: 106.8295,
      accuracyMeters: 10,
      attachments: [{ id: "att_1", url: "/bukti.webp", name: "foto_pju.webp" }],
    };

    const res = createReportSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("validasi update status mewajibkan catatan minimal 10 karakter", () => {
    const invalid = { statusKey: "resolved", notes: "Selesai" };
    const res = updateStatusSchema.safeParse(invalid);
    expect(res.success).toBe(false);

    const valid = {
      statusKey: "resolved",
      notes: "Bohlam dan kabel fitting telah diganti oleh petugas RT. Selesai.",
    };
    const validRes = updateStatusSchema.safeParse(valid);
    expect(validRes.success).toBe(true);
  });
});
