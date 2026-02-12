// ── Blocked domains — aggregators, social media, blogs, wikis ───────
export const BLOCKED_DOMAINS = new Set([
  // Scholarship aggregators
  "scholarshiptab.com",
  "studentscholarships.org",
  "scholarshipnext.com",
  "scholaropportunity.com",
  "scholarships.com",
  "fastweb.com",
  "scholarshipowl.com",
  "scholarshipportal.com",
  "findaid.org",
  "internationalscholarships.com",
  "scholars4dev.com",
  "afterschool.my",
  "opportunitiesforafricans.com",
  "oyaop.com",
  "aseanop.com",
  "marj3.com",
  "opportunitydesk.org",
  "scholarshipsads.com",
  "scholarshipscorner.website",
  "grantfinder.com",
  "scholarshipslab.com",
  "uscholarships.us",
  "scholarshipau.com",
  "happyfacetravels.com",
  "worldscholarshipforum.com",
  "scholarshipscafe.com",
  "scholarsme.com",
  "myschoolscholarship.com",
  // Social media
  "facebook.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "instagram.com",
  "youtube.com",
  "tiktok.com",
  "reddit.com",
  "quora.com",
  "pinterest.com",
  // Blogs / news / generic
  "medium.com",
  "wordpress.com",
  "blogspot.com",
  "tumblr.com",
  "substack.com",
  "wikipedia.org",
  "wikidata.org",
  "bbc.com",
  "cnn.com",
  "theguardian.com",
  // Fake / test
  "example.com",
  "example.org",
  "test.com",
  "localhost",
]);

/**
 * Returns true if the link points to an official, direct source.
 */
export function isOfficialDirectLink(link: string): boolean {
  if (!link) return false;
  try {
    const url = new URL(link);
    // Must be http(s)
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;

    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    // Check blocklist
    const blockedList = Array.from(BLOCKED_DOMAINS);
    for (const blocked of blockedList) {
      if (host === blocked || host.endsWith("." + blocked)) return false;
    }

    // Reject PDF links (not direct apply pages)
    if (url.pathname.toLowerCase().endsWith(".pdf")) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Verify a URL actually resolves (returns 2xx or 3xx) with a HEAD request.
 * Times out after 8 seconds.
 */
export async function verifyLinkReachable(link: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(link, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ScholarBridge/1.0; +https://scholarbridge.com)",
      },
    });
    clearTimeout(timeout);

    // Accept 2xx and 3xx. Some sites return 403 for HEAD so also try GET.
    if (res.ok || (res.status >= 300 && res.status < 400)) return true;

    // Retry with GET for servers that reject HEAD
    if (res.status === 403 || res.status === 405) {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 8000);
      const res2 = await fetch(link, {
        method: "GET",
        redirect: "follow",
        signal: controller2.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ScholarBridge/1.0; +https://scholarbridge.com)",
        },
      });
      clearTimeout(timeout2);
      // Consume body to avoid leak
      await res2.text().catch(() => {});
      return res2.ok;
    }

    return false;
  } catch {
    // Network error / timeout — reject
    return false;
  }
}

/**
 * Batch runner with link verification
 * Run a full search batch. After collecting results from all queries,
 * verify each link is reachable before returning.
 */
export async function runSearchBatch(
  queries: string[],
  searchFunction: (query: string) => Promise<ParsedScholarship[]>,
  providerName: string
): Promise<ParsedScholarship[]> {
  const allResults: ParsedScholarship[] = [];

  for (const query of queries) {
    const results = await searchFunction(query);
    allResults.push(...results);
    // Rate-limit gap
    await new Promise((r) => setTimeout(r, 2000));
  }

  // ── Verify links actually resolve ─────────────────────────────
  console.log(
    `[${providerName}] [LinkCheck] Verifying ${allResults.length} scholarship links…`
  );
  const verified: ParsedScholarship[] = [];

  // Run verifications in parallel (max 5 at a time)
  const batchSize = 5;
  for (let i = 0; i < allResults.length; i += batchSize) {
    const batch = allResults.slice(i, i + batchSize);
    const checks = await Promise.all(
      batch.map(async (s) => {
        const ok = await verifyLinkReachable(s.link);
        if (!ok) {
          console.warn(
            `[${providerName}] [LinkCheck] DEAD link — ${s.link} — "${s.title}"`
          );
        }
        return { scholarship: s, ok };
      })
    );
    for (const { scholarship, ok } of checks) {
      if (ok) verified.push(scholarship);
    }
  }

  console.log(
    `[${providerName}] [LinkCheck] ${verified.length}/${allResults.length} links verified OK`
  );
  return verified;
}

import { ParsedScholarship } from "../../types/index.js";
