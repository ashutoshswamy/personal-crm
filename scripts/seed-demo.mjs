// Seeds a demo sheet with fake leads for local testing.
// Usage: node scripts/seed-demo.mjs you@example.com [--sheet-name "Demo Leads"] [--reset]
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

config({ path: ".env.local" });

const email = process.argv[2];
if (!email || email.startsWith("--")) {
  console.error("Usage: node scripts/seed-demo.mjs you@example.com [--sheet-name NAME] [--reset]");
  process.exit(1);
}
const args = process.argv.slice(3);
const nameFlagIdx = args.indexOf("--sheet-name");
const sheetName = nameFlagIdx >= 0 ? args[nameFlagIdx + 1] : "Demo Leads";
const reset = args.includes("--reset");

const sql = neon(process.env.DATABASE_URL);
const app = initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const adminAuth = getAuth(app);

const FIRST_NAMES = ["Aarav", "Vivaan", "Ishaan", "Diya", "Ananya", "Kabir", "Meera", "Rohan", "Sara", "Aditya", "Priya", "Nikhil", "Tara", "Yash", "Zara"];
const LAST_NAMES = ["Sharma", "Verma", "Iyer", "Nair", "Gupta", "Reddy", "Kapoor", "Bose", "Menon", "Chopra"];
const COMPANIES = ["Northwind Traders", "Acme Retail", "Blue Ocean Labs", "Vertex Solutions", "Lumen Digital", "Orbit Studio", "Crestline Media", "Solace Ventures", "", ""];
const STATUSES = ["Called", "Didn't Pickup", "In Talk", "Asked Portfolio", "Not Interested", "Interested", "Locked"];
const COMMENTS = [
  "",
  "",
  "Wants a follow-up call next week.",
  "Budget confirmed, sending proposal.",
  "Not the right time, check back next quarter.",
  "Referred by an existing client.",
  "Asked for pricing over email.",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  return "9" + String(Math.floor(100000000 + Math.random() * 899999999));
}

function randomCallbackDate() {
  if (Math.random() < 0.4) return null;
  const days = Math.floor(Math.random() * 20) - 5; // some overdue, some upcoming
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const user = await adminAuth.getUserByEmail(email);
  console.log(`Seeding for ${email} (${user.uid})`);

  if (reset) {
    const existing = await sql`select id from sheets where owner_id = ${user.uid} and name = ${sheetName}`;
    for (const row of existing) {
      await sql`delete from sheets where id = ${row.id}`;
    }
    console.log(`Cleared ${existing.length} existing "${sheetName}" sheet(s).`);
  }

  const [sheet] = await sql`
    insert into sheets (owner_id, name) values (${user.uid}, ${sheetName}) returning id
  `;

  const leadCount = 25;
  for (let i = 0; i < leadCount; i++) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const company = pick(COMPANIES);
    const status = pick(STATUSES);
    const callbackDate = randomCallbackDate();
    const comments = pick(COMMENTS);
    const email_ = `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;

    await sql`
      insert into leads (sheet_id, created_by, name, email, phone, company, status, callback_date, comments)
      values (${sheet.id}, ${user.uid}, ${name}, ${email_}, ${randomPhone()}, ${company}, ${status}, ${callbackDate}, ${comments})
    `;
  }

  await sql`
    insert into logs (sheet_id, user_id, user_email, action, detail)
    values (${sheet.id}, ${user.uid}, ${email}, 'create_sheet', ${`created "${sheetName}" (seeded demo data)`})
  `;

  console.log(`Done: ${leadCount} leads in sheet "${sheetName}" (${sheet.id}).`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(() => process.exit(0));
