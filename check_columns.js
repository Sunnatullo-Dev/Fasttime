import Database from 'better-sqlite3';
const db = new Database('fasttime.db');
const columns = db.pragma('table_info(pomodoro_sessions)');
console.log('Columns in pomodoro_sessions:');
columns.forEach(c => console.log(`- ${c.name}`));
