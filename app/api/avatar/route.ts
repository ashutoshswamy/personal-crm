import { sql } from "@/lib/db";
import { requireUserId } from "@/lib/firebase-admin";

// Body: { dataUrl: "data:image/jpeg;base64,..." }. Uploads always target the caller's own avatar.
export async function PUT(req: Request) {
  try {
    const uid = await requireUserId(req);
    const { dataUrl } = await req.json();
    const match = /^data:(image\/[a-z0-9+.-]+);base64,(.+)$/i.exec(dataUrl ?? "");
    if (!match) return new Response("Invalid image", { status: 400 });
    const [, mime, base64] = match;

    await sql`
      insert into profiles (user_id, avatar_data, avatar_mime)
      values (${uid}, ${base64}, ${mime})
      on conflict (user_id) do update set avatar_data = excluded.avatar_data,
        avatar_mime = excluded.avatar_mime, updated_at = now()
    `;
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function DELETE(req: Request) {
  try {
    const uid = await requireUserId(req);
    await sql`delete from profiles where user_id = ${uid}`;
    return new Response(null, { status: 204 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
