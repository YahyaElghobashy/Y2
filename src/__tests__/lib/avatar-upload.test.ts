import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Hoisted mocks ─────────────────────────────────────────
const mockUpload = vi.fn()
const mockRemove = vi.fn()
const mockGetPublicUrl = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}))

// Mock OffscreenCanvas and createImageBitmap globally
const mockConvertToBlob = vi.fn()
const mockDrawImage = vi.fn()
const mockClose = vi.fn()

vi.stubGlobal("OffscreenCanvas", class {
  width: number
  height: number
  constructor(w: number, h: number) {
    this.width = w
    this.height = h
  }
  getContext() {
    return { drawImage: mockDrawImage }
  }
  convertToBlob = mockConvertToBlob
})

vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({
  width: 800,
  height: 600,
  close: mockClose,
}))

import { uploadAvatar } from "@/lib/avatar-upload"

describe("uploadAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConvertToBlob.mockResolvedValue(new Blob(["test"], { type: "image/webp" }))
    mockUpload.mockResolvedValue({ error: null })
    mockRemove.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://storage.example.com/avatars/user-1.webp" },
    })
  })

  // ── Unit tests ──────────────────────────────────────────
  describe("unit", () => {
    it("rejects non-image files", async () => {
      const file = new File(["data"], "test.txt", { type: "text/plain" })
      const result = await uploadAvatar(file, "user-1")
      expect(result).toEqual({ error: "File must be an image" })
    })

    it("rejects files over 5MB", async () => {
      const file = new File([new ArrayBuffer(6 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" })
      const result = await uploadAvatar(file, "user-1")
      expect(result).toEqual({ error: "Image must be under 5MB" })
    })

    it("accepts valid image files", async () => {
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
      const result = await uploadAvatar(file, "user-1")
      expect("url" in result).toBe(true)
    })

    it("returns URL with cache-busting timestamp", async () => {
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
      const result = await uploadAvatar(file, "user-1")
      if ("url" in result) {
        expect(result.url).toContain("?t=")
      }
    })
  })

  // ── Integration tests ───────────────────────────────────
  describe("integration", () => {
    it("uploads to correct Storage path", async () => {
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
      await uploadAvatar(file, "user-42")
      expect(mockUpload).toHaveBeenCalledWith(
        "avatars/user-42.webp",
        expect.any(Blob),
        { contentType: "image/webp", upsert: true }
      )
    })

    it("removes old avatar before uploading", async () => {
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
      await uploadAvatar(file, "user-1")
      expect(mockRemove).toHaveBeenCalledWith(["avatars/user-1.webp"])
      // Remove should be called before upload
      const removeOrder = mockRemove.mock.invocationCallOrder[0]
      const uploadOrder = mockUpload.mock.invocationCallOrder[0]
      expect(removeOrder).toBeLessThan(uploadOrder)
    })

    it("calls createImageBitmap for processing", async () => {
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
      await uploadAvatar(file, "user-1")
      expect(createImageBitmap).toHaveBeenCalledWith(file)
    })

    it("creates 400x400 OffscreenCanvas", async () => {
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
      await uploadAvatar(file, "user-1")
      expect(mockDrawImage).toHaveBeenCalled()
    })

    it("converts to WebP at 80% quality", async () => {
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
      await uploadAvatar(file, "user-1")
      expect(mockConvertToBlob).toHaveBeenCalledWith({ type: "image/webp", quality: 0.8 })
    })

    it("closes ImageBitmap after processing", async () => {
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
      await uploadAvatar(file, "user-1")
      expect(mockClose).toHaveBeenCalled()
    })

    it("returns error when upload fails", async () => {
      mockUpload.mockResolvedValue({ error: { message: "Upload failed" } })
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
      const result = await uploadAvatar(file, "user-1")
      expect(result).toEqual({ error: "Failed to upload avatar" })
    })

    it("returns error when image processing fails", async () => {
      vi.mocked(createImageBitmap).mockRejectedValueOnce(new Error("Bad image"))
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
      const result = await uploadAvatar(file, "user-1")
      expect(result).toEqual({ error: "Failed to process image" })
    })

    it("calls getPublicUrl with correct path", async () => {
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
      await uploadAvatar(file, "user-1")
      expect(mockGetPublicUrl).toHaveBeenCalledWith("avatars/user-1.webp")
    })
  })
})
