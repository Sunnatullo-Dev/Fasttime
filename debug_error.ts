import db from './server/db.js';

try {
    const userId = 1;
    // This is the query that likely fails
    db.prepare(`
      SELECT 
        COUNT(*) as started,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM pomodoro_sessions
      WHERE user_id = ? AND DATE(started_at) = DATE('now')
    `).get(userId);
} catch (err) {
    import fs from 'fs';
    fs.writeFileSync('error_details.txt', JSON.stringify({
        message: err.message,
        code: err.code,
        stack: err.stack
    }, null, 2));
}
