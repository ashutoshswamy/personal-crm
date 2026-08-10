import { apiFetch } from "@/lib/api-client";

export function uploadAvatar(token: string, dataUrl: string): Promise<{ ok: true }> {
  return apiFetch(token, "/api/avatar", { method: "PUT", body: JSON.stringify({ dataUrl }) });
}

export function deleteAvatar(token: string): Promise<null> {
  return apiFetch(token, "/api/avatar", { method: "DELETE" });
}

export function avatarUrl(uid: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/api/avatar/${uid}?v=${Date.now()}`;
}
