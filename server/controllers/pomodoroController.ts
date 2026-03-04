import db from "../db";
import { checkAndAwardAchievements } from "../services/achievementService";

export const getSessions = (req: any, res: any) => {
  const sessions = db.prepare("SELECT * FROM pomodoro_sessions WHERE user_id = ? ORDER BY completed_at DESC").all(req.user.id);
  res.json(sessions);
};

export const createSession = (req: any, res: any) => {
  const { duration, type } = req.body;
  const stmt = db.prepare("INSERT INTO pomodoro_sessions (user_id, duration, type, status, completed_at) VALUES (?, ?, ?, 'completed', CURRENT_TIMESTAMP)");
  const info = stmt.run(req.user.id, duration, type);
  res.json({ id: info.lastInsertRowid });
};

export const startSession = (req: any, res: any) => {
  const { duration, type } = req.body;
  const stmt = db.prepare("INSERT INTO pomodoro_sessions (user_id, duration, target_duration, type, status, started_at) VALUES (?, ?, ?, ?, 'started', CURRENT_TIMESTAMP)");
  const info = stmt.run(req.user.id, duration, duration, type);
  res.json({ id: info.lastInsertRowid });
};

export const updateSession = (req: any, res: any) => {
  const { id } = req.params;
  const { interruptions, duration } = req.body;
  try {
    const stmt = db.prepare("UPDATE pomodoro_sessions SET interruptions = COALESCE(?, interruptions), duration = COALESCE(?, duration) WHERE id = ? AND user_id = ?");
    stmt.run(interruptions, duration, id, req.user.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to update session" });
  }
};

export const completeSession = (req: any, res: any) => {
  const { id } = req.params;
  const { duration } = req.body;
  const userId = req.user.id;

  try {
    const session = db.prepare("SELECT duration, type FROM pomodoro_sessions WHERE id = ? AND user_id = ?").get(id, userId) as any;

    db.prepare("UPDATE pomodoro_sessions SET status = 'completed', duration = COALESCE(?, duration), completed_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?")
      .run(duration, id, userId);

    if (session && session.type === 'focus') {
      const actualDuration = duration || session.duration;
      db.prepare("UPDATE users SET total_focus_minutes = total_focus_minutes + ? WHERE id = ?").run(actualDuration, userId);

      // Calculate and update level
      const user = db.prepare("SELECT total_focus_minutes FROM users WHERE id = ?").get(userId) as any;
      const totalMins = user.total_focus_minutes || 0;

      let level = 'Thinker';
      if (totalMins >= 12000) level = 'Master';
      else if (totalMins >= 3000) level = 'Architect';
      else if (totalMins >= 600) level = 'Builder';

      db.prepare("UPDATE users SET level = ? WHERE id = ?").run(level, userId);

      // Team integration (Digital Coworking Task)
      const teamMember: any = db.prepare("SELECT team_id FROM team_members WHERE user_id = ?").get(userId);
      if (teamMember) {
        db.prepare(`
              INSERT INTO team_sessions (team_id, user_id, mode, duration_seconds, completed, end_at)
              VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
          `).run(teamMember.team_id, userId, (session?.type || 'focus').toUpperCase(), (actualDuration || 25) * 60);
      }
    }

    const newAchievements = checkAndAwardAchievements(userId);

    res.json({ success: true, newAchievements });
  } catch (error) {
    console.error("completeSession error:", error);
    res.status(500).json({ error: "Failed to complete session" });
  }
};
