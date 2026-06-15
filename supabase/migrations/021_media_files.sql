-- ============================================================
-- TF07: Media Files Tracking Table
-- Tracks all uploaded media files across the app.
-- Files start in Supabase Storage, then after 7 days the
-- media-export cron compresses them to WebP and uploads to
-- Google Drive, updating this row with the Drive file ID.
-- ============================================================

-- ── 1. MEDIA_FILES TABLE ────────────────────────────────────
create table public.media_files (
  id                    uuid        primary key default gen_random_uuid(),
  uploader_id           uuid        not null references public.profiles (id) on delete cascade,

  -- Source context: which table+column this image belongs to
  source_table          text        not null,
  source_column         text        not null,
  source_row_id         uuid        not null,

  -- Supabase Storage location (populated at upload time)
  storage_bucket        text        not null,
  storage_path          text        not null,

  -- Google Drive location (populated after export)
  google_drive_file_id  text,
  google_drive_folder   text,

  -- Metadata
  original_filename     text,
  content_type          text        not null default 'image/webp',
  file_size_bytes       integer,
  compressed_size_bytes integer,
  width                 integer,
  height                integer,

  -- Lifecycle
  status                text        not null default 'active'
                        check (status in ('active', 'exported', 'export_failed', 'deleted')),
  exported_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── 2. INDEXES ──────────────────────────────────────────────
create index media_files_uploader_idx
  on public.media_files (uploader_id);

create index media_files_status_created_idx
  on public.media_files (status, created_at);

create index media_files_source_idx
  on public.media_files (source_table, source_row_id);

create index media_files_drive_id_idx
  on public.media_files (google_drive_file_id)
  where google_drive_file_id is not null;

-- ── 3. UPDATED_AT TRIGGER ───────────────────────────────────
-- Reuses set_updated_at() created in 001_auth_profiles.sql
create trigger media_files_set_updated_at
  before update on public.media_files
  for each row
  execute function public.set_updated_at();

-- ── 4. ROW LEVEL SECURITY ───────────────────────────────────
alter table public.media_files enable row level security;

-- Both partners can read all media files
create policy "media_files: authenticated select"
  on public.media_files for select
  to authenticated
  using (true);

-- Users can insert their own media files
create policy "media_files: own insert"
  on public.media_files for insert
  to authenticated
  with check (auth.uid() = uploader_id);

-- Users can update their own media files
create policy "media_files: own update"
  on public.media_files for update
  to authenticated
  using (auth.uid() = uploader_id);

-- ── 5. GOOGLE DRIVE TOKEN ON PROFILES ───────────────────────
alter table public.profiles
  add column if not exists google_drive_refresh_token text,
  add column if not exists google_drive_connected_at  timestamptz;
