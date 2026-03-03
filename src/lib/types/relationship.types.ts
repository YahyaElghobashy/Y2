import type { Database } from "@/lib/types/database.types"

export type CouponCategory = "romantic" | "practical" | "fun" | "food" | "general"

export type CouponStatus =
  | "active"
  | "pending_approval"
  | "redeemed"
  | "rejected"
  | "expired"

export type Coupon = Database["public"]["Tables"]["coupons"]["Row"]

export type CreateCouponData = {
  title: string
  description?: string
  emoji?: string
  category?: CouponCategory
  image_url?: string
  is_surprise?: boolean
  expires_at?: string
}

export type UseCouponsReturn = {
  myCoupons: Coupon[]
  receivedCoupons: Coupon[]
  pendingApprovals: Coupon[]
  isLoading: boolean
  error: string | null
  createCoupon: (data: CreateCouponData) => Promise<Coupon>
  redeemCoupon: (couponId: string) => Promise<void>
  approveCoupon: (couponId: string) => Promise<void>
  rejectCoupon: (couponId: string, reason?: string) => Promise<void>
  revealSurprise: (couponId: string) => Promise<void>
  refreshCoupons: () => Promise<void>
}
