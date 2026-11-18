"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReportSchema, CreateReportInput } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PermissionBanner } from "@/components/ui/permission-banner";
import { mockCategories } from "@/lib/mock-data";
import { MapPin, Camera, Trash, CheckCircle } from "@phosphor-icons/react";

interface ReportFormProps {
  onSuccess?: (reportNo: string) => void;
}

export function ReportForm({ onSuccess }: ReportFormProps) {
  const [gpsStatus, setGpsStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [submittedReportNo, setSubmittedReportNo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateReportInput>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      title: "",
      categoryId: "",
      description: "",
      locationNotes: "",
      locationSource: "manual",
      lat: null,
      lng: null,
      accuracyMeters: null,
      attachments: [
        {
          id: "att_initial",
          url: "/foto-bukti-demo.jpg",
          name: "foto_kondisi_lapangan.jpg",
        },
      ],
    },
  });

  const descriptionValue = watch("description") || "";
  const attachments = watch("attachments") || [];

  const handleRequestGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      return;
    }

    setGpsStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("lat", pos.coords.latitude);
        setValue("lng", pos.coords.longitude);
        setValue("accuracyMeters", Math.round(pos.coords.accuracy));
        setValue("locationSource", "gps");
        setGpsStatus("granted");
        if (!watch("locationNotes")) {
          setValue("locationNotes", `Koordinat GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        }
      },
      () => {
        setGpsStatus("denied");
        setValue("locationSource", "manual");
      },
      { timeout: 10000 }
    );
  };

  const handleAddSamplePhoto = () => {
    if (attachments.length >= 5) return;
    const newAtt = {
      id: `att_${Date.now()}`,
      url: "/foto-lapangan-2.jpg",
      name: `foto_tambahan_${attachments.length + 1}.jpg`,
    };
    setValue("attachments", [...attachments, newAtt], { shouldValidate: true });
  };

  const handleRemovePhoto = (id: string) => {
    setValue(
      "attachments",
      attachments.filter((a) => a.id !== id),
      { shouldValidate: true }
    );
  };

  const onSubmit = async (data: CreateReportInput) => {
    // Simulating API POST /reports
    await new Promise((r) => setTimeout(r, 1000));
    const generatedNo = `SULAP-RT01-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedReportNo(generatedNo);
    onSuccess?.(generatedNo);
  };

  if (submittedReportNo) {
    return (
      <div
        role="status"
        className="p-6 sm:p-8 bg-white border border-[#E2E8E3] rounded-[22px] text-center max-w-lg mx-auto"
      >
        <div className="w-14 h-14 rounded-full bg-[#E5F6E9] text-[#1B6836] flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={32} weight="fill" aria-hidden="true" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-[#121915]">
          Laporan Berhasil Terkirim
        </h2>
        <p className="text-sm text-[#4A564F] mt-1">
          Nomor laporan resmi Anda adalah:
        </p>
        <div className="my-4 py-2 px-4 rounded-[10px] bg-[#F4F6F4] text-base font-extrabold text-[#135E3F] tabular-nums inline-block border border-[#C4CEC6]">
          {submittedReportNo}
        </div>
        <p className="text-xs text-[#7D8A82] leading-relaxed mb-6">
          Pengurus RT telah menerima notifikasi dan akan meninjau laporan ini dalam waktu 2 hari kerja.
        </p>
        <div className="flex gap-2 justify-center">
          <Button
            variant="primary"
            onClick={() => {
              setSubmittedReportNo(null);
            }}
          >
            Buat Laporan Lain
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              window.location.href = "/laporan";
            }}
          >
            Lihat Daftar Laporan
          </Button>
        </div>
      </div>
    );
  }

  const categoryOptions = [
    { value: "", label: "Pilih kategori masalah fasilitas..." },
    ...mockCategories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="p-5 sm:p-7 bg-white border border-[#E2E8E3] rounded-[22px] text-left flex flex-col gap-5 max-w-2xl mx-auto"
    >
      <div>
        <h2 className="text-lg font-bold text-[#121915]">Formulir Laporan Fasilitas RT</h2>
        <p className="text-xs text-[#4A564F] mt-0.5">
          Sampaikan masalah fasilitas atau kebersihan lingkungan RT secara jelas.
        </p>
      </div>

      {/* Bagian 1: Kategori & Judul */}
      <div className="flex flex-col gap-4">
        <Select
          label="Kategori Masalah *"
          options={categoryOptions}
          error={errors.categoryId?.message}
          {...register("categoryId")}
        />

        <Input
          label="Judul Laporan *"
          placeholder="Contoh: Lampu PJU Mati Depan Gang 3"
          helperText="Tulis ringkas dan spesifik (8 - 120 karakter)."
          error={errors.title?.message}
          {...register("title")}
        />
      </div>

      {/* Bagian 2: Deskripsi */}
      <Textarea
        label="Deskripsi Masalah Lingkungan *"
        placeholder="Jelaskan kondisi fisik masalah, sejak kapan terjadi, dan potensi bahaya..."
        helperText="Deskripsi lengkap membantu pengurus RT menentukan prioritas inspeksi."
        charCount={descriptionValue.length}
        maxChars={2000}
        error={errors.description?.message}
        {...register("description")}
      />

      {/* Bagian 3: Foto Bukti */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-[#121915]">
            Foto Bukti Lapangan *
          </label>
          <span className="text-xs text-[#7D8A82] tabular-nums">
            {attachments.length}/5 Foto
          </span>
        </div>

        {/* Thumbnail preview list */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative p-2 rounded-[12px] bg-[#F7F9F7] border border-[#E2E8E3] flex flex-col items-center justify-between h-28"
            >
              <div className="w-10 h-10 rounded-[8px] bg-[#EEF2EE] flex items-center justify-center text-[#7D8A82]">
                <Camera size={20} weight="regular" aria-hidden="true" />
              </div>
              <span className="text-[10px] text-[#4A564F] truncate w-full text-center">
                {att.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemovePhoto(att.id)}
                aria-label={`Hapus foto ${att.name}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9C3412] hover:underline"
              >
                <Trash size={12} weight="bold" />
                <span>Hapus</span>
              </button>
            </div>
          ))}

          {attachments.length < 5 && (
            <button
              type="button"
              onClick={handleAddSamplePhoto}
              className="min-h-[44px] h-28 rounded-[12px] border-2 border-dashed border-[#C4CEC6] hover:border-[#135E3F] bg-[#F7F9F7] hover:bg-[#EEF2EE] flex flex-col items-center justify-center gap-1 text-[#4A564F] transition-colors cursor-pointer"
            >
              <Camera size={22} weight="bold" className="text-[#135E3F]" aria-hidden="true" />
              <span className="text-xs font-semibold">+ Tambah Foto</span>
            </button>
          )}
        </div>
        {errors.attachments && (
          <p role="alert" className="text-xs font-medium text-[#9C3412]">
            {errors.attachments.message}
          </p>
        )}
      </div>

      {/* Bagian 4: Lokasi & GPS */}
      <div className="flex flex-col gap-3 pt-2 border-t border-[#E2E8E3]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-sm font-medium text-[#121915]">
            Penentuan Lokasi *
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRequestGps}
            isLoading={gpsStatus === "requesting"}
          >
            <MapPin size={16} weight="bold" />
            <span>
              {gpsStatus === "granted" ? "Lokasi GPS Terdeteksi" : "Gunakan GPS Otomatis"}
            </span>
          </Button>
        </div>

        {gpsStatus === "denied" && <PermissionBanner />}

        <Input
          label="Petunjuk / Patokan Lokasi *"
          placeholder="Contoh: Depan rumah nomor B12, dekat tiang gardu listrik"
          helperText="Wajib diisi agar petugas mudah menemukan lokasi fisik."
          error={errors.locationNotes?.message}
          {...register("locationNotes")}
        />
      </div>

      {/* Tombol Kirim */}
      <div className="pt-3 border-t border-[#E2E8E3] flex flex-col sm:flex-row items-center justify-end gap-3">
        <Button
          type="button"
          variant="quiet"
          size="md"
          onClick={() => window.history.back()}
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          className="w-full sm:w-auto"
        >
          Kirim Laporan Resmi
        </Button>
      </div>
    </form>
  );
}
