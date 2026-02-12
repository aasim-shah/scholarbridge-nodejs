/**
 * Search query batches for scholarship discovery
 * Each batch focuses on different regions/types of scholarships
 */

export const SEARCH_QUERY_SETS: string[][] = [
  // Batch 1: US, UK, Australia, Canada universities
  [
    "site:.edu OR site:.ac.uk scholarships international students 2026 apply now",
    "site:.gov.au OR site:.gc.ca scholarships 2026 international students",
    "official university scholarships USA 2026 application open international students",
    "UK Russell Group university scholarships 2026 international apply",
  ],
  
  // Batch 2: European universities
  [
    "site:daad.de scholarships 2026 international students",
    "Netherlands universities scholarships 2026 non-EU students official",
    "Sweden SI scholarships 2026 official application",
    "France Campus France Eiffel Excellence scholarship 2026",
  ],
  
  // Batch 3: Asian scholarships
  [
    "site:jasso.go.jp OR MEXT scholarship 2026 official application",
    "site:.ac.kr KGSP GKS scholarship 2026 application",
    "CSC scholarship China 2026 official application international",
    "Turkiye Burslari scholarship 2026 official apply",
  ],
  
  // Batch 4: Specialized scholarships
  [
    "STEM scholarships women 2026 official university apply",
    "fully funded PhD scholarships 2026 official university application",
    "need-based scholarships developing countries 2026 official",
    "athletic scholarships NCAA universities 2026 official",
  ],
  
  // Batch 5: Major international programs
  [
    "Fulbright scholarship 2026 official application site:fulbrightonline.org OR site:cies.org",
    "Chevening scholarship 2026 official site:chevening.org",
    "Erasmus Mundus Joint Master 2026 official site:ec.europa.eu OR site:eacea.ec.europa.eu",
    "Commonwealth scholarship 2026 official site:cscuk.fcdo.gov.uk",
  ],
];

/**
 * Get search queries for a specific run index
 * Rotates through the query sets
 */
export function getSearchQueries(runIndex: number): string[] {
  return SEARCH_QUERY_SETS[runIndex % SEARCH_QUERY_SETS.length];
}

/**
 * Get the total number of query batches
 */
export function getTotalBatches(): number {
  return SEARCH_QUERY_SETS.length;
}
