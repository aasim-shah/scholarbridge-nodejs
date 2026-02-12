import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { ParsedScholarship, ParsedScholarshipSchema } from "../../types/index.js";
import { AIServiceProvider } from "./types.js";
import { isOfficialDirectLink } from "./utils.js";

export class GeminiProvider implements AIServiceProvider {
  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor(private apiKey: string) {}

  private getModel(): GenerativeModel {
    if (!this.model) {
      this.client = new GoogleGenerativeAI(this.apiKey);
      // Using latest stable Gemini Flash model - free tier with 60 RPM
      // Available models: gemini-2.5-flash, gemini-flash-latest, gemini-pro-latest
      this.model = this.client.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
    }
    return this.model;
  }

  getProviderName(): string {
    return "Gemini";
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async searchScholarships(query: string): Promise<ParsedScholarship[]> {
    const prompt = `You are a scholarship data extractor with web search capabilities. Search the web for: "${query}"

ABSOLUTE RULES — violating any of these means the entry must be excluded:
1. Every field you return MUST come from an official page you found via web search. DO NOT guess, infer, or make up ANY detail.
2. The "link" field MUST be the URL of the official scholarship/application page on the university or organisation's own website (domain ending in .edu, .ac.uk, .gov, .org, .edu.au, etc.). It must NOT be a scholarship aggregator, social media post, blog, news article, or PDF.
3. The "deadline" MUST be the exact date stated on the official page. If you cannot find a specific deadline on the page, set it to "2026-12-31" and add "(rolling/unconfirmed)" in the description.
4. The "description" MUST include ONLY facts stated on the official page: coverage (tuition, stipend amounts, travel, insurance), eligibility requirements (GPA, nationality restrictions, field of study, degree required), required documents, and selection criteria.
5. The "amount" MUST be the exact figure or range stated on the official page (e.g., "AUD $10,000 per year", "Full tuition + €934/month stipend"). If the page says "varies" or does not state a figure, write "Varies".
6. If you are not 100% certain a scholarship is real and currently accepting applications, DO NOT include it.
7. DO NOT include scholarships whose deadlines have already passed.
8. Return 3-6 scholarships maximum — accuracy is more important than quantity.

For "level": Bachelor | Master | PhD | Postdoctoral | Any
For "category": Merit-Based | Need-Based | Research | Sports | Women in STEM | International | Government | Private

For each real scholarship you find on an OFFICIAL page, extract the data and return a JSON array:
[
  {
    "title": "exact scholarship name from the official page",
    "organization": "exact university / organisation name",
    "country": "country",
    "level": "Bachelor|Master|PhD|Postdoctoral|Any",
    "field": "field of study or Any",
    "category": "one of the allowed categories",
    "deadline": "YYYY-MM-DD exactly as stated on the page",
    "description": "ONLY facts from the official page: what is covered, eligibility, required documents, selection criteria",
    "link": "the official page URL you found (NOT an aggregator)",
    "amount": "exact value from the page",
    "currency": "USD|EUR|GBP|AUD|CAD|JPY|CNY|KRW|TRY|SEK|NOK|DKK|CHF|NZD|SGD|HKD|INR|Other"
  }
]

Return ONLY the JSON array. No commentary. If you cannot find any qualifying scholarships, return [].`;

    try {
      const result = await this.getModel().generateContent(prompt);
      const response = result.response;
      const rawText = response.text();

      if (!rawText) {
        console.warn(`[Gemini] Empty response for: "${query}"`);
        return [];
      }

      // ── Parse JSON ──────────────────────────────────────────────
      let jsonStr = rawText;
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      let parsed: unknown[];
      try {
        const data = JSON.parse(jsonStr);
        parsed = Array.isArray(data) ? data : [data];
      } catch {
        console.warn(`[Gemini] JSON parse failed for: "${query}"`);
        console.warn(
          `[Gemini] Raw (first 400 chars): ${rawText.substring(0, 400)}`
        );
        return [];
      }

      // ── Validate each entry ─────────────────────────────────────
      const valid: ParsedScholarship[] = [];

      for (const item of parsed) {
        // 1. Zod schema validation
        const result = ParsedScholarshipSchema.safeParse(item);
        if (!result.success) {
          const issues = result.error.issues.map((i) => i.message).join("; ");
          console.warn(`[Gemini] [Validate] Zod failed: ${issues}`);
          continue;
        }
        const s = result.data;

        // 2. Official-link check
        if (!isOfficialDirectLink(s.link)) {
          console.warn(`[Gemini] [Validate] Blocked link: ${s.link}`);
          continue;
        }

        // 3. Deadline must be in the future
        const deadline = new Date(s.deadline);
        if (isNaN(deadline.getTime()) || deadline < new Date()) {
          console.warn(
            `[Gemini] [Validate] Past/invalid deadline: ${s.deadline} — ${s.title}`
          );
          continue;
        }

        // 4. Deadline not absurdly far away (>3 years)
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 3);
        if (deadline > maxDate) {
          console.warn(
            `[Gemini] [Validate] Deadline too far: ${s.deadline} — ${s.title}`
          );
          continue;
        }

        valid.push(s);
      }

      console.log(
        `[Gemini] ${valid.length}/${parsed.length} passed validation for: "${query.substring(0, 60)}"`
      );
      return valid;
    } catch (error: any) {
      console.error(`[Gemini] API error for "${query}":`, error.message);
      return [];
    }
  }
}
