import type { Database } from "@/lib/types/database.types"

export type CoyynsWallet = Database["public"]["Tables"]["coyyns_wallets"]["Row"]

export type CoyynsTransaction = Database["public"]["Tables"]["coyyns_transactions"]["Row"]
