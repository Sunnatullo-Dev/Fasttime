import express from 'express';
import { teamController } from '../controllers/teamController';
import { authenticateToken } from '../middleware/auth';
import { teamMiddleware, requireTeamOwner, requireTeamAdmin, requireTeamPremium } from '../middleware/team';

const router = express.Router();

// Public Team Routes (for members/admins/owners)
router.use(authenticateToken);

// My Team & Creation
router.get('/me', teamController.getMyTeam);
router.post('/', teamController.createTeam);

// Global Join Routes (Don't require being in a team yet)
router.post('/join', teamController.joinByCode);
router.post('/invites/accept', teamController.acceptInvite);
router.get('/invites/:token', teamController.getInviteDetails);

// Sub-routes that require a team
router.use(teamMiddleware);

// Members & Invites
router.get('/invites', requireTeamAdmin, teamController.listInvites);
router.post('/invites', requireTeamAdmin, teamController.inviteMember);
router.delete('/invites/:id', requireTeamAdmin, teamController.revokeInvite);
router.delete('/member/:userId', requireTeamAdmin, teamController.removeMember);

// Join Code Management
router.post('/join-code/rotate', requireTeamOwner, teamController.rotateJoinCode);
router.patch('/join-code', requireTeamOwner, teamController.toggleJoinCode);

// Live Status
router.post('/heartbeat', teamController.heartbeat);
router.get('/live', teamController.getLiveStatus);

// Analytics
router.get('/overview', teamController.getOverview);
router.get('/leaderboard', teamController.getLeaderboard);

// Premium Analytics
router.get('/heatmap', requireTeamPremium, teamController.getHeatmap);
router.get('/insights', requireTeamPremium, teamController.getInsights);
router.get('/distract-time', requireTeamPremium, teamController.getDistractTime);

// Sprints
router.post('/:teamId/sprints', requireTeamAdmin, teamController.createSprint);
router.post('/:teamId/sprints/:sprintId/start', requireTeamAdmin, teamController.startSprint);
router.post('/:teamId/sprints/:sprintId/join', teamController.joinSprint);
router.post('/:teamId/sprints/:sprintId/leave', teamController.leaveSprint);
router.get('/:teamId/sprints/active', teamController.getActiveSprint);

// Challenges
router.get('/:teamId/challenges', teamController.getChallenges);
router.post('/:teamId/challenges', requireTeamAdmin, teamController.createChallenge);
router.patch('/challenges/:id/complete', requireTeamAdmin, teamController.completeChallenge);
router.delete('/challenges/:id', requireTeamAdmin, teamController.deleteChallenge);

// Achievements
router.get('/achievements', teamController.getAchievements);

export default router;
