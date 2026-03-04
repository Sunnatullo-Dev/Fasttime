import db from './server/db.js';

try {
    const userId = 1;
    console.log('Testing pomodoro_sessions count...');
    const count = db.prepare('SELECT COUNT(*) as count FROM pomodoro_sessions').get();
    console.log('Count:', count);

    console.log('Testing problematic query...');
    const sessionStats = db.prepare(`
      SELECT 
        COUNT(*) as started,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM pomodoro_sessions
      WHERE user_id = ? AND DATE(started_at) = DATE('now')
    `).get(userId);
    console.log('Session stats:', sessionStats);
} catch (err) {
    console.error('FULL ERROR:', err);
}
