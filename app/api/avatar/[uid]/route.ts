import { sql } from "@/lib/db";

// Public by design — an <img src> can't send an Authorization header, and a Firebase
// uid isn't guessable, so this is no more exposed than any other avatar URL.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  const rows = (await sql`
    select avatar_data, avatar_mime from profiles where user_id = ${uid}
  `) as { avatar_data: string; avatar_mime: string }[];

  if (rows.length === 0) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(rows[0].avatar_data, "base64"), {
    headers: {
      "Content-Type": rows[0].avatar_mime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
