import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Trophy, TrendingUp, Star, X, Crown, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Stats } from '../types';
import { playSound } from '../lib/sounds';

interface Props {
    stats: Stats | null;
    onUpgrade?: () => void;
}

export default function EngagementTriggers({ stats, onUpgrade }: Props) {
    const { t } = useTranslation();
    const [showStreakWarning, setShowStreakWarning] = useState(false);
    const [showWeeklyReport, setShowWeeklyReport] = useState(false);
    const [showMilestone, setShowMilestone] = useState(false);
    const [milestoneType, setMilestoneType] = useState('');
    const [showPremiumOffer, setShowPremiumOffer] = useState(false);
    const [offerType, setOfferType] = useState<'streak' | 'ai_score' | 'generic'>('generic');

    const dismissStreak = () => {
        setShowStreakWarning(false);
        localStorage.setItem('streak_warning_dismissed', new Date().toDateString());
    };

    const dismissWeekly = () => {
        setShowWeeklyReport(false);
        localStorage.setItem('last_weekly_report', new Date().toDateString());
    };

    const dismissMilestone = () => {
        setShowMilestone(false);
        if (milestoneType === '1000_minutes') {
            localStorage.setItem('milestone_1000_reached', 'true');
        } else if (milestoneType === '5000_minutes') {
            localStorage.setItem('milestone_5000_reached', 'true');
        } else if (milestoneType === '10000_minutes') {
            localStorage.setItem('milestone_10000_reached', 'true');
        } else if (milestoneType.startsWith('streak_')) {
            localStorage.setItem(`milestone_${milestoneType}_reached`, 'true');
        }
    };

    const dismissOffer = () => {
        setShowPremiumOffer(false);
        localStorage.setItem(`last_${offerType}_offer_seen`, new Date().toDateString());
    };

    useEffect(() => {
        if (!stats) return;

        // 1. Streak Loss Warning (If streak exists but no focus today and it's evening)
        const hour = new Date().getHours();
        if (stats.streak > 0 && stats.totalFocusTime === 0 && hour > 20) {
            const dismissed = localStorage.getItem('streak_warning_dismissed');
            if (dismissed !== new Date().toDateString()) {
                setShowStreakWarning(true);
            }
        }

        // 2. Weekly Report (Every Sunday)
        const isSunday = new Date().getDay() === 0;
        if (isSunday) {
            const lastReport = localStorage.getItem('last_weekly_report');
            if (lastReport !== new Date().toDateString()) {
                setShowWeeklyReport(true);
            }
        }

        // 3. Progress Milestones (Time & Streaks)
        // 1000, 5000, 10000 Minutes
        [1000, 5000, 10000].forEach(mins => {
            const milestoneKey = `milestone_${mins}_reached`;
            if (stats.totalFocusTime >= mins && !localStorage.getItem(milestoneKey)) {
                setMilestoneType(`${mins}_minutes`);
                setShowMilestone(true);
                playSound('achievement');
            }
        });

        // Streak Badges (3, 7, 30, 100)
        [3, 7, 30, 100].forEach(days => {
            const streakMilestone = `streak_${days}`;
            const reached = localStorage.getItem(`milestone_${streakMilestone}_reached`);
            if (stats.streak >= days && !reached) {
                setMilestoneType(streakMilestone);
                setShowMilestone(true);
                playSound('achievement');

                // Smart Upgrade Trigger: 7-day streak
                if (days === 7) {
                    const lastSeen = localStorage.getItem('last_streak_offer_seen');
                    if (lastSeen !== new Date().toDateString()) {
                        setOfferType('streak');
                        setTimeout(() => setShowPremiumOffer(true), 1500);
                    }
                }
            }
        });

        // 4. AI Score Trigger (> 70%)
        if (stats.aiScore && stats.aiScore >= 70) {
            const lastSeen = localStorage.getItem('last_ai_score_offer_seen');
            if (lastSeen !== new Date().toDateString()) {
                setOfferType('ai_score');
                setTimeout(() => setShowPremiumOffer(true), 3000);
            }
        }

    }, [stats]);

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 pointer-events-none">
            <AnimatePresence>
                {/* Streak Loss Warning */}
                {showStreakWarning && (
                    <motion.div
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="pointer-events-auto glass-card p-6 rounded-[32px] w-80 bg-orange-500/10 border-orange-500/20 shadow-[0_20px_40px_rgba(249,115,22,0.15)] overflow-hidden relative group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                            <Flame size={80} fill="currentColor" className="text-orange-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mb-4 text-white">
                                <Flame size={20} fill="currentColor" />
                            </div>
                            <h4 className="text-lg font-black text-white leading-tight mb-2">{t('engagement.streak_risk_title', 'STREAK AT RISK! 🔥')}</h4>
                            <p className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">
                                {t('engagement.streak_risk_desc', "Sizning {{count}}-kunlik streakingiz xavf ostida. Fokusni boshlang!", { count: stats?.streak })}
                            </p>
                            <div className="flex gap-2">
                                <button onClick={dismissStreak} className="flex-1 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all">
                                    {t('engagement.start_now', 'HOZIR BOSHLASH')}
                                </button>
                                <button onClick={dismissStreak} className="p-2 text-white/20 hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Milestone Achievement */}
                {showMilestone && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm"
                    >
                        {/* Confetti Particles */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(30)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{
                                        x: "50%",
                                        y: "50%",
                                        scale: 0,
                                        rotate: 0
                                    }}
                                    animate={{
                                        x: `${Math.random() * 100}%`,
                                        y: `${Math.random() * 100}%`,
                                        scale: [0, 1, 0.5],
                                        rotate: 360
                                    }}
                                    transition={{
                                        duration: 2 + Math.random() * 2,
                                        repeat: Infinity,
                                        ease: "easeOut"
                                    }}
                                    className={cn(
                                        "absolute w-2 h-2 rounded-sm",
                                        ["bg-accent-purple", "bg-accent-blue", "bg-yellow-400", "bg-emerald-400"][i % 4]
                                    )}
                                />
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-12 rounded-[50px] bg-zinc-900 border border-white/20 text-center max-w-sm flex flex-col items-center gap-8 shadow-[0_0_100px_rgba(139,92,246,0.3)] relative"
                        >
                            <div className="absolute -top-12 animate-bounce">
                                <div className="w-24 h-24 bg-yellow-400 rounded-[32px] flex items-center justify-center text-black shadow-2xl rotate-12">
                                    <Trophy size={48} fill="black" />
                                </div>
                            </div>

                            <div className="space-y-4 mt-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                                    <Star size={12} fill="currentColor" /> {t('engagement.achievement_unlocked', 'Achievement Unlocked')}
                                </div>
                                <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{t('engagement.milestone_title_1', 'LEGENDARY')} <br /> {t('engagement.milestone_title_2', 'STATUS!')}</h3>
                                <p className="text-sm font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                                    {t('engagement.milestone_desc', 'Siz 1000 daqiqa chuqur fokusni yakunladingiz. Bu haqiqiy mahorat belgisidir!')}
                                </p>
                            </div>

                            <button
                                onClick={dismissMilestone}
                                className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                {t('common.continue', 'Davom Etish')}
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {/* Weekly Report Modal */}
                {showWeeklyReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl pointer-events-auto"
                    >
                        <motion.div
                            initial={{ y: 50, scale: 0.9 }}
                            animate={{ y: 0, scale: 1 }}
                            className="glass-card w-full max-w-2xl rounded-[40px] bg-zinc-950 border border-white/10 overflow-hidden"
                        >
                            <div className="p-10 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-blue/10 border border-accent-blue/20 rounded-full text-[10px] font-black text-accent-blue uppercase tracking-widest mb-2">
                                        <TrendingUp size={12} /> {t('engagement.weekly_analysis', 'Haftalik Tahlil')}
                                    </div>
                                    <h3 className="text-3xl font-black tracking-tighter">{t('engagement.weekly_report_title', 'WEEKLY BRAIN REPORT')}</h3>
                                </div>
                                <button onClick={dismissWeekly} className="p-3 text-white/20 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-10 grid grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    <div>
                                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-4">{t('engagement.total_focus_time', 'Total Focus Time')}</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-6xl font-black">{stats?.totalFocusTime}</span>
                                            <span className="text-xl font-bold text-white/20 uppercase tracking-widest">{t('onboarding.min', 'MIN')}</span>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                        <p className="text-[10px] text-accent-purple font-black uppercase tracking-widest mb-2">{t('engagement.brain_efficiency', 'Brain Efficiency')}</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black">92%</span>
                                            <span className="text-emerald-400 text-xs font-bold">{t('engagement.vs_last_week', '+4% o\'tgan haftaga nisbatan')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-col gap-4">
                                        {[
                                            { label: t('engagement.sessions_done', 'Sessions Done'), val: stats?.completedSessions, icon: Star },
                                            { label: t('engagement.tasks_finished', 'Tasks Finished'), val: stats?.completedTasks, icon: Trophy },
                                            { label: t('engagement.current_streak', 'Current Streak'), val: stats?.streak, icon: Flame },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <item.icon size={16} className="text-white/20" />
                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{item.label}</span>
                                                </div>
                                                <span className="text-lg font-black">{item.val}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-6 bg-gradient-to-br from-yellow-400/5 to-orange-500/5 rounded-3xl border border-yellow-400/10">
                                        <p className="text-sm font-black italic text-white/80 leading-snug">
                                            {t('engagement.weekly_tip', '"Sizning diqqat markazingiz o\'sib bormoqda. Kelasi hafta 5 soatlik chuqur fokusni maqsad qiling."')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-white/[0.02] border-t border-white/5">
                                <button
                                    onClick={dismissWeekly}
                                    className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-4 group"
                                >
                                    {t('engagement.close_report', 'HISOBOTNI YOPISH VA DAVOM ETTIRISH')}
                                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Smart Premium Offer Modal */}
                {showPremiumOffer && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="pointer-events-auto glass-card p-8 rounded-[40px] w-[400px] bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-yellow-400/30 overflow-hidden relative shadow-[0_30px_60px_rgba(234,179,8,0.2)]"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                            <Crown size={120} fill="currentColor" className="text-yellow-400" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center text-black shadow-lg">
                                <Crown size={32} />
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-white italic tracking-tighter leading-none mb-2">
                                    {offerType === 'streak' ? t('engagement.offer_title_streak', "Siz endi to'xtatib bo'lmas kuchsiz! 🔥") : t('engagement.offer_title_score', "A'lo Ko'rsatkich! 🧠")}
                                </h3>
                                <p className="text-sm font-medium text-white/60 leading-relaxed">
                                    {offerType === 'streak'
                                        ? t('engagement.offer_desc_streak', `7 kunlik g'ayratingiz tahsinga loyiq. Premium bilan ushbu energiyani AI tahlillar orqali 2 barobar oshiring.`)
                                        : t('engagement.offer_desc_score', `AI samaradorlik ballingiz {{score}}% ga yetdi! To'liq AI tahlili va heatmaplarni ochish vaqti keldi.`, { score: stats?.aiScore })}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => { onUpgrade?.(); dismissOffer(); }}
                                    className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-yellow-400/20 flex items-center justify-center gap-3"
                                >
                                    {t('sidebar.upgrade', "PREMIUMGA O'TISH")}
                                </button>
                                <button
                                    onClick={dismissOffer}
                                    className="w-full py-3 text-white/30 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                                >
                                    {t('engagement.maybe_later', 'Keyinroq ko\'rib chiqaman')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
