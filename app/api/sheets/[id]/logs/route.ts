import { sql } from "@/lib/db";
import { requireUser } from "@/lib/firebase-admin";
import { requireSheetRole } from "@/lib/sheet-access";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { uid } = await requireUser(req);
    const { id } = await params;
    await requireSheetRole(id, uid, "owner");
    const rows = (await sql`
      select id, user_email, action, detail, created_at
      from logs where sheet_id = ${id} order by created_at desc limit 200
    `) as { id: string; user_email: string; action: string; detail: string; created_at: string }[];
    return Response.json(
      rows.map((r) => ({
        id: r.id,
        userEmail: r.user_email,
        action: r.action,
        detail: r.detail,
        createdAt: r.created_at,
      }))
    );
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
