import { sql } from "@/lib/db";
import { requireUser } from "@/lib/firebase-admin";

type NotificationRow = {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

export async function GET(req: Request) {
  try {
    const { uid } = await requireUser(req);
    const rows = (await sql`
      select id, message, link, read, created_at from notifications
      where user_id = ${uid} order by created_at desc limit 50
    `) as NotificationRow[];
    return Response.json(
      rows.map((r) => ({
        id: r.id,
        message: r.message,
        link: r.link,
        read: r.read,
        createdAt: r.created_at,
      }))
    );
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

// Marks notifications read for the current user. Body: { ids?: string[] } — omit ids to mark all read.
export async function PATCH(req: Request) {
  try {
    const { uid } = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;
    if (ids && ids.length > 0) {
      await sql`update notifications set read = true where user_id = ${uid} and id = any(${ids}::uuid[])`;
    } else {
      await sql`update notifications set read = true where user_id = ${uid}`;
    }
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
