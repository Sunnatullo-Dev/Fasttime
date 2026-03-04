
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created directory:', uploadDir);
} else {
    console.log('Directory exists:', uploadDir);
}

const db = new Database('fasttime.db');

// Check and add columns if missing
try {
    const columns = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
    if (!columns.includes('avatar_url')) {
        db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT;');
        console.log('Added avatar_url column');
    } else {
        console.log('avatar_url column exists');
    }

    if (!columns.includes('avatar')) {
        db.exec('ALTER TABLE users ADD COLUMN avatar TEXT;');
        console.log('Added avatar column');
    }
} catch (e) {
    console.error('DB Error:', e.message);
}

console.log('Environment check complete.');
process.exit(0);
