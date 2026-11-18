import { z } from "zod";

export const createReportSchema = z.object({
  title: z
    .string()
    .min(8, "Judul laporan minimal 8 karakter.")
    .max(120, "Judul laporan maksimal 120 karakter."),
  categoryId: z.string().min(1, "Pilih salah satu kategori masalah."),
  description: z
    .string()
    .min(20, "Deskripsi minimal 20 karakter agar petugas memahami masalah.")
    .max(2000, "Deskripsi maksimal 2000 karakter."),
  locationNotes: z
    .string()
    .min(5, "Petunjuk lokasi minimal 5 karakter (contoh: depan nomor rumah atau patokan).")
    .max(200, "Petunjuk lokasi maksimal 200 karakter."),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  accuracyMeters: z.number().nullable().optional(),
  locationSource: z.enum(["gps", "manual"]),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        name: z.string(),
      })
    )
    .min(1, "Sertakan minimal 1 foto bukti kondisi lapangan.")
    .max(5, "Maksimal 5 foto per laporan."),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateStatusSchema = z.object({
  statusKey: z.string().min(1, "Pilih status baru."),
  notes: z.string().min(10, "Catatan alasan atau ringkasan tindakan minimal 10 karakter."),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
