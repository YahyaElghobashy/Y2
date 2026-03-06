import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLDivElement>
      ) => {
        const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
        void initial; void animate; void exit; void transition; void whileHover; void whileTap
        return <div ref={ref} {...rest}>{children}</div>
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { CreateCouponStep3 } from "@/components/coupons/CreateCouponStep3"

// Helper to create a mock File
function createMockFile(name: string, sizeBytes: number, type = "image/png"): File {
  const buffer = new ArrayBuffer(sizeBytes)
  return new File([buffer], name, { type })
}

describe("CreateCouponStep3", () => {
  const mockOnNext = vi.fn()
  const mockOnBack = vi.fn()
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:http://localhost/fake-url")
    revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
  })

  afterEach(() => {
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
  })

  const renderStep3 = (props?: Partial<React.ComponentProps<typeof CreateCouponStep3>>) =>
    render(
      <CreateCouponStep3
        onNext={mockOnNext}
        onBack={mockOnBack}
        {...props}
      />
    )

  // ─── Unit Tests ───────────────────────────────────────────────────

  describe("Unit", () => {
    it("calls onBack when Back button is clicked", async () => {
      renderStep3()
      const backBtn = screen.getByTestId("back-button")
      await userEvent.click(backBtn)
      expect(mockOnBack).toHaveBeenCalledTimes(1)
    })

    it("calls onNext with empty object when Skip button is clicked (no image)", async () => {
      renderStep3()
      // When no file is uploaded, the button reads "Skip"
      const nextBtn = screen.getByTestId("next-button")
      expect(nextBtn).toHaveTextContent("Skip")
      await userEvent.click(nextBtn)
      expect(mockOnNext).toHaveBeenCalledTimes(1)
      expect(mockOnNext).toHaveBeenCalledWith({})
    })

    it("calls onNext with { imageFile, imagePreview } when Next is clicked after upload", async () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      const validFile = createMockFile("photo.png", 1024, "image/png")

      fireEvent.change(fileInput, { target: { files: [validFile] } })

      // Button should now say "Next"
      const nextBtn = screen.getByTestId("next-button")
      expect(nextBtn).toHaveTextContent("Next")
      await userEvent.click(nextBtn)

      expect(mockOnNext).toHaveBeenCalledTimes(1)
      const callArgs = mockOnNext.mock.calls[0][0]
      expect(callArgs.imageFile).toBe(validFile)
      expect(callArgs.imagePreview).toBe("blob:http://localhost/fake-url")
    })

    it("button text switches from Skip to Next after a file is uploaded", () => {
      renderStep3()
      expect(screen.getByTestId("next-button")).toHaveTextContent("Skip")

      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      const validFile = createMockFile("photo.jpg", 2048, "image/jpeg")
      fireEvent.change(fileInput, { target: { files: [validFile] } })

      expect(screen.getByTestId("next-button")).toHaveTextContent("Next")
    })

    it("initializes with existing data when data prop is provided", () => {
      const existingFile = createMockFile("existing.png", 512, "image/png")
      renderStep3({
        data: { imageFile: existingFile, imagePreview: "blob:http://localhost/existing" },
      })
      // Should show preview, not upload area
      expect(screen.getByTestId("image-preview")).toBeInTheDocument()
      expect(screen.queryByTestId("upload-area")).not.toBeInTheDocument()
      // Button should say "Next" since file exists
      expect(screen.getByTestId("next-button")).toHaveTextContent("Next")
    })

    it("renders the heading text", () => {
      renderStep3()
      expect(screen.getByText("Add a photo?")).toBeInTheDocument()
    })
  })

  // ─── Interaction Tests ────────────────────────────────────────────

  describe("Interaction", () => {
    it("shows upload area initially when no data is provided", () => {
      renderStep3()
      expect(screen.getByTestId("upload-area")).toBeInTheDocument()
      expect(screen.queryByTestId("image-preview")).not.toBeInTheDocument()
    })

    it("shows image preview after a valid file is uploaded", () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      const validFile = createMockFile("photo.png", 1024, "image/png")

      fireEvent.change(fileInput, { target: { files: [validFile] } })

      expect(screen.getByTestId("image-preview")).toBeInTheDocument()
      expect(screen.queryByTestId("upload-area")).not.toBeInTheDocument()
      const img = screen.getByAltText("Coupon photo")
      expect(img).toHaveAttribute("src", "blob:http://localhost/fake-url")
    })

    it("shows error when file exceeds 5MB", () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      const oversizedFile = createMockFile("huge.png", 6 * 1024 * 1024, "image/png")

      fireEvent.change(fileInput, { target: { files: [oversizedFile] } })

      expect(screen.getByTestId("file-error")).toBeInTheDocument()
      expect(screen.getByTestId("file-error")).toHaveTextContent("Image must be under 5MB")
      // Upload area should still be visible, no preview
      expect(screen.getByTestId("upload-area")).toBeInTheDocument()
      expect(screen.queryByTestId("image-preview")).not.toBeInTheDocument()
    })

    it("does not show error for a file exactly at 5MB", () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      const exactFile = createMockFile("exact.png", 5 * 1024 * 1024, "image/png")

      fireEvent.change(fileInput, { target: { files: [exactFile] } })

      expect(screen.queryByTestId("file-error")).not.toBeInTheDocument()
      expect(screen.getByTestId("image-preview")).toBeInTheDocument()
    })

    it("clears the image when remove button is clicked", () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      const validFile = createMockFile("photo.png", 1024, "image/png")

      fireEvent.change(fileInput, { target: { files: [validFile] } })
      expect(screen.getByTestId("image-preview")).toBeInTheDocument()

      // Click remove
      const removeBtn = screen.getByTestId("remove-image")
      fireEvent.click(removeBtn)

      // Should revert to upload area
      expect(screen.queryByTestId("image-preview")).not.toBeInTheDocument()
      expect(screen.getByTestId("upload-area")).toBeInTheDocument()
      // Button should switch back to "Skip"
      expect(screen.getByTestId("next-button")).toHaveTextContent("Skip")
    })

    it("clears the error when a valid file is uploaded after an invalid one", () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement

      // First: oversized file
      const oversizedFile = createMockFile("huge.png", 6 * 1024 * 1024, "image/png")
      fireEvent.change(fileInput, { target: { files: [oversizedFile] } })
      expect(screen.getByTestId("file-error")).toBeInTheDocument()

      // Then: valid file
      const validFile = createMockFile("ok.png", 1024, "image/png")
      fireEvent.change(fileInput, { target: { files: [validFile] } })
      expect(screen.queryByTestId("file-error")).not.toBeInTheDocument()
    })

    it("does nothing when file input change fires with no files", () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement

      // Simulate change with empty files list
      fireEvent.change(fileInput, { target: { files: [] } })

      // Upload area should remain, no preview
      expect(screen.getByTestId("upload-area")).toBeInTheDocument()
      expect(screen.queryByTestId("image-preview")).not.toBeInTheDocument()
      expect(screen.queryByTestId("file-error")).not.toBeInTheDocument()
    })

    it("full upload-then-skip flow: upload file, remove it, then skip", async () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      const validFile = createMockFile("photo.png", 1024, "image/png")

      // Upload
      fireEvent.change(fileInput, { target: { files: [validFile] } })
      expect(screen.getByTestId("next-button")).toHaveTextContent("Next")

      // Remove
      fireEvent.click(screen.getByTestId("remove-image"))
      expect(screen.getByTestId("next-button")).toHaveTextContent("Skip")

      // Skip
      await userEvent.click(screen.getByTestId("next-button"))
      expect(mockOnNext).toHaveBeenCalledWith({})
    })
  })

  // ─── Integration Tests ────────────────────────────────────────────

  describe("Integration", () => {
    it("calls URL.createObjectURL when a valid file is uploaded", () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      const validFile = createMockFile("photo.png", 2048, "image/png")

      fireEvent.change(fileInput, { target: { files: [validFile] } })

      expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
      expect(createObjectURLSpy).toHaveBeenCalledWith(validFile)
    })

    it("does not call URL.createObjectURL for oversized files", () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      const oversizedFile = createMockFile("huge.png", 6 * 1024 * 1024, "image/png")

      fireEvent.change(fileInput, { target: { files: [oversizedFile] } })

      expect(createObjectURLSpy).not.toHaveBeenCalled()
    })

    it("calls URL.revokeObjectURL when image is removed", () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      const validFile = createMockFile("photo.png", 1024, "image/png")

      fireEvent.change(fileInput, { target: { files: [validFile] } })
      fireEvent.click(screen.getByTestId("remove-image"))

      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1)
      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:http://localhost/fake-url")
    })

    it("does not call URL.revokeObjectURL when no image was uploaded", () => {
      renderStep3()
      // No upload, no remove — nothing to revoke
      expect(revokeObjectURLSpy).not.toHaveBeenCalled()
    })

    it("file input is configured with accept=image/* and capture=environment", () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      expect(fileInput).toHaveAttribute("accept", "image/*")
      expect(fileInput).toHaveAttribute("capture", "environment")
      expect(fileInput).toHaveAttribute("type", "file")
    })

    it("file input is hidden from view", () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      expect(fileInput).toHaveClass("hidden")
    })

    it("resets file input value when image is removed", () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      const validFile = createMockFile("photo.png", 1024, "image/png")

      // Upload a file
      fireEvent.change(fileInput, { target: { files: [validFile] } })

      // Remove the image
      fireEvent.click(screen.getByTestId("remove-image"))

      // The input value should be cleared so re-uploading the same file triggers onChange
      expect(fileInput.value).toBe("")
    })

    it("upload area click delegates to hidden file input", async () => {
      renderStep3()
      const fileInput = screen.getByTestId("file-input") as HTMLInputElement
      const clickSpy = vi.spyOn(fileInput, "click")

      const uploadArea = screen.getByTestId("upload-area")
      await userEvent.click(uploadArea)

      expect(clickSpy).toHaveBeenCalledTimes(1)
      clickSpy.mockRestore()
    })
  })
})
