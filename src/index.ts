import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env") });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import scholarshipRoutes from "./routes/scholarships.js";
import { startScheduler, runFetchCycle } from "./cron/scheduler.js";
import { connectMongo, disconnectMongo } from "./db/mongo.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001");

// ── Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan("short"));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────
app.use("/api/scholarships", scholarshipRoutes);

// Manual trigger for fetching (protected in production)
app.post("/api/fetch-now", async (_req, res) => {
  try {
    console.log("[API] Manual fetch triggered");
    // Run in background, don't block the response
    runFetchCycle().catch((err) =>
      console.error("[API] Manual fetch error:", err)
    );
    res.json({ message: "Fetch cycle started in background" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Start Server ────────────────────────────────────────────────────
connectMongo()
  .then(() => {
    console.log("[MongoDB] Connected successfully");

    const server = app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════╗
║  ScholarHub API Server                               ║
║  Running on http://localhost:${PORT}                    ║
║  Environment: ${process.env.NODE_ENV || "development"}                       ║
╚══════════════════════════════════════════════════════╝
  `);

      // Start the cron scheduler
      startScheduler();
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n[${signal}] Graceful shutdown initiated...`);
      
      server.close(async () => {
        console.log('[Server] HTTP server closed');
        
        try {
          await disconnectMongo();
          console.log('[Server] All connections closed. Exiting...');
          process.exit(0);
        } catch (error: any) {
          console.error('[Server] Error during shutdown:', error.message);
          process.exit(1);
        }
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch((error: any) => {
    console.error("[MongoDB] Connection failed:", error.message);
    process.exit(1);
  });

export default app;
