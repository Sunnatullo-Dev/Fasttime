import Database from 'better-sqlite3';
const db = new Database('fasttime.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => {
    console.log(`Table: ${t.name}`);
    const columns = db.pragma(`table_info(${t.name})`);
    columns.forEach(c => console.log(`  - ${c.name}`));
});
