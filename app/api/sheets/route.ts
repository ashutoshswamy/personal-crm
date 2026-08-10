import { sql } from "@/lib/db";
import { requireUser } from "@/lib/firebase-admin";
import { writeLog } from "@/lib/sheet-access";

type SheetRow = {
  id: string;
  name: string;
  owner_id: string;
  role: "owner" | "write" | "read";
  created_at: string;
};

export async function GET(req: Request) {
  try {
    const { uid } = await requireUser(req);
    const rows = (await sql`
      select s.id, s.name, s.owner_id, s.created_at,
        case when s.owner_id = ${uid} then 'owner' else sm.role end as role
      from sheets s
      left join sheet_members sm on sm.sheet_id = s.id and sm.user_id = ${uid}
      where s.owner_id = ${uid} or sm.user_id = ${uid}
      order by s.created_at desc
    `) as SheetRow[];
    return Response.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        ownerId: r.owner_id,
        role: r.role,
        createdAt: r.created_at,
      }))
    );
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const { uid, email } = await requireUser(req);
    const body = await req.json();
    const name = (body.name ?? "").trim() || "Untitled sheet";
    const rows = (await sql`
      insert into sheets (owner_id, name) values (${uid}, ${name})
      returning id, name, owner_id, created_at
    `) as SheetRow[];
    const sheet = rows[0];
    await writeLog(sheet.id, uid, email, "create_sheet", `created "${name}"`);
    return Response.json(
      { id: sheet.id, name: sheet.name, ownerId: sheet.owner_id, role: "owner", createdAt: sheet.created_at },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
