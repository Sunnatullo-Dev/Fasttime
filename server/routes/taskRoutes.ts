import express from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/taskController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticateToken, getTasks);
router.post("/", authenticateToken, createTask);
router.patch("/:id", authenticateToken, updateTask);
router.delete("/:id", authenticateToken, deleteTask);

export default router;
