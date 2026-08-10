import { sql } from "@/lib/db";
import { requireUser } from "@/lib/firebase-admin";
import { requireSheetRole, writeLog } from "@/lib/sheet-access";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { uid, email } = await requireUser(req);
    const { id, memberId } = await params;
    await requireSheetRole(id, uid, "owner");
    const rows = (await sql`
      delete from sheet_members where id = ${memberId} and sheet_id = ${id}
      returning email
    `) as { email: string }[];
    if (rows.length) {
      await writeLog(id, uid, email, "remove_member", `removed ${rows[0].email}`);
    }
    return new Response(null, { status: 204 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
