import type { Database } from "./database.types"

export type VisionBoard = Database["public"]["Tables"]["vision_boards"]["Row"]
export type VisionBoardInsert = Database["public"]["Tables"]["vision_boards"]["Insert"]
export type VisionCategory = Database["public"]["Tables"]["vision_categories"]["Row"]
export type VisionCategoryInsert = Database["public"]["Tables"]["vision_categories"]["Insert"]
export type VisionItem = Database["public"]["Tables"]["vision_items"]["Row"]
export type VisionItemInsert = Database["public"]["Tables"]["vision_items"]["Insert"]
export type MonthlyEvaluation = Database["public"]["Tables"]["monthly_evaluations"]["Row"]
export type MonthlyEvaluationInsert = Database["public"]["Tables"]["monthly_evaluations"]["Insert"]
export type CategoryScore = Database["public"]["Tables"]["category_scores"]["Row"]
export type CategoryScoreInsert = Database["public"]["Tables"]["category_scores"]["Insert"]

export type ActiveBoard = "mine" | "partner"

export type CategoryWithItems = VisionCategory & {
  items: VisionItem[]
}

export type EvaluationWithScores = MonthlyEvaluation & {
  category_scores: CategoryScore[]
}
