import db from "../db";

export type AchievementType =
    | 'FIRST_SESSION'
    | '10_SESSIONS'
    | '100_SESSIONS'
    | '7_DAY_STREAK'
    | 'PREMIUM_USER'
    | 'EARLY_SUPPORTER';

/**
 * Checks and awards achievements for a user.
 * Returns an array of newly unlocked achievement types.
 */
export const checkAndAwardAchievements = (userId: number): AchievementType[] => {
    const newlyUnlocked: AchievementType[] = [];
    const existingAchievements = db.prepare("SELECT type FROM achievements WHERE user_id = ?").all(userId).map((a: any) => a.type);

    const award = (type: AchievementType) => {
        if (!existingAchievements.includes(type)) {
            db.prepare("INSERT INTO achievements (user_id, type) VALUES (?, ?)").run(userId, type);
            newlyUnlocked.push(type);
        }
    };

    // Stats for checks
    const sessionCount = db.prepare("SELECT COUNT(*) as count FROM pomodoro_sessions WHERE user_id = ? AND status = 'completed' AND type = 'focus'").get(userId) as any;
    const focusSessions = sessionCount?.count || 0;

    const user = db.prepare("SELECT plan, created_at, current_streak FROM users WHERE id = ?").get(userId) as any;

    // FIRST_SESSION
    if (focusSessions >= 1) {
        award('FIRST_SESSION');
    }

    // 10_SESSIONS
    if (focusSessions >= 10) {
        award('10_SESSIONS');
    }

    // 100_SESSIONS
    if (focusSessions >= 100) {
        award('100_SESSIONS');
    }

    // 7_DAY_STREAK
    if (user?.current_streak >= 7) {
        award('7_DAY_STREAK');
    }

    // PREMIUM_USER
    if (user?.plan === 'PREMIUM') {
        award('PREMIUM_USER');
    }

    // EARLY_SUPPORTER (Joined within first 30 days of launch, or just early IDs for now)
    // Let's say if userId < 100 or created within a certain date range
    const launchDate = new Date('2026-02-01').getTime();
    const joinDate = new Date(user?.created_at).getTime();
    if (joinDate < launchDate + (30 * 24 * 60 * 60 * 1000)) {
        award('EARLY_SUPPORTER');
    }

    return newlyUnlocked;
};
