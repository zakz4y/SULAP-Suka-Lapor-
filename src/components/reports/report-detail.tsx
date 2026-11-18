"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Report, InternalStatusGroup } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mockStatusDefinitions } from "@/lib/mock-data";
import {
  MapPin,
  CalendarBlank,
  User,
  ArrowLeft,
  Clock,
  CheckCircle,
} from "@phosphor-icons/react";

interface ReportDetailProps {
  report: Report;
  isAdmin?: boolean;
}

export function ReportDetail({ report: initialReport, isAdmin = true }: ReportDetailProps) {
  const [report, setReport] = useState<Report>(initialReport);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(report.statusKey);
  const [statusNotes, setStatusNotes] = useState("");
  const [statusError, setStatusError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const dateFormatted = new Date(report.createdAt).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (statusNotes.trim().length < 10) {
      setStatusError("Catatan tindakan minimal 10 karakter.");
      return;
    }

    setIsUpdating(true);
    setStatusError("");

    // Simulate PATCH /reports/{publicNo}/status
    await new Promise((r) => setTimeout(r, 700));

    const matchedDef = mockStatusDefinitions.find((s) => s.key === selectedStatus);
    const newGroup = (matchedDef?.group || "in_progress") as InternalStatusGroup;
    const newLabel = matchedDef?.label || "Diperbarui";

    const newTimelineEvent = {
      id: `tl_${Date.now()}`,
      reportId: report.id,
      actorName: "Admin RT 01",
      actorRole: "admin" as const,
      eventType: "status_changed" as const,
      fromStatus: report.statusKey,
      toStatus: selectedStatus,
      notes: statusNotes,
      createdAt: new Date().toISOString(),
    };

    setReport((prev) => ({
      ...prev,
      statusKey: selectedStatus,
      statusLabel: newLabel,
      statusGroup: newGroup,
      timeline: [...(prev.timeline || []), newTimelineEvent],
    }));

    setIsUpdating(false);
    setShowStatusModal(false);
    setStatusNotes("");
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5 text-left">
      {/* Back button */}
      <div>
        <Link
          href="/laporan"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#135E3F] hover:underline"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>Kembali ke Daftar Laporan</span>
        </Link>
      </div>

      {/* Main card */}
      <article className="p-5 sm:p-7 bg-white border border-[#E2E8E3] rounded-[22px]">
        {/* Header metadata */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E2E8E3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-[#141916] tabular-nums">
                {report.publicNo}
              </span>
              <span className="text-xs text-[#7D8A82]">
                &bull; {report.categoryName}
              </span>
            </div>
            <h1 className="text-base sm:text-xl font-bold text-[#121915] mt-1">
              {report.title}
            </h1>
          </div>
          <StatusBadge group={report.statusGroup} label={report.statusLabel} />
        </div>

        {/* Content & Description */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-[#7D8A82] uppercase tracking-wider mb-1.5">
            Deskripsi Masalah
          </h2>
          <p className="text-sm sm:text-base text-[#121915] leading-relaxed whitespace-pre-line">
            {report.description}
          </p>
        </div>

        {/* Foto Bukti */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-[#7D8A82] uppercase tracking-wider mb-2">
            Foto Bukti Lapangan ({report.attachments.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.attachments.map((att, i) => (
              <div
                key={att.id}
                className="h-44 rounded-[14px] bg-[#EEF2EE] border border-[#E2E8E3] overflow-hidden flex flex-col items-center justify-center text-[#7D8A82]"
              >
                <div className="text-xs font-semibold">Bukti Foto #{i + 1}</div>
                <div className="text-[10px] text-[#A3B1A8] mt-1">
                  Ukuran: {(att.sizeBytes / 1024).toFixed(0)} KB &bull; WebP
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Lokasi & Pelapor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-[14px] bg-[#F7F9F7] border border-[#E2E8E3] mb-6">
          <div>
            <span className="text-[11px] font-semibold text-[#7D8A82] uppercase tracking-wider block mb-1">
              Lokasi Kejadian
            </span>
            <div className="flex items-start gap-1.5 text-xs text-[#121915]">
              <MapPin size={16} weight="bold" className="shrink-0 text-[#135E3F] mt-0.5" />
              <span>
                {report.location.notes || "Koordinat GPS terkonfirmasi"} (Sumber: {report.location.source.toUpperCase()})
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-[#7D8A82] uppercase tracking-wider block mb-1">
              Pelapor & Waktu
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[#121915]">
              <User size={16} weight="bold" className="shrink-0 text-[#7D8A82]" />
              {/* Privacy rule: hidden from public */}
              <span>
                {isAdmin ? "Warga Terverifikasi RT 01 (Privat)" : "Warga Terverifikasi"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#7D8A82] mt-1">
              <CalendarBlank size={14} weight="regular" />
              <span>{dateFormatted}</span>
            </div>
          </div>
        </div>

        {/* Admin Action Button */}
        {isAdmin && (
          <div className="pt-4 border-t border-[#E2E8E3] flex justify-end">
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowStatusModal(true)}
            >
              Ubah Status / Tindak Lanjut
            </Button>
          </div>
        )}
      </article>

      {/* Timeline Riwayat Penanganan (Immutable - Sesuai PRD §10) */}
      <section
        aria-label="Riwayat Kronologis Laporan"
        className="p-5 sm:p-7 bg-white border border-[#E2E8E3] rounded-[22px]"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} weight="bold" className="text-[#135E3F]" aria-hidden="true" />
          <h2 className="text-base font-bold text-[#121915]">
            Riwayat Kronologis Penanganan
          </h2>
        </div>

        <ol className="relative border-l-2 border-[#D9D5C7] ml-3 flex flex-col gap-5">
          {report.timeline?.map((event) => {
            const timeStr = new Date(event.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <li key={event.id} className="ml-5">
                <span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-[#135E3F] border-2 border-white" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#121915]">
                    {event.actorName}
                  </span>
                  <span className="text-[11px] text-[#7D8A82] tabular-nums">
                    {timeStr}
                  </span>
                </div>
                {event.toStatus && (
                  <div className="mt-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-[6px] bg-[#EEF2EE] text-[#135E3F]">
                      Status: {event.toStatus}
                    </span>
                  </div>
                )}
                {event.notes && (
                  <p className="text-xs sm:text-sm text-[#4A564F] mt-1 leading-relaxed bg-[#F7F9F7] p-2.5 rounded-[10px] border border-[#E2E8E3]">
                    {event.notes}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Modal Dialog Ubah Status */}
      {showStatusModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-[22px] max-w-md w-full p-6 text-left border border-[#E2E8E3] shadow-xl">
            <h2 id="modal-title" className="text-lg font-bold text-[#121915] mb-1">
              Perbarui Status Laporan
            </h2>
            <p className="text-xs text-[#4A564F] mb-4">
              Perubahan status akan dicatat pada timeline permanen dan notifikasi dikirim ke pelapor.
            </p>

            <form onSubmit={handleUpdateStatus} className="flex flex-col gap-4">
              <Select
                label="Status Tujuan *"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={mockStatusDefinitions.map((s) => ({
                  value: s.key,
                  label: s.label,
                }))}
              />

              <Textarea
                label="Catatan Tindakan / Ringkasan Inspeksi *"
                placeholder="Contoh: Sudah dicek bersama teknisi PJU, fitting telah diganti baru..."
                helperText="Wajib diisi agar warga memahami progres penanganan."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                error={statusError}
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8E3]">
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() => setShowStatusModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isUpdating}
                >
                  Simpan Status
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
