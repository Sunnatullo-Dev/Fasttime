import Database from 'better-sqlite3';
const db = new Database('fasttime.db');
try {
    const userId = 1;
    const sql = `
      SELECT 
        COUNT(*) as started,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM pomodoro_sessions
      WHERE user_id = ? AND DATE(started_at) = DATE('now')
    `;
    console.log('Running query:', sql);
    db.prepare(sql).get(userId);
    console.log('Query successful');
} catch (err) {
    console.error('SQL Error Caught:', err.message);
}
