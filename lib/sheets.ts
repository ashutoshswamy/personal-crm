import { apiFetch } from "@/lib/api-client";

export type SheetRole = "owner" | "write" | "read";

export type Sheet = {
  id: string;
  name: string;
  ownerId: string;
  role: SheetRole;
  createdAt: string;
};

export type Member = { id: string; email: string; role: "write" | "read" };

export type LogEntry = {
  id: string;
  userEmail: string;
  action: string;
  detail: string;
  createdAt: string;
};

export function listSheets(token: string): Promise<Sheet[]> {
  return apiFetch(token, "/api/sheets");
}

export function getSheet(token: string, id: string): Promise<Sheet> {
  return apiFetch(token, `/api/sheets/${id}`);
}

export function createSheet(token: string, name: string): Promise<Sheet> {
  return apiFetch(token, "/api/sheets", { method: "POST", body: JSON.stringify({ name }) });
}

export function renameSheet(token: string, id: string, name: string): Promise<{ ok: true }> {
  return apiFetch(token, `/api/sheets/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
}

export function deleteSheet(token: string, id: string): Promise<null> {
  return apiFetch(token, `/api/sheets/${id}`, { method: "DELETE" });
}

export function listMembers(token: string, sheetId: string): Promise<Member[]> {
  return apiFetch(token, `/api/sheets/${sheetId}/members`);
}

export function inviteMember(
  token: string,
  sheetId: string,
  email: string,
  role: "write" | "read"
): Promise<{ ok: true }> {
  return apiFetch(token, `/api/sheets/${sheetId}/members`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export function removeMember(token: string, sheetId: string, memberId: string): Promise<null> {
  return apiFetch(token, `/api/sheets/${sheetId}/members/${memberId}`, { method: "DELETE" });
}

export function listLogs(token: string, sheetId: string): Promise<LogEntry[]> {
  return apiFetch(token, `/api/sheets/${sheetId}/logs`);
}
