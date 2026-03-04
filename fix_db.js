import Database from 'better-sqlite3';
const db = new Database('fasttime.db');

const addColumn = (table, column, type) => {
    try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
        console.log(`Added ${column} to ${table}`);
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log(`${column} already exists in ${table}`);
        } else {
            console.error(`Error adding ${column} to ${table}:`, e.message);
        }
    }
};

console.log('Starting migrations...');

// Pomodoro Sessions
addColumn('pomodoro_sessions', 'status', "TEXT DEFAULT 'completed'");
addColumn('pomodoro_sessions', 'started_at', "DATETIME DEFAULT CURRENT_TIMESTAMP");

// Users (just in case)
addColumn('users', 'last_login', 'DATETIME');

console.log('Migrations finished.');
