import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from 'recharts';
import {
  Timer, CheckCircle2, TrendingUp, Calendar, Zap, Flame,
  Download, History, Clock, Target, Star, Trophy, Award, Lock,
  Info, ChevronRight, RefreshCw, X
} from 'lucide-react';
import { PomodoroSession } from '../types';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import PremiumLock from './PremiumLock';

interface DashboardProps {
  onUpgrade?: () => void;
}

export default function Dashboard({ onUpgrade }: DashboardProps) {
  const { t } = useTranslation();
  const [dailyStats, setDailyStats] = useState<any>({ totalFocusTime: 0, completedSessions: 0, avgDuration: 0, taskCompletionRate: 0, streak: 0, aiScore: 0 });
  const [weeklyStats, setWeeklyStats] = useState<any>({ history: [], totalFocusTime: 0, completedSessions: 0, mostProductiveDay: '0', mostProductiveHour: '00' });
  const [history, setHistory] = useState<PomodoroSession[]>([]);
  const [heatmap, setHeatmap] = useState<{ date: string, count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filterDays, setFilterDays] = useState(7);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterDays]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profile first to ensure user is set
      try {
        const profileRes = await api.get('/auth/profile');
        setUser(profileRes.data);
      } catch (e) {
        console.error('Profile fetch error:', e);
      }

      // Fetch other data in parallel but handle errors individually
      const [dailyRes, weeklyRes, historyRes, heatmapRes] = await Promise.allSettled([
        api.get('/stats/daily'),
        api.get(`/stats/weekly?days=${filterDays}`),
        api.get('/stats/history'),
        api.get('/stats/heatmap')
      ]);

      if (dailyRes.status === 'fulfilled' && dailyRes.value.data) setDailyStats(dailyRes.value.data);
      if (weeklyRes.status === 'fulfilled' && weeklyRes.value.data) setWeeklyStats(weeklyRes.value.data);
      if (historyRes.status === 'fulfilled' && Array.isArray(historyRes.value.data)) setHistory(historyRes.value.data);
      if (heatmapRes.status === 'fulfilled' && Array.isArray(heatmapRes.value.data)) setHeatmap(heatmapRes.value.data);

    } catch (error) {
      console.error('Data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyReport = async () => {
    setLoadingReport(true);
    try {
      const res = await api.get('/stats/weekly-report');
      setWeeklyReport(res.data);
      setShowReport(true);
    } catch (e) {
      console.error('Weekly report error:', e);
    } finally {
      setLoadingReport(false);
    }
  };

  const badges = [
    { title: '3 Kunlik Streak', days: 3, icon: Star, color: 'text-blue-400' },
    { title: '7 Kunlik Streak', days: 7, icon: Zap, color: 'text-purple-400' },
    { title: '30 Kunlik Streak', days: 30, icon: Trophy, color: 'text-orange-400' },
    { title: '100 Kunlik Streak', days: 100, icon: Award, color: 'text-yellow-400' },
  ];

  const mostProductiveDayName = useMemo(() => {
    const daysArr = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    return daysArr[parseInt(weeklyStats?.mostProductiveDay || '0')];
  }, [weeklyStats]);

  const productivityScore = dailyStats?.aiScore || 0;
  const burnoutRisk = dailyStats?.burnoutRisk || 0;
  const focusDNA = dailyStats?.focusDNA || "Explorer";

  const generateReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const historyHtml = history.slice(0, 50).map(s => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">${new Date(s.completed_at).toLocaleDateString()}</td>
        <td style="padding: 10px;">${s.type === 'focus' ? 'Fokus' : 'Tanaffus'}</td>
        <td style="padding: 10px;">${s.duration} daqiqa</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html>
        <head>
          <title>FASTTIME PREMIUM HISOBOT</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; }
            h1 { color: #8B5CF6; letter-spacing: -1px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f8fafc; padding: 12px; border-bottom: 2px solid #e2e8f0; }
            .header { border-bottom: 4px solid #8B5CF6; padding-bottom: 20px; margin-bottom: 30px; }
            .stats { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
            .stat-card { background: #f1f5f9; padding: 20px; border-radius: 12px; }
            .stat-card span { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .stat-card b { display: block; font-size: 20px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header"><h1>FASTTIME DASHBOARD</h1><p>Tayyorlandi: ${new Date().toLocaleString()}</p></div>
          <div class="stats">
            <div class="stat-card"><span>Fokus Vaqti</span><b>${weeklyStats.totalFocusTime}m</b></div>
            <div class="stat-card"><span>Sessiyalar</span><b>${weeklyStats.completedSessions}</b></div>
            <div class="stat-card"><span>Joriy Streak</span><b>${dailyStats.streak} kun</b></div>
            <div class="stat-card"><span>AI Score</span><b>${productivityScore}%</b></div>
            <div class="stat-card"><span>Focus DNA</span><b>${focusDNA}</b></div>
          </div>
          <h2>Batafsil Tarix</h2>
          <table><thead><tr><th>Sana</th><th>Turi</th><th>Davomiyligi</th></tr></thead><tbody>${historyHtml}</tbody></table>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportToCSV = () => {
    if (!history.length) return;
    const headers = ['ID', 'Davomiyligi', 'Turi', 'Yakunlangan vaqt'];
    const csvData = history.map(s => [s.id, s.duration, s.type, s.completed_at]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + headers.join(",") + "\n"
      + csvData.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fasttime_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !user) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[400px] glass-card animate-pulse rounded-[40px]" />
        <div className="h-[400px] glass-card animate-pulse rounded-[40px]" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Header with Stats Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-4xl font-black text-white tracking-tighter">{t('dashboard.welcome', 'SALOM')}, {user?.username?.toUpperCase()}!</h2>
            {dailyStats.level && (
              <div className="px-4 py-1 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                <Trophy size={12} fill="currentColor" /> {dailyStats.level}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{t('dashboard.subtitle', "Bugungi mahsuldorlik metrikalari")}</p>
            <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (dailyStats.totalFocusMinutes / 600) * 100)}%` }}
                className="h-full bg-accent-purple"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchWeeklyReport}
            disabled={loadingReport}
            className="px-6 py-2 bg-accent-purple text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-accent-purple/20"
          >
            {loadingReport ? <RefreshCw size={14} className="animate-spin" /> : <Star size={14} fill="white" />}
            AI REFLEKSIYA
          </button>

          <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setFilterDays(d)}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  filterDays === d ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white"
                )}
              >
                {t('dashboard.stats_days', `${d} KUN`, { days: d })}
              </button>
            ))}
          </div>
          {user.is_premium && (
            <button onClick={generateReport} className="p-3 bg-white/5 text-white/40 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
              <Download size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('dashboard.today_focus', 'Bugun Fokus'), val: `${dailyStats.totalFocusTime}m`, icon: Clock, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
          { label: t('dashboard.completion_rate', 'Bajarilish darajasi'), val: `${dailyStats.taskCompletionRate}%`, icon: Target, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
          { label: t('dashboard.total_sessions', 'Jami sessiyalar'), val: weeklyStats.completedSessions, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: t('dashboard.current_streak', 'Bugungi Streak'), val: `${dailyStats.streak} kun`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            key={i} className="glass-card rounded-[32px] p-8 group hover:scale-[1.03] transition-all"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-white tracking-tight">{stat.val}</p>
          </motion.div>
        ))}
      </div>

      {/* Health & Balance AI Card */}
      <div className="lg:col-span-12 glass-card rounded-[40px] p-8 md:p-12 relative overflow-hidden group border-2 border-accent-purple/10">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
          <Star size={240} className="text-white" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-purple/10 border border-accent-purple/20 rounded-full text-[10px] font-black text-accent-purple uppercase tracking-[0.2em] mb-4">
                <Star size={12} fill="currentColor" /> Premium AI Intelligence
              </div>
              <h3 className="text-3xl font-black text-white tracking-tighter">{t('dashboard.balance_title', 'HEALTH & WORK BALANCE')}</h3>
              <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-1">{t('dashboard.balance_subtitle', 'Sizning unumdorlik va salomatlik muvozanatingiz')}</p>
            </div>

            <div className="flex items-center gap-8">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="absolute w-full h-full -rotate-90">
                  <circle
                    cx="48" cy="48" r="44"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-white/5"
                  />
                  <motion.circle
                    cx="48" cy="48" r="44"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="276.46"
                    initial={{ strokeDashoffset: 276.46 }}
                    animate={{ strokeDashoffset: 276.46 - (276.46 * Math.round(productivityScore * 0.9)) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="text-accent-purple"
                  />
                </svg>
                <div className="text-center relative z-10">
                  <p className="text-2xl font-black text-white">{productivityScore}%</p>
                  <p className="text-[8px] text-white/20 font-black uppercase">Fokus AI</p>
                </div>
              </div>
              <div className="w-[2px] h-12 bg-white/5" />
              <div className="text-center">
                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Focus DNA</p>
                <div className="px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                  {focusDNA}
                </div>
              </div>
              <div className="w-[2px] h-12 bg-white/5" />
              <div className="text-center">
                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Burnout Risk</p>
                <div className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest",
                  burnoutRisk < 30 ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" :
                    burnoutRisk < 60 ? "bg-blue-400/10 text-blue-400 border border-blue-400/20" :
                      burnoutRisk < 80 ? "bg-orange-400/10 text-orange-400 border border-orange-400/20" :
                        "bg-red-400/10 text-red-400 border border-red-400/20"
                )}>
                  {burnoutRisk}% {burnoutRisk > 70 ? 'HIGH' : burnoutRisk > 40 ? 'MODERATE' : 'LOW'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px]">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-accent-purple" size={18} />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Deep Focus Performance</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-black">{dailyStats.deepFocusMinutes || 0}m</span>
                <span className="text-[10px] font-black text-white/20 uppercase">Core</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((dailyStats.deepFocusMinutes || 0) / 300) * 100)}%` }}
                  className="h-full bg-accent-purple"
                />
              </div>
              <p className="text-[10px] font-bold text-white/40 leading-tight">
                {t('dashboard.deep_focus_desc', "Bugungi yuqori sifatli konsentratsiya vaqti.")}
              </p>
            </div>

            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px]">
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw className="text-accent-blue" size={18} />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Neuro-Drift & Penalty</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-black">-{Math.round((dailyStats.fatigueDrift || 0) + (dailyStats.contextSwitchPenalty || 0))}</span>
                <span className="text-[10px] font-black text-white/20 uppercase">Points</span>
              </div>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < Math.floor(((dailyStats.fatigueDrift || 0) + (dailyStats.contextSwitchPenalty || 0)) / 10) ? "bg-red-500/50" : "bg-white/5")} />
                ))}
              </div>
              <p className="text-[10px] font-bold text-white/40 leading-tight">
                {t('dashboard.penalty_desc', "Chalg'ishlar va charchoq natijasidagi yo'qotilgan ballar.")}
              </p>
            </div>

            <div className="p-6 bg-accent-purple text-white rounded-[32px] shadow-xl shadow-accent-purple/20">
              <div className="flex items-center gap-3 mb-4">
                <Zap size={18} fill="white" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">AI Suggestion</span>
              </div>
              <p className="text-sm font-black leading-snug mb-4">
                {burnoutRisk > 80
                  ? t('dashboard.ai_crit_burnout', "CRITICAL: Charchoq nihoyatda yuqori. Hozirgi sessiyani 15 daqiqaga qisqartiring.")
                  : burnoutRisk > 50
                    ? t('dashboard.ai_warn_fatigue', "DIQQAT: Fokus darajasi pasaymoqda. Keyingi sessiyani 20 daqiqaga sozlang.")
                    : t('dashboard.ai_optimal', "OPTIMAL: Miya yangi holatda. 45 daqiqalik chuqur fokus tavsiya etiladi.")}
              </p>
              <div className="pt-4 border-t border-white/20">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Recommended Duration</p>
                <p className="text-xl font-black">{burnoutRisk > 70 ? '15-20m' : burnoutRisk > 40 ? '25-30m' : '45-60m'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:mt-8">
        {/* Main Chart */}
        <div className="lg:col-span-8 glass-card rounded-[40px] p-10 overflow-hidden relative">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <TrendingUp size={24} className="text-accent-purple" />
                {t('dashboard.trend_title', 'Fokus Tendensiyasi')}
              </h3>
              <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">{t('dashboard.trend_subtitle', `Oxirgi ${filterDays} kunlik tahlil`, { days: filterDays })}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white">{weeklyStats.totalFocusTime}m</p>
              <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{t('dashboard.total_time', 'Jami Vaqt')}</p>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyStats?.history || []}>
                <defs>
                  <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                <XAxis
                  dataKey="date" stroke="#ffffff10" fontSize={10} fontWeight="black" tickLine={false} axisLine={false}
                  tickFormatter={d => {
                    const date = new Date(d);
                    return filterDays > 7 ? `${date.getDate()}/${date.getMonth() + 1}` : date.toLocaleDateString('uz-UZ', { weekday: 'short' }).toUpperCase();
                  }}
                />
                <YAxis stroke="#ffffff10" fontSize={10} fontWeight="black" tickLine={false} axisLine={false} tickFormatter={v => `${v}m`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}
                  cursor={{ stroke: '#8B5CF6', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="duration" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#colorFocus)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productivity Score Card */}
        <div className="lg:col-span-4 glass-card rounded-[40px] p-10 flex flex-col items-center justify-between text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-accent-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

          <div className="relative z-10 w-full">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-8">Productivity Score</h3>

            <div className="relative w-full">
              <div className="relative inline-block mb-8">
                <svg className="w-48 h-48 -rotate-90">
                  <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                  <motion.circle
                    cx="96" cy="96" r="88" fill="none" stroke="#3B82F6" strokeWidth="12"
                    strokeDasharray="553" initial={{ strokeDashoffset: 553 }}
                    animate={{ strokeDashoffset: 553 * (1 - productivityScore / 100) }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    strokeLinecap="round" className="drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-white">{productivityScore}%</span>
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Haftalik AI</span>
                </div>
              </div>

              <div className="space-y-4 text-left">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-accent-blue" />
                    <span className="text-[10px] font-bold text-white/60 uppercase">Eng faol soat</span>
                  </div>
                  <span className="text-sm font-black">{weeklyStats.mostProductiveHour}:00</span>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-accent-purple" />
                    <span className="text-[10px] font-bold text-white/60 uppercase">Eng faol kun</span>
                  </div>
                  <span className="text-sm font-black">{mostProductiveDayName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap & Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Badges Section */}
        <div className="glass-card rounded-[40px] p-10">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
            <Award size={24} className="text-yellow-500" />
            {t('dashboard.achievements_title', 'Yutuqlar & Badgelar')}
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {badges.map((b, i) => {
              const isEarned = dailyStats.streak >= b.days;
              return (
                <div key={i} className={cn(
                  "relative p-6 rounded-[32px] border transition-all flex flex-col items-center gap-3 text-center",
                  isEarned ? "bg-white/5 border-white/10" : "bg-black/20 border-white/5 opacity-30 grayscale"
                )}>
                  <div className={cn("p-4 rounded-full bg-black/40 border border-white/10", isEarned && b.color)}>
                    <b.icon size={32} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest">{b.title}</h4>
                    <p className="text-[10px] text-white/20 font-bold mt-1">{isEarned ? 'QO\'LGA KIRITILDI' : `${b.days - dailyStats.streak} kun qoldi`}</p>
                  </div>
                  {isEarned && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full">
                      <CheckCircle2 size={12} />
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Heatmap Section */}
        <div className="glass-card rounded-[40px] p-10 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <Target size={24} className="text-accent-blue" />
              {t('dashboard.heatmap_title', 'Fokus Xaritasi')}
            </h3>
            {user.is_premium ? (
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest px-3 py-1 bg-emerald-400/10 rounded-full">Premium Analysis</span>
            ) : (
              <Lock size={16} className="text-white/20" />
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-[300px]">
            <div className="relative w-full">
              <div className="flex flex-wrap gap-1.5 justify-center mb-8">
                {Array.from({ length: 156 }).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (155 - i));
                  const dateStr = date.toISOString().split('T')[0];
                  const entry = Array.isArray(heatmap) ? heatmap.find(h => h.date === dateStr) : undefined;
                  const count = entry?.count || 0;
                  return (
                    <div
                      key={i}
                      title={`${dateStr}: ${count} sessiya`}
                      className={cn(
                        "w-3.5 h-3.5 rounded-[3px] transition-all",
                        count === 0 ? "bg-white/[0.03]" :
                          count === 1 ? "bg-accent-purple/20" :
                            count === 2 ? "bg-accent-purple/40" :
                              count === 3 ? "bg-accent-purple/70" : "bg-accent-purple"
                      )}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                <span>Kam</span>
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-white/[0.03]" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-accent-purple/30" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-accent-purple" />
                </div>
                <span>Ko'p</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Actions Table */}
      <div className="glass-card rounded-[40px] p-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <Info size={24} className="text-white/20" />
              {t('dashboard.archive_title', 'Sessiyalar Arxivasi')}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
            >
              <Download size={16} />
              CSV Yuklash
            </button>
          </div>
        </div>

        <div className="overflow-hidden bg-white/[0.02] rounded-[32px] border border-white/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">{t('dashboard.table_date', 'Sana va Vaqt')}</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">{t('dashboard.table_type', 'Sessiya Turi')}</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">{t('dashboard.table_duration', 'Davomiyligi')}</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(Array.isArray(history) ? history : []).map(session => (
                <tr key={session.id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-8 py-5 text-sm text-white/60 font-bold">
                    {new Date(session.completed_at).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      session.type === 'focus' ? "bg-accent-purple/10 border-accent-purple/20 text-accent-purple" : "bg-white/5 border-white/10 text-white/30"
                    )}>
                      {session.type === 'focus' ? t('timer.focus', 'Fokus') : t('timer.short_break', 'Tanaffus')}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-white font-black">{session.duration}m</td>
                  <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={18} className="text-white/20 inline-block" />
                  </td>
                </tr>
              ))}
              {(!Array.isArray(history) || history.length === 0) && (
                <tr><td colSpan={4} className="px-8 py-20 text-center text-white/10 italic text-sm font-bold uppercase tracking-widest">Hali ma'lumotlar mavjud emas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly AI Report Modal */}
      <AnimatePresence>
        {showReport && weeklyReport && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReport(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-x-60 md:inset-y-20 bg-[#0A0A0A] border border-white/10 rounded-[40px] z-[101] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1 relative">
                <button onClick={() => setShowReport(false)} className="absolute top-8 right-8 p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all">
                  <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center mb-12">
                  <div className="w-20 h-20 bg-accent-purple rounded-3xl flex items-center justify-center shadow-2xl shadow-accent-purple/20 mb-6 rotate-3">
                    <Star size={40} fill="white" className="text-white" />
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase underline decoration-accent-purple/50 decoration-4 underline-offset-8">Haftalik AI Refleksiya</h2>
                  <p className="text-white/20 text-xs font-black uppercase tracking-[0.4em] mt-6">Murabbiyingizdan hisobot • {new Date().toLocaleDateString('uz-UZ')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] flex flex-col items-center text-center transition-all hover:bg-white/[0.04]">
                    <Clock className="text-accent-purple mb-4" size={32} />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Chuqur ish</span>
                    <p className="text-3xl font-black tracking-tight">{weeklyReport.totalDeepWorkHours} soat</p>
                  </div>
                  <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] flex flex-col items-center text-center transition-all hover:bg-white/[0.04]">
                    <Calendar className="text-accent-blue mb-4" size={32} />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Eng yaxshi kun</span>
                    <p className="text-3xl font-black tracking-tight">{weeklyReport.bestDay}</p>
                  </div>
                  <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] flex flex-col items-center text-center transition-all hover:bg-white/[0.04]">
                    <Timer className="text-orange-500 mb-4" size={32} />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Samarali soat</span>
                    <p className="text-3xl font-black tracking-tight">{weeklyReport.bestHour}</p>
                  </div>
                  <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] flex flex-col items-center text-center transition-all hover:bg-white/[0.04]">
                    <Flame className="text-emerald-500 mb-4" size={32} />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Joriy Streak</span>
                    <p className="text-3xl font-black tracking-tight">{weeklyReport.streak} kun</p>
                  </div>
                </div>

                <div className="p-10 bg-accent-purple/5 border border-accent-purple/10 rounded-[40px] relative overflow-hidden group">
                  <div className="absolute -top-10 -left-10 opacity-5 group-hover:scale-110 transition-transform">
                    <Star size={200} fill="white" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="flex items-center gap-3 text-sm font-black text-accent-purple uppercase tracking-[0.3em] mb-6">
                      <Info size={18} />
                      AI MURABBIY TAHLILI
                    </h4>
                    <p className="text-xl md:text-2xl font-black text-white leading-relaxed italic">
                      "{weeklyReport.aiSummary}"
                    </p>
                    <div className="mt-8 pt-8 border-t border-accent-purple/10">
                      <p className="text-[10px] font-black text-accent-purple uppercase tracking-widest mb-2">Tafsiya:</p>
                      <p className="text-sm font-bold text-white/60">{weeklyReport.recommendation}</p>
                    </div>
                  </div>
                </div>

                <button onClick={() => setShowReport(false)} className="w-full mt-10 p-6 bg-white text-black rounded-[32px] font-black text-xs uppercase tracking-widest hover:scale-[0.98] transition-all">
                  HISOBOTNI YOPISH
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}



