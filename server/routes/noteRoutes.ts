import express from "express";
import { getNotes, createNote, updateNote, deleteNote } from "../controllers/noteController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticateToken, getNotes);
router.post("/", authenticateToken, createNote);
router.patch("/:id", authenticateToken, updateNote);
router.delete("/:id", authenticateToken, deleteNote);

export default router;
