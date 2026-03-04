import express from "express";
import { getStats, getDailyStats, getWeeklyStats, getSessionHistory, getHeatmapData, getAIProductivityScore, getAdaptiveConfig, getWeeklyAIReport } from "../controllers/statsController";
import { authenticateToken } from "../middleware/auth";
import { requirePremium } from "../middleware/premium";

const router = express.Router();

router.get("/", authenticateToken, getStats);
router.get("/daily", authenticateToken, getDailyStats);
router.get("/weekly", authenticateToken, getWeeklyStats);
router.get("/history", authenticateToken, getSessionHistory);
router.get("/heatmap", authenticateToken, requirePremium, getHeatmapData);
router.get("/ai-score", authenticateToken, getAIProductivityScore);
router.get("/adaptive-config", authenticateToken, requirePremium, getAdaptiveConfig);
router.get("/weekly-report", authenticateToken, requirePremium, getWeeklyAIReport);


export default router;

