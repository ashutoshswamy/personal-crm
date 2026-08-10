import { sql, toDateOnly } from "@/lib/db";
import { requireUserId } from "@/lib/firebase-admin";
import type { Lead } from "@/lib/leads";

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
  sheet_id: string;
  sheet_name: string;
};

export type LeadWithSheet = Lead & { sheetId: string; sheetName: string };

function toLead(row: LeadRow): LeadWithSheet {
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
    sheetId: row.sheet_id,
    sheetName: row.sheet_name,
  };
}

// Aggregate read across every sheet the user can access — powers the dashboard.
export async function GET(req: Request) {
  try {
    const userId = await requireUserId(req);
    const rows = (await sql`
      select l.id, l.name, l.email, l.phone, l.company, l.status, l.callback_date, l.comments,
             l.created_at, l.sheet_id, s.name as sheet_name
      from leads l
      join sheets s on s.id = l.sheet_id
      where s.owner_id = ${userId}
         or exists (
           select 1 from sheet_members sm where sm.sheet_id = s.id and sm.user_id = ${userId}
         )
      order by l.created_at desc
    `) as LeadRow[];
    return Response.json(rows.map(toLead));
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
