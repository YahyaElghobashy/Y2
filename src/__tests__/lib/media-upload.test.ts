import { describe, it, expect, vi, beforeEach } from "vitest"
import { uploadMedia, type MediaUploadParams } from "@/lib/media-upload"

// ── Mocks ──────────────────────────────────────────────

let mockUploadResult: { error: unknown } = { error: null }
let mockInsertResult: { data: unknown; error: unknown } = {
  data: { id: "media-row-id" },
  error: null,
}

const mockUpload = vi.fn().mockImplementation(() => Promise.resolve(mockUploadResult))
const mockGetPublicUrl = vi.fn().mockReturnValue({
  data: { publicUrl: "https://storage.supabase.co/bucket/user/file.webp" },
})
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn().mockImplementation(() => Promise.resolve(mockInsertResult))

// Build chainable insert mock
mockInsert.mockReturnValue({ select: mockSelect })
mockSelect.mockReturnValue({ single: mockSingle })

const mockSupabaseClient = {
  storage: {
    from: vi.fn().mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    }),
  },
  from: vi.fn().mockReturnValue({
    insert: mockInsert,
  }),
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabaseClient,
}))

// Mock createImageBitmap + OffscreenCanvas (not available in jsdom)
const mockClose = vi.fn()
const mockDrawImage = vi.fn()
const mockConvertToBlob = vi.fn().mockResolvedValue(
  new Blob(["compressed-data"], { type: "image/webp" })
)

vi.stubGlobal(
  "createImageBitmap",
  vi.fn().mockResolvedValue({ width: 800, height: 600, close: mockClose })
)

vi.stubGlobal("OffscreenCanvas", vi.fn().mockImplementation(function (this: Record<string, unknown>) {
  this.getContext = () => ({ drawImage: mockDrawImage })
  this.convertToBlob = mockConvertToBlob
}))

// Stable UUID for predictable storage paths
vi.stubGlobal("crypto", {
  ...globalThis.crypto,
  randomUUID: vi.fn().mockReturnValue("test-uuid-1234"),
})

// ── Helpers ────────────────────────────────────────────

function createTestFile(options?: { type?: string; size?: number; name?: string }): File {
  const { type = "image/jpeg", size = 1024, name = "photo.jpg" } = options ?? {}
  const content = new ArrayBuffer(size)
  return new File([content], name, { type })
}

const validParams: MediaUploadParams = {
  file: createTestFile(),
  userId: "user-123",
  bucket: "snap-photos",
  sourceTable: "snaps",
  sourceColumn: "photo_url",
  sourceRowId: "row-456",
}

// ── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  mockUploadResult = { error: null }
  mockInsertResult = { data: { id: "media-row-id" }, error: null }

  // Re-chain mocks after clearAllMocks wipes return values
  mockUpload.mockImplementation(() => Promise.resolve(mockUploadResult))
  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: "https://storage.supabase.co/bucket/user/file.webp" },
  })
  mockSupabaseClient.storage.from.mockReturnValue({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  })

  mockInsert.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({ single: mockSingle })
  mockSingle.mockImplementation(() => Promise.resolve(mockInsertResult))
  mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })

  mockConvertToBlob.mockResolvedValue(
    new Blob(["compressed-data"], { type: "image/webp" })
  )
  ;(globalThis.OffscreenCanvas as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    function (this: Record<string, unknown>) {
      this.getContext = () => ({ drawImage: mockDrawImage })
      this.convertToBlob = mockConvertToBlob
    }
  )
  ;(globalThis.createImageBitmap as ReturnType<typeof vi.fn>).mockResolvedValue({
    width: 800,
    height: 600,
    close: mockClose,
  })
})

// ── Unit Tests ─────────────────────────────────────────

describe("uploadMedia — unit", () => {
  it("rejects non-image files", async () => {
    const result = await uploadMedia({
      ...validParams,
      file: createTestFile({ type: "application/pdf" }),
    })
    expect(result).toEqual({ error: "File must be an image" })
  })

  it("rejects files over 5MB", async () => {
    const result = await uploadMedia({
      ...validParams,
      file: createTestFile({ size: 6 * 1024 * 1024 }),
    })
    expect(result).toEqual({ error: "Image must be under 5MB" })
  })

  it("accepts files exactly at 5MB", async () => {
    const result = await uploadMedia({
      ...validParams,
      file: createTestFile({ size: 5 * 1024 * 1024 }),
    })
    expect("url" in result).toBe(true)
  })

  it("accepts various image types", async () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
      const result = await uploadMedia({
        ...validParams,
        file: createTestFile({ type }),
      })
      expect("url" in result).toBe(true)
    }
  })

  it("returns error when image processing fails", async () => {
    ;(globalThis.createImageBitmap as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("decode error")
    )
    const result = await uploadMedia(validParams)
    expect(result).toEqual({ error: "Failed to process image" })
  })

  it("returns error when Storage upload fails", async () => {
    mockUploadResult = { error: { message: "quota exceeded" } }
    const result = await uploadMedia(validParams)
    expect(result).toEqual({ error: "Failed to upload image" })
  })

  it("returns error when media_files insert fails", async () => {
    mockInsertResult = { data: null, error: { message: "insert failed" } }
    const result = await uploadMedia(validParams)
    expect(result).toEqual({ error: "Failed to track media file" })
  })

  it("returns url and mediaId on success", async () => {
    const result = await uploadMedia(validParams)
    expect("url" in result && "mediaId" in result).toBe(true)
    if ("url" in result) {
      expect(result.url).toContain("https://storage.supabase.co/bucket/user/file.webp")
      expect(result.mediaId).toBe("media-row-id")
    }
  })

  it("appends cache-busting timestamp to URL", async () => {
    const result = await uploadMedia(validParams)
    if ("url" in result) {
      expect(result.url).toMatch(/\?t=\d+$/)
    }
  })
})

// ── Interaction Tests ──────────────────────────────────

describe("uploadMedia — interaction", () => {
  it("processes image through createImageBitmap and OffscreenCanvas", async () => {
    await uploadMedia(validParams)
    expect(globalThis.createImageBitmap).toHaveBeenCalledWith(validParams.file)
    expect(OffscreenCanvas).toHaveBeenCalledWith(800, 600) // original dimensions fit within 1920
    expect(mockDrawImage).toHaveBeenCalled()
    expect(mockClose).toHaveBeenCalled() // bitmap.close() called
  })

  it("resizes images exceeding max dimensions", async () => {
    ;(globalThis.createImageBitmap as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      width: 3840,
      height: 2160,
      close: mockClose,
    })

    await uploadMedia(validParams)

    // 3840x2160 scaled to fit 1920x1920: ratio = min(1920/3840, 1920/2160) = 0.5
    // → 1920 x 1080
    expect(OffscreenCanvas).toHaveBeenCalledWith(1920, 1080)
  })

  it("resizes with custom maxWidth/maxHeight", async () => {
    ;(globalThis.createImageBitmap as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      width: 2000,
      height: 1000,
      close: mockClose,
    })

    await uploadMedia({ ...validParams, maxWidth: 500, maxHeight: 500 })

    // ratio = min(500/2000, 500/1000) = 0.25 → 500 x 250
    expect(OffscreenCanvas).toHaveBeenCalledWith(500, 250)
  })

  it("does not resize images within max dimensions", async () => {
    ;(globalThis.createImageBitmap as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      width: 400,
      height: 300,
      close: mockClose,
    })

    await uploadMedia(validParams)
    expect(OffscreenCanvas).toHaveBeenCalledWith(400, 300)
  })

  it("converts to WebP with 0.8 quality", async () => {
    await uploadMedia(validParams)
    expect(mockConvertToBlob).toHaveBeenCalledWith({
      type: "image/webp",
      quality: 0.8,
    })
  })
})

// ── Integration Tests ──────────────────────────────────

describe("uploadMedia — integration", () => {
  it("uploads to correct Storage bucket and path", async () => {
    await uploadMedia(validParams)

    expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith("snap-photos")
    expect(mockUpload).toHaveBeenCalledWith(
      "user-123/test-uuid-1234.webp",
      expect.any(Blob),
      { contentType: "image/webp", upsert: false }
    )
  })

  it("gets public URL from correct bucket", async () => {
    await uploadMedia(validParams)

    // storage.from called twice: once for upload, once for getPublicUrl
    expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith("snap-photos")
    expect(mockGetPublicUrl).toHaveBeenCalledWith("user-123/test-uuid-1234.webp")
  })

  it("inserts media_files row with correct fields", async () => {
    await uploadMedia(validParams)

    expect(mockSupabaseClient.from).toHaveBeenCalledWith("media_files")
    expect(mockInsert).toHaveBeenCalledWith({
      uploader_id: "user-123",
      source_table: "snaps",
      source_column: "photo_url",
      source_row_id: "row-456",
      storage_bucket: "snap-photos",
      storage_path: "user-123/test-uuid-1234.webp",
      original_filename: "photo.jpg",
      content_type: "image/webp",
      file_size_bytes: 1024,
      compressed_size_bytes: expect.any(Number),
      width: 800,
      height: 600,
    })
  })

  it("calls .select('id').single() on insert", async () => {
    await uploadMedia(validParams)
    expect(mockSelect).toHaveBeenCalledWith("id")
    expect(mockSingle).toHaveBeenCalled()
  })

  it("does not call Storage or DB if validation fails", async () => {
    await uploadMedia({
      ...validParams,
      file: createTestFile({ type: "text/plain" }),
    })
    expect(mockUpload).not.toHaveBeenCalled()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("does not insert media_files if Storage upload fails", async () => {
    mockUploadResult = { error: { message: "failed" } }
    await uploadMedia(validParams)
    expect(mockUpload).toHaveBeenCalled()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("tracks compressed_size_bytes from blob, not original file", async () => {
    const smallBlob = new Blob(["tiny"], { type: "image/webp" })
    mockConvertToBlob.mockResolvedValueOnce(smallBlob)

    await uploadMedia({
      ...validParams,
      file: createTestFile({ size: 2048 }),
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        file_size_bytes: 2048,
        compressed_size_bytes: smallBlob.size,
      })
    )
  })
})
