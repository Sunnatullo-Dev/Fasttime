import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Crown, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
    children: React.ReactNode;
    isPremium: boolean;
    onUpgrade?: () => void;
    title?: string;
    description?: string;
    className?: string;
}

export default function PremiumLock({ children, isPremium, onUpgrade, title, description, className }: Props) {
    const { t } = useTranslation();
    if (isPremium) return <>{children}</>;

    return (
        <div className={cn("relative group overflow-hidden", className)}>
            <div className="filter blur-[8px] opacity-40 select-none pointer-events-none scale-[1.02]">
                {children}
            </div>

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center bg-black/10 transition-all group-hover:bg-black/20">
                <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-black shadow-2xl mb-6 animate-bounce duration-[2000ms]">
                    <Crown size={32} />
                </div>

                <h4 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">
                    {title || t('premium.lock_title', "PREMIUM IMKONIYAT")}
                </h4>
                <p className="text-sm font-bold text-white/40 uppercase tracking-widest max-w-[240px] mb-8 leading-relaxed">
                    {description || t('premium.lock_desc', "To'liq quvvatni ochish va ushbu funksiyadan foydalanish uchun Premiumga o'ting")}
                </p>

                <button
                    onClick={onUpgrade}
                    className="group relative px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10 flex items-center gap-3"
                >
                    <Lock size={14} className="group-hover:text-yellow-500 transition-colors" />
                    {t('premium.unlock_now', 'HOZIROQ OCHISH')}
                </button>
            </div>
        </div>
    );
}
