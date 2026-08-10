import { apiFetch } from "@/lib/api-client";

export const LEAD_STATUSES = [
  "Called",
  "Didn't Pickup",
  "In Talk",
  "Asked Portfolio",
  "Not Interested",
  "Interested",
  "Locked",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  callbackDate: string; // empty string = no callback
  comments: string;
  createdAt: string;
};

export type LeadWithSheet = Lead & { sheetId: string; sheetName: string };

export type LeadInput = Pick<Lead, "name" | "email" | "phone" | "company"> &
  Partial<Pick<Lead, "status" | "callbackDate" | "comments">>;

export function listAllLeads(token: string): Promise<LeadWithSheet[]> {
  return apiFetch(token, "/api/leads");
}

export function listLeads(token: string, sheetId: string): Promise<Lead[]> {
  return apiFetch(token, `/api/sheets/${sheetId}/leads`);
}

export function createLead(token: string, sheetId: string, fields: LeadInput): Promise<Lead> {
  return apiFetch(token, `/api/sheets/${sheetId}/leads`, {
    method: "POST",
    body: JSON.stringify(fields),
  });
}

export function updateLead(
  token: string,
  sheetId: string,
  id: string,
  fields: Partial<LeadInput> & { status?: LeadStatus }
): Promise<Lead> {
  return apiFetch(token, `/api/sheets/${sheetId}/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export function deleteLead(token: string, sheetId: string, id: string): Promise<null> {
  return apiFetch(token, `/api/sheets/${sheetId}/leads/${id}`, { method: "DELETE" });
}

// Formats a "YYYY-MM-DD" callback date relative to today: "Today", "Tomorrow",
// "3d overdue", a weekday name within the next week, or a short date otherwise.
export function formatCallbackDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${-diffDays}d overdue`;
  if (diffDays <= 6) return date.toLocaleDateString(undefined, { weekday: "short" });
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

export type CsvGrid = { headers: string[]; rows: string[][] };

// ponytail: naive split-on-comma parser, no quoted-field/escaping support — swap for a real parser if leads ever contain commas in fields
export function parseCsv(text: string): CsvGrid {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  return {
    headers: lines[0].split(",").map((h) => h.trim()),
    rows: lines.slice(1).map((line) => line.split(",").map((c) => c.trim())),
  };
}

export async function parseXlsx(file: File): Promise<CsvGrid> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const [headerRow, ...rows] = grid;
  if (!headerRow) return { headers: [], rows: [] };
  return {
    headers: headerRow.map((h) => String(h).trim()),
    rows: rows
      .filter((row) => row.some((cell) => String(cell).trim()))
      .map((row) => row.map((c) => String(c).trim())),
  };
}

export type CsvMapping = { name: number; phone: number; email: number; company: number };

export function guessCsvMapping(headers: string[]): CsvMapping {
  const find = (needle: string) =>
    headers.findIndex((h) => h.trim().toLowerCase() === needle);
  return {
    name: find("name"),
    phone: find("phone"),
    email: find("email"),
    company: find("company"),
  };
}

export function applyCsvMapping(
  grid: CsvGrid,
  mapping: CsvMapping
): Pick<Lead, "name" | "email" | "phone" | "company">[] {
  return grid.rows
    .map((row) => ({
      name: mapping.name >= 0 ? row[mapping.name] ?? "" : "",
      phone: mapping.phone >= 0 ? row[mapping.phone] ?? "" : "",
      email: mapping.email >= 0 ? row[mapping.email] ?? "" : "",
      company: mapping.company >= 0 ? row[mapping.company] ?? "" : "",
    }))
    .filter((l) => l.name && l.phone);
}
