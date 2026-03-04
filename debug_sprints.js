
import Database from 'better-sqlite3';
const db = new Database('fasttime.db');

try {
    const info = db.prepare(`PRAGMA table_info(sprints)`).all();
    console.log(`INFO FOR sprints:`, JSON.stringify(info, null, 2));

    // Also check team_sprints just in case
    const info2 = db.prepare(`PRAGMA table_info(team_sprints)`).all();
    console.log(`INFO FOR team_sprints:`, JSON.stringify(info2, null, 2));
} catch (e) {
    console.log(`Error:`, e.message);
}

db.close();
