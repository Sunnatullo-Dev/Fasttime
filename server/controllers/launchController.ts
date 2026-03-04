import db from "../db";
import crypto from "crypto";

export const joinWaitlist = (req: any, res: any) => {
    const { email } = req.body;
    try {
        const stmt = db.prepare("INSERT INTO waitlist (email) VALUES (?)");
        stmt.run(email);
        res.json({ success: true, message: "Ro'yxatga qo'shildingiz!" });
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: "Ushbu email allaqachon ro'yxatda bor." });
        }
        res.status(500).json({ error: "Xatolik yuz berdi." });
    }
};

export const getReferralStats = (req: any, res: any) => {
    const userId = req.user.id;

    let user = db.prepare("SELECT referral_code FROM users WHERE id = ?").get(userId);

    if (!user.referral_code) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        db.prepare("UPDATE users SET referral_code = ? WHERE id = ?").run(code, userId);
        user.referral_code = code;
    }

    const count = db.prepare("SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?").get(userId).count;

    res.json({
        referralCode: user.referral_code,
        referralCount: count,
        rewardLevel: count >= 5 ? 'Silver' : count >= 10 ? 'Gold' : 'Starter'
    });
};

export const submitReferral = (req: any, res: any) => {
    const { code } = req.body;
    const userId = req.user.id;

    const referrer = db.prepare("SELECT id FROM users WHERE referral_code = ?").get(code);

    if (!referrer) return res.status(404).json({ error: "Referral kod topilmadi." });
    if (referrer.id === userId) return res.status(400).json({ error: "O'z kodingizni ishlata olmaysiz." });

    try {
        db.transaction(() => {
            db.prepare("INSERT INTO referrals (referrer_id, referred_user_id) VALUES (?, ?)").run(referrer.id, userId);
            db.prepare("UPDATE users SET referred_by_id = ? WHERE id = ?").run(referrer.id, userId);

            // Check if referrer reached 3 referrals for Reward
            const count = db.prepare("SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?").get(referrer.id).count;
            if (count === 3) {
                const trialUntil = new Date();
                trialUntil.setDate(trialUntil.getDate() + 7);
                db.prepare("UPDATE users SET is_premium = 1, premium_until = ? WHERE id = ? AND is_premium = 0").run(trialUntil.toISOString(), referrer.id);
            }
        })();
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: "Siz allaqachon referaldan foydalangansiz yoki xatolik yuz berdi." });
    }
};
