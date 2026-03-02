import { cn } from "@/lib/utils"

type LoadingSkeletonProps = {
  variant: "card" | "list-item" | "header" | "full-page"
  count?: number
  className?: string
}

function CardSkeleton() {
  return (
    <div className="w-full h-[120px] rounded-xl bg-bg-secondary animate-pulse p-4">
      <div className="w-8 h-8 rounded-full bg-bg-primary opacity-70" />
      <div className="w-[60%] h-3.5 rounded bg-bg-primary opacity-70 mt-3" />
      <div className="w-[40%] h-2.5 rounded bg-bg-primary opacity-70 mt-2" />
    </div>
  )
}

function ListItemSkeleton() {
  return (
    <div className="w-full h-14 rounded-lg bg-bg-secondary animate-pulse flex items-center px-4">
      <div className="w-10 h-10 rounded-full bg-bg-primary opacity-70 shrink-0" />
      <div className="flex-1 ms-3">
        <div className="w-[60%] h-3 rounded bg-bg-primary opacity-70" />
        <div className="w-[40%] h-2.5 rounded bg-bg-primary opacity-70 mt-2" />
      </div>
    </div>
  )
}

function HeaderSkeleton() {
  return (
    <div>
      <div className="w-1/2 h-7 rounded bg-bg-secondary animate-pulse" />
      <div className="w-[30%] h-4 rounded bg-bg-secondary animate-pulse mt-2" />
    </div>
  )
}

export function LoadingSkeleton({ variant, count = 3, className }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={cn(className)}>
        <CardSkeleton />
      </div>
    )
  }

  if (variant === "list-item") {
    if (count === 0) return null

    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {Array.from({ length: count }, (_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (variant === "header") {
    return (
      <div className={cn(className)}>
        <HeaderSkeleton />
      </div>
    )
  }

  // full-page
  return (
    <div className={cn("p-6", className)}>
      <HeaderSkeleton />
      <div className="mt-6 flex flex-col gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}
