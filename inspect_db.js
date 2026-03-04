
import Database from 'better-sqlite3';
const db = new Database('fasttime.db');

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("TABLES FOUND:", tables.map(t => t.name).join(", "));

    for (const table of tables) {
        if (table.name === 'sprints' || table.name === 'team_sprints') {
            const info = db.prepare(`PRAGMA table_info(${table.name})`).all();
            console.log(`INFO FOR ${table.name}:`, JSON.stringify(info, null, 2));
        }
    }
} catch (e) {
    console.log("ERROR:", e.message);
}

db.close();
