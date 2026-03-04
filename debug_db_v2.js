const Database = require('better-sqlite3');
const db = new Database('fasttime.db');

try {
    const userId = 1; // Assuming user ID 1 exists
    const row = db.prepare('SELECT * FROM ai_productivity_scores LIMIT 1').get();
    console.log('Columns in ai_productivity_scores:', Object.keys(row || {}));

    // Try the query that likely fails in statsController.ts:208
    const focusData = db.prepare(`
      SELECT SUM(duration) as total 
      FROM pomodoro_sessions 
      WHERE user_id = ? AND type = 'focus' AND status = 'completed' 
      AND DATE(completed_at) = DATE('now')
    `).get(userId);
    console.log('Focus data check:', focusData);

    // Try the query in statsController.ts:217
    const sessionStats = db.prepare(`
      SELECT 
        COUNT(*) as started,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM pomodoro_sessions
      WHERE user_id = ? AND DATE(started_at) = DATE('now')
    `).get(userId);
    console.log('Session stats check:', sessionStats);

    // Try a query to ai_productivity_scores with the new columns
    const testUpdate = db.prepare(`
      SELECT deep_focus_minutes FROM ai_productivity_scores LIMIT 1
    `).get();
    console.log('deep_focus_minutes check:', testUpdate);

} catch (err) {
    console.error('DEBUG ERROR:', err);
}
