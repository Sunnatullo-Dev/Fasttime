import Database from "better-sqlite3";
const db = new Database("fasttime.db");
const columns = db.prepare("PRAGMA table_info(users)").all();
console.log(JSON.stringify(columns.map(c => c.name)));
db.close();
