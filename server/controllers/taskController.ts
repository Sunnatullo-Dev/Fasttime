import db from "../db";

export const getTasks = (req: any, res: any) => {
  const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY is_priority DESC, created_at DESC").all(req.user.id);
  res.json(tasks);
};

export const createTask = (req: any, res: any) => {
  const { title, is_priority } = req.body;

  if (!title || title.trim().length === 0 || title.length > 200) {
    return res.status(400).json({ error: "Vazifa sarlavhasi bo'sh bo'lmasligi va 200 belgidan oshmasligi kerak" });
  }

  // Check limit for free users
  const user: any = db.prepare("SELECT is_premium FROM users WHERE id = ?").get(req.user.id);
  if (!user.is_premium) {
    const taskCount: any = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND DATE(created_at) = DATE('now')").get(req.user.id);
    if (taskCount.count >= 5) {
      return res.status(403).json({ error: "Bepul foydalanuvchilar uchun kunlik limit - 5 ta vazifa. Premiumga o'ting!" });
    }
  }

  const stmt = db.prepare("INSERT INTO tasks (user_id, title, is_priority) VALUES (?, ?, ?)");
  const info = stmt.run(req.user.id, title.trim(), is_priority ? 1 : 0);
  res.json({ id: info.lastInsertRowid, title: title.trim(), is_priority, is_completed: 0 });
};


export const updateTask = (req: any, res: any) => {
  const { is_completed, title, is_priority } = req.body;
  const fields = [];
  const params = [];

  if (is_completed !== undefined) {
    fields.push("is_completed = ?");
    params.push(is_completed ? 1 : 0);
  }
  if (title !== undefined) {
    fields.push("title = ?");
    params.push(title);
  }
  if (is_priority !== undefined) {
    fields.push("is_priority = ?");
    params.push(is_priority ? 1 : 0);
  }

  if (fields.length === 0) return res.status(400).json({ error: "Yangilash uchun ma'lumot yo'q" });

  params.push(req.params.id, req.user.id);
  db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`).run(...params);
  res.json({ success: true });
};

export const deleteTask = (req: any, res: any) => {
  db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ success: true });
};
