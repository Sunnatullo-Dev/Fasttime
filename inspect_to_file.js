
import Database from 'better-sqlite3';
import fs from 'fs';
const db = new Database('fasttime.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
let output = "";

for (const table of tables) {
    if (table.name === 'sprints' || table.name === 'team_sprints') {
        const info = db.prepare(`PRAGMA table_info(${table.name})`).all();
        output += `INFO FOR ${table.name}:\n${JSON.stringify(info, null, 2)}\n\n`;
    }
}

fs.writeFileSync('db_report.txt', output);
db.close();
