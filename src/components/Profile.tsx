import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Zap, Brain, TrendingUp, AlertCircle, CheckCircle2, Loader2, Users, Share2, Copy, Settings, Trophy, Timer } from 'lucide-react';
import api from '../lib/api';
import { User as UserType, AIAnalysis } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import PremiumLock from './PremiumLock';
import SettingsPanel from './SettingsPanel';
import { toast } from 'sonner';
import PremiumAvatar from './PremiumAvatar';
import VerifiedBadge from './VerifiedBadge';
import { Achievement } from '../types';

export default function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState<UserType | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [referralStats, setReferralStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [submittingReferral, setSubmittingReferral] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openPricingModal = () => {
    window.dispatchEvent(new CustomEvent('open-pricing-modal'));
  };


  const handleSubmitReferral = async () => {
    if (!referralInput) return;
    setSubmittingReferral(true);
    try {
      await api.post('/launch/referrals/submit', { code: referralInput });
      await fetchReferrals();
      setReferralInput('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Referral kodida xatolik');
    } finally {
      setSubmittingReferral(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchReferrals();
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await api.get('/auth/achievements');
      setAchievements(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Achievements error:', err);
    }
  };

  const fetchReferrals = async () => {
    try {
      const response = await api.get('/launch/referrals');
      setReferralStats(response.data);
    } catch (err) {
      console.error('Referral stats error:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
    } catch (err) {
      console.error('Profilni yuklashda xatolik:', err);
    }
  };

  const handleUpgrade = () => {
    openPricingModal();
  };


  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const response = await api.post('/ai/analyze');
      setAnalysis(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'AI tahlilida xatolik');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* User Info Card */}
      <div className="glass-card rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-10">
        <div className="relative">
          <PremiumAvatar user={user} size="xl" />
          {user.is_premium && (
            <div className="absolute -top-2 -right-2 bg-yellow-400 text-black p-2 rounded-full shadow-lg z-20">
              <Crown size={20} />
            </div>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
            <h2 className="text-4xl font-bold text-white tracking-tight flex items-center gap-2">
              {user.username}
              {user.is_verified && <VerifiedBadge size={18} />}
            </h2>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <span className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border",
              user.is_premium ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400" : "bg-white/5 border-white/10 text-white/40"
            )}>
              {user.is_premium ? t('profile.premium_user', 'Premium Foydalanuvchi') : t('profile.free_user', 'Bepul Foydalanuvchi')}
            </span>
            {user.premium_until && (
              <span className="text-white/20 text-xs font-bold uppercase tracking-widest self-center">
                {t('profile.expires_at', `Muddati: ${new Date(user.premium_until).toLocaleDateString()} gacha`, { date: new Date(user.premium_until).toLocaleDateString() })}
              </span>
            )}
          </div>
        </div>
        {!user.is_premium && (
          <button
            onClick={openPricingModal}
            className="group relative bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-yellow-400/20 flex items-center gap-3 hover:scale-105 active:scale-95"
          >
            <Crown size={18} fill="black" />
            Tariflar
            <div className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </div>
          </button>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              const link = `${window.location.origin}/u/${user.username}`;
              navigator.clipboard.writeText(link);
              toast.success('Profil havolasi nusxalandi');
            }}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
          >
            <Copy size={18} className="text-white/40 group-hover:text-accent-blue" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white">🔗 HAVOLA</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
          >
            <Settings size={18} className="text-white/40 group-hover:text-accent-purple" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white">🛠 TAHRIRLASH</span>
          </button>

          {user.is_premium && (
            <button
              onClick={openPricingModal}
              className="px-6 py-3 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/20 rounded-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
            >
              <Crown size={18} className="text-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">TARIFLAR</span>
            </button>
          )}
        </div>
      </div>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onUpdate={fetchProfile}
      />





      <div className="glass-card rounded-[40px] p-10 border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
          <Users size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tighter mb-2 uppercase">{t('profile.reward_program', 'REWARD PROGRAM')}</h3>
              <p className="text-white/40 text-sm font-bold uppercase tracking-widest">{t('profile.reward_subtitle', "Do'stlaringizni taklif qiling va mukofot oling")}</p>
            </div>

            <div className="flex gap-4">
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] text-center min-w-[120px]">
                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">{t('profile.referrals_label', 'Takliflar')}</p>
                <p className="text-3xl font-black">{referralStats?.referralCount || 0}</p>
              </div>
              <div className="p-6 bg-accent-purple/10 border border-accent-purple/20 rounded-[32px] text-center min-w-[120px]">
                <p className="text-[10px] text-accent-purple font-black uppercase tracking-widest mb-1">{t('profile.level_label', 'Daraja')}</p>
                <p className="text-xl font-black text-accent-purple uppercase">{referralStats?.rewardLevel || 'Starter'}</p>
              </div>
            </div>

            {/* Trial Progress */}
            <div className="mt-8 p-6 bg-white/[0.02] border border-white/5 rounded-[32px]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t('profile.trial_progress', 'Premium Trial Progress')}</span>
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{referralStats?.referralCount || 0} / {t('profile.friends_count', "3 DO'ST", { count: 3 })}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((referralStats?.referralCount || 0) / 3) * 100)}%` }}
                  className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                />
              </div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-4">
                {t('profile.trial_desc', "3 ta do'stingiz qo'shilsa, 7 kunlik Premium mutlaqo bepul ochiladi!")}
              </p>
            </div>
          </div>

          <div className="mt-10 p-6 bg-black/40 border border-white/5 rounded-[32px] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-xl">
                <Share2 size={20} className="text-white/40" />
              </div>
              <div>
                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">{t('profile.referral_code_label', 'Sizning referal kodingiz')}</p>
                <p className="text-lg font-black tracking-widest text-white">{referralStats?.referralCode || '...'}</p>
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralStats?.referralCode || '');
                // toast needed here?
              }}
              className="p-4 bg-white text-black rounded-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <Copy size={20} />
            </button>
          </div>

          {/* Referral Input (if not already referred) */}
          {!user.referred_by_id && (
            <div className="mt-8 p-6 bg-accent-blue/5 border border-accent-blue/20 rounded-[32px] flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1">
                <p className="text-[10px] text-accent-blue font-black uppercase tracking-widest mb-1">{t('profile.has_referral', 'Referral Kodingiz bormi?')}</p>
                <p className="text-xs font-bold text-white/40 uppercase">{t('profile.has_referral_desc', "Do'stingiz kodi orqali ro'yxatdan o'ting va bonuslarga ega bo'ling.")}</p>
              </div>
              <div className="flex w-full md:w-auto gap-2">
                <input
                  type="text"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value)}
                  placeholder="CODE123"
                  className="flex-1 md:w-32 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-accent-blue transition-all"
                />
                <button
                  onClick={handleSubmitReferral}
                  disabled={submittingReferral || !referralInput}
                  className="px-6 py-2 bg-accent-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submittingReferral ? <Loader2 className="animate-spin" size={14} /> : t('profile.verify_btn', 'Tasdiqlash')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Focus Analyzer Section */}
      <div className="glass-card rounded-[40px] p-10 space-y-8">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-accent-blue/10 text-accent-blue rounded-2xl">
                <Brain size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">{t('profile.ai_analyzer_title', 'AI Focus Analyzer')}</h3>
                <p className="text-white/40 text-sm">{t('profile.ai_analyzer_desc', "Sizning mahsuldorligingizni sun'iy intellekt tahlil qiladi")}</p>
              </div>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all flex items-center gap-3 bg-accent-blue hover:bg-accent-blue/90 text-white shadow-xl shadow-accent-blue/20"
            >
              {analyzing ? <Loader2 className="animate-spin" /> : <TrendingUp size={20} />}
              {t('profile.start_analyze_btn', 'Tahlilni Boshlash')}
            </button>
          </div>

          {error && (
            <div className={cn(
              "p-6 border rounded-2xl flex items-center gap-4 mt-8",
              error.includes('ishlanmoqda')
                ? "bg-accent-blue/10 border-accent-blue/20 text-accent-blue"
                : "bg-red-400/10 border-red-400/20 text-red-400"
            )}>
              <AlertCircle size={24} />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <AnimatePresence>
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pt-8 border-t border-white/5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">{t('profile.efficiency_score', 'Samaradorlik Bahosi')}</p>
                    <div className="flex items-end gap-3">
                      <span className="text-6xl font-bold text-accent-blue tracking-tighter">{analysis.efficiency_score}%</span>
                      <div className="mb-2 h-2 flex-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${analysis.efficiency_score}%` }}
                          className="h-full bg-accent-blue"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">{t('profile.optimal_time', 'Optimal Ish Vaqti')}</p>
                    <p className="text-2xl font-bold text-white tracking-tight">{analysis.optimal_time}</p>
                  </div>
                  {analysis.health_status && (
                    <div className="space-y-4 md:col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">{t('profile.health_status', 'Salomatlik Holati')}</p>
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <p className="text-emerald-400 font-black uppercase tracking-widest">{analysis.health_status}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">{t('profile.ai_analysis', 'AI Tahlili')}</p>
                  <p className="text-white/60 leading-relaxed text-lg">{analysis.analysis}</p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">{t('profile.recommendations', 'Tavsiyalar')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Array.isArray(analysis.recommendations) ? analysis.recommendations : []).map((rec, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <CheckCircle2 size={20} className="text-accent-blue shrink-0 mt-1" />
                        <p className="text-white/80 text-sm leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="glass-card rounded-[40px] p-10 space-y-10 mt-10 relative overflow-hidden">

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-purple/[0.04] rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-yellow-400/10 rounded-2xl relative">
              <Trophy size={28} className="text-yellow-400" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Yutuqlar</h3>
              <p className="text-white/30 text-sm font-medium mt-0.5">Har bir sessiya — sizning merosингиз.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
              {achievements.length} / 6 Ochilgan
            </span>
          </div>
        </div>

        {/* Progress bar overall */}
        <div className="relative z-10 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Umumiy Natija</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400/60">{Math.round((achievements.length / 6) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(achievements.length / 6) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.4)]"
            />
          </div>
        </div>

        {/* Achievement Grid */}
        {(() => {
          const ALL_ACHIEVEMENTS = [
            {
              type: 'FIRST_SESSION',
              label: 'Birinchi Sessiya',
              desc: 'Siz birinchi fokus sessiyangizni muvaffaqiyatli yakunladingiz!',
              hint: '25 daqiqalik fokus sessiyasini boshlang.',
              icon: Timer,
              color: 'yellow',
            },
            {
              type: '10_SESSIONS',
              label: '10 Sessiya',
              desc: 'Aql har bir sessiyada o`sib boradi.',
              hint: '10 ta fokus sessiyasini yakunlang.',
              icon: Zap,
              color: 'blue',
            },
            {
              type: '100_SESSIONS',
              label: 'Yuz Karbofur',
              desc: 'Siz fokus bo`yicha eng yaxshi 1% ga kirasiz!',
              hint: '100 ta fokus sessiyasini yakunlang.',
              icon: Crown,
              color: 'yellow',
            },
            {
              type: '7_DAY_STREAK',
              label: '7 Kunlik Seriya',
              desc: 'Izchillik — eng muhim mahorat.',
              hint: '7 kun ketma-ket fokuslaning.',
              icon: TrendingUp,
              color: 'green',
            },
            {
              type: 'PREMIUM_USER',
              label: 'Premium A`zo',
              desc: 'Siz o`z rivojlanishingizga sarmoya kiritdingiz.',
              hint: 'Premiumga o`ting.',
              icon: Zap,
              color: 'purple',
            },
            {
              type: 'EARLY_SUPPORTER',
              label: 'Dastlabki Tarafdor',
              desc: 'Siz biz bilan eng boshidan edingiz.',
              hint: 'Dastur ochilganidan bir oy ichida ro`yxatdan o`ting.',
              icon: Users,
              color: 'blue',
            },
          ];

          const unlockedTypes = new Set(achievements.map(a => a.type));

          const colorMap: Record<string, { bg: string, border: string, icon: string, glow: string }> = {
            yellow: { bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', icon: 'text-yellow-400', glow: 'shadow-yellow-400/20' },
            blue: { bg: 'bg-accent-blue/10', border: 'border-accent-blue/30', icon: 'text-accent-blue', glow: 'shadow-accent-blue/20' },
            green: { bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', icon: 'text-emerald-400', glow: 'shadow-emerald-400/20' },
            purple: { bg: 'bg-accent-purple/10', border: 'border-accent-purple/30', icon: 'text-accent-purple', glow: 'shadow-accent-purple/20' },
          };

          return (
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {ALL_ACHIEVEMENTS.map((def, i) => {
                const isUnlocked = unlockedTypes.has(def.type);
                const colors = colorMap[def.color];
                const unlocked = achievements.find(a => a.type === def.type);
                const Icon = def.icon;

                return (
                  <motion.div
                    key={def.type}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className={cn(
                      "relative p-6 rounded-3xl border transition-all duration-300 group overflow-hidden",
                      isUnlocked
                        ? `bg-white/[0.04] ${colors.border} hover:shadow-xl hover:${colors.glow}`
                        : "bg-white/[0.02] border-white/[0.06] opacity-60 grayscale"
                    )}
                  >
                    {/* Locked overlay */}
                    {!isUnlocked && (
                      <div className="absolute top-3 right-3 p-1.5 bg-white/5 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                    )}

                    {/* Unlocked glow */}
                    {isUnlocked && (
                      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", colors.bg, "blur-2xl")} />
                    )}

                    {/* Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300",
                      isUnlocked ? `${colors.bg} group-hover:scale-110` : "bg-white/5"
                    )}>
                      <Icon size={22} className={isUnlocked ? colors.icon : "text-white/20"} />
                    </div>

                    {/* Label */}
                    <h4 className={cn(
                      "font-black uppercase tracking-widest text-xs mb-1",
                      isUnlocked ? "text-white" : "text-white/30"
                    )}>
                      {def.label}
                    </h4>

                    {/* Description */}
                    <p className={cn(
                      "text-[11px] leading-relaxed font-medium",
                      isUnlocked ? "text-white/50" : "text-white/20"
                    )}>
                      {isUnlocked ? def.desc : def.hint}
                    </p>

                    {/* Unlock date */}
                    {isUnlocked && unlocked && (
                      <p className={cn("text-[10px] font-bold mt-3 uppercase tracking-widest", colors.icon)}>
                        ✓ {new Date(unlocked.unlocked_at).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          );
        })()}

        {/* Empty state CTA — only show if no achievements at all */}
        {achievements.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative z-10 flex flex-col items-center gap-6 py-8 px-6 bg-white/[0.02] border border-dashed border-white/10 rounded-[32px] text-center"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-[28px] bg-yellow-400/10 flex items-center justify-center">
                <Trophy size={40} className="text-yellow-400/60" />
              </div>
              <div className="absolute inset-0 bg-yellow-400/5 rounded-[28px] blur-xl" />
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-black text-lg tracking-tight">Hali birorta yutuq ochilmagan</h4>
              <p className="text-white/30 text-sm font-medium max-w-xs">25 daqiqalik fokus sessiyasini boshlang va sayohatingizni boshlab yuboring.</p>
            </div>
            <button
              onClick={() => {
                const pomodoroBtn = document.querySelector('[data-tab="pomodoro"]') as HTMLButtonElement;
                if (pomodoroBtn) pomodoroBtn.click();
              }}
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-yellow-400/20"
            >
              <Timer size={16} />
              Fokus Sessiyasini Boshlash
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
