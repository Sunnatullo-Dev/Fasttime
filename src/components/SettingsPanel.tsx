import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, User as UserIcon, Phone, Lock, CreditCard, LogOut, Loader2, Camera, Eye, EyeOff, ShieldCheck, Crown, Zap, ChevronRight, Settings, CheckCircle2, AlertCircle, Copy, Check, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { User as UserType } from '../types';
import { toast } from 'sonner';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserType | null;
    onUpdate: () => void;
}

export default function SettingsPanel({ isOpen, onClose, user: initialUser, onUpdate }: SettingsPanelProps) {
    const { t } = useTranslation();
    const [activeSubTab, setActiveSubTab] = useState<'profile' | 'phone' | 'password' | 'plan'>('profile');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<UserType | null>(initialUser);
    const [fullName, setFullName] = useState(initialUser?.full_name || '');
    const [username, setUsername] = useState(initialUser?.username || '');
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
    const [usernameMessage, setUsernameMessage] = useState('');
    const [phoneNumber, setPhoneNumber] = useState(initialUser?.phone || '');
    const [email, setEmail] = useState(initialUser?.email || '');
    const [avatar, setAvatar] = useState(initialUser?.avatar_url || initialUser?.avatar || '');
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [showPass, setShowPass] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Username Debounce & Selection
    useEffect(() => {
        if (!isOpen) return;

        const validate = () => {
            if (initialUser && username.toLowerCase() === initialUser.username?.toLowerCase()) {
                setUsernameStatus('available');
                setUsernameMessage('Sizning hozirgi username\'ingiz');
                return false;
            }
            if (!username) {
                setUsernameStatus('invalid');
                setUsernameMessage('Username bo\'sh bo\'lishi mumkin emas');
                return false;
            }
            if (username.length < 4) {
                setUsernameStatus('invalid');
                setUsernameMessage('Kamida 4 ta belgi');
                return false;
            }
            if (!/^[a-z0-9_]+$/.test(username)) {
                setUsernameStatus('invalid');
                setUsernameMessage('Faqat harf, son va _ mumkin');
                return false;
            }
            return true;
        };

        if (validate()) {
            setUsernameStatus('checking');
            const timer = setTimeout(async () => {
                try {
                    const res = await api.get(`/auth/check-username?username=${username}`);
                    if (res.data.available) {
                        setUsernameStatus('available');
                        setUsernameMessage(res.data.message || 'Username mavjud');
                    } else {
                        setUsernameStatus('taken');
                        setUsernameMessage(res.data.message || 'Username band');
                    }
                } catch (e) {
                    setUsernameStatus('invalid');
                    setUsernameMessage('Tekshirishda xatolik');
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [username, initialUser, isOpen]);

    useEffect(() => {
        if (initialUser) {
            setFullName(initialUser.full_name || '');
            setUsername(initialUser.username || '');
            setPhoneNumber(initialUser.phone || '');
            setEmail(initialUser.email || '');
            setAvatar(initialUser.avatar_url || initialUser.avatar || '');
            setUser(initialUser);
        }
    }, [initialUser]);

    const isPhoneValid = phoneNumber.startsWith('+998') && phoneNumber.replace(/\s/g, '').length === 13 && /^\+998\d{9}$/.test(phoneNumber.replace(/\s/g, ''));
    const isUsernameValid = usernameStatus === 'available' || username === initialUser?.username;
    const isEmailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const canSave = (fullName !== initialUser?.full_name || username !== initialUser?.username || email !== initialUser?.email || phoneNumber !== initialUser?.phone || avatar !== initialUser?.avatar)
        && isUsernameValid && isEmailValid && (phoneNumber === '' || isPhoneValid);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation - Support both plan and is_premium
        const isPremium = user?.plan === 'PREMIUM' || user?.is_premium;
        const maxSize = isPremium ? 5 * 1024 * 1024 : 2 * 1024 * 1024;

        if (file.size > maxSize) {
            if (isPremium) {
                toast.error("Premium allows up to 5MB");
            } else {
                toast.error("Free plan allows up to 2MB");
            }
            return;
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Faqat jpg, png va webp formatlari ruxsat etilgan');
            return;
        }

        setSaving(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await api.post('/auth/upload-avatar', formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
                    setUploadProgress(percentCompleted);
                }
            });

            // Cache busting for the new avatar
            const newAvatarUrl = `${res.data.avatarUrl}?t=${Date.now()}`;
            setAvatar(newAvatarUrl);
            toast.success('Profil rasmi yangilandi');
            onUpdate();
        } catch (error: any) {
            console.error('Avatar upload error:', error);
            // Show specific backend message if available
            const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Yuklashda xatolik';
            toast.error(errorMsg);
        } finally {
            setSaving(false);
            setUploadProgress(0);
        }
    };

    const saveProfile = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            await api.post('/auth/update-profile', {
                full_name: fullName,
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                phone: phoneNumber,
                avatar
            });
            toast.success(t('common.success', 'Profil yangilandi.'), { duration: 2000 });
            onUpdate();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async () => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(passwords.new)) {
            toast.error('Parol kamida 8 ta belgi, 1 ta katta harf, 1 ta kichik harf va 1 ta raqamdan iborat bo\'lishi kerak');
            return;
        }
        if (passwords.new !== passwords.confirm) {
            toast.error('Yangi parollar mos kelmadi');
            return;
        }

        setSaving(true);
        try {
            await api.put('/auth/change-password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            toast.success('Parol muvaffaqiyatli yangilandi');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.reload();
    };

    const getPasswordStrength = () => {
        if (!passwords.new) return 0;
        let strength = 0;
        if (passwords.new.length >= 8) strength += 25;
        if (/[A-Z]/.test(passwords.new)) strength += 25;
        if (/[a-z]/.test(passwords.new)) strength += 25;
        if (/[0-9]/.test(passwords.new)) strength += 25;
        return strength;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-4 md:inset-10 lg:inset-x-60 lg:inset-y-20 bg-[#0A0A0A] border border-white/5 rounded-[40px] z-[101] shadow-2xl flex flex-col md:flex-row overflow-hidden"
                    >
                        {/* Navigation Sidebar */}
                        <div className="w-full md:w-80 border-r border-white/5 p-8 flex flex-col bg-white/[0.02]">
                            <div className="flex items-center gap-3 mb-10 px-2 text-white">
                                <div className="w-10 h-10 bg-accent-purple rounded-xl flex items-center justify-center shadow-lg shadow-accent-purple/20">
                                    <Settings size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight uppercase leading-none">{t('profile.settings_title', 'SOZLAMALAR')}</h2>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">ACCOUNT V2.0</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-2">
                                {[
                                    { id: 'profile', icon: UserIcon, label: t('sidebar.profile', 'Profil'), color: 'text-accent-purple' },
                                    { id: 'phone', icon: Phone, label: t('profile.phone', 'Telefon'), color: 'text-accent-blue' },
                                    { id: 'password', icon: Lock, label: t('profile.security', 'Xavfsizlik'), color: 'text-orange-500' },
                                    { id: 'plan', icon: CreditCard, label: t('profile.billing', 'To\'lovlar'), color: 'text-emerald-500' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSubTab(tab.id as any)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
                                            activeSubTab === tab.id
                                                ? "bg-white text-black shadow-xl scale-[1.02]"
                                                : "text-white/40 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <tab.icon size={20} className={cn(activeSubTab === tab.id ? "text-black" : tab.color)} />
                                            <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                                        </div>
                                        <ChevronRight size={16} className={cn("opacity-50", activeSubTab === tab.id && "text-black")} />
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleLogout}
                                className="mt-6 w-full flex items-center gap-4 p-5 rounded-3xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all group"
                            >
                                <LogOut size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">{t('sidebar.logout', 'CHIQISH')}</span>
                            </button>

                            <button
                                onClick={onClose}
                                className="md:hidden mt-4 w-full p-4 text-white/40 text-[10px] font-black uppercase tracking-widest"
                            >
                                YOPISH
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 p-6 md:p-12 relative">
                            <button
                                onClick={onClose}
                                className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white/40 hover:text-white hidden md:block"
                            >
                                <X size={20} />
                            </button>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeSubTab}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="max-w-xl mx-auto"
                                >
                                    {/* Profile Section */}
                                    {activeSubTab === 'profile' && (
                                        <div className="space-y-10">
                                            <div className="flex flex-col items-center gap-6 p-10 bg-accent-purple/5 border border-accent-purple/20 rounded-[40px] relative overflow-hidden group/profile">
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="relative w-32 h-32 cursor-pointer group"
                                                >
                                                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-accent-purple/30 group-hover:border-accent-purple transition-colors animate-[spin_10s_linear_infinite]" />
                                                    <div className="absolute inset-2 rounded-full overflow-hidden bg-white/5 border border-white/10 group-hover:border-accent-purple transition-all shadow-2xl">
                                                        {avatar ? (
                                                            <img
                                                                src={avatar}
                                                                alt="Avatar"
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                            />
                                                        ) : (
                                                            <UserIcon size={64} className="text-accent-purple/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                        )}
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 backdrop-blur-[2px]">
                                                            <Camera size={24} className="text-white animate-bounce" />
                                                            <span className="text-[8px] font-black text-white uppercase tracking-tighter">O'ZGARTIRISH</span>
                                                        </div>
                                                        {saving && (
                                                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                                                                <div className="relative w-12 h-12 flex items-center justify-center">
                                                                    <svg className="w-full h-full -rotate-90">
                                                                        <circle cx="24" cy="24" r="20" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                                                        <circle
                                                                            cx="24"
                                                                            cy="24"
                                                                            r="20"
                                                                            fill="transparent"
                                                                            stroke="#A855F7"
                                                                            strokeWidth="4"
                                                                            strokeDasharray={126}
                                                                            strokeDashoffset={126 - (126 * uploadProgress) / 100}
                                                                            className="transition-all duration-300"
                                                                        />
                                                                    </svg>
                                                                    <span className="absolute text-[8px] font-black">{uploadProgress}%</span>
                                                                </div>
                                                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">YUKLANMOQDA...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleAvatarChange}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                                <div className="text-center">
                                                    <h3 className="text-xl font-black uppercase tracking-tight">{username || 'Foydalanuvchi'}</h3>
                                                    <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mt-1">FASTTIME PRO IDENTITY</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">{t('profile.full_name', 'To\'liq ism')}</label>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-accent-purple transition-colors">
                                                            <UserIcon size={18} />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={fullName}
                                                            onChange={(e) => setFullName(e.target.value)}
                                                            placeholder={t('profile.full_name_placeholder', 'Ismingizni kiriting')}
                                                            className="w-full bg-white/5 border border-white/5 hover:border-white/10 rounded-[28px] p-5 pl-12 text-sm font-bold focus:outline-none focus:border-accent-purple transition-all focus:bg-white/[0.08] placeholder:text-white/10"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center ml-2">
                                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Foydalanuvchi nomi (Username)</label>
                                                        <AnimatePresence>
                                                            {usernameStatus !== 'idle' && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: 10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    exit={{ opacity: 0 }}
                                                                    className={cn(
                                                                        "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter",
                                                                        usernameStatus === 'available' ? "text-emerald-400" : usernameStatus === 'checking' ? "text-accent-blue" : "text-red-400"
                                                                    )}
                                                                >
                                                                    {usernameStatus === 'checking' && <Loader2 size={10} className="animate-spin" />}
                                                                    {usernameStatus === 'available' && <CheckCircle2 size={10} />}
                                                                    {usernameStatus === 'taken' && <AlertCircle size={10} />}
                                                                    {usernameMessage}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-accent-purple transition-colors">
                                                            <span className="text-sm font-black">@</span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={username}
                                                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                                            placeholder="my_username"
                                                            className={cn(
                                                                "w-full bg-white/5 border rounded-[28px] p-5 pl-12 text-sm font-bold focus:outline-none transition-all focus:bg-white/[0.08] placeholder:text-white/10",
                                                                usernameStatus === 'available' ? "border-emerald-500/30" : usernameStatus === 'taken' || usernameStatus === 'invalid' ? "border-red-500/30" : "border-white/5 focus:border-accent-purple"
                                                            )}
                                                        />
                                                        {usernameStatus === 'available' && (
                                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] text-white/20 font-medium ml-4">
                                                    </p>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Email Manzili</label>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-accent-purple transition-colors">
                                                            <Mail size={18} />
                                                        </div>
                                                        <input
                                                            type="email"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            placeholder="example@mail.com"
                                                            className={cn(
                                                                "w-full bg-white/5 border rounded-[28px] p-5 pl-12 text-sm font-bold focus:outline-none transition-all focus:bg-white/[0.08] placeholder:text-white/10",
                                                                email && !isEmailValid ? "border-red-500/30" : "border-white/5 focus:border-accent-purple"
                                                            )}
                                                        />
                                                    </div>
                                                    {!initialUser?.email && (
                                                        <p className="text-[9px] text-yellow-500/60 font-medium ml-4 uppercase tracking-wider italic">
                                                            ⚠️ Parolni tiklash uchun email kiritishingiz shart!
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="pt-4 space-y-4">
                                                    <button
                                                        onClick={() => {
                                                            const link = `${window.location.origin}/u/${username}`;
                                                            navigator.clipboard.writeText(link);
                                                            toast.success('Profil havolasi nusxalandi');
                                                        }}
                                                        className="w-full flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-accent-purple/10 rounded-lg text-accent-purple">
                                                                <Copy size={14} />
                                                            </div>
                                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Profil havolasi</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">fasttime.pro/u/{username}</span>
                                                    </button>

                                                    <button
                                                        onClick={saveProfile}
                                                        disabled={saving || !canSave}
                                                        className="w-full p-5 bg-accent-purple text-white rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-accent-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                                                    >
                                                        {saving ? <Loader2 className="animate-spin" size={20} /> : (
                                                            <>
                                                                <CheckCircle2 size={18} />
                                                                {t('profile.save_changes', 'O\'zgarishlarni saqlash')}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Phone Section */}
                                    {activeSubTab === 'phone' && (
                                        <div className="space-y-10">
                                            <div className="flex items-center gap-6 p-8 bg-accent-blue/5 border border-accent-blue/20 rounded-[40px]">
                                                <div className="p-5 bg-accent-blue/10 rounded-3xl text-accent-blue">
                                                    <Phone size={32} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black uppercase tracking-tight">{t('profile.phone_verification', 'Telefonni tasdiqlash')}</h4>
                                                    <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mt-1">{t('profile.phone_secured_by', 'FASTTIME AI tomonidan himoyalangan')}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center ml-2">
                                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{t('profile.phone_number', 'Telefon raqami')}</label>
                                                        {phoneNumber && (
                                                            <div className={cn(
                                                                "flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter",
                                                                isPhoneValid ? "text-emerald-400" : "text-red-400"
                                                            )}>
                                                                {isPhoneValid ? <Check size={10} /> : <AlertCircle size={10} />}
                                                                {isPhoneValid ? 'Tasdiqlandi' : 'Noto\'g\'ri format'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-accent-blue transition-colors">
                                                            <Phone size={18} />
                                                        </div>
                                                        <input
                                                            type="tel"
                                                            value={phoneNumber}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val.length <= 17) { // Increased length for spaces
                                                                    setPhoneNumber(val);
                                                                }
                                                            }}
                                                            placeholder="+998901234567"
                                                            className={cn(
                                                                "w-full bg-white/5 border rounded-[28px] p-5 pl-12 text-sm font-bold focus:outline-none transition-all focus:bg-white/[0.08]",
                                                                phoneNumber && (isPhoneValid ? "border-emerald-500/30" : "border-red-500/30"),
                                                                !phoneNumber && "border-white/5 focus:border-accent-blue"
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-loose">
                                                        Faqat O'zbekiston raqamlari (+998) tasdiqlanadi. Xavfsizlik maqsadida bitta raqam faqat bitta hisobda bo'lishi mumkin.
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={saveProfile}
                                                    disabled={saving || (phoneNumber !== '' && !isPhoneValid) || phoneNumber === initialUser?.phone}
                                                    className="w-full p-5 bg-accent-blue text-white rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-accent-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                                                >
                                                    {saving ? <Loader2 className="animate-spin" size={20} /> : (
                                                        <>
                                                            <Zap size={18} />
                                                            {t('profile.update_phone', 'Telefonni yangilash')}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Security/Password Section */}
                                    {activeSubTab === 'password' && (
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-6 p-8 bg-orange-500/5 border border-orange-500/20 rounded-[40px]">
                                                <div className="p-5 bg-orange-500/10 rounded-3xl text-orange-500">
                                                    <ShieldCheck size={32} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black uppercase tracking-tight">{t('profile.security_shield', 'Xavfsizlik Qalqoni')}</h4>
                                                    <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mt-1">AES-256 BIT SHIFRLASH FAOL</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div className="space-y-6">
                                                    <div className="space-y-4">
                                                        <div className="space-y-2 relative group">
                                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Joriy parol</label>
                                                            <div className="relative">
                                                                <input
                                                                    type={showPass ? "text" : "password"}
                                                                    value={passwords.current}
                                                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                                                    placeholder="••••••••"
                                                                    className="w-full bg-white/5 border border-white/5 group-focus-within:border-orange-500/50 rounded-2xl p-5 text-sm font-bold focus:outline-none transition-all pr-14 placeholder:text-white/5"
                                                                />
                                                                <button
                                                                    onClick={() => setShowPass(!showPass)}
                                                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                                                                >
                                                                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 group">
                                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Yangi parol</label>
                                                            <input
                                                                type={showPass ? "text" : "password"}
                                                                value={passwords.new}
                                                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                                placeholder="Kamida 8 belgi..."
                                                                className="w-full bg-white/5 border border-white/5 group-focus-within:border-orange-500/50 rounded-2xl p-5 text-sm font-bold focus:outline-none transition-all placeholder:text-white/5"
                                                            />
                                                        </div>

                                                        <div className="space-y-2 group">
                                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Yangi parolni tasdiqlang</label>
                                                            <input
                                                                type={showPass ? "text" : "password"}
                                                                value={passwords.confirm}
                                                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                                placeholder="••••••••"
                                                                className={cn(
                                                                    "w-full bg-white/5 border rounded-2xl p-5 text-sm font-bold focus:outline-none transition-all placeholder:text-white/5",
                                                                    passwords.confirm && (passwords.new === passwords.confirm ? "border-emerald-500/20" : "border-red-500/20"),
                                                                    !passwords.confirm && "border-white/5 group-focus-within:border-orange-500/50"
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                                                        <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Xavfsizlik talablari:</h5>
                                                        <ul className="space-y-3">
                                                            {[
                                                                { label: 'Kamida 8 ta belgi', met: passwords.new.length >= 8 },
                                                                { label: 'Kamida bitta katta harf', met: /[A-Z]/.test(passwords.new) },
                                                                { label: 'Kamida bitta kichik harf', met: /[a-z]/.test(passwords.new) },
                                                                { label: 'Kamida bitta raqam', met: /[0-9]/.test(passwords.new) },
                                                                { label: 'Parollar mos kelishi', met: passwords.new && passwords.new === passwords.confirm }
                                                            ].map((rule, i) => (
                                                                <li key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                                                                    <div className={cn(
                                                                        "w-1.5 h-1.5 rounded-full transition-all",
                                                                        rule.met ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/10"
                                                                    )} />
                                                                    <span className={rule.met ? "text-white" : "text-white/20"}>{rule.label}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="space-y-3 px-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Himoya darajasi</span>
                                                            <span className={cn(
                                                                "text-[10px] font-black uppercase tracking-widest",
                                                                getPasswordStrength() === 100 ? "text-emerald-500" : getPasswordStrength() >= 50 ? "text-orange-500" : "text-red-500"
                                                            )}>
                                                                {getPasswordStrength() === 100 ? 'MUKAMMAL' : getPasswordStrength() >= 50 ? 'O\'RTACHA' : 'ZAIF'}
                                                            </span>
                                                        </div>
                                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden flex gap-1">
                                                            <div className={cn("h-full transition-all duration-500", getPasswordStrength() >= 25 ? "bg-red-500 w-1/4" : "bg-white/5 w-1/4")} />
                                                            <div className={cn("h-full transition-all duration-500", getPasswordStrength() >= 50 ? "bg-orange-500 w-1/4" : "bg-white/5 w-1/4")} />
                                                            <div className={cn("h-full transition-all duration-500", getPasswordStrength() >= 75 ? "bg-yellow-500 w-1/4" : "bg-white/5 w-1/4")} />
                                                            <div className={cn("h-full transition-all duration-500", getPasswordStrength() === 100 ? "bg-emerald-500 w-1/4" : "bg-white/5 w-1/4")} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={changePassword}
                                                disabled={saving || getPasswordStrength() < 100 || passwords.new !== passwords.confirm}
                                                className="w-full p-5 bg-orange-600 text-white rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                                            >
                                                {saving ? <Loader2 className="animate-spin" size={20} /> : (
                                                    <>
                                                        <ShieldCheck size={18} />
                                                        YANGI PAROLNI SAQLASH
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Plan/Billing Section */}
                                    {activeSubTab === 'plan' && (
                                        <div className="space-y-10">
                                            <div className="p-10 bg-gradient-to-br from-accent-purple via-accent-blue to-accent-purple bg-[length:200%_auto] animate-gradient rounded-[40px] text-white flex items-center justify-between shadow-2xl shadow-accent-purple/20 overflow-hidden relative group">
                                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-100%] group-hover:translate-x-[100%] duration-1000" />
                                                <div className="relative z-10">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">{t('profile.current_activity', 'Joriy holat')}</p>
                                                    <h3 className="text-4xl font-black italic tracking-tighter mb-4">
                                                        {user?.is_premium ? t('profile.premium_life', 'PREMIUM LIFE') : t('profile.free_plan', 'BEPUL REJA')}
                                                    </h3>
                                                    <div className="px-5 py-2 bg-white/20 rounded-full inline-flex items-center gap-2 backdrop-blur-md">
                                                        {user?.is_premium ? <Crown size={14} fill="white" /> : <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{user?.is_premium ? t('profile.lifetime_access', 'UMRBOD KIRISH') : t('profile.free', 'BEPUL')}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end relative z-10">
                                                    <Zap size={80} fill="rgba(255,255,255,0.2)" className="mb-4" />
                                                    {!user?.is_premium && (
                                                        <button className="px-6 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                                                            {t('profile.upgrade_now', 'Hozir yangilash')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[40px] flex flex-col items-center text-center">
                                                    <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">{t('profile.member_since', 'A\'zo bo\'lgan sana')}</h5>
                                                    <p className="text-2xl font-black italic">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}</p>
                                                </div>
                                                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[40px] flex flex-col items-center text-center">
                                                    <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">{t('profile.account_id', 'Hisob ID')}</h5>
                                                    <p className="text-2xl font-black italic text-accent-blue">#FT-00{user?.id}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
