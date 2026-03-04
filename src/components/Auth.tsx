import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LogIn, UserPlus, Timer, AlertCircle, Mail, Lock, ArrowRight, Loader2,
  Eye, EyeOff, CheckSquare, Square, ShieldCheck, Sparkles, X, Crown
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import api from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface AuthProps {
  onLogin: () => void;
  initialView?: 'login' | 'register' | 'forgot' | 'reset';
  resetToken?: string;
}

export default function Auth({ onLogin, initialView = 'login', resetToken }: AuthProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialView);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [specialMessage, setSpecialMessage] = useState('');

  const isLogin = view === 'login';
  const isRegister = view === 'register';
  const isForgot = view === 'forgot';
  const isReset = view === 'reset';

  const isFormValid = isLogin ? (username.length >= 3 && password.length > 0) :
    isRegister ? (username.length >= 3 && password.length >= 6 && email.includes('@')) :
      isForgot ? (email.includes('@')) :
        isReset ? (newPassword.length >= 8 && newPassword === confirmPassword) : false;

  const triggerCelebration = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin || isRegister) {
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const response = await api.post(endpoint, {
          username,
          password,
          email: isRegister ? email : undefined,
          referralCode: isRegister ? referralCode : undefined
        });

        if (isLogin) {
          if (rememberMe) {
            localStorage.setItem('remembered_username', username);
          }
          localStorage.setItem('token', response.data.token);
          if (response.data.forcePasswordUpdate) {
            toast.warning("Xavfsizlik uchun parolingizni yangilang!", { duration: 6000 });
          }
          onLogin();
        } else {
          if (response.data.special) {
            setSpecialMessage(response.data.message);
            setShowSpecialModal(true);
            triggerCelebration();
          } else {
            setView('login');
            toast.success(t('auth.register_success', "Muvaffaqiyatli ro'yxatdan o'tdingiz. Endi tizimga kiring."));
          }
        }
      } else if (isForgot) {
        const response = await api.post('/auth/forgot-password', { email });
        toast.success(response.data.message);
        setView('login');
      } else if (isReset) {
        const response = await api.post('/auth/reset-password', { token: resetToken, newPassword });
        toast.success(response.data.message || t('auth.reset_success', 'Parol muvaffaqiyatli yangilandi.'));
        setView('login');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Xatolik yuz berdi';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-primary-bg relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-purple/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-blue/10 blur-[120px] rounded-full animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center bg-transparent rounded-3xl mb-8 min-w-[120px] min-h-[120px] overflow-visible">
            <BrandLogo variant="hero" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-3">
            FASTTIME
          </h1>
          <p className="text-white/60 font-bold tracking-[0.2em] uppercase text-[10px] max-w-[200px] mx-auto leading-relaxed">
            {t('auth.tagline', 'Mahsuldorlikning yangi darajasi')}
          </p>
        </div>

        <div className="glass-card rounded-[48px] p-8 md:p-12 border border-white/10 shadow-2xl relative overflow-hidden bg-black/20 backdrop-blur-3xl">
          {(isLogin || isRegister) && (
            <div className="relative flex gap-1 mb-10 p-1.5 bg-white/5 rounded-2xl border border-white/5">
              <div
                className="absolute top-1.5 bottom-1.5 transition-all duration-300 ease-out bg-white rounded-xl shadow-lg"
                style={{
                  left: isLogin ? '6px' : 'calc(50% + 2px)',
                  width: 'calc(50% - 8px)'
                }}
              />
              <button
                type="button"
                onClick={() => setView('login')}
                className={`relative flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors z-10 ${isLogin ? 'text-black' : 'text-white/40 hover:text-white'
                  }`}
              >
                {t('auth.login_tab', 'Kirish')}
              </button>
              <button
                type="button"
                onClick={() => setView('register')}
                className={`relative flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors z-10 ${isRegister ? 'text-black' : 'text-white/40 hover:text-white'
                  }`}
              >
                {t('auth.register_tab', "Ro'yxatdan o'tish")}
              </button>
            </div>
          )}

          {isForgot && (
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{t('auth.forgot_title', 'Parolni tiklash')}</h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t('auth.tagline', 'Mahsuldorlikning yangi darajasi')}</p>
            </div>
          )}

          {isReset && (
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{t('auth.reset_title', 'Yangi parol o\'rnatish')}</h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t('auth.tagline', 'Mahsuldorlikning yangi darajasi')}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {(isLogin || isRegister) && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">
                    {t('auth.username_label', 'Username yoki Email')}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent-purple transition-colors" size={18} />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4.5 pl-14 pr-5 text-white focus:outline-none focus:border-accent-purple/50 focus:bg-white/[0.06] transition-all placeholder:text-white/10 font-bold"
                      placeholder="foydalanuvchi_nomi"
                    />
                  </div>
                </div>
              )}

              {isRegister && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">
                    {t('auth.email_label', 'Email manzili')}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent-purple transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4.5 pl-14 pr-5 text-white focus:outline-none focus:border-accent-purple/50 focus:bg-white/[0.06] transition-all placeholder:text-white/10 font-bold"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              )}

              {isForgot && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">
                    {t('auth.email_label', 'Email manzili')}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent-purple transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4.5 pl-14 pr-5 text-white focus:outline-none focus:border-accent-purple/50 focus:bg-white/[0.06] transition-all placeholder:text-white/10 font-bold"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              )}

              {(isLogin || isRegister) && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      {t('auth.password_label', 'Parol')}
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setView('forgot')}
                        className="text-[10px] font-black uppercase tracking-widest text-accent-purple hover:underline opacity-80 decoration-2 underline-offset-4"
                      >
                        {t('auth.forgot_password', 'Parolni unutdingizmi?')}
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent-purple transition-colors" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4.5 pl-14 pr-14 text-white focus:outline-none focus:border-accent-purple/50 focus:bg-white/[0.06] transition-all placeholder:text-white/10 font-bold"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {username.length > 0 && username.length < 3 && (
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-2">{t('auth.min_username', 'Kamida 3 ta belgi')}</p>
                  )}
                  {password.length > 0 && password.length < 6 && (
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-2">{t('auth.min_password', 'Kamida 6 ta belgi')}</p>
                  )}
                </div>
              )}

              {isReset && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">
                      {t('auth.new_password_label', 'Yangi parol')}
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent-purple transition-colors" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4.5 pl-14 pr-14 text-white focus:outline-none focus:border-accent-purple/50 focus:bg-white/[0.06] transition-all placeholder:text-white/10 font-bold"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">
                      {t('auth.confirm_new_password_label', 'Parolni tasdiqlang')}
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent-purple transition-colors" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4.5 pl-14 pr-5 text-white focus:outline-none focus:border-accent-purple/50 focus:bg-white/[0.06] transition-all placeholder:text-white/10 font-bold"
                        placeholder="••••••••"
                      />
                    </div>
                    {newPassword.length > 0 && newPassword.length < 8 && (
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-2">Kamida 8 ta belgi</p>
                    )}
                    {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-2">Parollar mos kelmadi</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {isLogin && (
              <div className="flex items-center gap-2 ml-2 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                {rememberMe ? <CheckSquare size={16} className="text-accent-purple" /> : <Square size={16} className="text-white/20" />}
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                  {t('auth.remember_me', 'Eslab qolish')}
                </span>
              </div>
            )}

            {isRegister && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">{t('auth.referral_label', 'Referral Kod (Ixtiyoriy)')}</label>
                <div className="relative group">
                  <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent-purple transition-colors" size={18} />
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4.5 pl-14 pr-5 text-white focus:outline-none focus:border-accent-purple/50 focus:bg-white/[0.06] transition-all placeholder:text-white/10 font-bold"
                    placeholder="CODE123"
                  />
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-400/10 border border-red-400/20 rounded-2xl text-red-400 text-sm"
                >
                  <AlertCircle size={18} />
                  <p className="font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-2 space-y-4">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full bg-gradient-to-r from-accent-purple to-purple-600 hover:from-accent-purple/90 hover:to-purple-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-accent-purple/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none focus:ring-4 focus:ring-accent-purple/30 outline-none"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    {(isLogin || isRegister) && (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
                    {isLogin ? t('auth.login_btn', 'Tizimga kirish') :
                      isRegister ? t('auth.register_btn', 'Ro\'yxatdan o\'tish') :
                        isForgot ? t('auth.send_link_btn', 'Tiklash havolasini yuborish') :
                          t('auth.update_password_btn', 'Parolni yangilash')}
                    <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {(isForgot || isReset) && (
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  {t('common.cancel', 'Bekor qilish')}
                </button>
              )}
            </div>
          </form>
        </div>
      </motion.div>

      {/* Special Celebration Modal */}
      <AnimatePresence>
        {showSpecialModal && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[200]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowSpecialModal(false); setView('login'); }}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-[#0A0A0A] border-2 border-yellow-400/30 rounded-[40px] p-12 text-center max-w-lg w-full relative shadow-[0_0_50px_rgba(234,179,8,0.2)]"
            >
              <button
                onClick={() => { setShowSpecialModal(false); setView('login'); }}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-xl transition-all"
              >
                <X size={20} className="text-white/40" />
              </button>

              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-yellow-400/20 rotate-12">
                <Crown size={48} fill="black" className="text-black" />
              </div>

              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles size={18} className="text-yellow-400" />
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em]">{t('auth.special_reward', 'MAXSUS MUKOFOT')}</span>
                <Sparkles size={18} className="text-yellow-400" />
              </div>

              <h2 className="text-2xl font-black text-white leading-tight mb-6">
                {specialMessage}
              </h2>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-8">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-loose text-center">
                  Siz bizning VIP foydalanuvchimizga aylandingiz. Tez orada menejerimiz siz bilan bog'lanadi!
                </p>
              </div>

              <button
                onClick={() => { setShowSpecialModal(false); setView('login'); }}
                className="w-full py-5 bg-yellow-400 text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-yellow-400/20"
              >
                DAVOM ETISH
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
