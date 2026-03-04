import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const AVATAR_SIZE = 400 // 400x400 output
const WEBP_QUALITY = 0.8

type UploadResult = {
  url: string
} | {
  error: string
}

/**
 * Validate, resize, crop, and upload an avatar image.
 * Returns the public URL on success or an error message.
 */
export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  // Validate type
  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image" }
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Image must be under 5MB" }
  }

  // Process image: center-crop to square, resize to 400x400, export as WebP
  let blob: Blob
  try {
    blob = await processImage(file)
  } catch {
    return { error: "Failed to process image" }
  }

  // Upload to Supabase Storage
  const supabase = getSupabaseBrowserClient()
  const path = `avatars/${userId}.webp`

  // Remove old avatar first (upsert pattern)
  await supabase.storage.from("avatars").remove([path])

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, blob, { contentType: "image/webp", upsert: true })

  if (uploadError) {
    return { error: "Failed to upload avatar" }
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path)

  // Bust cache with timestamp
  const url = `${urlData.publicUrl}?t=${Date.now()}`

  return { url }
}

async function processImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)

  // Center crop to square
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - side) / 2
  const sy = (bitmap.height - side) / 2

  const canvas = new OffscreenCanvas(AVATAR_SIZE, AVATAR_SIZE)
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
  bitmap.close()

  return await canvas.convertToBlob({ type: "image/webp", quality: WEBP_QUALITY })
}
