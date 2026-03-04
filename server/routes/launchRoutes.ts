import express from "express";
import { joinWaitlist, getReferralStats, submitReferral } from "../controllers/launchController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.post("/waitlist", joinWaitlist);
router.get("/referrals", authenticateToken, getReferralStats);
router.post("/referrals/submit", authenticateToken, submitReferral);

export default router;
