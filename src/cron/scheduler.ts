import cron from "node-cron";
import {
  runSearchBatchWithAI,
  getProviderName,
} from "../services/ai/index.js";
import { getSearchQueries } from "../services/ai/queries.js";
import { completeFetchLog, createFetchLog, failFetchLog, storeScholarships } from "../services/scholarshipService.js";


let runIndex = 0;

/**
 * Execute a single scholarship fetch cycle.
 * Each run uses a different batch of queries to rotate through regions.
 */
export async function runFetchCycle(): Promise<void> {
  const queries = getSearchQueries(runIndex);
  const logId = await createFetchLog(queries);
  const provider = getProviderName();

  console.log(
    `\n${"═".repeat(60)}\n[CRON] Scholarship fetch cycle #${runIndex + 1} started\n[CRON] AI Provider: ${provider}\n[CRON] Batch: ${runIndex % 5 + 1}/5\n[CRON] Queries: ${queries.length}\n${"═".repeat(60)}`
  );

  try {
    const scholarships = await runSearchBatchWithAI(queries);

    console.log(
      `[CRON] Found ${scholarships.length} scholarships from ${provider} web search`
    );

    const added = await storeScholarships(
      scholarships,
      `${provider.toLowerCase()}-web-search-batch-${runIndex % 5 + 1}`
    );

    await completeFetchLog(logId, scholarships.length, added);

    console.log(
      `[CRON] ✓ Added ${added} new scholarships (${scholarships.length - added} duplicates skipped)\n${"═".repeat(60)}\n`
    );
  } catch (error: any) {
    console.error(`[CRON] ✗ Fetch cycle failed:`, error.message);
    await failFetchLog(logId, error.message);
  }

  runIndex++;
}

/**
 * Start the cron scheduler.
 */
export function startScheduler(): void {
  const schedule = process.env.CRON_SCHEDULE || "0 */6 * * *";

  console.log(`[CRON] Scheduler started with schedule: ${schedule}`);
  console.log(`[CRON] Next batches will rotate through 5 regional query sets`);

  // Schedule recurring job
  cron.schedule(schedule, () => {
    runFetchCycle().catch((err) =>
      console.error("[CRON] Unhandled error:", err)
    );
  });

  // Run first fetch immediately on startup (after a small delay for DB setup)
  setTimeout(() => {
    console.log("[CRON] Running initial fetch on startup...");
    runFetchCycle().catch((err) =>
      console.error("[CRON] Initial fetch error:", err)
    );
  }, 3000);
}
