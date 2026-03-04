import express from "express";
import {
    getReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    snoozeReminder,
    markAsDone,
    checkDueReminders
} from "../controllers/reminderController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticateToken, getReminders);
router.post("/", authenticateToken, createReminder);
router.put("/:id", authenticateToken, updateReminder);
router.delete("/:id", authenticateToken, deleteReminder);
router.post("/:id/snooze", authenticateToken, snoozeReminder);
router.post("/:id/done", authenticateToken, markAsDone);
router.get("/due", authenticateToken, checkDueReminders);

export default router;
