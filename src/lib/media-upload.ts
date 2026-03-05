import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DIMENSION = 1920 // max width/height
const WEBP_QUALITY = 0.8

export type MediaUploadParams = {
  file: File
  userId: string
  bucket: string        // 'snap-photos', 'coupon-images', 'avatars', etc.
  sourceTable: string   // 'snaps', 'coupons', 'ritual_logs', 'profiles'
  sourceColumn: string  // 'photo_url', 'image_url', 'avatar_url'
  sourceRowId: string   // UUID of the source row
  maxWidth?: number
  maxHeight?: number
}

export type MediaUploadResult =
  | { url: string; mediaId: string }
  | { error: string }

/**
 * Validate, compress to WebP, upload to Supabase Storage,
 * and insert a media_files tracking row.
 */
export async function uploadMedia(params: MediaUploadParams): Promise<MediaUploadResult> {
  const {
    file,
    userId,
    bucket,
    sourceTable,
    sourceColumn,
    sourceRowId,
    maxWidth = MAX_DIMENSION,
    maxHeight = MAX_DIMENSION,
  } = params

  // Validate type
  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image" }
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Image must be under 5MB" }
  }

  // Process image: resize to fit within max dimensions, export as WebP
  let blob: Blob
  let width: number
  let height: number
  try {
    const result = await processImage(file, maxWidth, maxHeight)
    blob = result.blob
    width = result.width
    height = result.height
  } catch {
    return { error: "Failed to process image" }
  }

  const supabase = getSupabaseBrowserClient()
  const fileId = crypto.randomUUID()
  const storagePath = `${userId}/${fileId}.webp`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, blob, { contentType: "image/webp", upsert: false })

  if (uploadError) {
    return { error: "Failed to upload image" }
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath)
  const url = `${urlData.publicUrl}?t=${Date.now()}`

  // Insert media_files tracking row
  const { data: mediaRow, error: insertError } = await supabase
    .from("media_files")
    .insert({
      uploader_id: userId,
      source_table: sourceTable,
      source_column: sourceColumn,
      source_row_id: sourceRowId,
      storage_bucket: bucket,
      storage_path: storagePath,
      original_filename: file.name,
      content_type: "image/webp",
      file_size_bytes: file.size,
      compressed_size_bytes: blob.size,
      width,
      height,
    })
    .select("id")
    .single()

  if (insertError || !mediaRow) {
    return { error: "Failed to track media file" }
  }

  return { url, mediaId: mediaRow.id }
}

async function processImage(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)

  // Calculate dimensions that fit within maxWidth x maxHeight
  let targetWidth = bitmap.width
  let targetHeight = bitmap.height

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight)
    targetWidth = Math.round(targetWidth * ratio)
    targetHeight = Math.round(targetHeight * ratio)
  }

  const canvas = new OffscreenCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
  bitmap.close()

  const blob = await canvas.convertToBlob({ type: "image/webp", quality: WEBP_QUALITY })
  return { blob, width: targetWidth, height: targetHeight }
}
