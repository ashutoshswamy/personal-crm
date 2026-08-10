// Deletes demo sheet(s) seeded by seed-demo.mjs (cascades to their leads, members, logs).
// Usage: node scripts/delete-demo.mjs you@example.com [--sheet-name "Demo Leads"]
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

config({ path: ".env.local" });

const email = process.argv[2];
if (!email || email.startsWith("--")) {
  console.error("Usage: node scripts/delete-demo.mjs you@example.com [--sheet-name NAME]");
  process.exit(1);
}
const args = process.argv.slice(3);
const nameFlagIdx = args.indexOf("--sheet-name");
const sheetName = nameFlagIdx >= 0 ? args[nameFlagIdx + 1] : "Demo Leads";

const sql = neon(process.env.DATABASE_URL);
const app = initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const adminAuth = getAuth(app);

async function main() {
  const user = await adminAuth.getUserByEmail(email);
  const sheets = await sql`
    select id from sheets where owner_id = ${user.uid} and name = ${sheetName}
  `;

  if (sheets.length === 0) {
    console.log(`No "${sheetName}" sheet found for ${email}.`);
    return;
  }

  for (const sheet of sheets) {
    await sql`delete from sheets where id = ${sheet.id}`;
  }
  console.log(`Deleted ${sheets.length} "${sheetName}" sheet(s) for ${email}.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(() => process.exit(0));
