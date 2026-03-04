import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Crown, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import BillingModal, { BillingPlan } from './BillingModal';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan?: string;
    currentUser?: { username?: string; full_name?: string };
    onPlanChange?: () => void;   // called after successful payment → refresh profile
}

export default function PricingModal({
    isOpen,
    onClose,
    currentPlan = 'FREE',
    currentUser,
    onPlanChange,
}: PricingModalProps) {
    const [billingPlan, setBillingPlan] = useState<BillingPlan | null>(null);

    // ESC key to close (only when billing modal is NOT open)
    useEffect(() => {
        if (!isOpen || billingPlan) return;
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [isOpen, billingPlan, onClose]);

    // Body scroll lock
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const isPremium = currentPlan === 'PREMIUM' || currentPlan === 'MONTHLY' || currentPlan === 'LIFETIME';

    const openBilling = (plan: BillingPlan) => {
        // Close pricing backdrop first, then open billing
        setBillingPlan(plan);
    };

    const handleBillingClose = () => setBillingPlan(null);

    const handleBillingSuccess = () => {
        setBillingPlan(null);
        onClose();
        onPlanChange?.();
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                            "fixed inset-0 flex items-start justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto",
                            billingPlan ? "z-[9998]" : "z-[9999]"
                        )}
                        onClick={(e) => { if (e.target === e.currentTarget && !billingPlan) onClose(); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-5xl bg-[#08080c] border border-white/10 rounded-[32px] p-8 md:p-12 my-8"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white z-10"
                            >
                                <X size={24} />
                            </button>

                            {/* Header */}
                            <div className="text-center max-w-2xl mx-auto mb-14">
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">
                                    FASTTIME <span className="text-accent-purple">PRO</span>
                                </h2>
                                <p className="text-white/40 font-bold uppercase tracking-widest text-sm">
                                    O'z unumdorligingizni maksimal darajaga olib chiqing
                                </p>
                            </div>

                            {/* ── Cards Grid ───────────────────────────────── */}
                            <div className="grid md:grid-cols-3 gap-5 items-start">

                                {/* CARD 1: BEPUL */}
                                <div className="relative p-8 rounded-[28px] bg-white/[0.015] border border-white/[0.06] flex flex-col h-full opacity-75 hover:opacity-90 transition-opacity duration-300">
                                    <div className="mb-6">
                                        <h3 className="text-lg font-black text-white/70 uppercase tracking-widest mb-1">BEPUL</h3>
                                        <p className="text-white/30 text-xs">Boshlang'ich imkoniyatlar</p>
                                    </div>
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-white/60">$0</span>
                                            <span className="text-white/20 text-xs uppercase tracking-widest font-bold">/ doimo</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 mb-6 flex-1">
                                        {[
                                            "Asosiy 25:00 taymer",
                                            "Oddiy vazifalar",
                                            "Cheklangan AI (3 marta)",
                                            "2MB avatar yuklash",
                                        ].map((f) => (
                                            <div key={f} className="flex items-center gap-3">
                                                <Check size={15} className="text-white/20 shrink-0" />
                                                <span className="text-xs text-white/40">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-white/0 mb-4 select-none">–</p>
                                    <button
                                        id="pricing-bepul-btn"
                                        onClick={onClose}
                                        className={cn(
                                            "w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                                            !isPremium
                                                ? "bg-white/8 text-white/50 cursor-default"
                                                : "bg-white/5 hover:bg-white/10 text-white/40"
                                        )}
                                    >
                                        {!isPremium ? "JORIY TARIF" : "BEPULGA O'TISH"}
                                    </button>
                                </div>

                                {/* CARD 2: PRO OYLIK */}
                                <div className="relative flex flex-col h-full">
                                    <div className="absolute inset-0 rounded-[28px] bg-accent-purple/20 blur-2xl -z-10 scale-105" />
                                    <div className="relative p-8 rounded-[28px] bg-accent-purple/10 border border-accent-purple/40 flex flex-col h-full transform md:-translate-y-5 shadow-[0_0_60px_-10px_rgba(139,92,246,0.35)]">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-accent-purple text-white text-[10px] font-black uppercase tracking-widest rounded-full whitespace-nowrap shadow-lg shadow-accent-purple/30">
                                            ENG MASHHUR
                                        </div>
                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Crown size={18} className="text-accent-purple" fill="currentColor" />
                                                <h3 className="text-lg font-black text-white uppercase tracking-widest">PRO OYLIK</h3>
                                            </div>
                                            <p className="text-accent-purple/60 text-xs font-medium">Barcha Premium imkoniyatlar</p>
                                        </div>
                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-white">$1.5</span>
                                                <span className="text-accent-purple/50 text-xs uppercase tracking-widest font-bold">/ oy</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3 mb-6 flex-1">
                                            {[
                                                "Cheksiz AI Analizator",
                                                "Ilg'or statistika & Heatmap",
                                                "Custom taymer (20/40/60) + ringtone",
                                                "Fokus musiqalari",
                                                "Jamoaviy Deep Monitoring",
                                                "Golden avatar halqasi",
                                            ].map((f) => (
                                                <div key={f} className="flex items-center gap-3">
                                                    <Check size={15} className="text-accent-purple shrink-0" />
                                                    <span className="text-xs text-white/80 font-medium">{f}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[11px] text-accent-purple/60 font-semibold italic mb-4 text-center">
                                            "Ko'proq ishlash emas. Aqlli ishlash."
                                        </p>
                                        <button
                                            id="pricing-pro-btn"
                                            onClick={() => openBilling('MONTHLY')}
                                            className="w-full py-4 bg-accent-purple text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-accent-purple/90 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent-purple/30 flex items-center justify-center gap-2"
                                        >
                                            HOZIR YANGILASH
                                        </button>
                                    </div>
                                </div>

                                {/* CARD 3: UMRBOQ */}
                                <div className="relative flex flex-col h-full">
                                    <div className="absolute inset-0 rounded-[28px] bg-yellow-400/10 blur-2xl -z-10 scale-105" />
                                    <div className="relative p-8 rounded-[28px] bg-gradient-to-b from-yellow-400/10 to-yellow-400/[0.03] border-2 border-yellow-400/40 flex flex-col h-full shadow-[0_0_50px_-15px_rgba(250,204,21,0.3)]">
                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <InfinityIcon size={18} className="text-yellow-400" />
                                                <h3 className="text-lg font-black text-white uppercase tracking-widest">UMRBOQ</h3>
                                            </div>
                                            <p className="text-yellow-400/60 text-xs font-medium">Bir marta to'lang, abadiy foydalaning</p>
                                        </div>
                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-yellow-400">$49</span>
                                                <span className="text-yellow-400/40 text-xs uppercase tracking-widest font-bold">bir martalik</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3 mb-6 flex-1">
                                            {[
                                                "Barcha Pro imkoniyatlar",
                                                "Kelajakdagi barcha yangilanishlar",
                                                "Early Access (Beta)",
                                                "Founder Badge",
                                                "Maxsus asoschilar hamjamiyati",
                                            ].map((f) => (
                                                <div key={f} className="flex items-center gap-3">
                                                    <Check size={15} className="text-yellow-400 shrink-0" />
                                                    <span className="text-xs text-white/80 font-medium">{f}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[11px] text-yellow-400/60 font-semibold italic mb-4 text-center">
                                            "Bir martalik to'lov. Umrbod mahsuldorlik."
                                        </p>
                                        <button
                                            id="pricing-umrboq-btn"
                                            onClick={() => openBilling('LIFETIME')}
                                            className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-300 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-yellow-400/25 flex items-center justify-center gap-2"
                                        >
                                            UMRBOQ TARIF
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Footer trust line */}
                            <p className="text-center text-white/20 text-[10px] tracking-widest uppercase mt-8 font-bold">
                                🔒 Xavfsiz va shifrlangan to'lov
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Billing Modal — rendered on top, z-[10000] */}
            {billingPlan && (
                <BillingModal
                    isOpen={!!billingPlan}
                    plan={billingPlan}
                    currentUser={currentUser}
                    onClose={handleBillingClose}
                    onSuccess={handleBillingSuccess}
                />
            )}
        </>
    );
}
