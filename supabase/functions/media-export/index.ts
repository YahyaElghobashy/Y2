// ============================================================
// TF07: Media Export Edge Function
// Daily cron job. Exports media files older than 7 days from
// Supabase Storage to Google Drive (WebP format).
// Updates media_files.status and google_drive_file_id.
// Deletes Supabase Storage copy after successful export.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS Headers ────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Constants ───────────────────────────────────────────────
const EXPORT_AGE_DAYS = 7;
const BATCH_SIZE = 10;
const DRIVE_ROOT_FOLDER = "Y2-Media";

// ── Types ───────────────────────────────────────────────────
type MediaFileRow = {
  id: string;
  uploader_id: string;
  source_table: string;
  storage_bucket: string;
  storage_path: string;
  content_type: string;
  file_size_bytes: number | null;
  created_at: string;
};

type ExportResult = {
  media_id: string;
  success: boolean;
  drive_file_id?: string;
  error?: string;
  bytes_freed?: number;
};

// ── Helpers ─────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Google OAuth token exchange (same pattern as google-calendar-sync)
async function getAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.access_token ?? null;
}

// Find or create a Google Drive folder by name under a parent
async function findOrCreateFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<string> {
  // Search for existing folder
  let q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) q += ` and '${parentId}' in parents`;

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files?.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create folder: ${name}`);
  }

  const createData = await createRes.json();
  return createData.id;
}

// Ensure a nested folder path exists: Y2-Media/snaps/2026-03
async function ensureDriveFolderPath(
  accessToken: string,
  folderPath: string
): Promise<string> {
  const segments = folderPath.split("/");
  let parentId: string | undefined;

  for (const segment of segments) {
    parentId = await findOrCreateFolder(accessToken, segment, parentId);
  }

  return parentId!;
}

// Upload a file to Google Drive
async function uploadToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  blob: Blob,
  contentType: string
): Promise<string> {
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const boundary = "media_export_boundary";
  const metaJson = JSON.stringify(metadata);
  const blobArray = new Uint8Array(await blob.arrayBuffer());

  const body = new Uint8Array(
    new TextEncoder().encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaJson}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`
    ).length + blobArray.length + new TextEncoder().encode(`\r\n--${boundary}--`).length
  );

  // Build multipart body
  let offset = 0;
  const prefix = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaJson}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`
  );
  body.set(prefix, offset);
  offset += prefix.length;
  body.set(blobArray, offset);
  offset += blobArray.length;
  const suffix = new TextEncoder().encode(`\r\n--${boundary}--`);
  body.set(suffix, offset);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Drive upload failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.id;
}

// ── Main Handler ────────────────────────────────────────────

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Query files eligible for export
    const cutoffDate = new Date(
      Date.now() - EXPORT_AGE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: files, error: queryError } = await supabase
      .from("media_files")
      .select(
        "id, uploader_id, source_table, storage_bucket, storage_path, content_type, file_size_bytes, created_at"
      )
      .eq("status", "active")
      .lt("created_at", cutoffDate)
      .limit(BATCH_SIZE);

    if (queryError) {
      return jsonResponse({ status: "query_error", error: queryError.message }, 500);
    }

    if (!files || files.length === 0) {
      return jsonResponse({ status: "no_files_to_export" });
    }

    // 2. Get Google Drive refresh token from any connected user
    const { data: tokenOwner } = await supabase
      .from("profiles")
      .select("id, google_drive_refresh_token")
      .not("google_drive_refresh_token", "is", null)
      .limit(1)
      .single();

    if (!tokenOwner?.google_drive_refresh_token) {
      return jsonResponse({
        status: "no_drive_token",
        files_pending: files.length,
      });
    }

    const accessToken = await getAccessToken(
      tokenOwner.google_drive_refresh_token
    );
    if (!accessToken) {
      return jsonResponse({ status: "token_refresh_failed" }, 503);
    }

    // 3. Process each file
    const results: ExportResult[] = [];
    let totalBytesFreed = 0;

    for (const file of files as MediaFileRow[]) {
      try {
        // a. Download from Supabase Storage
        const { data: fileData, error: downloadErr } = await supabase.storage
          .from(file.storage_bucket)
          .download(file.storage_path);

        if (downloadErr || !fileData) {
          await supabase
            .from("media_files")
            .update({ status: "export_failed" })
            .eq("id", file.id);
          results.push({
            media_id: file.id,
            success: false,
            error: "download_failed",
          });
          continue;
        }

        // b. Determine Drive folder path: Y2-Media/{source_table}/{YYYY-MM}
        const createdDate = new Date(file.created_at);
        const yearMonth = `${createdDate.getFullYear()}-${String(
          createdDate.getMonth() + 1
        ).padStart(2, "0")}`;
        const folderPath = `${DRIVE_ROOT_FOLDER}/${file.source_table}/${yearMonth}`;

        // c. Ensure folder exists
        const folderId = await ensureDriveFolderPath(accessToken, folderPath);

        // d. Upload to Drive (files are already WebP from client-side conversion)
        const fileName = `${file.id}.webp`;
        const driveFileId = await uploadToDrive(
          accessToken,
          folderId,
          fileName,
          fileData,
          file.content_type || "image/webp"
        );

        // e. Update media_files row
        await supabase
          .from("media_files")
          .update({
            status: "exported",
            google_drive_file_id: driveFileId,
            google_drive_folder: folderPath,
            compressed_size_bytes: fileData.size,
            exported_at: new Date().toISOString(),
          })
          .eq("id", file.id);

        // f. Delete from Supabase Storage (free up space)
        await supabase.storage
          .from(file.storage_bucket)
          .remove([file.storage_path]);

        const bytesFreed = file.file_size_bytes ?? fileData.size;
        totalBytesFreed += bytesFreed;

        results.push({
          media_id: file.id,
          success: true,
          drive_file_id: driveFileId,
          bytes_freed: bytesFreed,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await supabase
          .from("media_files")
          .update({ status: "export_failed" })
          .eq("id", file.id);
        results.push({ media_id: file.id, success: false, error: msg });
      }
    }

    return jsonResponse({
      status: "completed",
      total: files.length,
      exported: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      bytes_freed: totalBytesFreed,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return jsonResponse({ status: "error", error: msg }, 500);
  }
});
