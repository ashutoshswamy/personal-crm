import { sql, toDateOnly } from "@/lib/db";
import { requireUser } from "@/lib/firebase-admin";
import { requireSheetRole, writeLog } from "@/lib/sheet-access";
import { LEAD_STATUSES, type Lead } from "@/lib/leads";

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; leadId: string }> }
) {
  try {
    const { uid, email: actorEmail } = await requireUser(req);
    const { id, leadId } = await params;
    await requireSheetRole(id, uid, "write");
    const body = await req.json();
    const status = LEAD_STATUSES.includes(body.status) ? body.status : undefined;

    const rows = (await sql`
      update leads set
        name = coalesce(${body.name}, name),
        email = coalesce(${body.email}, email),
        phone = coalesce(${body.phone}, phone),
        company = coalesce(${body.company}, company),
        status = coalesce(${status}, status),
        callback_date = case when ${"callbackDate" in body} then ${body.callbackDate || null} else callback_date end,
        comments = coalesce(${body.comments}, comments)
      where id = ${leadId} and sheet_id = ${id}
      returning id, name, email, phone, company, status, callback_date, comments, created_at
    `) as LeadRow[];

    if (rows.length === 0) return new Response("Not found", { status: 404 });

    const detail = status ? `${rows[0].name}: status → ${status}` : `edited ${rows[0].name}`;
    await writeLog(id, uid, actorEmail, "update_lead", detail);

    return Response.json(toLead(rows[0]));
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; leadId: string }> }
) {
  try {
    const { uid, email: actorEmail } = await requireUser(req);
    const { id, leadId } = await params;
    await requireSheetRole(id, uid, "write");
    const rows = (await sql`
      delete from leads where id = ${leadId} and sheet_id = ${id} returning name
    `) as { name: string }[];
    if (rows.length) {
      await writeLog(id, uid, actorEmail, "delete_lead", `deleted ${rows[0].name}`);
    }
    return new Response(null, { status: 204 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
