import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Timer,
  CheckSquare,
  BookOpen,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Crown,
  Maximize,
  Minimize,
  Bell,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ErrorBoundary from './components/ErrorBoundary';
import BrandLogo from './components/BrandLogo';
import Auth from './components/Auth';
import PomodoroTimer from './components/PomodoroTimer';
import TaskManager from './components/TaskManager';
import NotesSystem from './components/NotesSystem';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import PremiumModal from './components/PremiumModal';
import PricingModal from './components/billing/PricingModal';
import BillingModal, { BillingPlan } from './components/BillingModal';
import PremiumLanding from './components/PremiumLanding';
import ReminderSystem from './components/ReminderSystem';
import TeamDashboard from './components/TeamDashboard';
import JoinTeam from './components/JoinTeam';
import JoinByCode from './components/JoinByCode';
import { cn } from './lib/utils';
import api from './lib/api';
import { Toaster, toast } from 'sonner';
import EngagementTriggers from './components/EngagementTriggers';
import Onboarding from './components/Onboarding';
import PublicLanding from './components/PublicLanding';
import PremiumAvatar from './components/PremiumAvatar';
import VerifiedBadge from './components/VerifiedBadge';
import PaymentSuccess from './components/PaymentSuccess';

type Tab = 'dashboard' | 'pomodoro' | 'tasks' | 'notes' | 'reminders' | 'profile' | 'pricing' | 'team' | 'join-team' | 'join-by-code';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('pomodoro');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { t } = useTranslation();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('fasttime_onboarding_complete'));

  const [showAuth, setShowAuth] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [isEasterEggTheme, setIsEasterEggTheme] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState<string | undefined>(undefined);
  const [joinToken, setJoinToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [billingPlan, setBillingPlan] = useState<BillingPlan | null>(null);
  const [authInitialView, setAuthInitialView] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/join/')) {
      const token = path.split('/join/')[1];
      if (token) {
        setJoinToken(token);
        setActiveTab('join-team');
        // Clear URL
        window.history.replaceState({}, document.title, "/");
      }
    }

    if (path === '/forgot-password') {
      setAuthInitialView('forgot');
      setShowAuth(true);
      window.history.replaceState({}, document.title, "/");
    }

    if (path === '/reset-password') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        setResetToken(token);
        setAuthInitialView('reset');
        setShowAuth(true);
        window.history.replaceState({}, document.title, "/");
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
      fetchStats();
    } else {
      setLoading(false);
    }

    // Sedentary Reminder
    let activityTimer: NodeJS.Timeout;
    const resetActivityTimer = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(() => {
        if (Notification.permission === 'granted' && !document.hidden) {
          new Notification(t('notifications.sedentary_title', 'Harakat qilish vaqti keldi!'), {
            body: t('notifications.sedentary_body', 'Siz ancha vaqtdan beri harakatsizsiz. Keling, biroz badan-tarbiya qilamiz!'),
            icon: '/logo.png'
          });
        }
      }, 3600000); // 1 hour
    };

    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('keydown', resetActivityTimer);
    resetActivityTimer();

    // Global pricing modal opener
    const handleOpenPricingModal = () => setShowPricingModal(true);
    window.addEventListener('open-pricing-modal', handleOpenPricingModal);

    // Keyboard shortcut handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    // Fullscreen change listener
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      if (isCurrentlyFullscreen) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Payment Success Check
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      toast.success(t('notifications.premium_activated', 'Premium muvaffaqiyatli faollashtirildi!'), {
        description: t('notifications.premium_activated_desc', 'Barcha imkoniyatlardan umrbod foydalanishingiz mumkin 🎉'),
        duration: 5000
      });
      fetchProfile();
      // Remove param from URL
      window.history.replaceState({}, document.title, "/");
    }

    if (urlParams.get('session_id')) {
      const sid = urlParams.get('session_id') || undefined;
      setPaymentSessionId(sid);
      setShowPaymentSuccess(true);
      fetchProfile();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Also handle billing/success path explicitly if redirect happens there
    if (path.includes('billing/success')) {
      const sessionId = urlParams.get('session_id');
      if (sessionId) {
        setShowPaymentSuccess(true);
        window.history.replaceState({}, document.title, `/?session_id=${sessionId}`);
      }
    }

    if (urlParams.get('payment') === 'cancel') {
      toast.error(t('notifications.payment_cancelled', 'To\'lov bekor qilindi'));
      window.history.replaceState({}, document.title, "/");
    }

    // Reminder Checking Logic
    const checkReminders = async () => {
      if (!localStorage.getItem('token')) return;
      try {
        const res = await api.get('/reminders/due');
        res.data.forEach((rem: any) => {
          const key = `notified_${rem.id}_${new Date(rem.remind_at).getTime()}`;
          if (sessionStorage.getItem(key)) return;

          if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification("FASTTIME Reminder", {
                body: rem.title + (rem.description ? `: ${rem.description}` : ""),
                icon: "/logo.png",
                tag: `reminder-${rem.id}`,
                data: { id: rem.id, title: rem.title },
                actions: [
                  { action: 'mark-reminder-done', title: 'Mark as Done' },
                  { action: 'snooze-reminder-5', title: 'Remind in 5m' }
                ]
              } as any);
              sessionStorage.setItem(key, 'true');
            });
          }
        });
      } catch (e) { console.error('Reminder check error', e); }
    };

    const handleSWMessage = (e: MessageEvent) => {
      if (e.data?.type === 'CHECK_REMINDERS') checkReminders();
      if (e.data?.type === 'REMINDER_ACTION' && e.data.action === 'MARK_DONE') {
        api.post(`/reminders/${e.data.id}/done`).then(() => {
          toast.success(t('notifications.reminder_done', 'Eslatma bajarildi'));
          // Dispatch event for ReminderSystem to refresh if open
          window.dispatchEvent(new CustomEvent('reminders-updated'));
        });
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    const reminderInterval = setInterval(checkReminders, 60000);
    checkReminders();

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('mousemove', resetActivityTimer);
      window.removeEventListener('keydown', resetActivityTimer);
      window.removeEventListener('open-pricing-modal', handleOpenPricingModal);
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      clearInterval(reminderInterval);
      clearTimeout(activityTimer);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      const newData = response.data;

      // Detect Monthly Expiry UX
      if (user && user.plan === 'MONTHLY' && newData.plan === 'FREE') {
        toast.info("Pro muddati tugadi. Profilingiz BEPUL holatiga qaytdi.", {
          duration: 6000,
          icon: 'ℹ️'
        });
      }

      setUser(newData);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        setUser(null);
      }
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats/daily');
      setStats(response.data);
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Fullscreen error: ${err.message}`);
      });
      localStorage.setItem('fasttime_fullscreen_pref', 'true');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      localStorage.setItem('fasttime_fullscreen_pref', 'false');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-accent-purple/20 border-t-accent-purple rounded-full animate-spin" />
    </div>
  );

  if (!user) {
    if (showAuth) return (
      <Auth
        onLogin={() => { setShowAuth(false); setLoading(true); fetchProfile(); fetchStats(); }}
        initialView={authInitialView}
        resetToken={resetToken || undefined}
      />
    );
    return <PublicLanding onLogin={() => { setAuthInitialView('login'); setShowAuth(true); }} />;
  }

  if (showLanding && !user.is_premium) {
    return (
      <PremiumLanding
        onUpgrade={() => {
          setShowLanding(false);
          setShowPremiumModal(true);
        }}
        onClose={() => setShowLanding(false)}
      />
    );
  }

  const navItems = [
    { id: 'pomodoro', label: t('sidebar.timer', 'Taymer'), icon: Timer },
    { id: 'tasks', label: t('sidebar.tasks', 'Vazifalar'), icon: CheckSquare },
    { id: 'reminders', label: t('sidebar.reminders', 'Eslatmalar'), icon: Bell },
    { id: 'notes', label: t('sidebar.notes', 'Daftar'), icon: BookOpen },
    { id: 'dashboard', label: t('sidebar.analytics', 'Analitika'), icon: LayoutDashboard },
    { id: 'team', label: 'Jamoa (B2B)', icon: Users },
    { id: 'profile', label: t('sidebar.profile', 'Profil'), icon: UserIcon },
    { id: 'pricing', label: "Tariflar", icon: Crown },
  ];

  return (
    <div className={cn(
      "h-screen flex text-white selection:bg-accent-purple/30 font-sans transition-all duration-1000 overflow-hidden",
      isEasterEggTheme ? "bg-[#1a0b2e]" : "bg-primary-bg",
      isFullscreen && "bg-black"
    )}>
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-card-bg/50 backdrop-blur-2xl border-r border-white/5 transition-transform duration-300 lg:relative lg:translate-x-0",
        (!isSidebarOpen || isFullscreen) && "-translate-x-full lg:hidden"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-12 px-2 group cursor-pointer">
            <button
              onClick={() => {
                const newClicks = logoClicks + 1;
                setLogoClicks(newClicks);
                if (newClicks === 7) {
                  setIsEasterEggTheme(!isEasterEggTheme);
                  setLogoClicks(0);
                  toast.success("Maxfiy Mavzu Faollashtirildi! 💜", {
                    icon: "🎁"
                  });
                }
              }}
              className="min-w-[44px] min-h-[44px] p-0 bg-transparent flex items-center justify-center transition-all active:scale-95 group-hover:scale-110 overflow-visible"
            >
              <BrandLogo variant="sidebar" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2 text-white/90 group-hover:text-white transition-colors">
                Fasttime
                {user.is_premium && <Crown size={14} className="text-yellow-400 fill-yellow-400" />}
              </h1>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{t('sidebar.premium_saas', 'Premium SaaS')}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                data-tab={item.id}
                onClick={(e) => {
                  if (item.id === 'pricing') {
                    e.preventDefault();
                    setShowPricingModal(true);
                  } else {
                    setActiveTab(item.id as Tab);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group",
                  activeTab === item.id
                    ? "bg-white text-black shadow-xl"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon size={22} className={cn(
                  "transition-colors",
                  activeTab === item.id ? "text-black" : "group-hover:text-accent-purple"
                )} />
                <span className="font-bold text-sm uppercase tracking-widest">{item.label}</span>
                {item.id === 'profile' && user.is_premium && (
                  <Crown size={14} className="ml-auto text-yellow-500" />
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            {!(user.is_premium || user.plan === 'MONTHLY' || user.plan === 'LIFETIME' || user.plan === 'PREMIUM') && (
              <button
                onClick={() => setShowPricingModal(true)}
                className="w-full group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-400/10"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className="flex items-center gap-3 relative z-10">
                  <Crown size={20} fill="black" />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-tighter leading-none">{t('sidebar.upgrade_to', 'Upgrade to')}</p>
                    <p className="text-sm font-black uppercase tracking-widest leading-none mt-1">{t('sidebar.premium', 'PREMIUM')}</p>
                  </div>
                </div>
              </button>
            )}

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <PremiumAvatar user={user} size="lg" />
                <div className="overflow-hidden flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-base font-black truncate text-white tracking-tight uppercase">
                      {user?.username}
                    </p>
                    {!!user.is_verified && <VerifiedBadge size={13} />}
                  </div>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest mt-0.5",
                    (user.plan === 'PREMIUM' || user.plan === 'MONTHLY' || user.plan === 'LIFETIME' || user.is_premium) ? "text-yellow-400" : "text-white/40"
                  )}>
                    {(user.plan === 'PREMIUM' || user.plan === 'MONTHLY' || user.plan === 'LIFETIME' || user.is_premium) ? t('sidebar.premium_badge', 'PREMIUM') : t('sidebar.free_badge', 'BEPUL')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className={cn(
          "h-20 flex items-center justify-between px-8 border-b border-white/5 bg-primary-bg/50 backdrop-blur-xl z-40 transition-all",
          isFullscreen && "translate-y-[-100%]"
        )}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn("lg:hidden p-2 hover:bg-white/5 rounded-xl transition-all", isFullscreen && "hidden")}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {!(user.is_premium || user.plan === 'MONTHLY' || user.plan === 'LIFETIME' || user.plan === 'PREMIUM') && (
              <button
                onClick={() => setShowPricingModal(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-yellow-400/10 mr-4"
              >
                <Crown size={14} fill="black" />
                Premium Tarif
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              title="To'liq ekran (Ctrl+Shift+F)"
              className="p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl border border-white/5 transition-all group"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </header>

        {/* Floating Toggle for Fullscreen */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="fixed top-6 right-6 z-50 p-3 bg-white/5 hover:bg-white/10 text-white/20 hover:text-white rounded-2xl border border-white/5 backdrop-blur-xl transition-all active:scale-95"
          >
            <Minimize size={24} />
          </button>
        )}

        {/* Content Area */}
        <div className={cn(
          "flex-1 overflow-y-auto p-8 custom-scrollbar pb-24 transition-all duration-700",
          isFullscreen ? "flex items-center justify-center p-0" : "p-8"
        )}>
          <div className={cn(
            "max-w-5xl mx-auto w-full",
            isFullscreen && activeTab === 'pomodoro' && "max-w-4xl"
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(isFullscreen && activeTab === 'pomodoro' && "scale-110")}
              >
                <ErrorBoundary>
                  {activeTab === 'dashboard' && <Dashboard onUpgrade={() => setShowPricingModal(true)} />}
                  {activeTab === 'pomodoro' && <PomodoroTimer user={user} onSessionComplete={fetchStats} />}
                  {activeTab === 'tasks' && <TaskManager />}
                  {activeTab === 'notes' && <NotesSystem />}
                  {activeTab === 'reminders' && <ReminderSystem />}
                  {activeTab === 'profile' && <Profile />}
                  {activeTab === 'team' && <TeamDashboard />}
                  {activeTab === 'join-team' && joinToken && <JoinTeam token={joinToken} onComplete={() => { setJoinToken(null); setActiveTab('team'); }} />}
                  {activeTab === 'join-by-code' && <JoinByCode onComplete={() => setActiveTab('team')} />}
                  {activeTab === 'pricing' && <div className="text-center py-20"><p className="text-white/40 italic">Tariflar sahifasi o'chirildi. Iltimos sidebar orqali oching.</p></div>}
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <footer className={cn(
          "absolute bottom-0 left-0 right-0 h-16 border-t border-white/5 bg-primary-bg/80 backdrop-blur-md flex items-center justify-center px-10 z-30 transition-all",
          isFullscreen && "translate-y-full"
        )}>
        </footer>
      </main>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSuccess={fetchProfile}
      />
      <PricingModal
        open={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        user={user}
        onSelectPlan={(plan) => {
          setShowPricingModal(false);
          if (plan === 'MONTHLY') setBillingPlan('MONTHLY');
          if (plan === 'LIFETIME') setBillingPlan('LIFETIME');
        }}
      />
      {billingPlan && (
        <BillingModal
          isOpen={!!billingPlan}
          plan={billingPlan}
          currentUser={user}
          onClose={() => setBillingPlan(null)}
          onSuccess={() => {
            setBillingPlan(null);
            fetchProfile();
          }}
        />
      )}
      <EngagementTriggers stats={stats} onUpgrade={() => setShowPricingModal(true)} />
      {showOnboarding && <Onboarding onComplete={() => {
        setShowOnboarding(false);
        localStorage.setItem('fasttime_onboarding_complete', 'true');
      }} />}
      <AnimatePresence>
        {showPaymentSuccess && (
          <PaymentSuccess
            sessionId={paymentSessionId}
            onContinue={() => { setShowPaymentSuccess(false); setPaymentSessionId(undefined); }}
            onProfileRefresh={fetchProfile}
          />
        )}
      </AnimatePresence>
      <Toaster theme="dark" position="top-right" />
    </div>
  );
}
