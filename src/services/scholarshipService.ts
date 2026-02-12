import { Scholarship } from "../db/Scholarship.js";
import type {
  Scholarship as ScholarshipType,
  InsertScholarship,
  ApiFilters,
  PaginatedResponse,
  ParsedScholarship,
} from "../types/index.js";
import mongoose from "mongoose";

// ── FetchLog Schema ─────────────────────────────────────────────────

const FetchLogSchema = new mongoose.Schema({
  search_queries: { type: [String], required: true },
  status: { type: String, enum: ["running", "completed", "failed"], default: "running" },
  scholarships_found: { type: Number, default: 0 },
  scholarships_added: { type: Number, default: 0 },
  error: { type: String },
  started_at: { type: Date, default: Date.now },
  completed_at: { type: Date },
});

const FetchLog = mongoose.model("FetchLog", FetchLogSchema);

// ── Blocked domains (same list used in openaiService) ───────────────
const BLOCKED_DOMAINS = new Set([
  "scholarshiptab.com","studentscholarships.org","scholarshipnext.com",
  "scholaropportunity.com","scholarships.com","fastweb.com","scholarshipowl.com",
  "scholarshipportal.com","findaid.org","internationalscholarships.com",
  "scholars4dev.com","afterschool.my","opportunitiesforafricans.com","oyaop.com",
  "aseanop.com","marj3.com","opportunitydesk.org","scholarshipsads.com",
  "scholarshipscorner.website","grantfinder.com","scholarshipslab.com",
  "uscholarships.us","scholarshipau.com","happyfacetravels.com",
  "worldscholarshipforum.com","scholarshipscafe.com","scholarsme.com",
  "myschoolscholarship.com",
  "facebook.com","twitter.com","x.com","linkedin.com","instagram.com",
  "youtube.com","tiktok.com","reddit.com","quora.com","pinterest.com",
  "medium.com","wordpress.com","blogspot.com","tumblr.com","substack.com",
  "wikipedia.org","wikidata.org","bbc.com","cnn.com","theguardian.com",
  "example.com","example.org","test.com","localhost",
]);

// ── Private Helpers ─────────────────────────────────────────────────

/**
 * Validate if a URL is a direct, authentic application link.
 * Blocks aggregators, social media, PDFs, and fake domains.
 */
function isValidApplicationLink(url: string): boolean {
  if (!url || url.trim() === "") return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    // Reject PDFs
    if (parsed.pathname.toLowerCase().endsWith(".pdf")) return false;
    // Reject blocked domains
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    for (const blocked of BLOCKED_DOMAINS) {
      if (host === blocked || host.endsWith("." + blocked)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate scholarship data completeness and authenticity
 */
function validateScholarshipData(s: ParsedScholarship): { valid: boolean; reason?: string } {
  // Title validation
  if (!s.title || s.title.length < 10) {
    return { valid: false, reason: "Title too short or missing" };
  }
  
  // Organization validation
  if (!s.organization || s.organization.length < 3) {
    return { valid: false, reason: "Organization too short or missing" };
  }
  
  // Description validation (must be detailed)
  if (!s.description || s.description.length < 50) {
    return { valid: false, reason: "Description too short or missing eligibility criteria" };
  }
  
  // Link validation
  if (!isValidApplicationLink(s.link)) {
    return { valid: false, reason: "Invalid or non-direct application link" };
  }
  
  // Deadline validation (must be future date)
  const deadlineDate = new Date(s.deadline);
  const now = new Date();
  if (deadlineDate < now) {
    return { valid: false, reason: 'Deadline is in the past' };
  }
  
  // Check deadline is not too far in future (max 3 years)
  const maxDate = new Date(now.getFullYear() + 3, 11, 31);
  if (deadlineDate > maxDate) {
    return { valid: false, reason: 'Deadline too far in future' };
  }
  
  return { valid: true };
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Get scholarships with filtering, searching, sorting, and pagination.
 */
export async function getScholarships(
  filters: ApiFilters
): Promise<PaginatedResponse<ScholarshipType>> {
  const {
    country,
    level,
    field,
    category,
    search,
    page = 1,
    limit = 20,
    sort = "deadline",
    order = "asc",
  } = filters;

  const query: any = {};

  // Only show scholarships with future deadlines and valid links
  query.deadline = { $gte: new Date() };
  
  // Ensure link is present, valid, not an aggregator, and not a PDF
  query.link = { 
    $exists: true, 
    $ne: "",
    $not: {
      $regex: /example\.com|placeholder|test\.com|fake|dummy|scholarshiptab|studentscholarships\.org|scholarshipnext|scholaropportunity|linkedin\.com|medium\.com|facebook\.com|twitter\.com|reddit\.com|wikipedia\.org|youtube\.com|uscholarships\.us|scholarshipau\.com|happyfacetravels\.com|\.pdf$/i,
    },
  };

  if (country && country !== "all") {
    query.country = country;
  }
  if (level && level !== "all") {
    query.level = level;
  }
  if (field && field !== "all") {
    query.field = field;
  }
  if (category && category !== "all") {
    query.category = category;
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { organization: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Validate sort column
  const allowedSorts = [
    "deadline",
    "title",
    "country",
    "created_at",
    "organization",
  ];
  const sortCol = allowedSorts.includes(sort) ? sort : "deadline";
  const sortOrder = order === "desc" ? -1 : 1;

  // Count total
  const total = await Scholarship.countDocuments(query);

  // Fetch page
  const offset = (page - 1) * limit;
  const data = await Scholarship.find(query)
    .sort({ [sortCol]: sortOrder })
    .skip(offset)
    .limit(limit)
    .lean();

  return {
    data: data.map((doc: any) => ({
      id: doc._id.toString(),
      title: doc.title,
      organization: doc.organization,
      country: doc.country,
      level: doc.level,
      field: doc.field,
      category: doc.category,
      deadline: doc.deadline.toISOString().split("T")[0],
      description: doc.description,
      link: doc.link,
      amount: doc.amount ?? undefined,
      currency: doc.currency ?? undefined,
      is_verified: doc.is_verified ? 1 : 0,
      source: doc.source ?? undefined,
      created_at: doc.created_at?.toISOString() || new Date().toISOString(),
      updated_at: doc.updated_at?.toISOString() || new Date().toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single scholarship by ID.
 */
export async function getScholarshipById(id: string): Promise<ScholarshipType | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  
  const doc = await Scholarship.findById(id).lean();
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    title: doc.title,
    organization: doc.organization,
    country: doc.country,
    level: doc.level,
    field: doc.field,
    category: doc.category,
    deadline: doc.deadline.toISOString().split("T")[0],
    description: doc.description,
    link: doc.link,
    amount: doc.amount ?? undefined,
    currency: doc.currency ?? undefined,
    is_verified: doc.is_verified ? 1 : 0,
    source: doc.source ?? undefined,
    created_at: doc.created_at?.toISOString() || new Date().toISOString(),
    updated_at: doc.updated_at?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Get all distinct values for filter dropdowns.
 */
export async function getFilterOptions() {
  const futureDeadlineQuery = { deadline: { $gte: new Date() } };

  const [countries, levels, fields, categories] = await Promise.all([
    Scholarship.distinct("country", futureDeadlineQuery),
    Scholarship.distinct("level", futureDeadlineQuery),
    Scholarship.distinct("field", futureDeadlineQuery),
    Scholarship.distinct("category", futureDeadlineQuery),
  ]);

  return {
    countries: countries.sort(),
    levels: levels.sort(),
    fields: fields.sort(),
    categories: categories.sort(),
  };
}

/**
 * Get dashboard stats.
 */
export async function getStats() {
  const futureDeadlineQuery = { deadline: { $gte: new Date() } };

  const [total, countries, organizations, lastFetch] = await Promise.all([
    Scholarship.countDocuments(futureDeadlineQuery),
    Scholarship.distinct("country", futureDeadlineQuery).then((c: string[]) => c.length),
    Scholarship.distinct("organization", futureDeadlineQuery).then((o: string[]) => o.length),
    FetchLog.findOne({ status: "completed" })
      .sort({ completed_at: -1 })
      .lean(),
  ]);

  return {
    totalScholarships: total,
    totalCountries: countries,
    totalOrganizations: organizations,
    lastFetchedAt: lastFetch?.completed_at?.toISOString().replace("T", " ").substring(0, 19) || null,
    lastFetchAdded: lastFetch?.scholarships_added || 0,
  };
}

/**
 * Store newly fetched scholarships from OpenAI.
 * De-duplicates by case-insensitive title+org match AND unique index.
 * Only stores scholarships with valid, authentic data and direct application links.
 */
export async function storeScholarships(
  scholarships: ParsedScholarship[],
  source: string
): Promise<number> {
  let added = 0;
  let rejected = 0;
  let duped = 0;

  for (const s of scholarships) {
    // 1. Validate scholarship data before storing
    const validation = validateScholarshipData(s);
    if (!validation.valid) {
      console.warn(`[Store] Rejected "${s.title}": ${validation.reason}`);
      rejected++;
      continue;
    }

    // 2. Case-insensitive duplicate check (title + organization)
    const exists = await Scholarship.findOne({
      title: { $regex: new RegExp(`^${escapeRegex(s.title.trim())}$`, "i") },
      organization: { $regex: new RegExp(`^${escapeRegex(s.organization.trim())}$`, "i") },
    });
    if (exists) {
      // Update if new deadline is further out or description is longer
      const newDeadline = new Date(s.deadline);
      const oldDeadline = new Date(exists.deadline);
      if (
        newDeadline > oldDeadline ||
        s.description.trim().length > (exists.description?.length ?? 0)
      ) {
        await Scholarship.updateOne(
          { _id: exists._id },
          {
            $set: {
              deadline: newDeadline > oldDeadline ? newDeadline : oldDeadline,
              description:
                s.description.trim().length > (exists.description?.length ?? 0)
                  ? s.description.trim()
                  : exists.description,
              link: isValidApplicationLink(s.link) ? s.link.trim() : exists.link,
              amount: s.amount?.trim() || exists.amount,
              updated_at: new Date(),
            },
          }
        );
        console.log(`[Store] Updated existing: ${s.title}`);
      }
      duped++;
      continue;
    }

    // 3. Insert new scholarship
    try {
      await Scholarship.create({
        title: s.title.trim(),
        organization: s.organization.trim(),
        country: s.country.trim(),
        level: s.level,
        field: s.field.trim(),
        category: s.category,
        deadline: new Date(s.deadline),
        description: s.description.trim(),
        link: s.link.trim(),
        amount: s.amount?.trim() || "Varies",
        currency: s.currency || "USD",
        is_verified: false,
        source,
      });
      added++;
      console.log(`[Store] ✓ Added: ${s.title} — ${s.organization}`);
    } catch (error: any) {
      if (error.code === 11000) {
        duped++;
        continue;
      }
      console.error("[Store] DB error:", error.message);
    }
  }

  console.log(
    `[Store] Done — added: ${added}, duped: ${duped}, rejected: ${rejected}`
  );
  return added;
}

/** Escape special regex chars in a string */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Add a scholarship manually (from admin).
 * Validates data before storing.
 */
export async function addScholarship(data: InsertScholarship): Promise<string> {
  // Validate the link before adding
  if (!isValidApplicationLink(data.link)) {
    throw new Error('Invalid application link. Must be a direct, official application URL.');
  }
  
  // Validate basic data requirements
  if (!data.title || data.title.trim().length < 10) {
    throw new Error('Title must be at least 10 characters.');
  }
  
  if (!data.description || data.description.trim().length < 50) {
    throw new Error('Description must be at least 50 characters with eligibility criteria.');
  }
  
  if (!data.organization || data.organization.trim().length < 3) {
    throw new Error('Organization must be at least 3 characters.');
  }
  
  // Validate deadline is in the future
  const deadlineDate = new Date(data.deadline);
  if (deadlineDate < new Date()) {
    throw new Error('Deadline must be a future date.');
  }

  const doc: any = await Scholarship.create({
    ...data,
    title: data.title.trim(),
    organization: data.organization.trim(),
    description: data.description.trim(),
    link: data.link.trim(),
    deadline: deadlineDate,
    is_verified: Boolean(data.is_verified),
  });
  return doc._id.toString();
}

/**
 * Update a scholarship.
 * Validates data before updating.
 */
export async function updateScholarship(
  id: string,
  data: Partial<InsertScholarship>
): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  // Validate link if being updated
  if (data.link && !isValidApplicationLink(data.link)) {
    throw new Error('Invalid application link. Must be a direct, official application URL.');
  }
  
  // Validate title if being updated
  if (data.title && data.title.trim().length < 10) {
    throw new Error('Title must be at least 10 characters.');
  }
  
  // Validate description if being updated
  if (data.description && data.description.trim().length < 50) {
    throw new Error('Description must be at least 50 characters with eligibility criteria.');
  }
  
  // Validate organization if being updated
  if (data.organization && data.organization.trim().length < 3) {
    throw new Error('Organization must be at least 3 characters.');
  }

  const updateData: any = { ...data };
  if (data.deadline) {
    const deadlineDate = new Date(data.deadline);
    if (deadlineDate < new Date()) {
      throw new Error('Deadline must be a future date.');
    }
    updateData.deadline = deadlineDate;
  }
  
  // Trim string fields
  if (data.title) updateData.title = data.title.trim();
  if (data.organization) updateData.organization = data.organization.trim();
  if (data.description) updateData.description = data.description.trim();
  if (data.link) updateData.link = data.link.trim();
  
  updateData.updated_at = new Date();

  const result = await Scholarship.updateOne({ _id: id }, { $set: updateData });
  return result.modifiedCount > 0;
}

/**
 * Delete a scholarship.
 */
export async function deleteScholarship(id: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  const result = await Scholarship.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

// ── Fetch Logging ───────────────────────────────────────────────────

export async function createFetchLog(queries: string[]): Promise<string> {
  const doc = await FetchLog.create({
    search_queries: queries,
    status: "running",
  });
  return doc._id.toString();
}

export async function completeFetchLog(
  logId: string,
  found: number,
  added: number
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(logId)) {
    console.error("[DB] Invalid FetchLog ID:", logId);
    return;
  }
  
  await FetchLog.updateOne(
    { _id: new mongoose.Types.ObjectId(logId) },
    {
      $set: {
        completed_at: new Date(),
        status: "completed",
        scholarships_found: found,
        scholarships_added: added,
      },
    }
  );
}

export async function failFetchLog(logId: string, error: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(logId)) {
    console.error("[DB] Invalid FetchLog ID:", logId);
    return;
  }
  
  await FetchLog.updateOne(
    { _id: new mongoose.Types.ObjectId(logId) },
    {
      $set: {
        completed_at: new Date(),
        status: "failed",
        error,
      },
    }
  );
}

export async function getFetchLogs(limit = 20): Promise<any[]> {
  const logs = await FetchLog.find()
    .sort({ started_at: -1 })
    .limit(limit)
    .lean();

  return logs.map((log: any) => ({
    id: log._id.toString(),
    search_queries: log.search_queries,
    status: log.status,
    scholarships_found: log.scholarships_found,
    scholarships_added: log.scholarships_added,
    error: log.error,
    started_at: log.started_at?.toISOString().replace("T", " ").substring(0, 19),
    completed_at: log.completed_at?.toISOString().replace("T", " ").substring(0, 19),
  }));
}
