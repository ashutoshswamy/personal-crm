import { sql } from "@/lib/db";
import { requireUser } from "@/lib/firebase-admin";
import { getSheetRole, requireSheetRole, writeLog } from "@/lib/sheet-access";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { uid } = await requireUser(req);
    const { id } = await params;
    const role = await getSheetRole(id, uid);
    if (!role) return new Response("Not found", { status: 404 });
    const rows = (await sql`select id, name, owner_id, created_at from sheets where id = ${id}`) as {
      id: string;
      name: string;
      owner_id: string;
      created_at: string;
    }[];
    const sheet = rows[0];
    return Response.json({
      id: sheet.id,
      name: sheet.name,
      ownerId: sheet.owner_id,
      role,
      createdAt: sheet.created_at,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { uid, email } = await requireUser(req);
    const { id } = await params;
    await requireSheetRole(id, uid, "owner");
    const body = await req.json();
    const name = (body.name ?? "").trim();
    if (!name) return new Response("Name required", { status: 400 });
    await sql`update sheets set name = ${name} where id = ${id}`;
    await writeLog(id, uid, email, "rename_sheet", `renamed to "${name}"`);
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { uid } = await requireUser(req);
    const { id } = await params;
    await requireSheetRole(id, uid, "owner");
    await sql`delete from sheets where id = ${id}`;
    return new Response(null, { status: 204 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
