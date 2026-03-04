import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
    register, login, getProfile, upgrade, upgradeDemo, updateProfile,
    changePassword, checkUsername, uploadAvatar, getAchievements,
    forgotPassword, resetPassword
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

import db from "../db";

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req: any, file, cb) => {
        const userId = req.user?.id || 'unknown';
        const ext = path.extname(file.originalname).toLowerCase();
        // Requirement: userId_timestamp.ext
        cb(null, `${userId}_${Date.now()}${ext}`);
    }
});

// Dynamic Multer Middleware
const uploadMiddleware = (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ success: false, message: "UNAUTHORIZED" });

    const userId = req.user.id;
    const userRecord = db.prepare("SELECT plan FROM users WHERE id = ?").get(userId) as any;
    const plan = userRecord?.plan || 'FREE';
    const limit = plan === 'PREMIUM' ? 5 * 1024 * 1024 : 2 * 1024 * 1024;

    console.log(`[AVATAR_UPLOAD] User: ${userId}, Plan: ${plan}, Limit: ${limit} bytes`);

    const upload = multer({
        storage,
        limits: { fileSize: limit },
        fileFilter: (req, file, cb) => {
            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error("INVALID_FILE_TYPE"));
            }
        }
    }).single("avatar");

    upload(req, res, (err: any) => {
        if (err) {
            console.error(`[AVATAR_UPLOAD_ERROR] User: ${userId}, Error:`, err);

            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: plan === "FREE" ? "Free users can upload up to 2MB. Upgrade to Premium for 5MB." : "Premium allows up to 5MB."
                    });
                }
                return res.status(400).json({ success: false, message: `Upload error: ${err.code}` });
            }

            if (err.message === "INVALID_FILE_TYPE") {
                return res.status(400).json({ success: false, message: "Faqat jpg, png va webp formatlari ruxsat etilgan" });
            }

            return res.status(400).json({ success: false, message: err.message });
        }

        if (req.file) {
            console.log(`[AVATAR_UPLOAD_SUCCESS] User: ${userId}, File: ${req.file.filename}, Size: ${req.file.size} bytes`);
        }

        next();
    });
};

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticateToken, getProfile);
router.get("/check-username", authenticateToken, checkUsername);
router.post("/upgrade", authenticateToken, upgrade);
router.post("/upgrade-demo", authenticateToken, upgradeDemo);
router.post("/update-profile", authenticateToken, updateProfile);
router.put("/change-password", authenticateToken, changePassword);
router.post("/upload-avatar", authenticateToken, uploadMiddleware, uploadAvatar);
router.get("/achievements", authenticateToken, getAchievements);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;

