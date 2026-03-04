import db from '../db';
import crypto from 'crypto';

const generateCode = (length = 7) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, I, 0, 1 for clarity
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const teamController = {
    // CRUD Operations
    async createTeam(req: any, res: any) {
        const { name } = req.body;
        const userId = req.user.id;

        try {
            const joinCode = generateCode();
            const teamResult: any = db.prepare("INSERT INTO teams (name, owner_id, join_code) VALUES (?, ?, ?)").run(name, userId, joinCode);
            const teamId = teamResult.lastInsertRowid;

            db.prepare("INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)").run(teamId, userId, 'OWNER');

            res.json({ success: true, teamId, joinCode });
        } catch (error) {
            res.status(500).json({ error: "Jamoa yaratishda xatolik." });
        }
    },

    async getMyTeam(req: any, res: any) {
        const userId = req.user.id;
        const member: any = db.prepare(`
            SELECT tm.*, t.name as team_name, u.username as owner_name,
            (SELECT COUNT(*) FROM team_members WHERE team_id = tm.team_id) as member_count
            FROM team_members tm 
            JOIN teams t ON tm.team_id = t.id 
            JOIN users u ON t.owner_id = u.id
            WHERE tm.user_id = ?
        `).get(userId);

        if (!member) {
            return res.json({ inTeam: false });
        }

        const teamDetails: any = db.prepare("SELECT join_code, join_code_enabled FROM teams WHERE id = ?").get(member.team_id);

        res.json({ inTeam: true, ...member, ...teamDetails });
    },

    async inviteMember(req: any, res: any) {
        const { emailOrUsername, role = 'MEMBER' } = req.body;
        const teamId = req.team.id;
        const invitedById = req.user.id;

        // Check if user exists
        const invitedUser: any = db.prepare("SELECT id, email, username FROM users WHERE email = ? OR username = ?").get(emailOrUsername, emailOrUsername);

        if (!invitedUser) {
            return res.status(404).json({ error: "Foydalanuvchi topilmadi." });
        }

        // Check if already in team
        const existingMember = db.prepare("SELECT id FROM team_members WHERE team_id = ? AND user_id = ?").get(teamId, invitedUser.id);
        if (existingMember) {
            return res.status(400).json({ error: "Foydalanuvchi allaqachon jamoada." });
        }

        try {
            const code = generateCode(8);
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            db.prepare(`
                INSERT INTO team_invites (team_id, invited_by_user_id, invitee_email, invitee_username, role, code, token, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(teamId, invitedById, invitedUser.email, invitedUser.username, role, code, token, expiresAt.toISOString());

            res.json({
                success: true,
                message: "Taklif muvaffaqiyatli yuborildi.",
                invite: { code, token }
            });
        } catch (error) {
            res.status(500).json({ error: "Taklif yuborishda xatolik." });
        }
    },

    async getInviteDetails(req: any, res: any) {
        const { token } = req.params;
        const invite: any = db.prepare(`
            SELECT t.name as team_name, ti.role
            FROM team_invites ti
            JOIN teams t ON ti.team_id = t.id
            WHERE ti.token = ? AND ti.status = 'PENDING' AND ti.expires_at > datetime('now')
        `).get(token);

        if (!invite) {
            return res.status(404).json({ error: "Taklif muddati tugagan yoki noto'g'ri." });
        }

        res.json(invite);
    },

    async listInvites(req: any, res: any) {
        const teamId = req.team.id;
        const invites = db.prepare(`
            SELECT ti.*, u.username as inviter_name
            FROM team_invites ti
            JOIN users u ON ti.invited_by_user_id = u.id
            WHERE ti.team_id = ? AND ti.status = 'PENDING' AND ti.expires_at > datetime('now')
            ORDER BY ti.created_at DESC
        `).all(teamId);
        res.json(invites);
    },

    async revokeInvite(req: any, res: any) {
        const { id } = req.params;
        const teamId = req.team.id;

        db.prepare("UPDATE team_invites SET status = 'REVOKED' WHERE id = ? AND team_id = ?").run(id, teamId);
        res.json({ success: true });
    },

    async acceptInvite(req: any, res: any) {
        const { token } = req.body;
        const userId = req.user.id;

        const invite: any = db.prepare(`
            SELECT * FROM team_invites 
            WHERE token = ? AND status = 'PENDING' AND expires_at > datetime('now')
        `).get(token);

        if (!invite) {
            return res.status(400).json({ error: "Taklif muddati tugagan yoki noto'g'ri." });
        }

        const userAccount: any = db.prepare("SELECT email, username FROM users WHERE id = ?").get(userId);
        if (invite.invitee_email && invite.invitee_email !== userAccount.email && invite.invitee_username !== userAccount.username) {
            return res.status(403).json({ error: "Ushbu taklif boshqa foydalanuvchi uchun." });
        }

        try {
            db.prepare("INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)").run(invite.team_id, userId, invite.role);
            db.prepare("UPDATE team_invites SET status = 'ACCEPTED' WHERE id = ?").run(invite.id);
            res.json({ success: true, teamId: invite.team_id });
        } catch (e: any) {
            if (e.code === 'SQLITE_CONSTRAINT') {
                return res.status(400).json({ error: "Siz allaqachon ushbu jamoa a'zosisiz." });
            }
            res.status(500).json({ error: "Jamoaga qo'shilishda xatolik." });
        }
    },

    async joinByCode(req: any, res: any) {
        const { code } = req.body;
        const userId = req.user.id;

        // Try team join_code first
        let team: any = db.prepare("SELECT id, join_code_enabled FROM teams WHERE join_code = ?").get(code);
        let role = 'MEMBER';

        if (team) {
            if (!team.join_code_enabled) {
                return res.status(400).json({ error: "Ushbu jamoaga kod orqali qo'shilish yopilgan." });
            }
        } else {
            // Try individual invite code
            const invite: any = db.prepare("SELECT team_id, role FROM team_invites WHERE code = ? AND status = 'PENDING' AND expires_at > datetime('now')").get(code);
            if (!invite) {
                return res.status(404).json({ error: "Noto'g'ri yoki muddati o'tgan kod." });
            }
            team = { id: invite.team_id };
            role = invite.role;
            db.prepare("UPDATE team_invites SET status = 'ACCEPTED' WHERE code = ?").run(code);
        }

        try {
            db.prepare("INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)").run(team.id, userId, role);
            res.json({ success: true, teamId: team.id });
        } catch (e: any) {
            if (e.code === 'SQLITE_CONSTRAINT') {
                return res.status(400).json({ error: "Siz allaqachon ushbu jamoa a'zosisiz." });
            }
            res.status(500).json({ error: "Jamoaga qo'shilishda xatolik." });
        }
    },

    async rotateJoinCode(req: any, res: any) {
        const teamId = req.team.id;
        const newCode = generateCode();

        db.prepare("UPDATE teams SET join_code = ? WHERE id = ?").run(newCode, teamId);
        res.json({ success: true, joinCode: newCode });
    },

    async toggleJoinCode(req: any, res: any) {
        const { enabled } = req.body;
        const teamId = req.team.id;

        db.prepare("UPDATE teams SET join_code_enabled = ? WHERE id = ?").run(enabled ? 1 : 0, teamId);
        res.json({ success: true });
    },


    async removeMember(req: any, res: any) {
        const { userId } = req.params;
        const teamId = req.team.id;

        const member: any = db.prepare("SELECT role FROM team_members WHERE team_id = ? AND user_id = ?").get(teamId, userId);
        if (member?.role === 'OWNER') {
            return res.status(400).json({ error: "Jamoa asoschisini o'chirib bo'lmaydi." });
        }

        db.prepare("DELETE FROM team_members WHERE team_id = ? AND user_id = ?").run(teamId, userId);
        res.json({ success: true });
    },

    // LIVE STATUS
    async heartbeat(req: any, res: any) {
        const { status, currentSessionStart } = req.body;
        const userId = req.user.id;
        const teamId = req.team.id;

        db.prepare(`
            INSERT INTO team_presence (user_id, team_id, status, current_session_start, last_heartbeat_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
            status = excluded.status,
            current_session_start = excluded.current_session_start,
            last_heartbeat_at = CURRENT_TIMESTAMP
        `).run(userId, teamId, status, currentSessionStart);

        res.json({ success: true });
    },

    async getLiveStatus(req: any, res: any) {
        const teamId = req.team.id;

        // Clean up offline members (last heartbeat > 30s ago)
        db.prepare("UPDATE team_presence SET status = 'OFFLINE' WHERE last_heartbeat_at < datetime('now', '-30 seconds') AND team_id = ?").run(teamId);

        const presence = db.prepare(`
            SELECT tp.*, u.username, u.avatar 
            FROM team_presence tp
            JOIN users u ON tp.user_id = u.id
            WHERE tp.team_id = ?
            ORDER BY tp.status = 'FOCUS' DESC, tp.last_heartbeat_at DESC
        `).all(teamId);

        res.json(presence);
    },

    // ANALYTICS
    async getOverview(req: any, res: any) {
        const teamId = req.team.id;

        const todayStats: any = db.prepare(`
            SELECT SUM(duration_seconds) as total_seconds 
            FROM team_sessions 
            WHERE team_id = ? AND date(start_at) = date('now') AND completed = 1
        `).get(teamId);

        const weekStats: any = db.prepare(`
            SELECT SUM(duration_seconds) as total_seconds 
            FROM team_sessions 
            WHERE team_id = ? AND start_at >= datetime('now', '-7 days') AND completed = 1
        `).get(teamId);

        const topMember: any = db.prepare(`
            SELECT u.username, SUM(ts.duration_seconds) as total_seconds
            FROM team_sessions ts
            JOIN users u ON ts.user_id = u.id
            WHERE ts.team_id = ? AND ts.completed = 1
            GROUP BY ts.user_id
            ORDER BY total_seconds DESC
            LIMIT 1
        `).get(teamId);

        res.json({
            todayHours: Math.round((todayStats?.total_seconds || 0) / 3600 * 10) / 10,
            weekHours: Math.round((weekStats?.total_seconds || 0) / 3600 * 10) / 10,
            topMember: topMember?.username || 'Yo\'q',
            longestStreak: 0 // Placeholder for now
        });
    },

    async getLeaderboard(req: any, res: any) {
        const teamId = req.team.id;
        const leaderboard = db.prepare(`
            SELECT u.username, SUM(ts.duration_seconds) as total_seconds
            FROM team_sessions ts
            JOIN users u ON ts.user_id = u.id
            WHERE ts.team_id = ? AND ts.completed = 1
            GROUP BY ts.user_id
            ORDER BY total_seconds DESC
        `).all(teamId);

        res.json(leaderboard.map((item: any) => ({
            ...item,
            hours: Math.round(item.total_seconds / 3600 * 10) / 10
        })));
    },

    // SPRINT
    async createSprint(req: any, res: any) {
        const { teamId } = req.params;
        const { title, durationMinutes } = req.body;
        const userId = req.user.id;

        if (!title || title.length < 3) {
            return res.status(400).json({ error: "Sprint mavzusi noto‘g‘ri (kamida 3 ta belgi)." });
        }

        // Check for already active sprint in this team
        const activeSprint = db.prepare("SELECT id FROM sprints WHERE team_id = ? AND status = 'ACTIVE' AND ends_at > datetime('now')").get(teamId);
        if (activeSprint) {
            return res.status(409).json({ error: "Jamoada allaqachon faol sprint mavjud." });
        }

        const startsAt = new Date();
        const endsAt = new Date(startsAt.getTime() + (durationMinutes || 45) * 60000);

        try {
            const result: any = db.prepare(`
                INSERT INTO sprints (team_id, title, duration_minutes, created_by, status, starts_at, ends_at, created_at)
                VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, datetime('now'))
            `).run(
                teamId,
                title,
                durationMinutes || 45,
                userId,
                startsAt.toISOString(),
                endsAt.toISOString()
            );

            const sprintId = result.lastInsertRowid;

            // Auto join creator
            db.prepare("INSERT OR IGNORE INTO sprint_participants (sprint_id, user_id) VALUES (?, ?)").run(sprintId, userId);

            res.json({
                success: true,
                id: sprintId,
                teamId,
                title,
                durationMinutes: durationMinutes || 45,
                message: "Sprint yaratildi ✅"
            });
        } catch (error: any) {
            console.error("SPRINT_CREATE_ERROR:", error);
            res.status(500).json({ error: error.message || "Serverda xatolik yuz berdi" });
        }
    },

    async startSprint(req: any, res: any) {
        const { sprintId } = req.params;
        const sprint: any = db.prepare("SELECT * FROM sprints WHERE id = ?").get(sprintId);

        if (!sprint) {
            return res.status(404).json({ error: "Sprint topilmadi." });
        }

        // Check for already active sprint in this team
        const activeSprint = db.prepare("SELECT id FROM sprints WHERE team_id = ? AND status = 'ACTIVE' AND ends_at > datetime('now')").get(sprint.team_id);
        if (activeSprint) {
            return res.status(409).json({ error: "Sprint allaqachon active." });
        }

        const startsAt = new Date();
        const endsAt = new Date(startsAt.getTime() + sprint.duration_minutes * 60000);

        try {
            db.prepare(`
                UPDATE sprints 
                SET starts_at = ?, ends_at = ?, status = 'ACTIVE'
                WHERE id = ?
            `).run(startsAt.toISOString(), endsAt.toISOString(), sprintId);

            // Auto join creator
            db.prepare("INSERT OR IGNORE INTO sprint_participants (sprint_id, user_id) VALUES (?, ?)").run(sprintId, sprint.created_by);

            res.json({ success: true, endsAt: endsAt.toISOString() });
        } catch (error) {
            console.error("Sprint start error:", error);
            res.status(500).json({ error: "Serverda xatolik. Keyinroq urinib ko‘ring." });
        }
    },

    async joinSprint(req: any, res: any) {
        const { sprintId } = req.params;
        const userId = req.user.id;

        const sprint: any = db.prepare("SELECT status, ends_at FROM sprints WHERE id = ?").get(sprintId);
        if (!sprint) {
            return res.status(404).json({ error: "Sprint topilmadi." });
        }

        if (sprint.status !== 'ACTIVE' || new Date(sprint.ends_at) < new Date()) {
            return res.status(400).json({ error: "Faol sprint topilmadi." });
        }

        try {
            db.prepare("INSERT OR IGNORE INTO sprint_participants (sprint_id, user_id) VALUES (?, ?)").run(sprintId, userId);
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: "Serverda xatolik. Keyinroq urinib ko‘ring." });
        }
    },

    async leaveSprint(req: any, res: any) {
        const { sprintId } = req.params;
        const userId = req.user.id;

        try {
            db.prepare("DELETE FROM sprint_participants WHERE sprint_id = ? AND user_id = ?").run(sprintId, userId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Serverda xatolik. Keyinroq urinib ko‘ring." });
        }
    },

    async getActiveSprint(req: any, res: any) {
        const { teamId } = req.params;

        try {
            // Auto-finish sprints that have passed their ends_at
            db.prepare("UPDATE sprints SET status = 'FINISHED' WHERE team_id = ? AND status = 'ACTIVE' AND ends_at < datetime('now')").run(teamId);

            const sprint: any = db.prepare(`
                SELECT s.*, u.username as creator_name
                FROM sprints s
                JOIN users u ON s.created_by = u.id
                WHERE s.team_id = ? AND s.status IN ('ACTIVE', 'DRAFT')
                ORDER BY s.status = 'ACTIVE' DESC, s.created_at DESC LIMIT 1
            `).get(teamId);

            if (!sprint) {
                return res.json({ active: false });
            }

            const participants = db.prepare(`
                SELECT u.username, u.avatar
                FROM sprint_participants sp
                JOIN users u ON sp.user_id = u.id
                WHERE sp.sprint_id = ? AND sp.left_at IS NULL
            `).all(sprint.id);

            res.json({
                active: true,
                ...sprint,
                participants,
                participantsCount: participants.length
            });
        } catch (error) {
            console.error("Sprint status error:", error);
            res.status(500).json({ error: "Serverda xatolik. Keyinroq urinib ko‘ring." });
        }
    },
    async getChallenges(req: any, res: any) {
        const teamId = req.params.teamId || req.team?.id;
        try {
            // Auto-expire challenges
            db.prepare("UPDATE team_challenges SET status = 'EXPIRED' WHERE team_id = ? AND status = 'ACTIVE' AND ends_at < datetime('now')").run(teamId);

            const challenges = db.prepare(`
                SELECT tc.*, tc.challenge_type as type, u.username as creator_name
                FROM team_challenges tc
                JOIN users u ON COALESCE(tc.created_by_user_id, tc.created_by) = u.id
                WHERE tc.team_id = ?
                ORDER BY tc.status = 'ACTIVE' DESC, tc.id DESC
            `).all(teamId);

            res.json(challenges);
        } catch (error) {
            console.error("GET_CHALLENGES_ERROR:", error);
            res.status(500).json({ error: "Serverda xatolik yuz berdi." });
        }
    },

    async createChallenge(req: any, res: any) {
        const teamId = req.params.teamId || req.team?.id;
        const userId = req.user?.id;
        const authHeader = req.headers.authorization;

        console.log("CHALLENGE_CREATE_START", {
            teamId,
            userId,
            hasAuth: !!authHeader
        });

        // Normalize payload
        const body = req.body;
        const title = body.title;
        const type = body.type || body.challenge_type || 'FOCUS_HOURS';
        const target_value = parseInt(body.targetValue || body.target_value || body.target_minutes || 0);
        const duration_days = parseInt(body.durationDays || body.duration_days || 7);
        const starts_at = body.startsAt || body.starts_at || new Date().toISOString();

        console.log("PARSED_CHALLENGE_BODY:", { title, type, target_value, duration_days, starts_at });

        // Validation
        if (!title || title.length < 3 || title.length > 60) {
            console.error("VALIDATION_FAILED: title");
            return res.status(400).json({ error: "Chaqiriq nomi noto‘g‘ri (3-60 ta belgi)." });
        }
        if (!["FOCUS_HOURS", "SPRINT_COUNT", "STREAK_DAYS"].includes(type)) {
            console.error("VALIDATION_FAILED: type", type);
            return res.status(400).json({ error: "Chaqiriq turi noto‘g‘ri." });
        }
        if (target_value < 1 || target_value > 100000) { // Extended max for focus hours
            console.error("VALIDATION_FAILED: target_value", target_value);
            return res.status(400).json({ error: "Maqsad qiymati noto‘g‘ri." });
        }

        const start = new Date(starts_at);
        const end = new Date(start.getTime() + duration_days * 86400000);

        try {
            const result = db.prepare(`
                INSERT INTO team_challenges (
                    team_id, title, type, target_value, 
                    duration_days, starts_at, ends_at, created_by_user_id, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
            `).run(
                teamId,
                title,
                type,
                target_value,
                duration_days,
                start.toISOString(),
                end.toISOString(),
                userId
            );

            console.log("CHALLENGE_CREATE_SUCCESS", { id: result.lastInsertRowid });
            res.json({ success: true, message: "Chaqiriq yaratildi ✅", id: result.lastInsertRowid });
        } catch (error: any) {
            console.error("CREATE_CHALLENGE_DB_ERROR:", error);
            res.status(500).json({ error: "Serverda xatolik. Keyinroq urinib ko‘ring." });
        }
    },

    async completeChallenge(req: any, res: any) {
        const { id } = req.params;
        const teamId = req.team.id;

        try {
            db.prepare("UPDATE team_challenges SET status = 'COMPLETED' WHERE id = ? AND team_id = ?").run(id, teamId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Serverda xatolik yuz berdi" });
        }
    },

    async deleteChallenge(req: any, res: any) {
        const { id } = req.params;
        const teamId = req.team.id;

        try {
            db.prepare("DELETE FROM team_challenges WHERE id = ? AND team_id = ?").run(id, teamId);
            res.json({ success: true, message: "Chaqiriq o'chirildi" });
        } catch (error) {
            res.status(500).json({ error: "Serverda xatolik yuz berdi" });
        }
    },

    async getAchievements(req: any, res: any) {
        const teamId = req.team.id;
        const achievements = db.prepare("SELECT * FROM team_achievements WHERE team_id = ?").all(teamId);
        res.json(achievements);
    },

    // PREMIUM ANALYTICS
    async getHeatmap(req: any, res: any) {
        const teamId = req.team.id;
        // Simple heatmap: count of sessions per date
        const heatmap = db.prepare(`
            SELECT date(start_at) as date, COUNT(*) as count
            FROM team_sessions
            WHERE team_id = ? AND completed = 1
            GROUP BY date(start_at)
            LIMIT 90
        `).all(teamId);

        res.json(heatmap);
    },

    async getInsights(req: any, res: any) {
        const teamId = req.team.id;
        // Placeholder for performance summary
        res.json({
            summary: "Jamoangizning bu haftadagi samaradorligi yuqori darajada. Erta tongda fokus darajasi maksimal.",
            trend: "up"
        });
    },

    async getDistractTime(req: any, res: any) {
        // Placeholder for future desktop integration
        res.json({
            status: "Coming Soon",
            info: "Desktop ilovasi bilan jamoaviy chalg'ish vaqtlari bu yerda chiqadi."
        });
    }
};

