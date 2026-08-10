import { sql } from "@/lib/db";
import { adminAuth, requireUser } from "@/lib/firebase-admin";
import { notify, requireSheetRole, writeLog } from "@/lib/sheet-access";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { uid } = await requireUser(req);
    const { id } = await params;
    await requireSheetRole(id, uid, "owner");
    const rows = (await sql`
      select id, email, role from sheet_members where sheet_id = ${id} order by created_at asc
    `) as { id: string; email: string; role: string }[];
    return Response.json(rows);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { uid, email: actorEmail } = await requireUser(req);
    const { id } = await params;
    await requireSheetRole(id, uid, "owner");
    if (!rateLimit(`invite:${uid}`, 20, 60_000)) {
      return new Response("Too many invites, slow down", { status: 429 });
    }

    const body = await req.json();
    const inviteeEmail = (body.email ?? "").trim().toLowerCase();
    const role = body.role === "write" ? "write" : "read";
    if (!inviteeEmail) return new Response("Email required", { status: 400 });

    let invitee;
    try {
      invitee = await adminAuth.getUserByEmail(inviteeEmail);
    } catch {
      return new Response("No account exists for that email yet", { status: 404 });
    }
    if (invitee.uid === uid) {
      return new Response("Can't invite yourself", { status: 400 });
    }

    const sheetRows = (await sql`select name from sheets where id = ${id}`) as { name: string }[];
    const sheetName = sheetRows[0]?.name ?? "a sheet";

    await sql`
      insert into sheet_members (sheet_id, user_id, email, role)
      values (${id}, ${invitee.uid}, ${inviteeEmail}, ${role})
      on conflict (sheet_id, user_id) do update set role = excluded.role
    `;

    await notify(
      invitee.uid,
      `${actorEmail} gave you ${role === "write" ? "read/write" : "read-only"} access to "${sheetName}"`,
      `/leads/${id}`
    );
    await writeLog(id, uid, actorEmail, "invite_member", `invited ${inviteeEmail} as ${role}`);

    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
