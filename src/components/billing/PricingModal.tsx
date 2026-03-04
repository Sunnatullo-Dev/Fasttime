import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Crown, Infinity as InfinityIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PricingModalProps {
    open: boolean;
    onClose: () => void;
    user: any;
    onSelectPlan: (plan: "FREE" | "MONTHLY" | "LIFETIME") => void;
}

export const isPremiumActive = (profile: any) => {
    if (!profile) return false;
    return (
        profile.plan === "LIFETIME" ||
        profile.plan === "PREMIUM" ||
        (profile.plan === "MONTHLY" &&
            profile.plan_expires_at &&
            new Date(profile.plan_expires_at) > new Date())
    );
};

export default function PricingModal({ open, onClose, user, onSelectPlan }: PricingModalProps) {
    const [showAlreadyPremium, setShowAlreadyPremium] = useState(false);

    // ESC key to close
    useEffect(() => {
        if (!open) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [open, onClose]);

    // Body scroll lock
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (typeof document === 'undefined') return null;

    const premium = isPremiumActive(user);

    const handleSelect = (plan: "MONTHLY" | "LIFETIME") => {
        if (premium) {
            setShowAlreadyPremium(true);
            return;
        }
        onSelectPlan(plan);
    };

    const modal = (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative max-w-[1100px] w-[92vw] mx-auto rounded-[32px] bg-gradient-to-br from-[#0B1020] via-[#070A12] to-[#0B1020] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Already Premium Overlay */}
                        <AnimatePresence>
                            {showAlreadyPremium && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="max-w-md w-full bg-[#0B1020] border border-white/10 p-8 rounded-[32px] text-center shadow-2xl"
                                    >
                                        <div className="w-16 h-16 bg-accent-purple/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Crown size={32} className="text-accent-purple" fill="currentColor" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-2">Siz allaqachon PREMIUMdasiz</h3>
                                        <p className="text-white/60 mb-8">Tariflarni ko‘rishingiz mumkin, lekin qayta to‘lov talab qilinmaydi.</p>
                                        <button
                                            onClick={() => setShowAlreadyPremium(false)}
                                            className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all"
                                        >
                                            OK
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white z-50"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
                            {/* Header */}
                            <div className="text-center mb-12">
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">
                                    FASTTIME <span className="text-accent-purple">PRO</span>
                                </h2>
                                <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-sm">
                                    O'Z UNUMDORLIGINGIZNI MAKSIMAL DARAJAGA OLIB CHIQING
                                </p>
                            </div>

                            {/* Pricing Cards Grid */}
                            <div className="grid md:grid-cols-3 gap-6 items-stretch">
                                {/* Card 1: BEPUL */}
                                <div className="relative p-8 rounded-[28px] bg-white/[0.02] border border-white/5 flex flex-col h-full hover:bg-white/[0.04] transition-all group">
                                    <div className="mb-6">
                                        <h3 className="text-lg font-black text-white/70 uppercase tracking-widest mb-1 italic">BEPUL</h3>
                                        <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Boshlang'ich</p>
                                    </div>
                                    <div className="mb-8">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-white">$0</span>
                                            <span className="text-white/20 text-xs uppercase tracking-widest font-black italic">/ DOIMO</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4 mb-8 flex-1">
                                        {[
                                            "Asosiy 25:00 taymer",
                                            "Oddiy vazifalar",
                                            "Cheklangan AI (3 marta)",
                                            "2MB avatar yuklash",
                                        ].map((f) => (
                                            <div key={f} className="flex items-center gap-3">
                                                <Check size={16} className="text-white/20 shrink-0" />
                                                <span className="text-sm text-white/40 font-bold">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => onClose()}
                                        className="w-full py-4 rounded-2xl bg-white/5 text-white/40 font-black text-xs uppercase tracking-widest border border-white/5 group-hover:bg-white/10 transition-all"
                                    >
                                        {!premium ? "JORIY TARIF" : "BEPULGA O'TISH"}
                                    </button>
                                </div>

                                {/* Card 2: PRO OYLIK */}
                                <div className="relative p-8 rounded-[28px] bg-[#8B5CF6]/10 border border-[#8B5CF6]/40 flex flex-col h-full shadow-[0_0_60px_-15px_rgba(139,92,246,0.3)] transform md:-translate-y-4 scale-105 z-10 transition-all hover:scale-[1.07]">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#8B5CF6] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-[#8B5CF6]/30 whitespace-nowrap">
                                        ENG MASHHUR
                                    </div>
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Crown size={20} className="text-[#8B5CF6]" fill="currentColor" />
                                            <h3 className="text-lg font-black text-white uppercase tracking-widest italic">PRO OYLIK</h3>
                                        </div>
                                        <p className="text-[#8B5CF6]/60 text-xs font-bold uppercase tracking-widest italic">To'liq imkoniyatlar</p>
                                    </div>
                                    <div className="mb-8">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-white">$1.5</span>
                                            <span className="text-[#8B5CF6]/50 text-xs uppercase tracking-widest font-black italic">/ OY</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4 mb-8 flex-1">
                                        {[
                                            "Cheksiz AI analizator",
                                            "Ilg'or statistika & heatmap",
                                            "Custom taymer (20/40/60)",
                                            "Fokus musiqalari",
                                            "Jamoaviy deep monitoring",
                                            "Golden avatar halqasi",
                                        ].map((f) => (
                                            <div key={f} className="flex items-center gap-3">
                                                <Check size={16} className="text-[#8B5CF6] shrink-0" />
                                                <span className="text-sm text-white/80 font-bold">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        title={premium ? "Siz allaqachon PREMIUMdasiz" : ""}
                                        onClick={() => handleSelect("MONTHLY")}
                                        className={cn(
                                            "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl",
                                            premium
                                                ? "bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 cursor-not-allowed"
                                                : "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white hover:brightness-110 active:scale-95 shadow-[#8B5CF6]/30"
                                        )}
                                    >
                                        {premium ? "SIZDA MAVJUD ✅" : "HOZIR YANGILASH"}
                                    </button>
                                </div>

                                {/* Card 3: UMRBOQ */}
                                <div className="relative p-8 rounded-[28px] bg-[#FACC15]/5 border border-[#FACC15]/20 flex flex-col h-full hover:bg-[#FACC15]/10 transition-all group">
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-1">
                                            <InfinityIcon size={20} className="text-[#FACC15]" />
                                            <h3 className="text-lg font-black text-white uppercase tracking-widest italic">UMRBOQ</h3>
                                        </div>
                                        <p className="text-[#FACC15]/40 text-xs font-bold uppercase tracking-widest">Cheksiz kelajak</p>
                                    </div>
                                    <div className="mb-8">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-[#FACC15]">$49</span>
                                            <span className="text-[#FACC15]/30 text-xs uppercase tracking-widest font-black italic">BIR MARTALIK</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4 mb-8 flex-1">
                                        {[
                                            "Barcha Pro imkoniyatlar",
                                            "Kelajakdagi yangilanishlar",
                                            "Early Access",
                                            "Founder badge",
                                            "Maxsus asoschilar hamjamiyati",
                                        ].map((f) => (
                                            <div key={f} className="flex items-center gap-3">
                                                <Check size={16} className="text-[#FACC15] shrink-0" />
                                                <span className="text-sm text-white/60 font-bold">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        title={premium ? "Siz allaqachon PREMIUMdasiz" : ""}
                                        onClick={() => handleSelect("LIFETIME")}
                                        className={cn(
                                            "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl",
                                            premium
                                                ? "bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]/30 cursor-not-allowed"
                                                : "bg-[#FACC15] text-black hover:bg-[#EAB308] active:scale-95 shadow-[#FACC15]/10"
                                        )}
                                    >
                                        {premium ? "SIZDA MAVJUD ✅" : "UMRBOQ TARIF"}
                                    </button>
                                </div>
                            </div>

                            {/* Secure Payment Note */}
                            <div className="mt-12 flex flex-col items-center gap-4 text-white/20">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] italic text-center">
                                    🔒 Stripe orqali xavfsiz va shifrlangan to'lov tizimi
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modal, document.body);
}
