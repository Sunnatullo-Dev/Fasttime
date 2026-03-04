import db from '../db';
import { checkPremiumStatus } from './premium';

export const teamMiddleware = async (req: any, res: any, next: any) => {
    const userId = req.user.id;
    const teamMember: any = db.prepare(`
        SELECT tm.*, t.name as team_name 
        FROM team_members tm 
        JOIN teams t ON tm.team_id = t.id 
        WHERE tm.user_id = ?
    `).get(userId);

    if (!teamMember) {
        return res.status(404).json({ error: "Siz hech qanday jamoaga a'zo emassiz." });
    }

    req.team = {
        id: teamMember.team_id,
        name: teamMember.team_name,
        role: teamMember.role
    };
    next();
};

export const requireTeamOwner = (req: any, res: any, next: any) => {
    if (req.team.role !== 'OWNER') {
        return res.status(403).json({ error: "Ushbu amal uchun Jamoa Asoschisi bo'lishingiz kerak." });
    }
    next();
};

export const requireTeamAdmin = (req: any, res: any, next: any) => {
    if (req.team.role !== 'OWNER' && req.team.role !== 'ADMIN') {
        return res.status(403).json({ error: "Ushbu amal uchun Jamoa Admini bo'lishingiz kerak." });
    }
    next();
};

export const requireTeamPremium = (req: any, res: any, next: any) => {
    // For now, team premium is tied to the owner's premium status
    const team: any = db.prepare("SELECT owner_id FROM teams WHERE id = ?").get(req.team.id);
    if (!team) return res.status(404).json({ error: "Jamoa topilmadi." });

    const isPremium = checkPremiumStatus(team.owner_id);
    if (!isPremium) {
        return res.status(403).json({
            error: "Ushbu funksiya faqat Premium Jamoalar uchun mavjud.",
            isPremiumGated: true
        });
    }
    next();
};
