import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Zap, Target, ArrowRight, CheckCircle2, Brain } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
    onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [goal, setGoal] = useState('120');

    const steps = [
        {
            title: t('onboarding.step1_title', "MAQSADNI BELGILANG"),
            description: t('onboarding.step1_desc', "Kuniga necha daqiqa fokus qilishni xohlaysiz? Bu sizga AI balingizni oshirishga yordam beradi."),
            icon: Target,
            color: "text-accent-blue",
            bg: "bg-accent-blue/10",
            component: (
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-end gap-2">
                        <input
                            type="number"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="bg-white/5 border-2 border-accent-blue/30 rounded-2xl w-32 py-4 text-center text-3xl font-black text-white focus:outline-none focus:border-accent-blue transition-all"
                        />
                        <span className="text-white/20 font-black mb-2">{t('onboarding.min', 'MIN')}</span>
                    </div>
                </div>
            )
        },
        {
            title: t('onboarding.step2_title', "FOKUSNI SINAB KO'RING"),
            description: t('onboarding.step2_desc', "Birinchi 25 daqiqalik sessiyangizni hoziroq boshlashga tayyormisiz? Diqqatni jamlashni boshlang."),
            icon: Timer,
            color: "text-accent-purple",
            bg: "bg-accent-purple/10",
            component: (
                <div className="flex flex-col items-center gap-4">
                    <div className="text-6xl font-black text-white tracking-widest tabular-nums">25:00</div>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent-purple animate-ping" />
                        <span className="text-[10px] font-black uppercase text-accent-purple tracking-widest">{t('onboarding.ready_mode', 'Tayyor Rejim')}</span>
                    </div>
                </div>
            )
        },
        {
            title: t('onboarding.step3_title', "AI SCORE OLDINDAN KO'RISH"),
            description: t('onboarding.step3_desc', "Sizning mahsuldorligingiz mana shunday tahlil qilinadi. Har bir harakatingiz hisobga olinadi."),
            icon: Brain,
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
            component: (
                <div className="relative w-40 h-40 flex items-center justify-center mx-auto">
                    <svg className="absolute w-full h-full -rotate-90">
                        <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <motion.circle
                            cx="80" cy="80" r="70" fill="none" stroke="#EAB308" strokeWidth="8"
                            strokeDasharray="439.8" initial={{ strokeDashoffset: 439.8 }}
                            animate={{ strokeDashoffset: 439.8 * 0.25 }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                        />
                    </svg>
                    <div className="text-center">
                        <p className="text-4xl font-black text-white">85%</p>
                        <p className="text-[10px] text-white/20 font-black uppercase">{t('onboarding.preview', 'Preview')}</p>
                    </div>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (step === 0) {
            localStorage.setItem('fasttime_daily_goal', goal);
        }
        if (step === steps.length - 1) {
            onComplete();
        } else {
            setStep(s => s + 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-purple/30 blur-[120px] rounded-full animate-pulse" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl glass-card rounded-[50px] p-12 text-center relative z-10"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-10"
                    >
                        <div className={cn("w-20 h-20 rounded-[28px] mx-auto flex items-center justify-center", steps[step].bg, steps[step].color)}>
                            {React.createElement(steps[step].icon, { size: 40 })}
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black tracking-tighter uppercase">{steps[step].title}</h2>
                            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] leading-relaxed px-8">
                                {steps[step].description}
                            </p>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/[0.02] p-8 rounded-[40px] border border-white/5"
                        >
                            {steps[step].component}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>

                <div className="mt-12 space-y-6">
                    <div className="flex justify-center gap-2">
                        {steps.map((_, i) => (
                            <div key={i} className={cn("h-1.5 transition-all rounded-full", step === i ? "w-8 bg-white" : "w-2 bg-white/10")} />
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {step === steps.length - 1 ? t('onboarding.start_btn', "Boshladik!") : t('onboarding.next_btn', "Navbatdagi")}
                        <ArrowRight size={20} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
