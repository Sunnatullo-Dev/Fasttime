import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, Crown, ShieldCheck, Zap, User as UserIcon,
    Phone, Loader2, CheckCircle2, CreditCard,
    Lock, Check, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'info' | 'payment_method' | 'summary' | 'success';

export default function PremiumModal({ isOpen, onClose, onSuccess }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>('info');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agreed, setAgreed] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: ''
    });
    const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'click'>('stripe');
    const [errors, setErrors] = useState({
        fullName: '',
        phone: '',
        agreed: ''
    });

    const price = "$19";

    // Reset modal when opened
    useEffect(() => {
        if (isOpen) {
            setStep('info');
            setFormData({ fullName: '', phone: '' });
            setError(null);
            setErrors({ fullName: '', phone: '', agreed: '' });
            setAgreed(false);
        }
    }, [isOpen]);

    const validateInfo = () => {
        const newErrors = { fullName: '', phone: '', agreed: '' };
        let isValid = true;

        if (!formData.fullName.trim()) {
            newErrors.fullName = t('premium_modal.error_name', 'Ism familiyangizni kiriting');
            isValid = false;
        }

        const phoneRegex = /^\+?[\d\s-]{9,}$/;
        if (!formData.phone.trim()) {
            newErrors.phone = t('premium_modal.error_phone', 'Telefon raqamingizni kiriting');
            isValid = false;
        } else if (!phoneRegex.test(formData.phone)) {
            newErrors.phone = t('premium_modal.error_phone_format', "Telefon raqami noto'g'ri formatda");
            isValid = false;
        }

        if (!agreed) {
            newErrors.agreed = t('premium_modal.error_agree', 'Shartlarga rozilik bildirishingiz kerak');
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleNextToPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateInfo()) {
            setStep('payment_method');
        }
    };

    const handlePurchase = async () => {
        setLoading(true);
        setError(null);

        try {
            // First update profile to ensure we have name and phone
            await api.post('/auth/update-profile', {
                full_name: formData.fullName,
                phone: formData.phone
            });

            // Then create checkout session
            const response = await api.post('/payment/create-checkout-session', {
                provider: selectedProvider
            });

            if (response.data.url) {
                window.location.href = response.data.url;
            } else {
                throw new Error(t('premium_modal.error_session', "Sessiya yaratib bo'lmadi"));
            }

        } catch (err: any) {
            setError(err.response?.data?.error || t('premium_modal.error_payment', "To'lovni amalga oshirishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring."));
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={loading ? undefined : onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-xl bg-zinc-950 border border-white/10 rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.15)]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-accent-purple/20 rounded-xl flex items-center justify-center">
                                    <Crown className="text-accent-purple" size={24} fill="currentColor" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">{t('sidebar.premium', 'FASTTIME PREMIUM')}</h2>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{t('premium_modal.lifetime', 'Lifetime Activation')}</p>
                                </div>
                            </div>
                            {!loading && step !== 'success' && (
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/20 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            )}
                        </div>

                        <div className="p-8">
                            <AnimatePresence mode="wait">
                                {step === 'info' && (
                                    <motion.div
                                        key="info"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">{t('premium_modal.full_name', 'Full Name')}</label>
                                                <div className="relative group">
                                                    <UserIcon className={cn(
                                                        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                                                        errors.fullName ? "text-red-400" : "text-white/20 group-focus-within:text-accent-purple"
                                                    )} size={18} />
                                                    <input
                                                        type="text"
                                                        value={formData.fullName}
                                                        onChange={(e) => {
                                                            setFormData({ ...formData, fullName: e.target.value });
                                                            if (errors.fullName) setErrors({ ...errors, fullName: '' });
                                                        }}
                                                        placeholder="Sunnatulla Samandarov"
                                                        className={cn(
                                                            "w-full bg-white/5 border rounded-2xl py-4 pl-12 pr-4 text-sm transition-all focus:outline-none",
                                                            errors.fullName ? "border-red-400/50 bg-red-400/5" : "border-white/5 focus:border-accent-purple focus:bg-white/[0.08]"
                                                        )}
                                                    />
                                                </div>
                                                {errors.fullName && <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider ml-1">{errors.fullName}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">{t('premium_modal.phone', 'Phone Number')}</label>
                                                <div className="relative group">
                                                    <Phone className={cn(
                                                        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                                                        errors.phone ? "text-red-400" : "text-white/20 group-focus-within:text-accent-purple"
                                                    )} size={18} />
                                                    <input
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={(e) => {
                                                            setFormData({ ...formData, phone: e.target.value });
                                                            if (errors.phone) setErrors({ ...errors, phone: '' });
                                                        }}
                                                        placeholder="+998 90 123 45 67"
                                                        className={cn(
                                                            "w-full bg-white/5 border rounded-2xl py-4 pl-12 pr-4 text-sm transition-all focus:outline-none",
                                                            errors.phone ? "border-red-400/50 bg-red-400/5" : "border-white/5 focus:border-accent-purple focus:bg-white/[0.08]"
                                                        )}
                                                    />
                                                </div>
                                                {errors.phone && <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider ml-1">{errors.phone}</p>}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAgreed(!agreed);
                                                    if (errors.agreed) setErrors({ ...errors, agreed: '' });
                                                }}
                                                className="flex items-start gap-3 group cursor-pointer py-2"
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all mt-0.5",
                                                    agreed ? "bg-accent-purple border-accent-purple" : "border-white/10 bg-white/5 group-hover:border-white/20"
                                                )}>
                                                    {agreed && <Check size={14} className="text-white" />}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-widest">
                                                        {t('premium_modal.agree', 'I agree to the Terms of Service and Privacy Policy')}
                                                    </p>
                                                    {errors.agreed && <p className="text-[9px] text-red-400 font-bold mt-1 uppercase tracking-wider">{errors.agreed}</p>}
                                                </div>
                                            </button>
                                        </div>

                                        <button
                                            onClick={handleNextToPayment}
                                            className="w-full bg-white text-black py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
                                        >
                                            {t('premium_modal.to_payment', "To'lovga o'tish")}
                                        </button>
                                    </motion.div>
                                )}

                                {step === 'payment_method' && (
                                    <motion.div
                                        key="payment_method"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">{t('premium_modal.select_method', "To'lov usulini tanlang")}</p>

                                            <button
                                                onClick={() => setSelectedProvider('stripe')}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-6 rounded-3xl border transition-all",
                                                    selectedProvider === 'stripe' ? "bg-accent-purple/10 border-accent-purple" : "bg-white/5 border-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-[#635BFF]/10 text-[#635BFF] rounded-2xl flex items-center justify-center">
                                                        <CreditCard size={24} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-black">STRIPE</p>
                                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('premium_modal.stripe_desc', 'Xalqaro kartalar (Visa, Mastercard)')}</p>
                                                    </div>
                                                </div>
                                                {selectedProvider === 'stripe' && <CheckCircle2 className="text-accent-purple" size={24} />}
                                            </button>

                                            <button
                                                onClick={() => setSelectedProvider('click')}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-6 rounded-3xl border transition-all",
                                                    selectedProvider === 'click' ? "bg-accent-blue/10 border-accent-blue" : "bg-white/5 border-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-[#00AEEF]/10 text-[#00AEEF] rounded-2xl flex items-center justify-center font-black italic">
                                                        C
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-black">CLICK.UZ</p>
                                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('premium_modal.click_desc', "O'zbekiston (Uzcard, Humo)")}</p>
                                                    </div>
                                                </div>
                                                {selectedProvider === 'click' && <CheckCircle2 className="text-accent-blue" size={24} />}
                                            </button>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setStep('info')}
                                                className="px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all"
                                            >
                                                {t('premium_modal.back', 'Orqaga')}
                                            </button>
                                            <button
                                                onClick={() => setStep('summary')}
                                                className="flex-1 bg-white text-black py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-[0.98]"
                                            >
                                                {t('premium_modal.continue', 'Davom etish')}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                                {step === 'summary' && (
                                    <motion.div
                                        key="summary"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        {/* Payment Card */}
                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <CreditCard size={120} />
                                            </div>

                                            <div className="relative z-10 space-y-6">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[10px] font-black text-accent-purple uppercase tracking-[0.3em] mb-2">{t('premium_modal.selected_product', 'Selected Product')}</p>
                                                        <h3 className="text-2xl font-black">FASTTIME LIFE</h3>
                                                    </div>
                                                    <div className="px-3 py-1 bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-yellow-400/10">
                                                        {t('premium_modal.one_time', 'One-Time Payment')}
                                                    </div>
                                                </div>

                                                <div className="space-y-3 pt-4 border-t border-white/5">
                                                    <div className="flex justify-between text-xs font-bold text-white/40">
                                                        <span>{t('premium_modal.access_type', 'Access Type')}</span>
                                                        <span className="text-white/80">{t('premium_modal.unlimited', 'Unlimited Forever')}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs font-bold text-white/40">
                                                        <span>{t('premium_modal.payment_method', "To'lov usuli")}</span>
                                                        <span className="text-white/80 uppercase">{selectedProvider}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs font-bold text-white/40">
                                                        <span>{t('premium_modal.customer', 'Mijoz')}</span>
                                                        <span className="text-white/80">{formData.fullName}</span>
                                                    </div>
                                                </div>

                                                <div className="pt-6 flex items-baseline justify-between border-t border-white/10">
                                                    <span className="text-sm font-black text-white/40 uppercase tracking-widest">{t('premium_modal.total_price', 'Total Price')}</span>
                                                    <span className="text-5xl font-black text-white">{price}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="p-4 bg-red-400/10 border border-red-400/20 rounded-2xl flex items-center gap-3 text-red-400">
                                                <AlertCircle size={20} />
                                                <p className="text-[10px] font-bold uppercase tracking-wider">{error}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-4">
                                            <button
                                                disabled={loading}
                                                onClick={() => setStep('payment_method')}
                                                className="px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all disabled:opacity-0"
                                            >
                                                {t('premium_modal.back', 'Back')}
                                            </button>
                                            <button
                                                disabled={loading}
                                                onClick={handlePurchase}
                                                className="flex-1 bg-accent-purple text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(139,92,246,0.2)] hover:shadow-[0_0_70px_rgba(139,92,246,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={20} />
                                                        {t('premium_modal.processing', 'Processing...')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock size={18} fill="white" />
                                                        {t('premium_modal.complete_purchase', 'Complete Purchase')}
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-white/20 uppercase tracking-widest mt-4">
                                            <ShieldCheck size={14} />
                                            {t('premium_modal.secure_notice', 'Secure 256-bit SSL encrypted payment')}
                                        </div>
                                    </motion.div>
                                )}

                                {step === 'success' && (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-12 flex flex-col items-center text-center space-y-8"
                                    >
                                        <div className="relative">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1.2 }}
                                                className="absolute inset-0 bg-accent-purple/20 blur-[60px] rounded-full"
                                            />
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", damping: 10, stiffness: 100 }}
                                                className="w-24 h-24 bg-accent-purple rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(139,92,246,0.5)] relative z-10"
                                            >
                                                <Check size={48} strokeWidth={4} className="text-white" />
                                            </motion.div>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <h3 className="text-3xl font-black tracking-tighter">{t('premium_modal.success_title', 'ORDER COMPLETE!')}</h3>
                                            <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em] px-8">
                                                {t('premium_modal.success_desc', 'Welcome to the FASTTIME family. Your premium status is now active forever.')}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 px-6 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                            <CheckCircle2 size={14} />
                                            {t('premium_modal.activated', 'Premium Activated 🎉')}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Progress Bar */}
                        {step !== 'success' && (
                            <div className="h-1 bg-white/5 w-full overflow-hidden">
                                <motion.div
                                    initial={{ width: "25%" }}
                                    animate={{
                                        width: step === 'info' ? "25%" :
                                            step === 'payment_method' ? "50%" :
                                                "75%"
                                    }}
                                    className="h-full bg-accent-purple shadow-[0_0_100px_#8B5CF6]"
                                />
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
