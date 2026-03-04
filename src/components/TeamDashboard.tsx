import React, { useState, useEffect, useCallback } from 'react';
import JoinByCode from './JoinByCode';
import { useTranslation } from 'react-i18next';
import {
    Users, TrendingUp, Flame, ShieldAlert, BarChart3,
    ChevronRight, Globe, Zap, Target, UserPlus, Trash2,
    Crown, Lock, Play, Trophy, Swords, Activity, Clock,
    Link as LinkIcon, RefreshCw, Copy, Check, Mail, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { toast } from 'sonner';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell
} from 'recharts';
import SprintCreateModal from './SprintCreateModal';
import ChallengeCreateModal from './ChallengeCreateModal';

type TeamTab = 'live' | 'analytics' | 'challenges' | 'sprints' | 'achievements' | 'management';

const safeNumber = (v: any, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;

function Countdown({ endsAt, onComplete }: { endsAt: string, onComplete?: () => void }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculate = () => {
            const diff = new Date(endsAt).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft('00:00');
                if (onComplete) onComplete();
                return;
            }
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        };

        const timer = setInterval(calculate, 1000);
        calculate();
        return () => clearInterval(timer);
    }, [endsAt, onComplete]);

    return <span>{timeLeft}</span>;
}

export default function TeamDashboard() {
    const { t } = useTranslation();
    const [activeSubTab, setActiveSubTab] = useState<TeamTab>('live');
    const [teamInfo, setTeamInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [liveMembers, setLiveMembers] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [sprint, setSprint] = useState<any>(null);
    const [achievements, setAchievements] = useState<any[]>([]);
    const [inviteInput, setInviteInput] = useState('');
    const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
    const [invites, setInvites] = useState<any[]>([]);
    const [showJoinByCode, setShowJoinByCode] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
    const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
    const [sprintLoading, setSprintLoading] = useState(false);
    const [challengeLoading, setChallengeLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const teamRes = await api.get('/teams/me');
            setTeamInfo(teamRes.data);

            if (teamRes.data.inTeam) {
                // Fetch context specific data
                const [liveRes, analyticsRes, leaderboardRes, challengesRes, sprintRes, achievementsRes, invitesRes] = await Promise.all([
                    api.get('/teams/live'),
                    api.get('/teams/overview'),
                    api.get('/teams/leaderboard'),
                    api.get(`/teams/${teamRes.data.team_id}/challenges`),
                    api.get(`/teams/${teamRes.data.team_id}/sprints/active`),
                    api.get('/teams/achievements'),
                    api.get('/teams/invites').catch(() => ({ data: [] }))
                ]);

                setLiveMembers(liveRes.data);
                setAnalytics(analyticsRes.data);
                setLeaderboard(leaderboardRes.data);
                setChallenges(challengesRes.data);
                setSprint(sprintRes.data);
                setAchievements(achievementsRes.data);
                setInvites(invitesRes.data);
            }
        } catch (error) {
            console.error('Error fetching team data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            if (teamInfo?.inTeam) {
                api.get('/teams/live').then(res => setLiveMembers(res.data));
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [fetchData, teamInfo?.inTeam]);

    const handleCreateTeam = async (name: string) => {
        try {
            await api.post('/teams', { name });
            toast.success("Jamoa muvaffaqiyatli yaratildi!");
            fetchData();
        } catch (error) {
            toast.error("Jamoa yaratishda xatolik.");
        }
    };

    const handleInvite = async () => {
        if (!inviteInput) return;
        try {
            await api.post('/teams/invites', { emailOrUsername: inviteInput, role: inviteRole });
            toast.success("Taklif muvaffaqiyatli yuborildi.");
            setInviteInput('');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Xatolik yuz berdi.");
        }
    };

    const handleRevokeInvite = async (inviteId: number) => {
        try {
            await api.delete(`/teams/invites/${inviteId}`);
            toast.success("Taklif bekor qilindi.");
            fetchData();
        } catch (error) {
            toast.error("Xatolik yuz berdi.");
        }
    };

    const handleRotateJoinCode = async () => {
        try {
            const res = await api.post('/teams/join-code/rotate');
            setTeamInfo({ ...teamInfo, join_code: res.data.joinCode });
            toast.success("Jamoa kodi yangilandi.");
        } catch (error) {
            toast.error("Xatolik yuz berdi.");
        }
    };

    const handleToggleJoinCode = async (enabled: boolean) => {
        try {
            await api.patch('/teams/join-code', { enabled });
            setTeamInfo({ ...teamInfo, join_code_enabled: enabled ? 1 : 0 });
            toast.success(enabled ? "Kod bilan qo'shilish yoqildi." : "Kod bilan qo'shilish o'chirildi.");
        } catch (error) {
            toast.error("Xatolik yuz berdi.");
        }
    };

    const handleJoinByCode = async () => {
        const code = prompt("Jamoa kodini kiriting:");
        if (!code) return;
        try {
            await api.post('/teams/join', { code });
            toast.success("Jamoaga muvaffaqiyatli qo'shildingiz!");
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Xatolik yuz berdi.");
        }
    };

    const handleRemoveMember = async (userId: number) => {
        try {
            await api.delete(`/teams/member/${userId}`);
            toast.success("A'zo o'chirildi.");
            fetchData();
        } catch (error) {
            toast.error("O'chirishda xatolik.");
        }
    };

    const handleJoinSprint = async () => {
        if (!sprint?.id || !teamInfo?.team_id) return;
        try {
            await api.post(`/teams/${teamInfo.team_id}/sprints/${sprint.id}/join`);
            toast.success("Sprintga qo'shildingiz!");
            fetchData();
        } catch (error: any) {
            const msg = error.response?.data?.error || "Sprintga qo'shilishda xatolik.";
            toast.error(msg);
        }
    };

    const handleLeaveSprint = async () => {
        if (!sprint?.id || !teamInfo?.team_id) return;
        try {
            await api.post(`/teams/${teamInfo.team_id}/sprints/${sprint.id}/leave`);
            toast.success("Sprintni tark etdingiz.");
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Xatolik.");
        }
    };

    const handleStartSprint = async (sprintId: number) => {
        if (!teamInfo?.team_id) return;
        try {
            await api.post(`/teams/${teamInfo.team_id}/sprints/${sprintId}/start`);
            toast.success("Sprint boshlandi! 🚀");
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Sprintni boshlashda xatolik.");
        }
    };

    const handleSprintSubmit = async (title: string, durationMinutes: number) => {
        setSprintLoading(true);
        try {
            console.log("CREATE_SPRINT payload:", { title, durationMinutes });
            const res = await api.post(`/teams/${teamInfo.team_id}/sprints`, { title, durationMinutes });
            console.log("status:", res.status);
            console.log("response:", res.data);

            toast.success("Sprint yaratildi ✅");
            setIsSprintModalOpen(false);
            fetchData();
        } catch (error: any) {
            const errorData = error.response?.data;
            console.error("SPRINT_CREATE_FRONTEND_ERROR:", errorData);
            toast.error(errorData?.error || errorData?.message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
        } finally {
            setSprintLoading(false);
        }
    };

    const handleChallengeSubmit = async (data: any) => {
        setChallengeLoading(true);
        try {
            const token = localStorage.getItem('token');
            console.log("CHALLENGE_SUBMIT_START", {
                teamId: teamInfo?.team_id,
                userRole: teamInfo?.role,
                hasToken: !!token,
                payload: data
            });

            if (!teamInfo?.team_id) {
                toast.error("Avval jamoani tanlang.");
                return;
            }

            const res = await api.post(`/teams/${teamInfo.team_id}/challenges`, data);

            console.log("CHALLENGE_SUBMIT_SUCCESS", {
                status: res.status,
                data: res.data
            });

            toast.success("Chaqiriq yaratildi ✅");
            setIsChallengeModalOpen(false);
            fetchData();
        } catch (error: any) {
            const errorData = error.response?.data;
            const errorStatus = error.response?.status;

            console.error("CHALLENGE_SUBMIT_FAILED", {
                status: errorStatus,
                error: errorData,
                message: error.message
            });

            toast.error(errorData?.error || errorData?.message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
        } finally {
            setChallengeLoading(false);
        }
    };

    const handleDeleteChallenge = async (id: number) => {
        if (!confirm("Haqiqatdan ham ushbu chaqiriqni o'chirmoqchimisiz?")) return;
        try {
            await api.delete(`/teams/challenges/${id}`);
            toast.success("Chaqiriq o'chirildi");
            fetchData();
        } catch (error: any) {
            toast.error("O'chirishda xatolik yuz berdi.");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-accent-purple/20 border-t-accent-purple rounded-full animate-spin" />
        </div>
    );

    if (!teamInfo?.inTeam) {
        if (showJoinByCode) return <JoinByCode onComplete={() => { setShowJoinByCode(false); fetchData(); }} />;

        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
                <div className="w-24 h-24 bg-accent-purple/10 rounded-full flex items-center justify-center mb-8">
                    <Users size={48} className="text-accent-purple" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-4 uppercase">Raqamli Kovorking</h2>
                <p className="text-white/40 max-w-md mb-12 text-sm font-medium">
                    Jamoangiz bilan birga fokuslaning, natijalarni kuzating va kollektiv samaradorlikka erishing.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <button
                        onClick={() => {
                            const name = prompt("Jamoa nomini kiriting:");
                            if (name) handleCreateTeam(name);
                        }}
                        className="flex-1 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
                    >
                        Jamoa Yaratish
                    </button>
                    <button
                        onClick={() => setShowJoinByCode(true)}
                        className="flex-1 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                        Kod orqali qo'shilish
                    </button>
                </div>
            </div>
        );
    }

    const isOwnerOrAdmin = teamInfo.role === 'OWNER' || teamInfo.role === 'ADMIN';

    return (
        <div className="space-y-8 pb-20">
            {/* Team Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{teamInfo.team_name}</h2>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-accent-purple uppercase tracking-widest bg-accent-purple/10 px-2 py-0.5 rounded-full border border-accent-purple/20">
                            {teamInfo.role}
                        </span>
                        <span className="text-white/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Users size={12} /> {safeNumber(teamInfo.member_count)} a’zolar
                        </span>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    {[
                        { id: 'live', label: 'Live', icon: Activity },
                        { id: 'analytics', label: 'Analitika', icon: BarChart3 },
                        { id: 'sprints', label: 'Sprintlar', icon: Zap },
                        { id: 'challenges', label: 'Chaqiriqlar', icon: Swords },
                        { id: 'achievements', label: 'Badjlar', icon: Trophy },
                        ...(isOwnerOrAdmin ? [{ id: 'management', label: 'Boshqaruv', icon: ShieldAlert }] : [])
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id as TeamTab)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeSubTab === tab.id
                                    ? "bg-white text-black shadow-lg"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon size={14} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <main className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {/* LIVE TAB */}
                    {activeSubTab === 'live' && (
                        <motion.div
                            key="live"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {liveMembers.map((member) => (
                                    <div key={member.user_id} className="glass-card rounded-3xl p-6 flex items-center gap-4 group transition-all hover:border-white/10">
                                        <div className="relative">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border-2",
                                                member.status === 'FOCUS' ? "border-accent-purple animate-pulse" : "border-transparent"
                                            )}>
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Users className="text-white/20" />
                                                )}
                                            </div>
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-primary-bg",
                                                member.status === 'FOCUS' ? "bg-accent-purple" :
                                                    member.status === 'BREAK' ? "bg-yellow-400" :
                                                        member.status === 'IDLE' ? "bg-white/20" : "bg-red-500/20"
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{member.username}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-0.5">
                                                {member.status === 'FOCUS' ? 'Fokuslanmoqda' :
                                                    member.status === 'BREAK' ? 'Tanaffusda' :
                                                        member.status === 'IDLE' ? 'Band' : 'Oflayn'}
                                            </p>
                                        </div>
                                        {member.status === 'FOCUS' && (
                                            <div className="flex flex-col items-end">
                                                <Flame size={16} className="text-accent-purple mb-1" />
                                                <span className="text-[8px] font-black text-accent-purple uppercase tracking-tighter">ULTRA</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {liveMembers.length === 0 && (
                                    <div className="col-span-full py-20 text-center opacity-20">
                                        <p className="text-sm font-black uppercase tracking-widest">Hozircha hech kim faol emas</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-accent-blue/5 border border-accent-blue/10 rounded-2xl">
                                <p className="text-[10px] font-medium text-accent-blue/60 italic text-center">
                                    "Xavfsizlik eslatmasi: Jamoa a'zolari faqatgina vaqt kategoriyalarini ko'ra oladilar. Shaxsiy vazifalar mazmuni hech qachon baham ko'rilmaydi."
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeSubTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Bugungi Fokus', val: `${analytics?.todayHours || 0}s`, sub: 'Jamoa jami', icon: Clock, color: 'text-accent-blue' },
                                    { label: 'Haftalik Fokus', val: `${analytics?.weekHours || 0}s`, sub: 'Oxirgi 7 kun', icon: TrendingUp, color: 'text-accent-purple' },
                                    { label: 'Hafta Qahramoni', val: analytics?.topMember || '---', sub: 'Eng ko\'p vaqt', icon: Trophy, color: 'text-yellow-400' },
                                    { label: 'Urganish', val: '92%', sub: 'Natijaviylik', icon: Target, color: 'text-emerald-400' },
                                ].map((stat, i) => (
                                    <div key={i} className="glass-card rounded-3xl p-6">
                                        <stat.icon className={cn("mb-4", stat.color)} size={20} />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{stat.label}</p>
                                        <p className="text-2xl font-black text-white">{stat.val}</p>
                                        <p className="text-[10px] font-bold text-white/10 uppercase tracking-tighter mt-1">{stat.sub}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Leaderboard */}
                                <div className="glass-card rounded-[40px] p-8">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                                        <Trophy size={20} className="text-yellow-400" />
                                        Jamoa Peshqadamlari
                                    </h3>
                                    <div className="space-y-4">
                                        {leaderboard.map((m, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10 group">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-colors",
                                                    i === 0 ? "bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]" :
                                                        i === 1 ? "bg-slate-300 text-black" :
                                                            i === 2 ? "bg-amber-600 text-white" : "bg-white/10 text-white/40"
                                                )}>
                                                    #{i + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm uppercase">{m.username}</p>
                                                    <div className="h-1 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(m.hours / Math.max(...leaderboard.map(x => x.hours))) * 100}%` }}
                                                            className="h-full bg-accent-purple"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-sm">{m.hours}s</p>
                                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">FOKUS</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Heatmap / Premium Lock */}
                                <div className="glass-card rounded-[40px] p-8 relative overflow-hidden group">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-3">
                                        <Activity size={20} className="text-accent-blue" />
                                        Fokus Faolligi
                                    </h3>
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-10">Jamoaviy issiqlik xaritasi</p>

                                    <div className="grid grid-cols-7 gap-2 opacity-50 blur-[2px]">
                                        {Array.from({ length: 49 }).map((_, i) => (
                                            <div key={i} className={cn(
                                                "aspect-square rounded-[4px]",
                                                Math.random() > 0.4 ? "bg-accent-purple/40" : "bg-white/5"
                                            )} />
                                        ))}
                                    </div>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[4px] opacity-100 transition-opacity">
                                        <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mb-4 shadow-2xl shadow-yellow-400/20">
                                            <Lock size={24} className="text-black" />
                                        </div>
                                        <p className="text-sm font-black text-white uppercase tracking-widest mb-2">Premium Analitika</p>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center px-12 leading-relaxed">
                                            Jamoaviy heatmap va AI tahlillarni ochish uchun Premium tarifga o'ting
                                        </p>
                                        <button className="mt-8 px-6 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                                            YANGILASH
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* SPRINTS TAB */}
                    {activeSubTab === 'sprints' && (
                        <motion.div
                            key="sprints"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            {sprint?.active || sprint?.status === 'DRAFT' ? (
                                <div className="glass-card rounded-[48px] p-12 border-2 border-accent-purple/20 bg-gradient-to-br from-accent-purple/5 to-transparent relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-12 opacity-5">
                                        <Zap size={200} className="text-accent-purple" />
                                    </div>
                                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12 w-full">
                                        <div className="text-center md:text-left flex-1">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-xl",
                                                sprint.status === 'ACTIVE' ? "bg-accent-purple shadow-accent-purple/20" : "bg-white/10"
                                            )}>
                                                <Zap size={12} fill="white" /> {sprint.status === 'ACTIVE' ? 'SPRINT ACTIVE' : 'SPRINT DRAFT'}
                                            </div>
                                            <h3 className="text-5xl font-black text-white tracking-tighter mb-4 uppercase">{sprint.title}</h3>
                                            <p className="text-white/40 text-sm font-medium mb-8">
                                                {sprint.status === 'ACTIVE' ? (
                                                    <>Qolgan vaqt: <span className="text-white font-bold ml-2">
                                                        {sprint.ends_at ? <Countdown endsAt={sprint.ends_at} onComplete={fetchData} /> : '--:--'}
                                                    </span></>
                                                ) : (
                                                    <>Davomiyligi: <span className="text-white font-bold ml-2">{sprint.duration_minutes} minut</span></>
                                                )}
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <div className="flex -space-x-3">
                                                    {sprint.participants?.slice(0, 5).map((m: any, idx: number) => (
                                                        <div key={idx} className="w-10 h-10 rounded-xl border-2 border-primary-bg bg-white/10 flex items-center justify-center overflow-hidden" title={m.username}>
                                                            {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : <Users size={16} />}
                                                        </div>
                                                    ))}
                                                    {safeNumber(sprint.participantsCount) > 5 && (
                                                        <div className="w-10 h-10 rounded-xl border-2 border-primary-bg bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40">
                                                            +{safeNumber(sprint.participantsCount) - 5}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                                                    {safeNumber(sprint.participantsCount) > 0 ? `${sprint.participantsCount} a’zo` : "A’zolar yo‘q"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-4">
                                            {sprint.status === 'DRAFT' ? (
                                                <button
                                                    onClick={() => handleStartSprint(sprint.id)}
                                                    className="w-56 h-56 rounded-full bg-accent-purple text-white flex flex-col items-center justify-center group relative overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-accent-purple/40"
                                                >
                                                    <Play size={48} className="mb-4 relative z-10" fill="currentColor" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] relative z-10">BOSHLASH</span>
                                                </button>
                                            ) : sprint.participants?.some((p: any) => p.username === teamInfo.username) ? (
                                                <button
                                                    onClick={handleLeaveSprint}
                                                    className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all"
                                                >
                                                    Tark etish
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleJoinSprint}
                                                    className="w-56 h-56 rounded-full border-4 border-white/5 flex flex-col items-center justify-center group relative overflow-hidden transition-all hover:scale-105 active:scale-95"
                                                >
                                                    <div className="absolute inset-0 bg-accent-purple/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                                    <Play size={48} className="text-accent-purple mb-4 relative z-10" fill="currentColor" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white relative z-10">QO'SHILISH</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="glass-card rounded-[40px] p-12 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8">
                                        <Zap size={32} className="text-white/20" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white tracking-tight mb-4 uppercase">Sprint Boshlash</h3>
                                    <p className="text-white/30 text-sm max-w-sm mb-10 leading-relaxed">
                                        Jamoaviy sprint - bu barcha a'zolar bir vaqtda qat'iy fokus rejimiga o'tadigan intensiv ish seansidir.
                                    </p>
                                    <button
                                        onClick={() => setIsSprintModalOpen(true)}
                                        className="px-12 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
                                    >
                                        SPRINTNI YOQISH
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* CHALLENGES TAB */}
                    {activeSubTab === 'challenges' && (
                        <motion.div
                            key="challenges"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {challenges.length === 0 && (
                                <div className="glass-card rounded-[40px] p-20 text-center flex flex-col items-center opacity-50">
                                    <Swords size={60} className="text-white/10 mb-6" />
                                    <p className="text-sm font-black uppercase tracking-widest text-white/20 text-center">Hozircha faol chaqiriqlar yo'q</p>
                                </div>
                            )}

                            {challenges.map((c) => {
                                const progress = Math.round((safeNumber(c.current_value || c.current_minutes) / Math.max(1, safeNumber(c.target_value || c.target_minutes))) * 100);
                                const isExpired = c.status === 'EXPIRED';
                                const isCompleted = c.status === 'COMPLETED';

                                return (
                                    <div key={c.id} className={cn(
                                        "glass-card rounded-[32px] p-8 flex flex-col gap-8 bg-gradient-to-br transition-all relative overflow-hidden group border border-white/5 hover:border-white/10",
                                        isExpired ? "opacity-40 grayscale" : "border-accent-blue/10 from-accent-blue/[0.03] to-transparent"
                                    )}>
                                        <div className="flex flex-col md:flex-row gap-8 items-start justify-between relative z-10">
                                            <div className="flex gap-6 items-start">
                                                <div className={cn(
                                                    "w-16 h-16 rounded-2xl flex items-center justify-center border shrink-0 shadow-2xl",
                                                    isExpired ? "bg-white/5 border-white/5 text-white/20" : "bg-accent-blue/10 border-accent-blue/20 text-accent-blue"
                                                )}>
                                                    <Swords size={28} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        <h4 className="text-2xl font-black text-white tracking-tight uppercase">{c.title}</h4>
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                                                            isExpired ? "bg-red-500/10 text-red-500 border border-red-500/10" :
                                                                isCompleted ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10" :
                                                                    "bg-accent-blue/20 text-accent-blue border border-accent-blue/20"
                                                        )}>
                                                            {c.status}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{c.type?.replace('_', ' ')}</span>
                                                    </div>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">
                                                        Maqsad: <span className="text-white">{safeNumber(c.target_value || c.target_minutes)} {c.type === 'FOCUS_HOURS' ? 'soat' : c.type === 'SPRINT_COUNT' ? 'sprint' : 'kun'}</span>
                                                    </p>
                                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                                        Yaratuvchi: <span className="text-white/40">{c.creator_name}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:items-end gap-2">
                                                <p className="text-4xl font-black text-white">{progress}%</p>
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">PROGRESS</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, progress)}%` }}
                                                    className={cn(
                                                        "h-full rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]",
                                                        isExpired ? "bg-white/20" : "bg-gradient-to-r from-accent-blue/50 to-accent-blue"
                                                    )}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                <p className="text-white/20">
                                                    Muddat: <span className="text-white/40">{c.duration_days ? `${c.duration_days} KUN` : '--'}</span>
                                                </p>
                                                <p className="text-white/20">
                                                    Tugaydi: <span className="text-accent-blue/60">{c.ends_at ? new Date(c.ends_at).toLocaleDateString('uz-UZ') : '--'}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {isOwnerOrAdmin && (
                                            <button
                                                onClick={() => handleDeleteChallenge(c.id)}
                                                className="absolute top-6 right-6 p-3 rounded-xl bg-red-500/5 text-red-500/30 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            {isOwnerOrAdmin && (
                                <button
                                    onClick={() => setIsChallengeModalOpen(true)}
                                    className="w-full py-12 border-2 border-dashed border-white/5 rounded-[32px] group relative overflow-hidden transition-all hover:border-accent-blue/30"
                                >
                                    <div className="absolute inset-0 bg-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10 flex flex-col items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:bg-accent-blue group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-2xl">
                                            <Swords size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black uppercase tracking-[0.4em] text-white/20 group-hover:text-white transition-colors mb-1">+ Yangi Challenge Qo'shish</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/10">Jamoa a'zolarini yangi marralar sari chorlang</p>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* ACHIEVEMENTS TAB */}
                    {activeSubTab === 'achievements' && (
                        <motion.div
                            key="achievements"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
                        >
                            {[
                                { id: 'team_start', label: 'Birinchi Jamoa', icon: Users, unlocked: true },
                                { id: 'sprint_master', label: 'Sprint Ustasi', icon: Zap, unlocked: achievements.some(a => a.type === 'sprint_master') },
                                { id: 'focus_gods', label: 'Fokus Xudolari', icon: Flame, unlocked: false },
                                { id: 'unbreakable', label: 'Sinmas Iroda', icon: ShieldAlert, unlocked: false },
                                { id: 'world_records', label: 'Rekordchilar', icon: Globe, unlocked: false },
                            ].map((badge) => (
                                <div key={badge.id} className={cn(
                                    "glass-card rounded-[32px] p-6 flex flex-col items-center justify-center text-center gap-4 transition-all",
                                    badge.unlocked ? "border-accent-purple/40 bg-accent-purple/5" : "opacity-30 grayscale"
                                )}>
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl",
                                        badge.unlocked ? "bg-accent-purple/20 text-accent-purple" : "bg-white/5 text-white"
                                    )}>
                                        <badge.icon size={32} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">{badge.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* MANAGEMENT TAB */}
                    {activeSubTab === 'management' && (
                        <motion.div
                            key="management"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Invite Member */}
                                <div className="glass-card rounded-3xl p-8 flex flex-col h-full">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                                        <UserPlus size={24} className="text-accent-purple" />
                                        A’zolar Taklif Qilish
                                    </h3>
                                    <div className="space-y-4 flex-1">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={inviteInput}
                                                onChange={(e) => setInviteInput(e.target.value)}
                                                placeholder="Email yoki username..."
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-accent-purple transition-all"
                                            />
                                        </div>
                                        {teamInfo.role === 'OWNER' && (
                                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                                                {['MEMBER', 'ADMIN'].map((r) => (
                                                    <button
                                                        key={r}
                                                        onClick={() => setInviteRole(r as any)}
                                                        className={cn(
                                                            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                                            inviteRole === r ? "bg-white text-black" : "text-white/40 hover:text-white"
                                                        )}
                                                    >
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <button
                                            onClick={handleInvite}
                                            className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5"
                                        >
                                            Taklif yuborish
                                        </button>
                                    </div>
                                </div>

                                {/* Team Code Management */}
                                <div className="glass-card rounded-3xl p-8 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                            <LinkIcon size={24} className="text-accent-blue" />
                                            Jamoa Kodi
                                        </h3>
                                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
                                            <button
                                                onClick={() => handleToggleJoinCode(!teamInfo.join_code_enabled)}
                                                className={cn(
                                                    "px-3 py-1 text-[8px] font-black uppercase tracking-tighter rounded-md transition-all",
                                                    teamInfo.join_code_enabled ? "bg-emerald-500 text-white" : "text-white/40 hover:text-white"
                                                )}
                                            >
                                                {teamInfo.join_code_enabled ? 'YOQIQLI' : 'OCHIQ'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between group relative">
                                            <div className="absolute inset-0 bg-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                            <div>
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Taklif Kodi</p>
                                                <p className="text-3xl font-black text-white tracking-[0.2em]">{teamInfo.join_code || '------'}</p>
                                            </div>
                                            <div className="flex gap-2 relative z-10">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(teamInfo.join_code);
                                                        toast.success("Nusxalandi!");
                                                    }}
                                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                                                >
                                                    <Copy size={18} className="text-white/60" />
                                                </button>
                                                {teamInfo.role === 'OWNER' && (
                                                    <button
                                                        onClick={handleRotateJoinCode}
                                                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                                                    >
                                                        <RefreshCw size={18} className="text-white/60" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/join/${teamInfo.join_code}`; // We'll use code as token for simplicity in link if no token
                                                navigator.clipboard.writeText(url);
                                                toast.success("Havola nusxalandi!");
                                            }}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            <LinkIcon size={14} /> Linkni Nusxalash
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Member List */}
                                <div className="glass-card rounded-3xl overflow-hidden">
                                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                            <Users size={24} className="text-white/40" />
                                            Jamoa A'zolari
                                        </h3>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{liveMembers.length} jami</p>
                                    </div>
                                    <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                                        {liveMembers.map((m) => (
                                            <div key={m.user_id} className="p-5 flex items-center justify-between group hover:bg-white/5 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden border border-white/5">
                                                        {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : <Users size={20} className="text-white/20" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-white text-sm">{m.username}</p>
                                                            {m.role === 'OWNER' && <Crown size={12} className="text-yellow-400" />}
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">{m.role}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {m.role !== 'OWNER' && isOwnerOrAdmin && (
                                                        <button
                                                            onClick={() => handleRemoveMember(m.user_id)}
                                                            className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Pending Invites */}
                                <div className="glass-card rounded-3xl overflow-hidden">
                                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                            <Mail size={24} className="text-white/40" />
                                            Kutilayotgan Takliflar
                                        </h3>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{invites.length} kutilmoqda</p>
                                    </div>
                                    <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                                        {invites.map((invite) => (
                                            <div key={invite.id} className="p-5 flex items-center justify-between group hover:bg-white/5 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-accent-purple/10 rounded-xl flex items-center justify-center border border-accent-purple/20">
                                                        <UserCheck size={18} className="text-accent-purple" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{invite.invitee_email || invite.invitee_username}</p>
                                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                                                            <span>{invite.role}</span>
                                                            <span className="w-1 h-1 rounded-full bg-white/10" />
                                                            <span className="text-accent-purple/60">Yubordi: {invite.inviter_name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRevokeInvite(invite.id)}
                                                    className="p-2.5 bg-white/5 text-white/40 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all font-black text-[8px] uppercase tracking-widest px-4 border border-white/5"
                                                >
                                                    Bekor qilish
                                                </button>
                                            </div>
                                        ))}
                                        {invites.length === 0 && (
                                            <div className="py-12 text-center opacity-20">
                                                <p className="text-[10px] font-black uppercase tracking-widest">Kutilayotgan takliflar yo'q</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <SprintCreateModal
                isOpen={isSprintModalOpen}
                onClose={() => setIsSprintModalOpen(false)}
                onSubmit={handleSprintSubmit}
                loading={sprintLoading}
            />

            <ChallengeCreateModal
                isOpen={isChallengeModalOpen}
                onClose={() => setIsChallengeModalOpen(false)}
                onCreated={handleChallengeSubmit}
                loading={challengeLoading}
            />
        </div>
    );
}
