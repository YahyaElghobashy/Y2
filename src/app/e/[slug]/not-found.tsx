import Link from "next/link"

export default function PortalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBF8F4] px-5 text-center">
      <h1 className="mb-2 font-display text-2xl font-semibold text-[#2C2825]">
        Portal Not Found
      </h1>
      <p className="mb-6 text-sm text-[#8C8279]">
        This event portal doesn&apos;t exist or hasn&apos;t been published yet.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[#C4956A] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Go Home
      </Link>
    </div>
  )
}
