import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { requireEnv } from "@/lib/env";

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(JSON.parse(requireEnv("FIREBASE_SERVICE_ACCOUNT"))),
    });

export const adminAuth = getAuth(app);

export async function requireUser(req: Request): Promise<{ uid: string; email: string }> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) throw new Response("Unauthorized", { status: 401 });
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? "" };
  } catch {
    throw new Response("Unauthorized", { status: 401 });
  }
}

export async function requireUserId(req: Request): Promise<string> {
  return (await requireUser(req)).uid;
}
