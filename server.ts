import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./server/routes/authRoutes";
import pomodoroRoutes from "./server/routes/pomodoroRoutes";
import taskRoutes from "./server/routes/taskRoutes";
import noteRoutes from "./server/routes/noteRoutes";
import statsRoutes from "./server/routes/statsRoutes";
import paymentRoutes from "./server/routes/paymentRoutes";
import aiRoutes from "./server/routes/aiRoutes";
import launchRoutes from "./server/routes/launchRoutes";
import reminderRoutes from "./server/routes/reminderRoutes";
import teamRoutes from "./server/routes/teamRoutes";
import db from "./server/db";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Cleanup expired plans on startup
  try {
    const now = new Date().toISOString();
    const result = db.prepare(`
      UPDATE users 
      SET plan = 'FREE', is_premium = 0, plan_expires_at = NULL, premium_expires_at = NULL
      WHERE plan = 'MONTHLY' AND plan_expires_at < ?
    `).run(now);
    if (result.changes > 0) {
      console.log(`[STARTUP] Downgraded ${result.changes} expired monthly plans.`);
    }
  } catch (err) {
    console.error("[STARTUP] Failed to cleanup expired plans:", err);
  }

  const app = express();

  // Stripe webhook needs raw body, so we mount it before express.json()
  app.use("/api/payment/webhook", express.raw({ type: 'application/json' }));
  app.use("/api/billing/webhook", express.raw({ type: 'application/json' }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/pomodoro", pomodoroRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/notes", noteRoutes);
  app.use("/api/stats", statsRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/billing", paymentRoutes); // Alias – PricingModal calls /api/billing/...
  app.use("/api/ai", aiRoutes);
  app.use("/api/launch", launchRoutes);
  app.use("/api/reminders", reminderRoutes);
  app.use("/api/teams", teamRoutes);

  // Stripe redirect landing pages — serve the SPA and let React Router handle them
  app.get("/billing/success", (req, res) => {
    const sessionId = req.query.session_id as string;
    res.redirect(`/?session_id=${encodeURIComponent(sessionId || '')}`);
  });
  app.get("/billing/cancel", (_req, res) => {
    res.redirect("/?payment=cancel");
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global Error:", err);
    res.status(err.status || 500).json({ error: err.message || "Server xatosi" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
