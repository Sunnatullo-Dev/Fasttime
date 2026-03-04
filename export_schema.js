import Database from 'better-sqlite3';
import fs from 'fs';
const db = new Database('fasttime.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
let output = '';
tables.forEach(t => {
    output += `Table: ${t.name}\n`;
    const columns = db.pragma(`table_info(${t.name})`);
    columns.forEach(c => {
        output += `  - ${c.name} (${c.type})\n`;
    });
});
fs.writeFileSync('db_schema.txt', output);
console.log('Schema written to db_schema.txt');
