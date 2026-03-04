import Database from "better-sqlite3";

const db = new Database("fasttime.db");

try { db.exec("ALTER TABLE users ADD COLUMN full_name TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN referred_by_id INTEGER;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN referral_code TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN email TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT 0;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN premium_until DATETIME;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN avatar TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'FREE';"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN premium_expires_at DATETIME;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN plan_expires_at DATETIME;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN last_login DATETIME;"); } catch (e) { }

// Achievements Table
db.exec(`
  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, type),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Professional AI Score Columns
try { db.exec("ALTER TABLE pomodoro_sessions ADD COLUMN interruptions INTEGER DEFAULT 0;"); } catch (e) { }
try { db.exec("ALTER TABLE pomodoro_sessions ADD COLUMN pause_duration INTEGER DEFAULT 0;"); } catch (e) { }
try { db.exec("ALTER TABLE pomodoro_sessions ADD COLUMN target_duration INTEGER;"); } catch (e) { }
try { db.exec("ALTER TABLE pomodoro_sessions ADD COLUMN status TEXT DEFAULT 'completed';"); } catch (e) { }
try { db.exec("ALTER TABLE pomodoro_sessions ADD COLUMN started_at DATETIME DEFAULT CURRENT_TIMESTAMP;"); } catch (e) { }

try { db.exec("ALTER TABLE ai_productivity_scores ADD COLUMN deep_focus_minutes INTEGER;"); } catch (e) { }
try { db.exec("ALTER TABLE ai_productivity_scores ADD COLUMN completion_rate REAL;"); } catch (e) { }
try { db.exec("ALTER TABLE ai_productivity_scores ADD COLUMN consistency_factor REAL;"); } catch (e) { }
try { db.exec("ALTER TABLE ai_productivity_scores ADD COLUMN context_switch_penalty REAL;"); } catch (e) { }
try { db.exec("ALTER TABLE ai_productivity_scores ADD COLUMN break_overuse_penalty REAL;"); } catch (e) { }
try { db.exec("ALTER TABLE ai_productivity_scores ADD COLUMN fatigue_drift REAL;"); } catch (e) { }
try { db.exec("ALTER TABLE ai_productivity_scores ADD COLUMN burnout_risk REAL;"); } catch (e) { }
try { db.exec("ALTER TABLE ai_productivity_scores ADD COLUMN focus_dna_profile TEXT;"); } catch (e) { }

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    full_name TEXT,
    phone TEXT,
    referral_code TEXT UNIQUE,
    referred_by_id INTEGER,
    is_premium BOOLEAN DEFAULT 0,
    avatar TEXT,
    avatar_url TEXT,
    plan TEXT DEFAULT 'FREE',
    is_verified BOOLEAN DEFAULT 0,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    premium_expires_at DATETIME,
    premium_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );

  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER,
    referred_user_id INTEGER,
    status TEXT DEFAULT 'pending',
    rewarded BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(referrer_id) REFERENCES users(id),
    FOREIGN KEY(referred_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    duration INTEGER,
    target_duration INTEGER,
    type TEXT,
    status TEXT DEFAULT 'completed',
    interruptions INTEGER DEFAULT 0,
    pause_duration INTEGER DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ai_productivity_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    score INTEGER,
    focus_ratio REAL,
    consistency_ratio REAL,
    completion_ratio REAL,
    streak_ratio REAL,
    deep_focus_minutes INTEGER,
    completion_rate REAL,
    consistency_factor REAL,
    context_switch_penalty REAL,
    break_overuse_penalty REAL,
    fatigue_drift REAL,
    burnout_risk REAL,
    focus_dna_profile TEXT,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    is_priority BOOLEAN DEFAULT 0,
    is_completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    transaction_id TEXT UNIQUE,
    provider TEXT,
    amount REAL,
    phone_number TEXT,
    status TEXT DEFAULT 'pending',
    lifetime BOOLEAN DEFAULT 1,
    activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    plan TEXT,
    currency TEXT DEFAULT 'USD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

`);

try { db.exec("ALTER TABLE payments ADD COLUMN plan TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE payments ADD COLUMN currency TEXT DEFAULT 'USD';"); } catch (e) { }
try { db.exec("ALTER TABLE payments ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;"); } catch (e) { }

db.exec(`

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    description TEXT,
    remind_at DATETIME,
    repeat_option TEXT DEFAULT 'none',
    is_completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ai_weekly_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    week_start_date DATE,
    report_data TEXT, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_pomodoro_user_date ON pomodoro_sessions(user_id, completed_at);
  CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
  CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
  CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);

  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    owner_id INTEGER,
    join_code TEXT UNIQUE,
    join_code_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    user_id INTEGER,
    role TEXT CHECK(role IN ('OWNER', 'ADMIN', 'MEMBER')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id),
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS team_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    user_id INTEGER,
    start_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_at DATETIME,
    duration_seconds INTEGER DEFAULT 0,
    mode TEXT CHECK(mode IN ('FOCUS', 'SHORT_BREAK', 'LONG_BREAK')),
    completed BOOLEAN DEFAULT 0,
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS team_presence (
    user_id INTEGER PRIMARY KEY,
    team_id INTEGER,
    status TEXT CHECK(status IN ('FOCUS', 'BREAK', 'IDLE', 'OFFLINE')),
    current_session_start DATETIME,
    last_heartbeat_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS team_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    type TEXT,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, type),
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS team_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    title TEXT NOT NULL,
    target_minutes INTEGER NOT NULL,
    start_date DATETIME,
    end_date DATETIME,
    created_by INTEGER,
    status TEXT CHECK(status IN ('ACTIVE', 'COMPLETED')) DEFAULT 'ACTIVE',
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS team_sprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    title TEXT,
    start_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_at DATETIME,
    created_by INTEGER,
    status TEXT CHECK(status IN ('ACTIVE', 'COMPLETED')) DEFAULT 'ACTIVE',
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS team_sprint_members (
    sprint_id INTEGER,
    user_id INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(sprint_id, user_id),
    FOREIGN KEY(sprint_id) REFERENCES team_sprints(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS team_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    invited_by_user_id INTEGER,
    invitee_email TEXT,
    invitee_username TEXT,
    role TEXT CHECK(role IN ('ADMIN', 'MEMBER')) DEFAULT 'MEMBER',
    code TEXT UNIQUE,
    token TEXT UNIQUE,
    status TEXT CHECK(status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')) DEFAULT 'PENDING',
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY(invited_by_user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    token_hash TEXT UNIQUE,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Ensure team_challenges has new columns
  -- Using simple ALTER TABLE with try/catch in db.ts is standard here
  -- For cleaner code, we check if columns exist first if possible, but try/catch is faster for this env.
`);

try { db.exec("ALTER TABLE team_challenges ADD COLUMN type TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE team_challenges ADD COLUMN challenge_type TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE team_challenges ADD COLUMN target_value INTEGER;"); } catch (e) { }
try { db.exec("ALTER TABLE team_challenges ADD COLUMN duration_days INTEGER;"); } catch (e) { }
try { db.exec("ALTER TABLE team_challenges ADD COLUMN starts_at DATETIME;"); } catch (e) { }
try { db.exec("ALTER TABLE team_challenges ADD COLUMN ends_at DATETIME;"); } catch (e) { }
try { db.exec("ALTER TABLE team_challenges ADD COLUMN created_by_user_id INTEGER;"); } catch (e) { }
try { db.exec("ALTER TABLE team_challenges ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;"); } catch (e) { }

// --- BILLING / PAYMENTS UPDATES ---
try { db.exec("ALTER TABLE payments ADD COLUMN card_last4 TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE payments ADD COLUMN country TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE payments ADD COLUMN invoice_number TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE payments ADD COLUMN meta_json TEXT;"); } catch (e) { }

// Add indexes for payments
try { db.exec("CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);"); } catch (e) { }
try { db.exec("CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);"); } catch (e) { }

// Add columns to users for faster streak/level access (Wrapped in try/catch to avoid duplicates)
try { db.exec("ALTER TABLE users ADD COLUMN total_focus_minutes INTEGER DEFAULT 0;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN current_streak INTEGER DEFAULT 0;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN max_streak INTEGER DEFAULT 0;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN level TEXT DEFAULT 'Thinker';"); } catch (e) { }

// Team Invite System Columns — use PRAGMA to check existence before ALTER
const teamsColumns = db.pragma("table_info(teams)") as { name: string }[];
const teamColumnNames = teamsColumns.map(c => c.name);
if (!teamColumnNames.includes('join_code')) db.exec("ALTER TABLE teams ADD COLUMN join_code TEXT;");
if (!teamColumnNames.includes('join_code_enabled')) db.exec("ALTER TABLE teams ADD COLUMN join_code_enabled INTEGER DEFAULT 1;");

export default db;
