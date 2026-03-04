import express from "express";
import { getSessions, createSession, startSession, updateSession, completeSession } from "../controllers/pomodoroController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticateToken, getSessions);
router.post("/", authenticateToken, createSession);
router.post("/start", authenticateToken, startSession);
router.patch("/update/:id", authenticateToken, updateSession);
router.post("/complete/:id", authenticateToken, completeSession);

export default router;
