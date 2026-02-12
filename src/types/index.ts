import { z } from "zod";

// ── Scholarship Schema ──────────────────────────────────────────────
export const ScholarshipSchema = z.object({
  id: z.string(), // MongoDB ObjectId as string
  title: z.string(),
  organization: z.string(),
  country: z.string(),
  level: z.string(),
  field: z.string(),
  category: z.string(),
  deadline: z.string(),
  description: z.string(),
  link: z.string().url(),
  amount: z.string().optional(),
  currency: z.string().optional(),
  is_verified: z.number().optional().default(0),
  source: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Scholarship = z.infer<typeof ScholarshipSchema>;

// Schema for inserting (no id, no timestamps)
export const InsertScholarshipSchema = ScholarshipSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertScholarship = z.infer<typeof InsertScholarshipSchema>;

// ── OpenAI Parsed Scholarship ───────────────────────────────────────
export const ParsedScholarshipSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  organization: z.string().min(3, "Organization must be at least 3 characters"),
  country: z.string().min(2, "Country must be specified"),
  level: z.enum(["Bachelor", "Master", "PhD", "Postdoctoral", "Any"]),
  field: z.string().min(2, "Field must be specified"),
  category: z.enum([
    "Merit-Based",
    "Need-Based",
    "Research",
    "Sports",
    "Women in STEM",
    "International",
    "Government",
    "Private",
  ]),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Deadline must be in YYYY-MM-DD format"), // YYYY-MM-DD
  description: z.string().min(50, "Description must be at least 50 characters with eligibility criteria"),
  link: z.string().url("Must be a valid URL").refine(
    (url) => url.startsWith("http://") || url.startsWith("https://"),
    "URL must start with http:// or https://"
  ),
  amount: z.string().min(1, "Amount must be specified").default("Varies"),
  currency: z.enum([
    "USD", "EUR", "GBP", "AUD", "CAD", "JPY", 
    "CNY", "KRW", "TRY", "SEK", "NOK", "DKK", 
    "CHF", "NZD", "SGD", "HKD", "INR", "Other"
  ]).default("USD"),
});

export type ParsedScholarship = z.infer<typeof ParsedScholarshipSchema>;

// ── API Response Types ──────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiFilters {
  country?: string;
  level?: string;
  field?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface FetchLog {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: string;
  scholarships_found: number;
  scholarships_added: number;
  error: string | null;
  search_queries: string | null;
}
