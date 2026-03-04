import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db";
import crypto from "crypto";
import { sendResetPasswordEmail } from "../services/emailService";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
const isPasswordBypassEnabled = process.env.NODE_ENV !== 'production' || process.env.DEV_BYPASS_WEAK_PASSWORD === 'true';

const isValidPassword = (password: string) => {
  if (isPasswordBypassEnabled && password === '123') return true;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

export const register = async (req: any, res: any) => {
  const { username, password, email, referralCode } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: "Barcha maydonlarni to'ldiring: username, email va parol" });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: "Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Email manzili noto'g'ri formatda" });
  }

  // Password Policy
  if (!isValidPassword(password)) {
    return res.status(400).json({
      error: "Parol talablarga javob bermaydi: kamida 8 ta belgi, 1 ta katta harf, 1 ta kichik harf va 1 ta raqam bo'lishi shart."
    });
  }

  try {
    const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existingEmail) {
      return res.status(400).json({ error: "Ushbu email manzili allaqachon ro'yxatdan o'tgan" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)");
    const info = stmt.run(username.toLowerCase(), hashedPassword, email.toLowerCase());
    const userId = info.lastInsertRowid;

    if (referralCode) {
      const referrer = db.prepare("SELECT id FROM users WHERE referral_code = ?").get(referralCode);
      if (referrer && referrer.id !== userId) {
        db.prepare("INSERT INTO referrals (referrer_id, referred_user_id) VALUES (?, ?)").run(referrer.id, userId);
        db.prepare("UPDATE users SET referred_by_id = ? WHERE id = ?").run(referrer.id, userId);
      }
    }

    if (username.toLowerCase() === "amirxon") {
      return res.status(201).json({
        success: true,
        message: "Amirxon, Sizni Mackbook M5 Pro bilan tabriklayman! 🎉",
        special: true
      });
    }

    res.status(201).json({ id: userId, username });
  } catch (error) {
    res.status(400).json({ error: "Bunday foydalanuvchi nomi allaqachon mavjud" });
  }
};

export const login = async (req: any, res: any) => {
  const { username, password } = req.body; // username could be email as well

  if (!username || !password) {
    return res.status(400).json({ error: "Foydalanuvchi nomi/email va parolni kiriting" });
  }

  const queryIdentifier = username.toLowerCase();
  const user: any = db.prepare("SELECT * FROM users WHERE username = ? OR email = ?").get(queryIdentifier, queryIdentifier);

  if (user && await bcrypt.compare(password, user.password)) {
    console.log(`Login muvaffaqiyatli: ${username}`);
    const token = jwt.sign({ id: user.id, username: user.username, is_premium: user.is_premium }, JWT_SECRET);

    // Check if it's the weak test account in dev/bypass mode
    const isWeakTestAccount = user.username === 'sunat' && password === '123' && isPasswordBypassEnabled;

    res.json({
      token,
      user: { id: user.id, username: user.username, is_premium: !!user.is_premium },
      forcePasswordUpdate: isWeakTestAccount
    });
  } else {
    console.log(`Login muvaffaqiyatsiz: ${username}`);
    res.status(401).json({ error: "Foydalanuvchi nomi/email yoki parol noto'g'ri" });
  }
};


export const getProfile = (req: any, res: any) => {
  try {
    const user: any = db.prepare(`
      SELECT id, username, email, full_name, phone, avatar, avatar_url, plan, is_verified, is_premium, premium_until, plan_expires_at, referred_by_id, referral_code, created_at 
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
    }

    // ── Plan expiry guard: downgrade expired MONTHLY users ──────────────
    if (user.plan === 'MONTHLY' && user.plan_expires_at) {
      if (new Date(user.plan_expires_at) < new Date()) {
        db.prepare(`
          UPDATE users SET plan = 'FREE', is_premium = 0, plan_expires_at = NULL, premium_expires_at = NULL
          WHERE id = ?
        `).run(user.id);
        user.plan = 'FREE';
        user.is_premium = 0;
        user.plan_expires_at = null;
        console.log(`[EXPIRY_GUARD] User ${user.id} MONTHLY plan expired. Downgraded to FREE.`);
      }
    }

    res.json({ ...user, is_premium: !!user.is_premium });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Server xatosi" });
  }
};


export const upgrade = (req: any, res: any) => {
  const userId = req.user.id;
  const { fullName, phone } = req.body;

  if (!fullName || !phone) {
    return res.status(400).json({ error: "To'liq ism va telefon raqami talab qilinadi" });
  }

  // Update user with premium status and contact info
  db.prepare("UPDATE users SET is_premium = 1, plan = 'PREMIUM', premium_until = NULL, full_name = ?, phone = ? WHERE id = ?")
    .run(fullName, phone, userId);

  res.json({ success: true, message: "Tabriklaymiz! Siz umrbod Premium foydalanuvchiga aylandingiz." });
};

export const upgradeDemo = (req: any, res: any) => {
  const userId = req.user.id;
  db.prepare("UPDATE users SET is_premium = 1, plan = 'PREMIUM', premium_until = NULL WHERE id = ?").run(userId);
  res.json({ success: true, message: "Tabriklaymiz! Siz Premium foydalanuvchiga aylandingiz." });
};

export const updateProfile = (req: any, res: any) => {
  const userId = req.user.id;
  const { full_name, username, email, phone, avatar } = req.body;

  try {
    const user: any = db.prepare("SELECT username, email, username_last_changed FROM users WHERE id = ?").get(userId);

    // If username is being changed, check 30 day limit
    if (username && username !== user.username) {
      if (user.username_last_changed) {
        const lastChanged = new Date(user.username_last_changed);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 30) {
          return res.status(400).json({ error: `Username'ni har 30 kunda bir marta o'zgartirish mumkin. Siz yana ${30 - diffDays} kundan keyin o'zgartira olasiz.` });
        }
      }

      // Check if new username is taken
      const existing = db.prepare("SELECT id FROM users WHERE username = ? AND id != ?").get(username, userId);
      if (existing) {
        return res.status(400).json({ error: "Bu foydalanuvchi nomi allaqachon band" });
      }
    }

    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Email manzili noto'g'ri formatda" });
      }

      const existingEmail = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email.toLowerCase(), userId);
      if (existingEmail) {
        return res.status(400).json({ error: "Ushbu email manzili allaqachon band" });
      }
    }

    // Dynamic query building
    let query = "UPDATE users SET ";
    const params: any[] = [];
    const updates: string[] = [];

    if (full_name !== undefined) {
      updates.push("full_name = ?");
      params.push(full_name);
    }
    if (username !== undefined && username !== user.username) {
      updates.push("username = ?");
      params.push(username.toLowerCase());
      updates.push("username_last_changed = CURRENT_TIMESTAMP");

      // Log username history
      db.prepare("INSERT INTO username_history (user_id, old_username, new_username) VALUES (?, ?, ?)")
        .run(userId, user.username, username.toLowerCase());
    }
    if (email !== undefined && email !== user.email) {
      updates.push("email = ?");
      params.push(email.toLowerCase());
    }
    if (phone !== undefined) {
      const formattedPhone = phone.replace(/\s/g, '');
      // Check if phone is taken
      const existingPhone = db.prepare("SELECT id FROM users WHERE phone = ? AND id != ?").get(formattedPhone, userId);
      if (existingPhone) {
        return res.status(400).json({ error: "Bu telefon raqami allaqachon ro'yxatdan o'tgan" });
      }
      updates.push("phone = ?");
      params.push(formattedPhone);
    }
    if (avatar !== undefined) {
      updates.push("avatar = ?");
      params.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Hech qanday o'zgarish kiritilmadi" });
    }

    query += updates.join(", ") + " WHERE id = ?";
    params.push(userId);

    db.prepare(query).run(...params);
    res.json({ success: true, message: "Profil muvaffaqiyatli yangilandi" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Profilni yangilab bo'lmadi" });
  }
};

export const checkUsername = (req: any, res: any) => {
  const { username } = req.query;
  const userId = req.user?.id;

  if (!username || username.length < 4) {
    return res.status(400).json({ error: "Username kamida 4 ta belgidan iborat bo'lishi kerak" });
  }

  try {
    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username.toLowerCase());

    if (existing) {
      if (userId && existing.id === userId) {
        return res.json({ available: true, message: "Sizning hozirgi username'ingiz" });
      }
      return res.json({ available: false, message: "Username band" });
    }

    res.json({ available: true, message: "Username mavjud" });
  } catch (error) {
    res.status(500).json({ error: "Server xatosi" });
  }
};

export const changePassword = async (req: any, res: any) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Barcha maydonlarni to'ldiring" });
  }

  // Production-level validation logic
  if (!isValidPassword(newPassword)) {
    return res.status(400).json({
      error: "Yangi parol talablarga javob bermaydi: kamida 8 ta belgi, 1 ta katta harf, 1 ta kichik harf va 1 ta raqam bo'lishi shart."
    });
  }

  try {
    const user = db.prepare("SELECT password FROM users WHERE id = ?").get(userId) as any;
    if (!user) {
      return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Hozirgi parol noto'g'ri" });
    }

    // Hash with 12 rounds for production security
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    db.prepare("UPDATE users SET password = ?, password_updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(hashedPassword, userId);

    res.json({ success: true, message: "Parol muvaffaqiyatli o'zgartirildi" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: "Parolni o'zgartirishda texnik xatolik yuz berdi" });
  }
};

export const uploadAvatar = (req: any, res: any) => {
  console.log("Avatar upload request received:", req.file);
  if (!req.file) {
    return res.status(400).json({ error: "Rasm yuklanmadi" });
  }

  const userId = req.user.id;
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  try {
    db.prepare("UPDATE users SET avatar = ?, avatar_url = ? WHERE id = ?")
      .run(avatarUrl, avatarUrl, userId);

    res.json({ success: true, avatarUrl });
  } catch (error) {
    console.error("Avatar upload DB error:", error);
    res.status(500).json({ error: "Ma'lumotlar bazasini yangilab bo'lmadi" });
  }
};

export const getAchievements = (req: any, res: any) => {
  try {
    const achievements = db.prepare("SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC").all(req.user.id);
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
};

export const forgotPassword = async (req: any, res: any) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email manzili kiritilishi kerak" });
  }

  try {
    const user = db.prepare("SELECT id, email FROM users WHERE email = ?").get(email) as any;

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

      // Remove any existing reset tokens for this user
      db.prepare("DELETE FROM password_resets WHERE user_id = ?").run(user.id);

      // Save new reset token
      db.prepare("INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)")
        .run(user.id, tokenHash, expiresAt);

      // Send email (async)
      sendResetPasswordEmail(user.email, resetToken).catch(console.error);
    }

    // Always return success to prevent user enumeration
    res.json({ success: true, message: "Agar bu email mavjud bo'lsa, tiklash havolasi yuborildi." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Server xatosi" });
  }
};

export const resetPassword = async (req: any, res: any) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token va yangi parol kiritilishi kerak" });
  }

  // Strong password validation
  if (!isValidPassword(newPassword)) {
    return res.status(400).json({
      error: "Yangi parol talablarga javob bermaydi: kamida 8 ta belgi, 1 ta katta harf, 1 ta kichik harf va 1 ta raqam bo'lishi shart."
    });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date().toISOString();

    const resetRequest = db.prepare(`
      SELECT user_id FROM password_resets 
      WHERE token_hash = ? AND expires_at > ?
    `).get(tokenHash, now) as any;

    if (!resetRequest) {
      return res.status(400).json({ error: "Yaroqsiz yoki muddati o'tgan token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    db.prepare("UPDATE users SET password = ?, password_updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(hashedPassword, resetRequest.user_id);

    // Delete used token
    db.prepare("DELETE FROM password_resets WHERE user_id = ?").run(resetRequest.user_id);

    res.json({ success: true, message: "Parol muvaffaqiyatli yangilandi." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Server xatosi" });
  }
};
