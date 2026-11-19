-- Hapus seluruh data laporan untuk semua peran (warga, admin RT, developer).
-- Jalankan di Supabase SQL Editor. Skrip ini TIDAK menghapus akun/warga/RT.

begin;

-- report_status_history bersifat append-only (trigger guard_history_mutation),
-- jadi trigger dimatikan sementara hanya untuk pembersihan ini.
alter table public.report_status_history disable trigger guard_history_mutation;

delete from public.assignments;
delete from public.comments;
delete from public.inspections;
delete from public.attachments;
delete from public.report_status_history;
delete from public.notifications where report_id is not null;
delete from public.reports;

alter table public.report_status_history enable trigger guard_history_mutation;

commit;
