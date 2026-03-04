import db from "../db";

export const getNotes = (req: any, res: any) => {
  const notes = db.prepare("SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC").all(req.user.id);
  res.json(notes);
};

export const createNote = (req: any, res: any) => {
  const { title, content } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: "Eslatma sarlavhasi bo'sh bo'lmasligi kerak" });
  }

  const stmt = db.prepare("INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)");
  const info = stmt.run(req.user.id, title.trim(), content || "");
  res.json({ id: info.lastInsertRowid, title: title.trim(), content: content || "" });
};

export const updateNote = (req: any, res: any) => {
  const { title, content } = req.body;

  if (title !== undefined && title.trim().length === 0) {
    return res.status(400).json({ error: "Eslatma sarlavhasi bo'sh bo'lmasligi kerak" });
  }

  db.prepare("UPDATE notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?")
    .run(title?.trim(), content, req.params.id, req.user.id);
  res.json({ success: true });
};


export const deleteNote = (req: any, res: any) => {
  db.prepare("DELETE FROM notes WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ success: true });
};
