import { sql } from "@/lib/db";

export type SheetRole = "owner" | "write" | "read";

const RANK: Record<SheetRole, number> = { read: 1, write: 2, owner: 3 };

export async function getSheetRole(sheetId: string, userId: string): Promise<SheetRole | null> {
  const sheets = (await sql`select owner_id from sheets where id = ${sheetId}`) as {
    owner_id: string;
  }[];
  if (sheets.length === 0) return null;
  if (sheets[0].owner_id === userId) return "owner";

  const members = (await sql`
    select role from sheet_members where sheet_id = ${sheetId} and user_id = ${userId}
  `) as { role: SheetRole }[];
  return members[0]?.role ?? null;
}

export async function requireSheetRole(
  sheetId: string,
  userId: string,
  min: SheetRole
): Promise<SheetRole> {
  const role = await getSheetRole(sheetId, userId);
  if (!role) throw new Response("Not found", { status: 404 });
  if (RANK[role] < RANK[min]) throw new Response("Forbidden", { status: 403 });
  return role;
}

export async function writeLog(
  sheetId: string,
  userId: string,
  userEmail: string,
  action: string,
  detail = ""
) {
  await sql`
    insert into logs (sheet_id, user_id, user_email, action, detail)
    values (${sheetId}, ${userId}, ${userEmail}, ${action}, ${detail})
  `;
}

export async function notify(userId: string, message: string, link?: string) {
  await sql`
    insert into notifications (user_id, message, link) values (${userId}, ${message}, ${link ?? null})
  `;
}
