import { neon } from "@neondatabase/serverless";
import { requireEnv } from "@/lib/env";

export const sql = neon(requireEnv("DATABASE_URL"));

// The driver returns `date` columns as Date objects, not strings — normalize to YYYY-MM-DD.
export function toDateOnly(value: Date | string | null): string {
  if (!value) return "";
  return (typeof value === "string" ? value : value.toISOString()).slice(0, 10);
}
