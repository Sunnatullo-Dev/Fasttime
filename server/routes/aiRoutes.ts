import express from "express";
import { analyzeFocus } from "../controllers/aiController";
import { authenticateToken } from "../middleware/auth";
import { requirePremium } from "../middleware/premium";

const router = express.Router();

router.post("/analyze", authenticateToken, requirePremium, analyzeFocus);

export default router;
