-- =============================================================================
-- SULAP (Suka Lapor) — Inisialisasi Database
-- Target   : PostgreSQL 17 di Supabase (project baru)
-- Jalankan : SEKALI di Supabase SQL Editor
-- Idempoten: seluruh blok memakai IF NOT EXISTS / CREATE OR REPLACE /
--            DROP POLICY IF EXISTS / ON CONFLICT DO NOTHING
-- Urutan   : extensions → enums → tables → constraints/indexes →
--            helper functions → RLS enable + policies → views → RPC →
--            triggers → grants → seed
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. EKSTENSI
-- ---------------------------------------------------------------------------
-- pgcrypto  : gen_random_bytes untuk kode undangan
-- pg_cron   : job terjadwal pembersihan
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"   with schema extensions;
create extension if not exists "pg_cron"    with schema extensions;
create extension if not exists "unaccent"   with schema extensions;

-- ---------------------------------------------------------------------------
-- 1. ENUM
-- ---------------------------------------------------------------------------

-- Peran anggota RT
do $$ begin
  create type public.member_role as enum (
    'resident',   -- warga biasa
    'rt_admin',   -- ketua/admin RT
    'developer',  -- super admin platform
    'officer'     -- petugas (P2)
  );
exception when duplicate_object then null; end $$;

-- Status keanggotaan
do $$ begin
  create type public.membership_status as enum (
    'pending',    -- menunggu persetujuan
    'active',     -- anggota aktif
    'rejected',   -- ditolak admin
    'suspended',  -- ditangguhkan
    'left'        -- keluar
  );
exception when duplicate_object then null; end $$;

-- Metode bergabung RT
do $$ begin
  create type public.join_method as enum (
    'invite_code', -- lewat kode undangan
    'request'      -- ajukan permohonan
  );
exception when duplicate_object then null; end $$;

-- Kelompok status laporan (tidak dapat diubah)
do $$ begin
  create type public.report_status_group as enum (
    'new',         -- baru masuk
    'triaged',     -- sudah diperiksa awal
    'inspection',  -- sedang inspeksi lapangan
    'in_progress', -- dalam penanganan
    'resolved',    -- selesai ditangani
    'closed',      -- ditutup
    'reopened'     -- dibuka kembali
  );
exception when duplicate_object then null; end $$;

-- Sumber koordinat lokasi
do $$ begin
  create type public.location_source as enum (
    'gps',      -- GPS perangkat
    'map_pin',  -- pin pada peta
    'manual'    -- teks manual tanpa koordinat
  );
exception when duplicate_object then null; end $$;

-- Jenis lampiran
do $$ begin
  create type public.attachment_kind as enum (
    'report_evidence', -- bukti laporan warga
    'inspection',      -- foto inspeksi admin
    'resolution'       -- bukti penyelesaian
  );
exception when duplicate_object then null; end $$;

-- Status moderasi komentar
do $$ begin
  create type public.moderation_status as enum (
    'visible', -- tampil
    'hidden',  -- disembunyikan (soft)
    'removed'  -- dihapus oleh moderator
  );
exception when duplicate_object then null; end $$;

-- Jenis notifikasi
do $$ begin
  create type public.notification_type as enum (
    'report_created',
    'report_status_changed',
    'report_comment',
    'report_reopened',
    'membership_requested',
    'membership_decided',
    'assignment_created'
  );
exception when duplicate_object then null; end $$;

-- Status penugasan petugas (P2)
do $$ begin
  create type public.assignment_status as enum (
    'assigned',
    'in_progress',
    'done',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. TABEL
-- ---------------------------------------------------------------------------

-- ---- 2.1 profiles ----------------------------------------------------------
-- Profil publik terbatas. Email tetap di auth.users, tidak diekspos ke warga.
create table if not exists public.profiles (
  id            uuid          primary key references auth.users(id) on delete cascade,
  display_name  varchar(80)   not null,
  avatar_path   text,                           -- path Storage, bukan URL
  locale        varchar(10)   not null default 'id-ID',
  last_seen_at  timestamptz,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

-- ---- 2.2 rts ---------------------------------------------------------------
-- Tenant utama. Semua data domain membawa rt_id.
create table if not exists public.rts (
  id              uuid          primary key default gen_random_uuid(),
  name            varchar(120)  not null,
  slug            varchar(60)   not null,
  rw_name         varchar(120),
  address_text    text,
  report_prefix   varchar(12)   not null,
  report_seq      integer       not null default 0,  -- counter atomik
  photo_required  boolean       not null default true,
  max_photos      smallint      not null default 5
                    check (max_photos between 1 and 5),
  timezone        varchar(50)   not null default 'Asia/Jakarta',
  is_active       boolean       not null default true,
  created_by      uuid          references public.profiles(id),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

-- ---- 2.3 rt_invite_codes ---------------------------------------------------
-- Kode undangan: disimpan sebagai SHA-256 hash; kode mentah hanya tampil sekali.
create table if not exists public.rt_invite_codes (
  id          uuid        primary key default gen_random_uuid(),
  rt_id       uuid        not null references public.rts(id),
  code_hash   text        not null,              -- SHA-256 kode mentah
  label       varchar(80),
  max_uses    smallint    not null default 50,
  uses_count  smallint    not null default 0,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_by  uuid        not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  constraint  chk_invite_uses check (uses_count <= max_uses)
);

-- ---- 2.4 memberships -------------------------------------------------------
-- Keanggotaan. Unik parsial mencegah duplikat pending/active di RT yang sama.
create table if not exists public.memberships (
  id              uuid                primary key default gen_random_uuid(),
  user_id         uuid                not null references public.profiles(id),
  rt_id           uuid                not null references public.rts(id),
  role            public.member_role  not null default 'resident',
  status          public.membership_status not null default 'pending',
  join_method     public.join_method  not null,
  invite_code_id  uuid                references public.rt_invite_codes(id),
  request_note    varchar(300),
  decided_by      uuid                references public.profiles(id),
  decided_at      timestamptz,
  created_at      timestamptz         not null default now(),
  updated_at      timestamptz         not null default now()
);

-- ---- 2.5 categories --------------------------------------------------------
-- Kategori per RT. Nonaktif tidak menghapus relasi laporan lama.
create table if not exists public.categories (
  id          uuid          primary key default gen_random_uuid(),
  rt_id       uuid          not null references public.rts(id),
  name        varchar(60)   not null,
  slug        varchar(60)   not null,
  description varchar(200),
  sort_order  smallint      not null default 0,
  is_active   boolean       not null default true,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);

-- ---- 2.6 status_definitions ------------------------------------------------
-- Definisi label status per RT. Satu label aktif per group per RT.
create table if not exists public.status_definitions (
  id              uuid                      primary key default gen_random_uuid(),
  rt_id           uuid                      not null references public.rts(id),
  "group"         public.report_status_group not null,
  label           varchar(40)               not null,
  color_hex       char(7)                   not null
                    check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order      smallint                  not null default 0,
  requires_note   boolean                   not null default false,
  is_active       boolean                   not null default true,
  created_at      timestamptz               not null default now(),
  updated_at      timestamptz               not null default now()
);

-- ---- 2.7 reports -----------------------------------------------------------
-- Inti laporan. Soft delete only; hard delete hanya developer.
create table if not exists public.reports (
  id                    uuid                      primary key default gen_random_uuid(),
  public_no             varchar(24)               not null,
  rt_id                 uuid                      not null references public.rts(id),
  category_id           uuid                      not null references public.categories(id),
  reporter_id           uuid                      not null references public.profiles(id),
  title                 varchar(120)              not null,
  description           varchar(2000)             not null,
  current_status_id     uuid                      not null references public.status_definitions(id),
  current_status_group  public.report_status_group not null default 'new',
  latitude              numeric(9,6),
  longitude             numeric(9,6),
  accuracy_m            numeric(6,1),
  location_source       public.location_source    not null,
  location_text         varchar(200),
  location_note         varchar(200),
  resolution_summary    text,
  closure_reason        varchar(300),
  resolved_at           timestamptz,
  closed_at             timestamptz,
  deleted_at            timestamptz,              -- soft delete
  deleted_by            uuid                      references public.profiles(id),
  delete_reason         varchar(300),
  version               integer                   not null default 1,
  search_tsv            tsvector
                          generated always as (
                            to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
                          ) stored,
  created_at            timestamptz               not null default now(),
  updated_at            timestamptz               not null default now(),
  -- constraints validasi
  constraint chk_report_title   check (length(trim(title)) > 0),
  constraint chk_report_lat     check (latitude  is null or (latitude  between -90  and 90)),
  constraint chk_report_lon     check (longitude is null or (longitude between -180 and 180))
);

-- ---- 2.8 report_status_history ---------------------------------------------
-- Append-only. Trigger melarang UPDATE dan DELETE.
create table if not exists public.report_status_history (
  id              bigint      primary key generated always as identity,
  report_id       uuid        not null references public.reports(id),
  from_status_id  uuid        references public.status_definitions(id),
  to_status_id    uuid        not null references public.status_definitions(id),
  actor_id        uuid        references public.profiles(id),
  note            text,
  created_at      timestamptz not null default now()
);

-- ---- 2.9 attachments -------------------------------------------------------
-- Metadata foto. URL selalu signed URL, tidak pernah publik.
create table if not exists public.attachments (
  id               uuid                   primary key default gen_random_uuid(),
  report_id        uuid                   not null references public.reports(id),
  kind             public.attachment_kind not null,
  storage_path     text                   not null,
  mime_type        varchar(60)            not null
                     check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size        integer                not null
                     check (byte_size between 1 and 5242880),
  width            integer,
  height           integer,
  checksum_sha256  char(64),
  sort_order       smallint               not null default 0,
  uploaded_by      uuid                   not null references public.profiles(id),
  created_at       timestamptz            not null default now(),
  deleted_at       timestamptz
);

-- ---- 2.10 inspections -------------------------------------------------------
-- Hasil inspeksi lapangan. Tidak dapat dihapus; koreksi = inspeksi baru.
create table if not exists public.inspections (
  id            uuid          primary key default gen_random_uuid(),
  report_id     uuid          not null references public.reports(id),
  inspector_id  uuid          not null references public.profiles(id),
  findings      varchar(2000) not null,
  inspected_at  timestamptz   not null,
  created_at    timestamptz   not null default now()
);

-- ---- 2.11 comments ---------------------------------------------------------
-- Komentar warga dan admin RT. Moderasi oleh admin.
create table if not exists public.comments (
  id                 uuid                      primary key default gen_random_uuid(),
  report_id          uuid                      not null references public.reports(id),
  author_id          uuid                      not null references public.profiles(id),
  body               varchar(2000)             not null,
  moderation_status  public.moderation_status  not null default 'visible',
  moderated_by       uuid                      references public.profiles(id),
  moderated_at       timestamptz,
  moderation_reason  varchar(300),
  created_at         timestamptz               not null default now(),
  deleted_at         timestamptz
);

-- ---- 2.12 assignments (P2) -------------------------------------------------
-- Penugasan petugas. Petugas hanya melihat penugasan miliknya.
create table if not exists public.assignments (
  id           uuid                      primary key default gen_random_uuid(),
  report_id    uuid                      not null references public.reports(id),
  assignee_id  uuid                      not null references public.memberships(id),
  assigned_by  uuid                      not null references public.profiles(id),
  title        varchar(120)              not null,
  note         varchar(500),
  status       public.assignment_status  not null default 'assigned',
  due_at       timestamptz,
  created_at   timestamptz               not null default now(),
  updated_at   timestamptz               not null default now()
);

-- ---- 2.13 notifications ----------------------------------------------------
-- Pusat notifikasi internal. Polling 30 detik; bukan Realtime.
create table if not exists public.notifications (
  id            uuid                      primary key default gen_random_uuid(),
  recipient_id  uuid                      not null references public.profiles(id),
  rt_id         uuid                      not null references public.rts(id),
  type          public.notification_type  not null,
  report_id     uuid                      references public.reports(id),
  title         varchar(140)              not null,
  body          varchar(300)              not null,
  dedupe_key    varchar(160)              not null,  -- cegah duplikat dari retry
  read_at       timestamptz,
  created_at    timestamptz               not null default now()
);

-- ---- 2.14 audit_logs -------------------------------------------------------
-- Append-only. Trigger melarang UPDATE dan DELETE untuk semua peran.
create table if not exists public.audit_logs (
  id           bigint        primary key generated always as identity,
  rt_id        uuid          references public.rts(id),
  actor_id     uuid          references public.profiles(id),
  actor_role   varchar(20)   not null,
  action       varchar(80)   not null,
  entity_type  varchar(40)   not null,
  entity_id    uuid,
  before_state jsonb,
  after_state  jsonb,
  reason       varchar(500),
  request_id   varchar(64),
  ip_hash      char(64),    -- hash SHA-256, bukan IP mentah
  created_at   timestamptz  not null default now()
);

-- ---- 2.15 platform_settings ------------------------------------------------
-- Konfigurasi platform lintas RT. Tidak menyimpan rahasia.
create table if not exists public.platform_settings (
  key         varchar(80)  primary key,
  value       jsonb        not null,
  updated_by  uuid         references public.profiles(id),
  updated_at  timestamptz  not null default now()
);

-- ---- 2.16 idempotency_keys -------------------------------------------------
-- Mencegah laporan ganda akibat klik berulang atau retry jaringan.
create table if not exists public.idempotency_keys (
  id            uuid          primary key default gen_random_uuid(),
  user_id       uuid          not null references public.profiles(id),
  endpoint      varchar(120)  not null,
  key           varchar(80)   not null,
  request_hash  char(64)      not null,
  status_code   smallint,
  response_body jsonb,
  created_at    timestamptz   not null default now(),
  expires_at    timestamptz   not null default (now() + interval '24 hours')
);

-- ---- 2.17 rate_limit_counters ----------------------------------------------
-- Rate limiter sederhana berbasis Postgres. Bukan pengganti WAF.
create table if not exists public.rate_limit_counters (
  id            bigint      primary key generated always as identity,
  bucket        varchar(80) not null,
  subject_id    uuid        not null,
  window_start  timestamptz not null,
  count         integer     not null default 0
);

-- ---------------------------------------------------------------------------
-- 3. CONSTRAINT & INDEX TAMBAHAN
-- ---------------------------------------------------------------------------

-- ---- rts ------------------------------------------------------------------
create unique index if not exists uq_rts_slug
  on public.rts (slug);

create unique index if not exists uq_rts_prefix
  on public.rts (report_prefix);

create index if not exists idx_rts_active_name
  on public.rts (is_active, name);

-- ---- rt_invite_codes -------------------------------------------------------
create unique index if not exists uq_invite_code_hash
  on public.rt_invite_codes (code_hash);

create index if not exists idx_invite_rt_created
  on public.rt_invite_codes (rt_id, created_at);

-- ---- memberships -----------------------------------------------------------
-- Unik parsial: satu pending atau active per (user, rt)
create unique index if not exists uq_membership_user_rt
  on public.memberships (user_id, rt_id)
  where status in ('pending', 'active');

create index if not exists idx_membership_rt_status
  on public.memberships (rt_id, status, role);

create index if not exists idx_membership_decided_by
  on public.memberships (decided_by);

-- ---- categories ------------------------------------------------------------
create unique index if not exists uq_category_rt_slug
  on public.categories (rt_id, slug);

create index if not exists idx_category_rt_active
  on public.categories (rt_id, is_active, sort_order);

-- ---- status_definitions ----------------------------------------------------
create unique index if not exists uq_status_rt_group
  on public.status_definitions (rt_id, "group");

create index if not exists idx_status_rt_active
  on public.status_definitions (rt_id, is_active, sort_order);

-- ---- reports ---------------------------------------------------------------
create unique index if not exists uq_reports_public_no
  on public.reports (public_no);

create index if not exists idx_reports_rt_created
  on public.reports (rt_id, created_at);

create index if not exists idx_reports_rt_status
  on public.reports (rt_id, current_status_group, created_at);

create index if not exists idx_reports_rt_category
  on public.reports (rt_id, category_id, created_at);

create index if not exists idx_reports_reporter
  on public.reports (reporter_id, created_at);

create index if not exists idx_reports_deleted
  on public.reports (deleted_at);

create index if not exists idx_reports_search
  on public.reports using gin (search_tsv);

-- ---- report_status_history -------------------------------------------------
create index if not exists idx_status_history_report
  on public.report_status_history (report_id, created_at);

create index if not exists idx_status_history_actor
  on public.report_status_history (actor_id, created_at);

-- ---- attachments -----------------------------------------------------------
create unique index if not exists uq_attachment_path
  on public.attachments (storage_path);

create index if not exists idx_attachments_report_kind
  on public.attachments (report_id, kind, sort_order);

-- ---- inspections -----------------------------------------------------------
create index if not exists idx_inspections_report
  on public.inspections (report_id, inspected_at);

-- ---- comments --------------------------------------------------------------
create index if not exists idx_comments_report
  on public.comments (report_id, created_at);

-- ---- assignments -----------------------------------------------------------
create index if not exists idx_assignments_report
  on public.assignments (report_id, status);

create index if not exists idx_assignments_assignee
  on public.assignments (assignee_id, status);

-- ---- notifications ---------------------------------------------------------
create unique index if not exists uq_notifications_dedupe
  on public.notifications (recipient_id, dedupe_key);

create index if not exists idx_notifications_recipient
  on public.notifications (recipient_id, read_at, created_at);

-- ---- audit_logs ------------------------------------------------------------
create index if not exists idx_audit_rt_created
  on public.audit_logs (rt_id, created_at);

create index if not exists idx_audit_actor
  on public.audit_logs (actor_id, created_at);

create index if not exists idx_audit_action
  on public.audit_logs (action, created_at);

create index if not exists idx_audit_entity
  on public.audit_logs (entity_type, entity_id);

-- ---- idempotency_keys ------------------------------------------------------
create unique index if not exists uq_idempotency_user_endpoint_key
  on public.idempotency_keys (user_id, endpoint, key);

create index if not exists idx_idempotency_expires
  on public.idempotency_keys (expires_at);

-- ---- rate_limit_counters ---------------------------------------------------
create unique index if not exists uq_rate_limit_window
  on public.rate_limit_counters (bucket, subject_id, window_start);

-- ---------------------------------------------------------------------------
-- 4. HELPER FUNCTIONS (SECURITY DEFINER, STABLE)
-- ---------------------------------------------------------------------------
-- Dipakai di dalam policy RLS dan RPC. Tidak menerima rt_id dari klien tulis.

-- Cek apakah pengguna saat ini adalah developer aktif
create or replace function public.is_developer()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and role = 'developer'
      and status = 'active'
  );
$$;

-- Cek apakah pengguna saat ini adalah anggota aktif RT tertentu
create or replace function public.is_rt_member(p_rt_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and rt_id = p_rt_id
      and status = 'active'
  );
$$;

-- Cek apakah pengguna saat ini adalah admin aktif RT tertentu
create or replace function public.is_rt_admin(p_rt_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and rt_id = p_rt_id
      and role = 'rt_admin'
      and status = 'active'
  );
$$;

-- Ambil rt_id aktif pengguna saat ini (helper internal RPC)
create or replace function public.get_my_rt_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select rt_id from public.memberships
  where user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- 5. RLS ENABLE + POLICIES
-- ---------------------------------------------------------------------------
-- Urutan: enable RLS → drop policy lama → create policy baru
-- Tidak ada policy using(true) pada tabel domain.
-- Tidak ada policy untuk role anon pada tabel domain.

-- ---- 5.1 profiles ----------------------------------------------------------
alter table public.profiles enable row level security;

-- Baca profil sendiri
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Baca profil sesama anggota aktif di RT yang sama
drop policy if exists profiles_select_comember on public.profiles;
create policy profiles_select_comember
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships me
      join public.memberships other on other.rt_id = me.rt_id
      where me.user_id = auth.uid()
        and me.status = 'active'
        and other.user_id = profiles.id
        and other.status = 'active'
    )
  );

-- Admin RT baca profil pemohon pending di RT-nya
drop policy if exists profiles_select_admin_applicant on public.profiles;
create policy profiles_select_admin_applicant
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.user_id = profiles.id
        and m.status = 'pending'
        and public.is_rt_admin(m.rt_id)
    )
  );

-- Developer baca semua profil
drop policy if exists profiles_select_developer on public.profiles;
create policy profiles_select_developer
  on public.profiles for select
  to authenticated
  using (public.is_developer());

-- Pengguna update kolom aman profil sendiri
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Supabase Auth trigger INSERT profil baru (via service_role)
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- ---- 5.2 rts ---------------------------------------------------------------
alter table public.rts enable row level security;

-- Warga baca RT aktif miliknya
drop policy if exists rts_select_member on public.rts;
create policy rts_select_member
  on public.rts for select
  to authenticated
  using (
    is_active = true
    and public.is_rt_member(id)
  );

-- Admin RT baca RT-nya (termasuk yang tidak aktif)
drop policy if exists rts_select_admin on public.rts;
create policy rts_select_admin
  on public.rts for select
  to authenticated
  using (public.is_rt_admin(id));

-- Developer baca semua RT
drop policy if exists rts_select_developer on public.rts;
create policy rts_select_developer
  on public.rts for select
  to authenticated
  using (public.is_developer());

-- ---- 5.3 rt_invite_codes ---------------------------------------------------
alter table public.rt_invite_codes enable row level security;

-- Admin RT baca kode undangan RT-nya
drop policy if exists invite_codes_select_admin on public.rt_invite_codes;
create policy invite_codes_select_admin
  on public.rt_invite_codes for select
  to authenticated
  using (public.is_rt_admin(rt_id));

-- Developer baca semua kode undangan
drop policy if exists invite_codes_select_developer on public.rt_invite_codes;
create policy invite_codes_select_developer
  on public.rt_invite_codes for select
  to authenticated
  using (public.is_developer());

-- ---- 5.4 memberships -------------------------------------------------------
alter table public.memberships enable row level security;

-- Pengguna baca keanggotaan sendiri
drop policy if exists memberships_select_own on public.memberships;
create policy memberships_select_own
  on public.memberships for select
  to authenticated
  using (user_id = auth.uid());

-- Admin RT baca semua anggota RT-nya
drop policy if exists memberships_select_admin on public.memberships;
create policy memberships_select_admin
  on public.memberships for select
  to authenticated
  using (public.is_rt_admin(rt_id));

-- Developer baca semua keanggotaan
drop policy if exists memberships_select_developer on public.memberships;
create policy memberships_select_developer
  on public.memberships for select
  to authenticated
  using (public.is_developer());

-- ---- 5.5 categories --------------------------------------------------------
alter table public.categories enable row level security;

-- Anggota aktif RT baca kategori RT-nya
drop policy if exists categories_select_member on public.categories;
create policy categories_select_member
  on public.categories for select
  to authenticated
  using (public.is_rt_member(rt_id));

-- Developer baca semua kategori
drop policy if exists categories_select_developer on public.categories;
create policy categories_select_developer
  on public.categories for select
  to authenticated
  using (public.is_developer());

-- ---- 5.6 status_definitions ------------------------------------------------
alter table public.status_definitions enable row level security;

-- Anggota aktif RT baca definisi status RT-nya
drop policy if exists status_def_select_member on public.status_definitions;
create policy status_def_select_member
  on public.status_definitions for select
  to authenticated
  using (public.is_rt_member(rt_id));

-- Developer baca semua definisi status
drop policy if exists status_def_select_developer on public.status_definitions;
create policy status_def_select_developer
  on public.status_definitions for select
  to authenticated
  using (public.is_developer());

-- ---- 5.7 reports -----------------------------------------------------------
alter table public.reports enable row level security;

-- Warga baca laporan aktif (tidak soft deleted) di RT-nya
drop policy if exists reports_select_member on public.reports;
create policy reports_select_member
  on public.reports for select
  to authenticated
  using (
    deleted_at is null
    and public.is_rt_member(rt_id)
  );

-- Admin RT baca semua laporan RT-nya (termasuk soft deleted)
drop policy if exists reports_select_admin on public.reports;
create policy reports_select_admin
  on public.reports for select
  to authenticated
  using (public.is_rt_admin(rt_id));

-- Developer baca semua laporan lintas RT
drop policy if exists reports_select_developer on public.reports;
create policy reports_select_developer
  on public.reports for select
  to authenticated
  using (public.is_developer());

-- ---- 5.8 report_status_history ---------------------------------------------
alter table public.report_status_history enable row level security;

-- Warga baca riwayat status laporan yang dapat dilihatnya
drop policy if exists history_select_member on public.report_status_history;
create policy history_select_member
  on public.report_status_history for select
  to authenticated
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_id
        and r.deleted_at is null
        and public.is_rt_member(r.rt_id)
    )
  );

-- Admin RT baca riwayat status laporan RT-nya
drop policy if exists history_select_admin on public.report_status_history;
create policy history_select_admin
  on public.report_status_history for select
  to authenticated
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_id
        and public.is_rt_admin(r.rt_id)
    )
  );

-- Developer baca semua riwayat
drop policy if exists history_select_developer on public.report_status_history;
create policy history_select_developer
  on public.report_status_history for select
  to authenticated
  using (public.is_developer());

-- ---- 5.9 attachments -------------------------------------------------------
alter table public.attachments enable row level security;

-- Warga baca lampiran laporan yang dapat dilihatnya
drop policy if exists attachments_select_member on public.attachments;
create policy attachments_select_member
  on public.attachments for select
  to authenticated
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_id
        and r.deleted_at is null
        and public.is_rt_member(r.rt_id)
    )
  );

-- Admin RT baca lampiran RT-nya
drop policy if exists attachments_select_admin on public.attachments;
create policy attachments_select_admin
  on public.attachments for select
  to authenticated
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_id
        and public.is_rt_admin(r.rt_id)
    )
  );

-- Developer baca semua lampiran
drop policy if exists attachments_select_developer on public.attachments;
create policy attachments_select_developer
  on public.attachments for select
  to authenticated
  using (public.is_developer());

-- ---- 5.10 inspections -------------------------------------------------------
alter table public.inspections enable row level security;

-- Warga baca inspeksi laporan yang dapat dilihatnya
drop policy if exists inspections_select_member on public.inspections;
create policy inspections_select_member
  on public.inspections for select
  to authenticated
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_id
        and r.deleted_at is null
        and public.is_rt_member(r.rt_id)
    )
  );

-- Admin RT baca inspeksi RT-nya
drop policy if exists inspections_select_admin on public.inspections;
create policy inspections_select_admin
  on public.inspections for select
  to authenticated
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_id
        and public.is_rt_admin(r.rt_id)
    )
  );

-- Developer baca semua inspeksi
drop policy if exists inspections_select_developer on public.inspections;
create policy inspections_select_developer
  on public.inspections for select
  to authenticated
  using (public.is_developer());

-- ---- 5.11 comments ---------------------------------------------------------
alter table public.comments enable row level security;

-- Warga baca komentar visible pada laporan yang dapat dilihatnya
drop policy if exists comments_select_member on public.comments;
create policy comments_select_member
  on public.comments for select
  to authenticated
  using (
    moderation_status = 'visible'
    and deleted_at is null
    and exists (
      select 1 from public.reports r
      where r.id = report_id
        and r.deleted_at is null
        and public.is_rt_member(r.rt_id)
    )
  );

-- Admin RT baca semua komentar RT-nya (termasuk hidden/removed)
drop policy if exists comments_select_admin on public.comments;
create policy comments_select_admin
  on public.comments for select
  to authenticated
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_id
        and public.is_rt_admin(r.rt_id)
    )
  );

-- Developer baca semua komentar
drop policy if exists comments_select_developer on public.comments;
create policy comments_select_developer
  on public.comments for select
  to authenticated
  using (public.is_developer());

-- ---- 5.12 assignments (P2) -------------------------------------------------
alter table public.assignments enable row level security;

-- Petugas/officer baca penugasan miliknya
drop policy if exists assignments_select_assignee on public.assignments;
create policy assignments_select_assignee
  on public.assignments for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.id = assignee_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- Admin RT baca penugasan di RT-nya
drop policy if exists assignments_select_admin on public.assignments;
create policy assignments_select_admin
  on public.assignments for select
  to authenticated
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_id
        and public.is_rt_admin(r.rt_id)
    )
  );

-- Developer baca semua penugasan
drop policy if exists assignments_select_developer on public.assignments;
create policy assignments_select_developer
  on public.assignments for select
  to authenticated
  using (public.is_developer());

-- ---- 5.13 notifications ----------------------------------------------------
alter table public.notifications enable row level security;

-- Hanya penerima yang bisa baca notifikasinya sendiri
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications for select
  to authenticated
  using (recipient_id = auth.uid());

-- ---- 5.14 audit_logs -------------------------------------------------------
alter table public.audit_logs enable row level security;

-- Hanya developer yang bisa baca audit log
drop policy if exists audit_select_developer on public.audit_logs;
create policy audit_select_developer
  on public.audit_logs for select
  to authenticated
  using (public.is_developer());

-- ---- 5.15 platform_settings ------------------------------------------------
alter table public.platform_settings enable row level security;

-- Hanya developer yang bisa baca platform settings
drop policy if exists platform_settings_select_developer on public.platform_settings;
create policy platform_settings_select_developer
  on public.platform_settings for select
  to authenticated
  using (public.is_developer());

-- ---- 5.16 idempotency_keys -------------------------------------------------
-- Tidak ada grant ke authenticated; hanya lewat RPC internal
alter table public.idempotency_keys enable row level security;

-- ---- 5.17 rate_limit_counters ----------------------------------------------
-- Tidak ada grant ke authenticated; hanya lewat RPC internal
alter table public.rate_limit_counters enable row level security;

-- ---------------------------------------------------------------------------
-- 6. VIEW (security_invoker = true)
-- ---------------------------------------------------------------------------
-- RLS tabel dasar tetap berlaku karena security_invoker.

-- ---- 6.1 v_reports_feed ---------------------------------------------------
-- Data daftar laporan untuk warga dan admin. Tanpa reporter_id, koordinat presisi.
create or replace view public.v_reports_feed
  with (security_invoker = true)
as
select
  r.id,
  r.public_no,
  r.rt_id,
  r.title,
  r.description,
  c.name                                              as category_name,
  r.current_status_group                              as status_group,
  sd.label                                            as status_label,
  sd.color_hex                                        as status_color,
  r.location_text,
  -- koordinat dibulatkan 3 desimal (~110 m) untuk privasi
  round(r.latitude::numeric,  3)                      as latitude_approx,
  round(r.longitude::numeric, 3)                      as longitude_approx,
  (
    select count(*)::integer
    from public.attachments a
    where a.report_id = r.id
      and a.kind = 'report_evidence'
      and a.deleted_at is null
  )                                                   as photo_count,
  r.created_at,
  r.updated_at
from public.reports r
join public.categories c         on c.id = r.category_id
join public.status_definitions sd on sd.id = r.current_status_id;

-- ---- 6.2 v_report_timeline -------------------------------------------------
-- Riwayat perubahan status. actor_display_name disamarkan untuk privasi pelapor.
create or replace view public.v_report_timeline
  with (security_invoker = true)
as
select
  rsh.id,
  rsh.report_id,
  sd_from.label                                       as from_label,
  sd_to.label                                         as to_label,
  sd_to."group"                                       as to_group,
  -- Jika aktor adalah admin RT atau developer, tampilkan nama + "(Admin RT)"
  -- Jika aktor adalah warga biasa (pelapor), tampilkan "Warga"
  case
    when m.role in ('rt_admin', 'developer')
      then p.display_name || ' (Admin RT)'
    else 'Warga'
  end                                                 as actor_display_name,
  rsh.note,
  rsh.created_at
from public.report_status_history rsh
left join public.status_definitions sd_from  on sd_from.id  = rsh.from_status_id
join      public.status_definitions sd_to    on sd_to.id    = rsh.to_status_id
left join public.profiles p                  on p.id        = rsh.actor_id
left join public.memberships m               on m.user_id   = rsh.actor_id
  and m.rt_id = (select rt_id from public.reports where id = rsh.report_id)
  and m.status = 'active';

-- ---- 6.3 v_rt_activity -----------------------------------------------------
-- Aktivitas RT untuk admin. Tanpa before_state, after_state, ip_hash.
create or replace view public.v_rt_activity
  with (security_invoker = true)
as
select
  al.id,
  al.rt_id,
  coalesce(p.display_name, '[sistem]')                as actor_display_name,
  al.action,
  al.entity_type,
  al.entity_id,
  al.reason,
  al.created_at
from public.audit_logs al
left join public.profiles p on p.id = al.actor_id
where al.action not in ('platform.setting_changed')   -- filter aksi non-operasional RT
  and (
    public.is_rt_admin(al.rt_id)
    or public.is_developer()
  );

-- ---------------------------------------------------------------------------
-- 7. RPC — SECURITY DEFINER
-- ---------------------------------------------------------------------------
-- Semua fungsi: set search_path = public, pg_temp
--               cek auth.uid() di awal
--               tidak menerima rt_id dari klien untuk operasi tulis
--               raise exception dengan kode aplikasi

-- ---- 7.1 create_report -----------------------------------------------------
-- Membuat laporan baru: nomor publik atomik, riwayat awal, lampiran, notifikasi admin.
create or replace function public.create_report(
  p_category_id    uuid,
  p_title          text,
  p_description    text,
  p_location       jsonb,
  p_upload_ids     uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid           uuid := auth.uid();
  v_rt_id         uuid;
  v_prefix        text;
  v_seq           integer;
  v_public_no     text;
  v_report_id     uuid;
  v_status_id     uuid;
  v_location_src  public.location_source;
  v_max_photos    smallint;
  v_upload        record;
  v_attach_order  smallint := 0;
  v_notif_key     text;
  v_admin         record;
begin
  -- 1. Cek sesi
  if v_uid is null then
    raise exception 'UNAUTHENTICATED' using hint = 'Tidak ada sesi valid';
  end if;

  -- 2. Ambil rt_id dari memberships (tidak menerima dari klien)
  select rt_id into v_rt_id
  from public.memberships
  where user_id = v_uid and status = 'active'
  limit 1;

  if v_rt_id is null then
    raise exception 'NOT_MEMBER' using hint = 'Belum menjadi anggota aktif RT';
  end if;

  -- 3. Validasi kategori: harus milik RT dan aktif
  if not exists (
    select 1 from public.categories
    where id = p_category_id and rt_id = v_rt_id and is_active = true
  ) then
    raise exception 'CATEGORY_INACTIVE' using hint = 'Kategori tidak aktif atau tidak ditemukan';
  end if;

  -- 4. Ambil max_photos RT
  select max_photos into v_max_photos
  from public.rts where id = v_rt_id;

  -- 5. Validasi upload_ids (1 s.d. max_photos, milik pengguna, belum dipakai)
  if p_upload_ids is null or array_length(p_upload_ids, 1) < 1 then
    raise exception 'VALIDATION_FAILED' using hint = 'Minimal satu foto diperlukan';
  end if;

  if array_length(p_upload_ids, 1) > v_max_photos then
    raise exception 'VALIDATION_FAILED' using hint = 'Jumlah foto melebihi batas RT';
  end if;

  -- Validasi upload_ids ada di storage paths inbox milik pengguna
  -- (validasi lengkap dilakukan di Route Handler; di sini cek dasar)

  -- 6. Validasi judul dan deskripsi
  if length(trim(p_title)) < 8 or length(trim(p_title)) > 120 then
    raise exception 'VALIDATION_FAILED' using hint = 'Judul 8–120 karakter';
  end if;

  if length(trim(p_description)) < 20 or length(trim(p_description)) > 2000 then
    raise exception 'VALIDATION_FAILED' using hint = 'Deskripsi 20–2000 karakter';
  end if;

  -- 7. Parse location_source
  v_location_src := (p_location->>'source')::public.location_source;

  -- 8. Ambil status_definition untuk grup 'new' di RT ini
  select id into v_status_id
  from public.status_definitions
  where rt_id = v_rt_id and "group" = 'new' and is_active = true
  limit 1;

  if v_status_id is null then
    raise exception 'INTERNAL' using hint = 'Definisi status baru tidak ditemukan untuk RT ini';
  end if;

  -- 9. Naikkan report_seq secara atomik dengan row lock
  update public.rts
  set report_seq = report_seq + 1
  where id = v_rt_id
  returning report_prefix, report_seq into v_prefix, v_seq;

  v_public_no := 'SULAP-' || v_prefix || '-' || lpad(v_seq::text, 4, '0');

  -- 10. Buat laporan
  insert into public.reports (
    public_no, rt_id, category_id, reporter_id,
    title, description, current_status_id, current_status_group,
    latitude, longitude, accuracy_m,
    location_source, location_text, location_note
  ) values (
    v_public_no, v_rt_id, p_category_id, v_uid,
    trim(p_title), trim(p_description), v_status_id, 'new',
    (p_location->>'latitude')::numeric,
    (p_location->>'longitude')::numeric,
    (p_location->>'accuracyM')::numeric,
    v_location_src,
    p_location->>'text',
    p_location->>'note'
  )
  returning id into v_report_id;

  -- 11. Tulis riwayat status awal
  insert into public.report_status_history (
    report_id, from_status_id, to_status_id, actor_id, note
  ) values (
    v_report_id, null, v_status_id, v_uid, null
  );

  -- 12. Pindahkan upload ke lampiran (storage_path dari Route Handler)
  -- Route Handler meneruskan storage_path; di sini path digunakan langsung
  if p_upload_ids is not null then
    declare
      v_uid_elem uuid;
    begin
      foreach v_uid_elem in array p_upload_ids loop
        -- Path sudah divalidasi dan dipindah oleh Route Handler ke path final
        insert into public.attachments (
          report_id, kind, storage_path, mime_type, byte_size,
          sort_order, uploaded_by
        )
        select
          v_report_id,
          'report_evidence'::public.attachment_kind,
          storage_path,
          mime_type,
          byte_size,
          v_attach_order,
          v_uid
        from public.attachments
        where id = v_uid_elem and uploaded_by = v_uid
        on conflict do nothing;

        v_attach_order := v_attach_order + 1;
      end loop;
    end;
  end if;

  -- 13. Kirim notifikasi ke semua admin RT
  for v_admin in
    select m.user_id
    from public.memberships m
    where m.rt_id = v_rt_id
      and m.role = 'rt_admin'
      and m.status = 'active'
  loop
    v_notif_key := 'report_created:' || v_report_id || ':' || v_admin.user_id;
    insert into public.notifications (
      recipient_id, rt_id, type, report_id,
      title, body, dedupe_key
    ) values (
      v_admin.user_id, v_rt_id,
      'report_created',
      v_report_id,
      'Laporan baru: ' || v_public_no,
      'Laporan baru diterima: ' || trim(p_title),
      v_notif_key
    )
    on conflict (recipient_id, dedupe_key) do nothing;
  end loop;

  -- 14. Kembalikan data minimal (tidak memuat reporter_id)
  return jsonb_build_object(
    'id',        v_report_id,
    'publicNo',  v_public_no,
    'status',    jsonb_build_object('group', 'new'),
    'createdAt', now()
  );
end;
$$;

-- ---- 7.2 transition_report_status ------------------------------------------
-- Mengubah status laporan. Admin RT saja. Validasi versi optimistik.
create or replace function public.transition_report_status(
  p_report_id          uuid,
  p_to_status_id       uuid,
  p_note               text,
  p_resolution_summary text,
  p_closure_reason     text,
  p_expected_version   integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid         uuid := auth.uid();
  v_report      record;
  v_to_status   record;
  v_actor_role  text;
  v_notif_key   text;
begin
  -- 1. Cek sesi
  if v_uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  -- 2. Ambil laporan dengan lock untuk cek versi
  select r.*, m.role as actor_role_val
  into v_report
  from public.reports r
  join public.memberships m on m.rt_id = r.rt_id and m.user_id = v_uid and m.status = 'active'
  where r.id = p_report_id and r.deleted_at is null
  for update of r;

  if not found then
    raise exception 'NOT_FOUND' using hint = 'Laporan tidak ditemukan';
  end if;

  -- 3. Cek peran admin RT
  if v_report.actor_role_val not in ('rt_admin', 'developer') then
    raise exception 'FORBIDDEN' using hint = 'Hanya admin RT yang dapat mengubah status';
  end if;

  -- 4. Cek versi optimistik
  if v_report.version != p_expected_version then
    raise exception 'CONFLICT_VERSION' using hint = 'Versi tidak cocok, muat ulang laporan';
  end if;

  -- 5. Ambil definisi status tujuan
  select * into v_to_status
  from public.status_definitions
  where id = p_to_status_id
    and rt_id = v_report.rt_id
    and is_active = true;

  if not found then
    raise exception 'NOT_FOUND' using hint = 'Status tujuan tidak aktif atau tidak ditemukan';
  end if;

  -- 6. Validasi catatan wajib
  if v_to_status.requires_note and (p_note is null or trim(p_note) = '') then
    raise exception 'STATUS_NOTE_REQUIRED' using hint = 'Status ini mewajibkan catatan';
  end if;

  -- 7. Validasi resolved: wajib resolution_summary min 20 karakter
  if v_to_status."group" = 'resolved' then
    if p_resolution_summary is null or length(trim(p_resolution_summary)) < 20 then
      raise exception 'STATUS_NOTE_REQUIRED'
        using hint = 'Ringkasan penyelesaian minimal 20 karakter untuk status resolved';
    end if;
  end if;

  -- 8. Validasi closed: wajib closure_reason min 10 karakter
  if v_to_status."group" = 'closed' then
    if p_closure_reason is null or length(trim(p_closure_reason)) < 10 then
      raise exception 'STATUS_NOTE_REQUIRED'
        using hint = 'Alasan penutupan minimal 10 karakter untuk status closed';
    end if;
  end if;

  -- 9. Update laporan
  update public.reports set
    current_status_id    = p_to_status_id,
    current_status_group = v_to_status."group",
    version              = version + 1,
    resolution_summary   = coalesce(p_resolution_summary, resolution_summary),
    closure_reason       = coalesce(p_closure_reason, closure_reason),
    resolved_at          = case when v_to_status."group" = 'resolved' then now() else resolved_at end,
    closed_at            = case when v_to_status."group" = 'closed'   then now() else closed_at   end
  where id = p_report_id;

  -- 10. Tulis riwayat status
  insert into public.report_status_history (
    report_id, from_status_id, to_status_id, actor_id, note
  ) values (
    p_report_id, v_report.current_status_id, p_to_status_id, v_uid,
    nullif(trim(coalesce(p_note, '')), '')
  );

  -- 11. Ambil peran aktor untuk audit
  select role::text into v_actor_role
  from public.memberships
  where user_id = v_uid and rt_id = v_report.rt_id and status = 'active'
  limit 1;

  -- 12. Tulis audit log
  insert into public.audit_logs (
    rt_id, actor_id, actor_role, action, entity_type, entity_id,
    before_state, after_state
  ) values (
    v_report.rt_id, v_uid, coalesce(v_actor_role, 'unknown'),
    'report.status_changed',
    'reports', p_report_id,
    jsonb_build_object('status_id', v_report.current_status_id, 'version', v_report.version),
    jsonb_build_object('status_id', p_to_status_id, 'version', v_report.version + 1)
  );

  -- 13. Notifikasi ke pelapor
  v_notif_key := 'status_changed:' || p_report_id || ':' || p_to_status_id;
  insert into public.notifications (
    recipient_id, rt_id, type, report_id,
    title, body, dedupe_key
  ) values (
    v_report.reporter_id, v_report.rt_id,
    'report_status_changed',
    p_report_id,
    'Laporan ' || v_report.public_no || ' diperbarui',
    'Status berubah menjadi ' || v_to_status.label,
    v_notif_key
  )
  on conflict (recipient_id, dedupe_key) do nothing;

  return jsonb_build_object(
    'id',        p_report_id,
    'publicNo',  v_report.public_no,
    'version',   v_report.version + 1,
    'status',    jsonb_build_object(
                   'id',    p_to_status_id,
                   'group', v_to_status."group",
                   'label', v_to_status.label,
                   'color', v_to_status.color_hex
                 )
  );
end;
$$;

-- ---- 7.3 create_inspection -------------------------------------------------
-- Membuat inspeksi lapangan + lampiran inspeksi. Admin RT saja.
create or replace function public.create_inspection(
  p_report_id    uuid,
  p_findings     text,
  p_inspected_at timestamptz,
  p_upload_ids   uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid           uuid := auth.uid();
  v_rt_id         uuid;
  v_inspection_id uuid;
  v_attach_order  smallint := 0;
  v_uid_elem      uuid;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;

  -- Ambil rt_id laporan
  select rt_id into v_rt_id from public.reports
  where id = p_report_id and deleted_at is null;

  if not found then
    raise exception 'NOT_FOUND' using hint = 'Laporan tidak ditemukan';
  end if;

  -- Cek peran admin RT
  if not public.is_rt_admin(v_rt_id) then
    raise exception 'FORBIDDEN' using hint = 'Hanya admin RT';
  end if;

  -- Validasi findings
  if length(trim(p_findings)) < 20 or length(trim(p_findings)) > 2000 then
    raise exception 'VALIDATION_FAILED' using hint = 'Temuan inspeksi 20–2000 karakter';
  end if;

  -- Buat inspeksi
  insert into public.inspections (report_id, inspector_id, findings, inspected_at)
  values (p_report_id, v_uid, trim(p_findings), p_inspected_at)
  returning id into v_inspection_id;

  -- Lampiran inspeksi (maks 5)
  if p_upload_ids is not null then
    if array_length(p_upload_ids, 1) > 5 then
      raise exception 'VALIDATION_FAILED' using hint = 'Maksimum 5 foto inspeksi';
    end if;

    foreach v_uid_elem in array p_upload_ids loop
      insert into public.attachments (
        report_id, kind, storage_path, mime_type, byte_size, sort_order, uploaded_by
      )
      select
        p_report_id,
        'inspection'::public.attachment_kind,
        storage_path, mime_type, byte_size,
        v_attach_order, v_uid
      from public.attachments
      where id = v_uid_elem and uploaded_by = v_uid
      on conflict do nothing;

      v_attach_order := v_attach_order + 1;
    end loop;
  end if;

  return jsonb_build_object('id', v_inspection_id, 'reportId', p_report_id);
end;
$$;

-- ---- 7.4 reopen_report -----------------------------------------------------
-- Pelapor mengajukan tinjau ulang laporan resolved/closed.
create or replace function public.reopen_report(
  p_report_id  uuid,
  p_reason     text,
  p_upload_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid           uuid := auth.uid();
  v_report        record;
  v_status_id     uuid;
  v_notif_key     text;
  v_admin         record;
  v_attach_order  smallint := 0;
  v_uid_elem      uuid;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;

  -- Ambil laporan dan cek pelapor
  select * into v_report from public.reports
  where id = p_report_id and deleted_at is null;

  if not found then
    raise exception 'NOT_FOUND' using hint = 'Laporan tidak ditemukan';
  end if;

  if v_report.reporter_id != v_uid then
    raise exception 'NOT_REPORTER' using hint = 'Hanya pelapor yang dapat mengajukan tinjau ulang';
  end if;

  -- Hanya untuk laporan resolved atau closed
  if v_report.current_status_group not in ('resolved', 'closed') then
    raise exception 'VALIDATION_FAILED'
      using hint = 'Tinjau ulang hanya untuk laporan resolved atau closed';
  end if;

  -- Validasi alasan
  if length(trim(p_reason)) < 20 or length(trim(p_reason)) > 500 then
    raise exception 'VALIDATION_FAILED' using hint = 'Alasan tinjau ulang 20–500 karakter';
  end if;

  -- Ambil status_definition untuk grup 'reopened'
  select id into v_status_id
  from public.status_definitions
  where rt_id = v_report.rt_id and "group" = 'reopened' and is_active = true
  limit 1;

  if v_status_id is null then
    raise exception 'INTERNAL' using hint = 'Definisi status reopened tidak ditemukan';
  end if;

  -- Update laporan ke reopened
  update public.reports set
    current_status_id    = v_status_id,
    current_status_group = 'reopened',
    version              = version + 1
  where id = p_report_id;

  -- Tulis riwayat
  insert into public.report_status_history (
    report_id, from_status_id, to_status_id, actor_id, note
  ) values (
    p_report_id, v_report.current_status_id, v_status_id, v_uid, trim(p_reason)
  );

  -- Lampiran bukti tinjau ulang (opsional)
  if p_upload_ids is not null then
    foreach v_uid_elem in array p_upload_ids loop
      insert into public.attachments (
        report_id, kind, storage_path, mime_type, byte_size, sort_order, uploaded_by
      )
      select
        p_report_id,
        'report_evidence'::public.attachment_kind,
        storage_path, mime_type, byte_size,
        v_attach_order, v_uid
      from public.attachments
      where id = v_uid_elem and uploaded_by = v_uid
      on conflict do nothing;

      v_attach_order := v_attach_order + 1;
    end loop;
  end if;

  -- Notifikasi ke admin RT
  for v_admin in
    select m.user_id from public.memberships m
    where m.rt_id = v_report.rt_id and m.role = 'rt_admin' and m.status = 'active'
  loop
    v_notif_key := 'report_reopened:' || p_report_id || ':' || v_admin.user_id;
    insert into public.notifications (
      recipient_id, rt_id, type, report_id,
      title, body, dedupe_key
    ) values (
      v_admin.user_id, v_report.rt_id,
      'report_reopened',
      p_report_id,
      'Laporan ' || v_report.public_no || ' dibuka kembali',
      'Pelapor mengajukan tinjau ulang: ' || left(trim(p_reason), 100),
      v_notif_key
    )
    on conflict (recipient_id, dedupe_key) do nothing;
  end loop;

  return jsonb_build_object('id', p_report_id, 'publicNo', v_report.public_no);
end;
$$;

-- ---- 7.5 join_rt -----------------------------------------------------------
-- Bergabung ke RT via kode undangan atau permintaan.
create or replace function public.join_rt(
  p_method   public.join_method,
  p_code     text,
  p_rt_slug  text,
  p_note     text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid         uuid := auth.uid();
  v_rt_id       uuid;
  v_invite_id   uuid;
  v_code_hash   text;
  v_membership_id uuid;
  v_admin       record;
  v_notif_key   text;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;

  -- Cek sudah ada keanggotaan aktif atau pending
  if exists (
    select 1 from public.memberships
    where user_id = v_uid and status in ('pending', 'active')
  ) then
    raise exception 'MEMBERSHIP_EXISTS'
      using hint = 'Sudah ada keanggotaan aktif atau menunggu persetujuan';
  end if;

  if p_method = 'invite_code' then
    -- Hash kode yang dikirim
    v_code_hash := encode(digest(p_code, 'sha256'), 'hex');

    -- Cari kode undangan yang valid
    select id, rt_id into v_invite_id, v_rt_id
    from public.rt_invite_codes
    where code_hash = v_code_hash
      and revoked_at is null
      and expires_at > now()
      and uses_count < max_uses;

    if not found then
      -- Bedakan expired vs invalid
      if exists (select 1 from public.rt_invite_codes where code_hash = v_code_hash) then
        raise exception 'INVITE_EXPIRED'
          using hint = 'Kode undangan sudah kedaluwarsa atau penuh';
      else
        raise exception 'INVITE_INVALID'
          using hint = 'Kode undangan tidak valid';
      end if;
    end if;

    -- Naikkan uses_count
    update public.rt_invite_codes
    set uses_count = uses_count + 1
    where id = v_invite_id;

    -- Buat membership aktif langsung
    insert into public.memberships (
      user_id, rt_id, role, status, join_method, invite_code_id
    ) values (
      v_uid, v_rt_id, 'resident', 'active', 'invite_code', v_invite_id
    )
    returning id into v_membership_id;

    -- Audit
    insert into public.audit_logs (
      rt_id, actor_id, actor_role, action, entity_type, entity_id,
      after_state
    ) values (
      v_rt_id, v_uid, 'resident',
      'membership.joined_via_invite', 'memberships', v_membership_id,
      jsonb_build_object('rt_id', v_rt_id, 'method', 'invite_code')
    );

  else
    -- Metode request: cari RT dari slug
    select id into v_rt_id from public.rts
    where slug = p_rt_slug and is_active = true;

    if not found then
      raise exception 'NOT_FOUND' using hint = 'RT tidak ditemukan';
    end if;

    -- Buat membership pending
    insert into public.memberships (
      user_id, rt_id, role, status, join_method, request_note
    ) values (
      v_uid, v_rt_id, 'resident', 'pending', 'request',
      nullif(trim(coalesce(p_note, '')), '')
    )
    returning id into v_membership_id;

    -- Notifikasi ke admin RT
    for v_admin in
      select m.user_id from public.memberships m
      where m.rt_id = v_rt_id and m.role = 'rt_admin' and m.status = 'active'
    loop
      v_notif_key := 'membership_requested:' || v_membership_id || ':' || v_admin.user_id;
      insert into public.notifications (
        recipient_id, rt_id, type,
        title, body, dedupe_key
      ) values (
        v_admin.user_id, v_rt_id,
        'membership_requested',
        'Permintaan bergabung baru',
        'Ada warga yang meminta bergabung ke RT ini.',
        v_notif_key
      )
      on conflict (recipient_id, dedupe_key) do nothing;
    end loop;
  end if;

  return jsonb_build_object('membershipId', v_membership_id, 'status',
    case when p_method = 'invite_code' then 'active' else 'pending' end);
end;
$$;

-- ---- 7.6 decide_membership -------------------------------------------------
-- Admin RT menyetujui/menolak/menangguhkan/mengembalikan/mengeluarkan anggota.
create or replace function public.decide_membership(
  p_membership_id  uuid,
  p_action         text,    -- approve | reject | suspend | reinstate | remove
  p_role           public.member_role,
  p_note           text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid        uuid := auth.uid();
  v_membership record;
  v_new_status public.membership_status;
  v_admin_count integer;
  v_notif_key  text;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;

  -- Ambil data keanggotaan
  select * into v_membership from public.memberships where id = p_membership_id;

  if not found then
    raise exception 'NOT_FOUND' using hint = 'Keanggotaan tidak ditemukan';
  end if;

  -- Cek peran admin RT
  if not public.is_rt_admin(v_membership.rt_id) then
    raise exception 'FORBIDDEN' using hint = 'Hanya admin RT';
  end if;

  -- Admin tidak bisa mengubah dirinya sendiri
  if v_membership.user_id = v_uid then
    raise exception 'FORBIDDEN' using hint = 'Tidak dapat mengubah keanggotaan sendiri';
  end if;

  -- Tentukan status baru
  v_new_status := case p_action
    when 'approve'   then 'active'::public.membership_status
    when 'reject'    then 'rejected'::public.membership_status
    when 'suspend'   then 'suspended'::public.membership_status
    when 'reinstate' then 'active'::public.membership_status
    when 'remove'    then 'left'::public.membership_status
    else null
  end;

  if v_new_status is null then
    raise exception 'VALIDATION_FAILED' using hint = 'Aksi tidak dikenal';
  end if;

  -- Cegah hilangnya admin terakhir saat remove/reject/suspend
  if p_action in ('remove', 'reject', 'suspend')
     and v_membership.role = 'rt_admin'
  then
    select count(*) into v_admin_count
    from public.memberships
    where rt_id = v_membership.rt_id
      and role = 'rt_admin'
      and status = 'active'
      and id != p_membership_id;

    if v_admin_count = 0 then
      raise exception 'LAST_ADMIN'
        using hint = 'Tidak dapat menghapus admin aktif terakhir';
    end if;
  end if;

  -- Update keanggotaan
  update public.memberships set
    status     = v_new_status,
    role       = coalesce(p_role, role),
    decided_by = v_uid,
    decided_at = now()
  where id = p_membership_id;

  -- Audit
  insert into public.audit_logs (
    rt_id, actor_id, actor_role, action, entity_type, entity_id,
    before_state, after_state, reason
  ) values (
    v_membership.rt_id, v_uid, 'rt_admin',
    'membership.' || p_action,
    'memberships', p_membership_id,
    jsonb_build_object('status', v_membership.status, 'role', v_membership.role),
    jsonb_build_object('status', v_new_status, 'role', coalesce(p_role, v_membership.role)),
    nullif(trim(coalesce(p_note, '')), '')
  );

  -- Notifikasi ke anggota
  v_notif_key := 'membership_decided:' || p_membership_id || ':' || p_action;
  insert into public.notifications (
    recipient_id, rt_id, type,
    title, body, dedupe_key
  ) values (
    v_membership.user_id, v_membership.rt_id,
    'membership_decided',
    'Status keanggotaan RT diperbarui',
    'Permohonan Anda ' ||
      case p_action
        when 'approve'   then 'disetujui.'
        when 'reject'    then 'ditolak.'
        when 'suspend'   then 'ditangguhkan.'
        when 'reinstate' then 'dipulihkan.'
        when 'remove'    then 'dikeluarkan dari RT.'
        else 'diperbarui.'
      end,
    v_notif_key
  )
  on conflict (recipient_id, dedupe_key) do nothing;

  return jsonb_build_object('membershipId', p_membership_id, 'status', v_new_status);
end;
$$;

-- ---- 7.7 create_invite_code ------------------------------------------------
-- Admin RT membuat kode undangan. Kode mentah hanya dikembalikan sekali.
create or replace function public.create_invite_code(
  p_max_uses    smallint,
  p_expires_at  timestamptz,
  p_label       text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid       uuid := auth.uid();
  v_rt_id     uuid;
  v_raw_code  text;
  v_code_hash text;
  v_id        uuid;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;

  -- Ambil RT dari keanggotaan aktif admin
  select rt_id into v_rt_id
  from public.memberships
  where user_id = v_uid and role = 'rt_admin' and status = 'active'
  limit 1;

  if v_rt_id is null then
    raise exception 'FORBIDDEN' using hint = 'Hanya admin RT';
  end if;

  -- Generate kode acak 8 karakter alfanumerik uppercase
  v_raw_code := upper(substring(encode(gen_random_bytes(6), 'base64'), 1, 8));
  v_raw_code := regexp_replace(v_raw_code, '[^A-Z0-9]', 'X', 'g');
  v_code_hash := encode(digest(v_raw_code, 'sha256'), 'hex');

  insert into public.rt_invite_codes (
    rt_id, code_hash, label, max_uses, expires_at, created_by
  ) values (
    v_rt_id, v_code_hash,
    nullif(trim(coalesce(p_label, '')), ''),
    coalesce(p_max_uses, 50),
    p_expires_at,
    v_uid
  )
  returning id into v_id;

  -- Audit
  insert into public.audit_logs (
    rt_id, actor_id, actor_role, action, entity_type, entity_id
  ) values (
    v_rt_id, v_uid, 'rt_admin',
    'invite_code.created', 'rt_invite_codes', v_id
  );

  -- Kembalikan kode mentah satu kali saja
  return jsonb_build_object(
    'id',        v_id,
    'code',      v_raw_code,
    'expiresAt', p_expires_at,
    'maxUses',   coalesce(p_max_uses, 50)
  );
end;
$$;

-- ---- 7.8 revoke_invite_code ------------------------------------------------
-- Admin RT mencabut kode undangan.
create or replace function public.revoke_invite_code(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_rt_id uuid;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;

  select rt_id into v_rt_id from public.rt_invite_codes where id = p_id;

  if not found then
    raise exception 'NOT_FOUND' using hint = 'Kode undangan tidak ditemukan';
  end if;

  if not public.is_rt_admin(v_rt_id) then
    raise exception 'FORBIDDEN' using hint = 'Hanya admin RT';
  end if;

  update public.rt_invite_codes
  set revoked_at = now()
  where id = p_id and revoked_at is null;

  insert into public.audit_logs (
    rt_id, actor_id, actor_role, action, entity_type, entity_id
  ) values (
    v_rt_id, v_uid, 'rt_admin',
    'invite_code.revoked', 'rt_invite_codes', p_id
  );

  return jsonb_build_object('id', p_id, 'revokedAt', now());
end;
$$;

-- ---- 7.9 soft_delete_report ------------------------------------------------
-- Developer melakukan soft delete laporan. Alasan wajib.
create or replace function public.soft_delete_report(
  p_report_id  uuid,
  p_reason     text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_report record;
  v_notif_key text;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;

  if not public.is_developer() then
    raise exception 'FORBIDDEN' using hint = 'Hanya developer';
  end if;

  if p_reason is null or length(trim(p_reason)) < 10 then
    raise exception 'VALIDATION_FAILED' using hint = 'Alasan penghapusan minimal 10 karakter';
  end if;

  select * into v_report from public.reports
  where id = p_report_id and deleted_at is null;

  if not found then
    raise exception 'NOT_FOUND' using hint = 'Laporan tidak ditemukan atau sudah dihapus';
  end if;

  update public.reports set
    deleted_at    = now(),
    deleted_by    = v_uid,
    delete_reason = trim(p_reason)
  where id = p_report_id;

  -- Audit
  insert into public.audit_logs (
    rt_id, actor_id, actor_role, action, entity_type, entity_id,
    before_state, reason
  ) values (
    v_report.rt_id, v_uid, 'developer',
    'report.soft_delete',
    'reports', p_report_id,
    jsonb_build_object('public_no', v_report.public_no, 'deleted_at', null),
    trim(p_reason)
  );

  -- Notifikasi ke pelapor
  v_notif_key := 'report_soft_deleted:' || p_report_id;
  insert into public.notifications (
    recipient_id, rt_id, type, report_id,
    title, body, dedupe_key
  ) values (
    v_report.reporter_id, v_report.rt_id,
    'report_status_changed',
    p_report_id,
    'Laporan ' || v_report.public_no || ' dihapus',
    'Laporan Anda telah dihapus oleh pengelola platform.',
    v_notif_key
  )
  on conflict (recipient_id, dedupe_key) do nothing;

  return jsonb_build_object('id', p_report_id, 'deletedAt', now());
end;
$$;

-- ---- 7.10 restore_report ---------------------------------------------------
-- Developer memulihkan laporan yang di-soft delete.
create or replace function public.restore_report(
  p_report_id  uuid,
  p_reason     text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_report record;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;

  if not public.is_developer() then
    raise exception 'FORBIDDEN' using hint = 'Hanya developer';
  end if;

  if p_reason is null or length(trim(p_reason)) < 10 then
    raise exception 'VALIDATION_FAILED' using hint = 'Alasan pemulihan minimal 10 karakter';
  end if;

  select * into v_report from public.reports
  where id = p_report_id and deleted_at is not null;

  if not found then
    raise exception 'NOT_FOUND' using hint = 'Laporan tidak ditemukan atau belum dihapus';
  end if;

  update public.reports set
    deleted_at    = null,
    deleted_by    = null,
    delete_reason = null
  where id = p_report_id;

  insert into public.audit_logs (
    rt_id, actor_id, actor_role, action, entity_type, entity_id,
    before_state, reason
  ) values (
    v_report.rt_id, v_uid, 'developer',
    'report.restore',
    'reports', p_report_id,
    jsonb_build_object('public_no', v_report.public_no, 'deleted_at', v_report.deleted_at),
    trim(p_reason)
  );

  return jsonb_build_object('id', p_report_id, 'restoredAt', now());
end;
$$;

-- ---- 7.11 mark_notifications_read ------------------------------------------
-- Penerima menandai satu atau semua notifikasi sebagai sudah dibaca.
create or replace function public.mark_notifications_read(
  p_ids  uuid[],
  p_all  boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_count  integer;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;

  if p_all = true then
    update public.notifications
    set read_at = now()
    where recipient_id = v_uid and read_at is null;
    get diagnostics v_count = row_count;
  elsif p_ids is not null and array_length(p_ids, 1) > 0 then
    update public.notifications
    set read_at = now()
    where id = any(p_ids)
      and recipient_id = v_uid
      and read_at is null;
    get diagnostics v_count = row_count;
  else
    v_count := 0;
  end if;

  return jsonb_build_object('updated', v_count);
end;
$$;

-- ---- 7.12 create_rt --------------------------------------------------------
-- Developer membuat RT baru. Admin pertama dipilih lewat akun nyata.
create or replace function public.create_rt(
  p_name          text,
  p_slug          text,
  p_report_prefix text,
  p_admin_email   text  -- email admin yang sudah ada di auth.users
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid        uuid := auth.uid();
  v_rt_id      uuid;
  v_admin_id   uuid;
  v_groups     public.report_status_group[] := array[
    'new', 'triaged', 'inspection', 'in_progress', 'resolved', 'closed', 'reopened'
  ];
  v_labels     text[] := array[
    'Baru Masuk', 'Sudah Diperiksa', 'Inspeksi Lapangan',
    'Dalam Penanganan', 'Selesai', 'Ditutup', 'Dibuka Kembali'
  ];
  v_colors     text[] := array[
    '#1D4ED8', '#7C3AED', '#B45309', '#0E6B5C',
    '#16A34A', '#6B7280', '#DC2626'
  ];
  v_requires   boolean[] := array[
    false, false, false, false, true, true, false
  ];
  i            integer;
  v_cat_names  text[] := array[
    'Saluran Air', 'Lampu Jalan', 'Sampah', 'Jalan Rusak', 'Fasilitas Umum'
  ];
  v_cat_slugs  text[] := array[
    'saluran-air', 'lampu-jalan', 'sampah', 'jalan-rusak', 'fasilitas-umum'
  ];
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;

  if not public.is_developer() then
    raise exception 'FORBIDDEN' using hint = 'Hanya developer yang dapat membuat RT';
  end if;

  -- Validasi
  if length(trim(p_slug)) < 3 then
    raise exception 'VALIDATION_FAILED' using hint = 'Slug minimal 3 karakter';
  end if;

  if exists (select 1 from public.rts where slug = p_slug) then
    raise exception 'CONFLICT_VERSION' using hint = 'Slug sudah dipakai RT lain';
  end if;

  -- Buat RT
  insert into public.rts (name, slug, report_prefix, created_by)
  values (trim(p_name), trim(p_slug), trim(p_report_prefix), v_uid)
  returning id into v_rt_id;

  -- Buat status_definitions default
  for i in 1..array_length(v_groups, 1) loop
    insert into public.status_definitions (
      rt_id, "group", label, color_hex, sort_order, requires_note
    ) values (
      v_rt_id, v_groups[i], v_labels[i], v_colors[i], i * 10, v_requires[i]
    );
  end loop;

  -- Buat kategori default
  for i in 1..array_length(v_cat_names, 1) loop
    insert into public.categories (rt_id, name, slug, sort_order)
    values (v_rt_id, v_cat_names[i], v_cat_slugs[i], i * 10);
  end loop;

  -- Cari admin berdasarkan email (lewat auth.users)
  if p_admin_email is not null then
    select p.id into v_admin_id
    from public.profiles p
    join auth.users u on u.id = p.id
    where lower(u.email) = lower(trim(p_admin_email))
    limit 1;

    if v_admin_id is not null then
      insert into public.memberships (
        user_id, rt_id, role, status, join_method
      ) values (
        v_admin_id, v_rt_id, 'rt_admin', 'active', 'invite_code'
      )
      on conflict do nothing;
    end if;
  end if;

  -- Audit
  insert into public.audit_logs (
    rt_id, actor_id, actor_role, action, entity_type, entity_id,
    after_state
  ) values (
    v_rt_id, v_uid, 'developer',
    'rt.created', 'rts', v_rt_id,
    jsonb_build_object('name', p_name, 'slug', p_slug, 'prefix', p_report_prefix)
  );

  return jsonb_build_object('id', v_rt_id, 'slug', p_slug, 'adminId', v_admin_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. TRIGGER FUNCTIONS & TRIGGERS
-- ---------------------------------------------------------------------------

-- ---- 8.1 set_updated_at ----------------------------------------------------
-- Otomatis memperbarui kolom updated_at setiap kali baris berubah.
create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Pasang trigger updated_at ke semua tabel yang punya kolom updated_at
do $$
declare
  t text;
  tbls text[] := array[
    'profiles', 'rts', 'rt_invite_codes', 'memberships',
    'categories', 'status_definitions', 'reports',
    'comments', 'assignments', 'platform_settings'
  ];
begin
  foreach t in array tbls loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at
         before update on public.%I
         for each row execute function public.fn_set_updated_at();',
      t, t
    );
  end loop;
end;
$$;

-- ---- 8.2 sync_report_status_group ------------------------------------------
-- Menjaga current_status_group tetap sinkron dengan status_definitions.group.
create or replace function public.fn_sync_report_status_group()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.current_status_id is distinct from old.current_status_id then
    select "group" into new.current_status_group
    from public.status_definitions
    where id = new.current_status_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_report_status_group on public.reports;
create trigger sync_report_status_group
  before update on public.reports
  for each row execute function public.fn_sync_report_status_group();

-- ---- 8.3 validate_status_transition ----------------------------------------
-- Menolak resolved tanpa resolution_summary, closed tanpa closure_reason.
create or replace function public.fn_validate_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group public.report_status_group;
begin
  select "group" into v_group
  from public.status_definitions
  where id = new.current_status_id;

  if v_group = 'resolved' and (new.resolution_summary is null or trim(new.resolution_summary) = '') then
    raise exception 'STATUS_NOTE_REQUIRED'
      using hint = 'Ringkasan penyelesaian wajib untuk status resolved';
  end if;

  if v_group = 'closed' and (new.closure_reason is null or trim(new.closure_reason) = '') then
    raise exception 'STATUS_NOTE_REQUIRED'
      using hint = 'Alasan penutupan wajib untuk status closed';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_status_transition on public.reports;
create trigger validate_status_transition
  before update on public.reports
  for each row
  when (old.current_status_id is distinct from new.current_status_id)
  execute function public.fn_validate_status_transition();

-- ---- 8.4 guard_history_mutation --------------------------------------------
-- Melarang UPDATE dan DELETE pada report_status_history untuk SEMUA peran.
create or replace function public.fn_guard_history_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  raise exception 'FORBIDDEN'
    using hint = 'report_status_history adalah tabel append-only. UPDATE dan DELETE dilarang.';
end;
$$;

drop trigger if exists guard_history_mutation on public.report_status_history;
create trigger guard_history_mutation
  before update or delete on public.report_status_history
  for each row execute function public.fn_guard_history_mutation();

-- ---- 8.5 guard_audit_mutation ----------------------------------------------
-- Melarang UPDATE dan DELETE pada audit_logs untuk SEMUA peran termasuk service_role.
create or replace function public.fn_guard_audit_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  raise exception 'FORBIDDEN'
    using hint = 'audit_logs adalah tabel append-only. UPDATE dan DELETE dilarang.';
end;
$$;

drop trigger if exists guard_audit_mutation on public.audit_logs;
create trigger guard_audit_mutation
  before update or delete on public.audit_logs
  for each row execute function public.fn_guard_audit_mutation();

-- ---- 8.6 notify_admin_new_report -------------------------------------------
-- Membuat notifikasi untuk semua admin RT saat laporan baru dibuat.
-- (Sudah ditangani di dalam RPC create_report; trigger ini sebagai lapisan tambahan.)
create or replace function public.fn_notify_admin_new_report()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin     record;
  v_notif_key text;
begin
  -- Hanya untuk INSERT baru (bukan reopen dari update)
  for v_admin in
    select m.user_id
    from public.memberships m
    where m.rt_id = new.rt_id
      and m.role = 'rt_admin'
      and m.status = 'active'
  loop
    v_notif_key := 'report_created:' || new.id || ':' || v_admin.user_id;
    insert into public.notifications (
      recipient_id, rt_id, type, report_id,
      title, body, dedupe_key
    ) values (
      v_admin.user_id, new.rt_id,
      'report_created',
      new.id,
      'Laporan baru: ' || new.public_no,
      'Laporan baru diterima: ' || new.title,
      v_notif_key
    )
    on conflict (recipient_id, dedupe_key) do nothing;
  end loop;
  return new;
end;
$$;

drop trigger if exists notify_admin_new_report on public.reports;
create trigger notify_admin_new_report
  after insert on public.reports
  for each row execute function public.fn_notify_admin_new_report();

-- ---- 8.7 notify_reporter_status --------------------------------------------
-- Membuat notifikasi pelapor setiap ada perubahan status.
create or replace function public.fn_notify_reporter_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_report    record;
  v_to_label  text;
  v_notif_key text;
begin
  select r.*, sd.label as to_label
  into v_report
  from public.reports r
  join public.status_definitions sd on sd.id = new.to_status_id
  where r.id = new.report_id;

  if not found or v_report.reporter_id is null then return new; end if;

  v_notif_key := 'status_changed:' || new.report_id || ':' || new.to_status_id;

  insert into public.notifications (
    recipient_id, rt_id, type, report_id,
    title, body, dedupe_key
  ) values (
    v_report.reporter_id, v_report.rt_id,
    'report_status_changed',
    new.report_id,
    'Laporan ' || v_report.public_no || ' diperbarui',
    'Status berubah menjadi ' || v_report.to_label,
    v_notif_key
  )
  on conflict (recipient_id, dedupe_key) do nothing;

  return new;
end;
$$;

drop trigger if exists notify_reporter_status on public.report_status_history;
create trigger notify_reporter_status
  after insert on public.report_status_history
  for each row execute function public.fn_notify_reporter_status();

-- ---- 8.8 notify_membership_request -----------------------------------------
-- Memberitahu admin RT saat ada permohonan keanggotaan baru.
create or replace function public.fn_notify_membership_request()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin     record;
  v_notif_key text;
begin
  if new.status = 'pending' and new.join_method = 'request' then
    for v_admin in
      select m.user_id from public.memberships m
      where m.rt_id = new.rt_id and m.role = 'rt_admin' and m.status = 'active'
    loop
      v_notif_key := 'membership_requested:' || new.id || ':' || v_admin.user_id;
      insert into public.notifications (
        recipient_id, rt_id, type,
        title, body, dedupe_key
      ) values (
        v_admin.user_id, new.rt_id,
        'membership_requested',
        'Permintaan bergabung baru',
        'Ada warga yang meminta bergabung ke RT ini.',
        v_notif_key
      )
      on conflict (recipient_id, dedupe_key) do nothing;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists notify_membership_request on public.memberships;
create trigger notify_membership_request
  after insert on public.memberships
  for each row execute function public.fn_notify_membership_request();

-- ---- 8.9 audit_membership_change -------------------------------------------
-- Mencatat setiap perubahan peran dan status keanggotaan.
create or replace function public.fn_audit_membership_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status is distinct from new.status or old.role is distinct from new.role then
    insert into public.audit_logs (
      rt_id, actor_id, actor_role, action, entity_type, entity_id,
      before_state, after_state
    ) values (
      new.rt_id,
      auth.uid(),
      coalesce((
        select role::text from public.memberships
        where user_id = auth.uid() and rt_id = new.rt_id and status = 'active'
        limit 1
      ), 'system'),
      'membership.changed',
      'memberships', new.id,
      jsonb_build_object('status', old.status, 'role', old.role),
      jsonb_build_object('status', new.status, 'role', new.role)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists audit_membership_change on public.memberships;
create trigger audit_membership_change
  after update on public.memberships
  for each row execute function public.fn_audit_membership_change();

-- ---- 8.10 audit_category_change --------------------------------------------
-- Mencatat perubahan kategori untuk jejak admin.
create or replace function public.fn_audit_category_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.audit_logs (
    rt_id, actor_id, actor_role, action, entity_type, entity_id,
    before_state, after_state
  ) values (
    new.rt_id,
    auth.uid(),
    coalesce((
      select role::text from public.memberships
      where user_id = auth.uid() and rt_id = new.rt_id and status = 'active'
      limit 1
    ), 'system'),
    'category.' || tg_op,
    'categories', new.id,
    case when tg_op = 'UPDATE'
      then jsonb_build_object('name', old.name, 'is_active', old.is_active)
      else null
    end,
    jsonb_build_object('name', new.name, 'is_active', new.is_active)
  );
  return new;
end;
$$;

drop trigger if exists audit_category_change on public.categories;
create trigger audit_category_change
  after insert or update on public.categories
  for each row execute function public.fn_audit_category_change();

-- ---- 8.11 audit_status_definition_change -----------------------------------
-- Mencatat perubahan label dan status aktif definisi status.
create or replace function public.fn_audit_status_definition_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.audit_logs (
    rt_id, actor_id, actor_role, action, entity_type, entity_id,
    before_state, after_state
  ) values (
    new.rt_id,
    auth.uid(),
    coalesce((
      select role::text from public.memberships
      where user_id = auth.uid() and rt_id = new.rt_id and status = 'active'
      limit 1
    ), 'system'),
    'status_definition.' || tg_op,
    'status_definitions', new.id,
    case when tg_op = 'UPDATE'
      then jsonb_build_object('label', old.label, 'color_hex', old.color_hex, 'is_active', old.is_active)
      else null
    end,
    jsonb_build_object('label', new.label, 'color_hex', new.color_hex, 'is_active', new.is_active)
  );
  return new;
end;
$$;

drop trigger if exists audit_status_definition_change on public.status_definitions;
create trigger audit_status_definition_change
  after insert or update on public.status_definitions
  for each row execute function public.fn_audit_status_definition_change();

-- ---- 8.12 auto-create profile saat user baru login -------------------------
-- Supabase Auth membuat auth.users; trigger ini membuat profil minimumnya.
create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    'id-ID'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();

-- ---------------------------------------------------------------------------
-- 9. GRANT / HAK AKSES
-- ---------------------------------------------------------------------------
-- Tanpa blok ini, sesi authenticated akan mendapat permission denied (403)
-- walau RLS sudah benar.

-- Hak akses skema
grant usage on schema public to authenticated;
grant usage on schema public to anon;

-- Cabut akses anon dari tabel domain (prinsip hak paling sedikit)
revoke all on public.profiles            from anon;
revoke all on public.rts                 from anon;
revoke all on public.rt_invite_codes     from anon;
revoke all on public.memberships         from anon;
revoke all on public.categories          from anon;
revoke all on public.status_definitions  from anon;
revoke all on public.reports             from anon;
revoke all on public.report_status_history from anon;
revoke all on public.attachments         from anon;
revoke all on public.inspections         from anon;
revoke all on public.comments            from anon;
revoke all on public.assignments         from anon;
revoke all on public.notifications       from anon;
revoke all on public.audit_logs          from anon;
revoke all on public.platform_settings   from anon;
revoke all on public.idempotency_keys    from anon;
revoke all on public.rate_limit_counters from anon;

-- Cabut INSERT/UPDATE/DELETE dari authenticated pada semua tabel domain
-- (hanya SELECT yang diizinkan; tulis hanya lewat RPC)
revoke insert, update, delete on public.rts                   from authenticated;
revoke insert, update, delete on public.rt_invite_codes       from authenticated;
revoke insert, update, delete on public.memberships           from authenticated;
revoke insert, update, delete on public.categories            from authenticated;
revoke insert, update, delete on public.status_definitions    from authenticated;
revoke insert, update, delete on public.reports               from authenticated;
revoke insert, update, delete on public.report_status_history from authenticated;
revoke insert, update, delete on public.attachments           from authenticated;
revoke insert, update, delete on public.inspections           from authenticated;
revoke insert, update, delete on public.comments              from authenticated;
revoke insert, update, delete on public.assignments           from authenticated;
revoke insert, update, delete on public.notifications         from authenticated;
revoke insert, update, delete on public.audit_logs            from authenticated;
revoke insert, update, delete on public.platform_settings     from authenticated;
revoke all                     on public.idempotency_keys      from authenticated;
revoke all                     on public.rate_limit_counters   from authenticated;

-- Beri SELECT pada tabel domain yang boleh dibaca authenticated
grant select on public.profiles              to authenticated;
grant select on public.rts                   to authenticated;
grant select on public.rt_invite_codes       to authenticated;
grant select on public.memberships           to authenticated;
grant select on public.categories            to authenticated;
grant select on public.status_definitions    to authenticated;
grant select on public.reports               to authenticated;
grant select on public.report_status_history to authenticated;
grant select on public.attachments           to authenticated;
grant select on public.inspections           to authenticated;
grant select on public.comments              to authenticated;
grant select on public.assignments           to authenticated;
grant select on public.notifications         to authenticated;
grant select on public.audit_logs            to authenticated;
grant select on public.platform_settings     to authenticated;

-- Beri SELECT pada view
grant select on public.v_reports_feed     to authenticated;
grant select on public.v_report_timeline  to authenticated;
grant select on public.v_rt_activity      to authenticated;

-- Pengecualian tulis: profiles (hanya kolom aman, baris sendiri, dijaga RLS)
grant update (display_name, avatar_path, locale) on public.profiles to authenticated;

-- Hak INSERT untuk profiles (saat registrasi pertama via trigger atau langsung)
grant insert on public.profiles to authenticated;

-- Hak EXECUTE fungsi helper (dipakai oleh policy RLS juga)
grant execute on function public.is_developer()          to authenticated;
grant execute on function public.is_rt_member(uuid)      to authenticated;
grant execute on function public.is_rt_admin(uuid)       to authenticated;
grant execute on function public.get_my_rt_id()          to authenticated;

-- Hak EXECUTE RPC domain
grant execute on function public.create_report(uuid, text, text, jsonb, uuid[])         to authenticated;
grant execute on function public.transition_report_status(uuid, uuid, text, text, text, integer) to authenticated;
grant execute on function public.create_inspection(uuid, text, timestamptz, uuid[])     to authenticated;
grant execute on function public.reopen_report(uuid, text, uuid[])                      to authenticated;
grant execute on function public.join_rt(public.join_method, text, text, text)          to authenticated;
grant execute on function public.decide_membership(uuid, text, public.member_role, text) to authenticated;
grant execute on function public.create_invite_code(smallint, timestamptz, text)        to authenticated;
grant execute on function public.revoke_invite_code(uuid)                               to authenticated;
grant execute on function public.soft_delete_report(uuid, text)                         to authenticated;
grant execute on function public.restore_report(uuid, text)                             to authenticated;
grant execute on function public.mark_notifications_read(uuid[], boolean)               to authenticated;
grant execute on function public.create_rt(text, text, text, text)                      to authenticated;

-- ---------------------------------------------------------------------------
-- 10. SEED DATA
-- ---------------------------------------------------------------------------
-- Hanya konfigurasi minimum. Tidak ada orang, laporan, atau testimoni fiktif.
-- Idempoten: on conflict do nothing.

-- ---- 10.1 RT Demo ----------------------------------------------------------
-- Satu RT demo untuk pengembangan dan pengujian.
-- Admin pertama dibuat lewat create_rt setelah ada akun Google nyata.
insert into public.rts (
  id, name, slug, rw_name, address_text,
  report_prefix, report_seq, photo_required, max_photos,
  timezone, is_active
) values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'RT 01 Melati',
  'rt-01-melati',
  'RW 03',
  'Jl. Melati Raya, Gang Melati, Kota Demo',
  'RT01',
  0,
  true,
  5,
  'Asia/Jakarta',
  true
) on conflict (slug) do nothing;

-- ---- 10.2 Kategori default RT Demo -----------------------------------------
-- Lima kategori umum untuk RT. Slug unik per RT.
insert into public.categories (rt_id, name, slug, description, sort_order, is_active) values
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Saluran Air',     'saluran-air',    'Drainase, selokan, dan genangan air',    10, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lampu Jalan',     'lampu-jalan',    'Lampu penerangan jalan dan gang',        20, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sampah',          'sampah',         'Tumpukan sampah, TPS, dan kebersihan',   30, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Jalan Rusak',     'jalan-rusak',    'Jalan berlubang, retak, atau amblas',    40, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fasilitas Umum',  'fasilitas-umum', 'Taman, pos ronda, dan fasilitas bersama', 50, true)
on conflict (rt_id, slug) do nothing;

-- ---- 10.3 Status definitions RT Demo ---------------------------------------
-- Tujuh kelompok status internal dengan label dan warna awal.
-- Hanya satu definisi aktif per group per RT (dijaga unique constraint).
insert into public.status_definitions (rt_id, "group", label, color_hex, sort_order, requires_note, is_active) values
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'new',         'Baru Masuk',           '#1D4ED8', 10,  false, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'triaged',     'Sudah Diperiksa',      '#7C3AED', 20,  false, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'inspection',  'Inspeksi Lapangan',    '#B45309', 30,  false, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'in_progress', 'Dalam Penanganan',     '#0E6B5C', 40,  false, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'resolved',    'Selesai',              '#16A34A', 50,  true,  true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'closed',      'Ditutup',              '#6B7280', 60,  true,  true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'reopened',    'Dibuka Kembali',       '#DC2626', 70,  false, true)
on conflict (rt_id, "group") do nothing;

-- ---- 10.4 Platform settings ------------------------------------------------
-- Konfigurasi platform. Tidak menyimpan rahasia.
insert into public.platform_settings (key, value) values
  ('retention.notification_days', '180'::jsonb),
  ('upload.max_photos',           '5'::jsonb),
  ('upload.max_bytes',            '5242880'::jsonb),
  ('rate_limit.report_per_hour',  '10'::jsonb),
  ('rate_limit.upload_per_hour',  '30'::jsonb),
  ('rate_limit.join_per_hour',    '5'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 11. JOB TERJADWAL (pg_cron)
-- ---------------------------------------------------------------------------
-- Jadwal dibuat dengan SELECT cron.schedule, idempoten lewat pembersihan lebih dulu.

-- Bersihkan idempotency_keys yang sudah kedaluwarsa (setiap jam)
select cron.unschedule('sulap_cleanup_idempotency') from (select 1) t where exists (
  select 1 from cron.job where jobname = 'sulap_cleanup_idempotency'
);
select cron.schedule(
  'sulap_cleanup_idempotency',
  '0 * * * *',
  $$delete from public.idempotency_keys where expires_at < now()$$
);

-- Bersihkan rate_limit_counters lebih dari 24 jam (setiap jam)
select cron.unschedule('sulap_cleanup_rate_limit') from (select 1) t where exists (
  select 1 from cron.job where jobname = 'sulap_cleanup_rate_limit'
);
select cron.schedule(
  'sulap_cleanup_rate_limit',
  '15 * * * *',
  $$delete from public.rate_limit_counters where window_start < now() - interval '24 hours'$$
);

-- Bersihkan notifikasi yang sudah dibaca lebih dari 180 hari (setiap hari 02.00 UTC)
select cron.unschedule('sulap_cleanup_notifications') from (select 1) t where exists (
  select 1 from cron.job where jobname = 'sulap_cleanup_notifications'
);
select cron.schedule(
  'sulap_cleanup_notifications',
  '0 2 * * *',
  $$delete from public.notifications
    where read_at is not null
      and read_at < now() - interval '180 days'$$
);

-- =============================================================================
-- SELESAI — SULAP init.sql
-- Jalankan sekali pada project Supabase baru. Idempoten: aman dijalankan ulang.
-- =============================================================================
