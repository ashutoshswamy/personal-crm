import { apiFetch } from "@/lib/api-client";

export type Notification = {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function listNotifications(token: string): Promise<Notification[]> {
  return apiFetch(token, "/api/notifications");
}

export function markNotificationsRead(token: string, ids?: string[]): Promise<{ ok: true }> {
  return apiFetch(token, "/api/notifications", {
    method: "PATCH",
    body: JSON.stringify(ids ? { ids } : {}),
  });
}
