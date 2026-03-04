import Database from "better-sqlite3";
const db = new Database("fasttime.db");

const columns = [
    "ALTER TABLE users ADD COLUMN email TEXT",
    "ALTER TABLE users ADD COLUMN full_name TEXT",
    "ALTER TABLE users ADD COLUMN phone TEXT",
    "ALTER TABLE users ADD COLUMN referral_code TEXT",
    "ALTER TABLE users ADD COLUMN referred_by_id INTEGER",
    "ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT 0",
    "ALTER TABLE users ADD COLUMN premium_until DATETIME"
];

for (const col of columns) {
    try {
        db.exec(col);
        console.log("Success:", col);
    } catch (e) {
        console.log("Already exists or error:", col, e.message);
    }
}

const finalCols = db.prepare("PRAGMA table_info(users)").all();
console.log("FINAL COLUMNS:", finalCols.map(c => c.name).join(", "));
db.close();
