import db from '../db';

export const requirePremium = (req: any, res: any, next: any) => {
    const userId = req.user.id;
    const user: any = db.prepare("SELECT plan, is_premium, premium_expires_at FROM users WHERE id = ?").get(userId);

    if (!user || user.plan !== 'PREMIUM') {
        return res.status(403).json({ error: "Premium obunasi talab qilinadi. Iltimos, tarifingizni yangilang." });
    }

    // Double check expiration if it's a subscription
    if (user.premium_expires_at) {
        const expires = new Date(user.premium_expires_at);
        if (expires < new Date()) {
            // Auto downgrade if expired
            db.prepare("UPDATE users SET plan = 'FREE', is_premium = 0 WHERE id = ?").run(userId);
            return res.status(403).json({ error: "Premium obunangiz muddati tugagan. Iltimos, yangilang." });
        }
    }

    next();
};

export const checkPremiumStatus = (userId: number) => {
    const user: any = db.prepare("SELECT plan, premium_expires_at FROM users WHERE id = ?").get(userId);
    if (user && user.plan === 'PREMIUM' && user.premium_expires_at) {
        if (new Date(user.premium_expires_at) < new Date()) {
            db.prepare("UPDATE users SET plan = 'FREE', is_premium = 0 WHERE id = ?").run(userId);
            return false;
        }
    }
    return user?.plan === 'PREMIUM';
};

