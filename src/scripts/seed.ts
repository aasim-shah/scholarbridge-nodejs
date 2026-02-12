/**
 * Seed script: Runs one fetch cycle immediately to populate the database
 * Usage: npm run seed
 */
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", "..", ".env") });

import { runFetchCycle } from "../cron/scheduler.js";

async function main() {
  console.log("[SEED] Starting database seeding...\n");

  // Run 2 batches to get a good initial dataset
  await runFetchCycle();
  await runFetchCycle();

  console.log("\n[SEED] ✓ Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("[SEED] Fatal error:", err);
  process.exit(1);
});
