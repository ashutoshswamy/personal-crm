import { sql, toDateOnly } from "@/lib/db";
import { requireUser } from "@/lib/firebase-admin";
import { requireSheetRole, writeLog } from "@/lib/sheet-access";
import { LEAD_STATUSES, type Lead } from "@/lib/leads";
import { rateLimit } from "@/lib/rate-limit";

type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  callback_date: string | Date | null;
  comments: string;
  created_at: string;
};

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    status: row.status as Lead["status"],
    callbackDate: toDateOnly(row.callback_date),
    comments: row.comments,
    createdAt: row.created_at,
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { uid } = await requireUser(req);
    const { id } = await params;
    await requireSheetRole(id, uid, "read");
    const rows = (await sql`
      select id, name, email, phone, company, status, callback_date, comments, created_at
      from leads where sheet_id = ${id} order by created_at desc
    `) as LeadRow[];
    return Response.json(rows.map(toLead));
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
    await requireSheetRole(id, uid, "write");
    if (!rateLimit(`create-lead:${uid}`, 120, 60_000)) {
      return new Response("Too many requests, slow down", { status: 429 });
    }
    const body = await req.json();
    const status = LEAD_STATUSES.includes(body.status) ? body.status : "Called";
    const rows = (await sql`
      insert into leads (sheet_id, created_by, name, email, phone, company, status, callback_date, comments)
      values (
        ${id}, ${uid}, ${body.name ?? ""}, ${body.email ?? ""}, ${body.phone ?? ""},
        ${body.company ?? ""}, ${status}, ${body.callbackDate || null}, ${body.comments ?? ""}
      )
      returning id, name, email, phone, company, status, callback_date, comments, created_at
    `) as LeadRow[];
    await writeLog(id, uid, actorEmail, "create_lead", `added ${rows[0].name}`);
    return Response.json(toLead(rows[0]), { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
