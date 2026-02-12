import { Router, Request, Response } from "express";
import {
  getScholarships,
  getScholarshipById,
  getFilterOptions,
  getStats,
  addScholarship,
  updateScholarship,
  deleteScholarship,
  getFetchLogs,
} from "../services/scholarshipService.js";
import { InsertScholarshipSchema } from "../types/index.js";

const router = Router();

// ── GET /api/scholarships ───────────────────────────────────────────
// List scholarships with filters, search, pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const filters = {
      country: req.query.country as string | undefined,
      level: req.query.level as string | undefined,
      field: req.query.field as string | undefined,
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit
        ? Math.min(parseInt(req.query.limit as string), 100)
        : 20,
      sort: req.query.sort as string | undefined,
      order: (req.query.order as "asc" | "desc") || "asc",
    };

    const result = await getScholarships(filters);
    res.json(result);
  } catch (error: any) {
    console.error("[API] Error fetching scholarships:", error.message);
    res.status(500).json({ error: "Failed to fetch scholarships" });
  }
});

// ── GET /api/scholarships/filters ───────────────────────────────────
// Get available filter options
router.get("/filters", async (_req: Request, res: Response) => {
  try {
    const options = await getFilterOptions();
    res.json(options);
  } catch (error: any) {
    console.error("[API] Error fetching filters:", error.message);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

// ── GET /api/scholarships/stats ─────────────────────────────────────
// Get dashboard stats
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (error: any) {
    console.error("[API] Error fetching stats:", error.message);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ── GET /api/scholarships/logs ──────────────────────────────────────
// Get fetch logs
router.get("/logs", async (req: Request, res: Response) => {
  try {
    const limit = req.query?.limit
      ? parseInt(req.query.limit as string)
      : 20;
    const logs = await getFetchLogs(limit);
    res.json(logs);
  } catch (error: any) {
    console.error("[API] Error fetching logs:", error.message);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// ── GET /api/scholarships/:id ───────────────────────────────────────
// Get single scholarship
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scholarship = await getScholarshipById(id);
    if (!scholarship) {
      res.status(404).json({ error: "Scholarship not found" });
      return;
    }

    res.json(scholarship);
  } catch (error: any) {
    console.error("[API] Error fetching scholarship:", error.message);
    res.status(500).json({ error: "Failed to fetch scholarship" });
  }
});

// ── POST /api/scholarships ──────────────────────────────────────────
// Add a scholarship manually
router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = InsertScholarshipSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
      return;
    }

    const id = await addScholarship(parsed.data);
    res.status(201).json({ id, message: "Scholarship added" });
  } catch (error: any) {
    console.error("[API] Error adding scholarship:", error.message);
    res.status(500).json({ error: "Failed to add scholarship" });
  }
});

// ── PUT /api/scholarships/:id ───────────────────────────────────────
// Update a scholarship
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await updateScholarship(id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Scholarship not found" });
      return;
    }

    res.json({ message: "Scholarship updated" });
  } catch (error: any) {
    console.error("[API] Error updating scholarship:", error.message);
    res.status(500).json({ error: "Failed to update scholarship" });
  }
});

// ── DELETE /api/scholarships/:id ────────────────────────────────────
// Delete a scholarship
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await deleteScholarship(id);
    if (!deleted) {
      res.status(404).json({ error: "Scholarship not found" });
      return;
    }

    res.json({ message: "Scholarship deleted" });
  } catch (error: any) {
    console.error("[API] Error deleting scholarship:", error.message);
    res.status(500).json({ error: "Failed to delete scholarship" });
  }
});

export default router;
