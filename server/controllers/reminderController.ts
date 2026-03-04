import db from "../db";

export const getReminders = (req: any, res: any) => {
    const userId = req.user.id;
    try {
        const reminders = db.prepare(`
      SELECT * FROM reminders 
      WHERE user_id = ? 
      ORDER BY is_completed ASC, remind_at ASC
    `).all(userId);
        res.json(reminders);
    } catch (error) {
        res.status(500).json({ error: "Xatolik yuz berdi" });
    }
};

export const createReminder = (req: any, res: any) => {
    const userId = req.user.id;
    const { title, description, remind_at, repeat_option } = req.body;

    try {
        const stmt = db.prepare(`
      INSERT INTO reminders (user_id, title, description, remind_at, repeat_option)
      VALUES (?, ?, ?, ?, ?)
    `);
        const info = stmt.run(userId, title, description, remind_at, repeat_option || 'none');
        res.json({ id: info.lastInsertRowid, title, description, remind_at, repeat_option });
    } catch (error) {
        res.status(500).json({ error: "Saqlashda xatolik" });
    }
};

export const updateReminder = (req: any, res: any) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, remind_at, repeat_option, is_completed } = req.body;

    try {
        const stmt = db.prepare(`
      UPDATE reminders 
      SET title = ?, description = ?, remind_at = ?, repeat_option = ?, is_completed = ?
      WHERE id = ? AND user_id = ?
    `);
        stmt.run(title, description, remind_at, repeat_option, is_completed ? 1 : 0, id, userId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Yangilashda xatolik" });
    }
};

export const deleteReminder = (req: any, res: any) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        db.prepare("DELETE FROM reminders WHERE id = ? AND user_id = ?").run(id, userId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "O'chirishda xatolik" });
    }
};

export const snoozeReminder = (req: any, res: any) => {
    const userId = req.user.id;
    const { id } = req.params;
    const snoozeTime = new Date(Date.now() + 5 * 60000).toISOString();

    try {
        db.prepare(`
      UPDATE reminders 
      SET remind_at = ?, is_completed = 0
      WHERE id = ? AND user_id = ?
    `).run(snoozeTime, id, userId);
        res.json({ success: true, new_time: snoozeTime });
    } catch (error) {
        res.status(500).json({ error: "Snooze xatoligi" });
    }
};

export const markAsDone = (req: any, res: any) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const reminder: any = db.prepare("SELECT * FROM reminders WHERE id = ? AND user_id = ?").get(id, userId);
        if (!reminder) return res.status(404).json({ error: "Topilmadi" });

        if (reminder.repeat_option !== 'none') {
            // Calculate next time
            const nextDate = new Date(reminder.remind_at);
            if (reminder.repeat_option === 'daily') nextDate.setDate(nextDate.getDate() + 1);
            else if (reminder.repeat_option === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            else if (reminder.repeat_option === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

            db.prepare("UPDATE reminders SET remind_at = ? WHERE id = ?").run(nextDate.toISOString(), id);
        } else {
            db.prepare("UPDATE reminders SET is_completed = 1 WHERE id = ?").run(id);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Xatolik" });
    }
};

export const checkDueReminders = (req: any, res: any) => {
    const userId = req.user.id;
    const now = new Date().toISOString();

    try {
        const dueReminders = db.prepare(`
      SELECT * FROM reminders 
      WHERE user_id = ? AND is_completed = 0 AND remind_at <= ?
    `).all(userId, now);
        res.json(dueReminders);
    } catch (error) {
        res.status(500).json({ error: "Xatolik" });
    }
};
