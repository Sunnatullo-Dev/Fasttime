import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, X, Target, Calendar, Clock, Sparkles, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { createPortal } from 'react-dom';

type ChallengeType = "FOCUS_HOURS" | "SPRINT_COUNT" | "STREAK_DAYS";

interface ChallengeCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (data: any) => Promise<void>;
    loading: boolean;
}

const TYPE_OPTIONS: { value: ChallengeType; label: string; icon: any; placeholder: string; unit: string }[] = [
    { value: "FOCUS_HOURS", label: "Fokus soat (jami)", icon: Clock, placeholder: "Masalan: 20", unit: "soat" },
    { value: "SPRINT_COUNT", label: "Sprintlar soni", icon: Zap, placeholder: "Masalan: 40", unit: "sprint" },
    { value: "STREAK_DAYS", label: "Streak (kun)", icon: Target, placeholder: "Masalan: 7", unit: "kun" }
];

const DURATION_OPTIONS = [
    { value: 1, label: "1 kun" },
    { value: 7, label: "7 kun" },
    { value: 14, label: "14 kun" },
    { value: 30, label: "30 kun" }
];

export default function ChallengeCreateModal({ isOpen, onClose, onCreated, loading }: ChallengeCreateModalProps) {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<ChallengeType>("FOCUS_HOURS");
    const [targetValue, setTargetValue] = useState<string>('');
    const [durationDays, setDurationDays] = useState(7);
    const [startsAt, setStartsAt] = useState<string>('');
    const [useNow, setUseNow] = useState(true);
    const [error, setError] = useState('');

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setTargetValue('');
            setType("FOCUS_HOURS");
            setDurationDays(7);
            setUseNow(true);
            setStartsAt('');
            setError('');
            setTimeout(() => inputRef.current?.focus(), 150);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (loading) return;

        if (title.trim().length < 3) {
            setError("Chaqiriq nomi kamida 3 ta belgi bo'lishi kerak.");
            return;
        }
        if (!targetValue || parseInt(targetValue) <= 0) {
            setError("Maqsad qiymatini kiriting.");
            return;
        }

        const payload = {
            title: title.trim(),
            type,
            targetValue: parseInt(targetValue),
            durationDays,
            startsAt: useNow ? new Date().toISOString() : startsAt
        };

        await onCreated(payload);
    };

    const selectedType = TYPE_OPTIONS.find(t => t.value === type);
    const endDateStr = () => {
        const start = useNow ? new Date() : (startsAt ? new Date(startsAt) : new Date());
        const end = new Date(start.getTime() + durationDays * 86400000);
        return end.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });
    };

    const isFormValid = title.trim().length >= 3 && targetValue !== '' && (useNow || startsAt !== '');

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/70 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="relative w-[94vw] max-w-[920px] rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0B1020]/95 via-[#070A12]/95 to-[#0B1020]/90 shadow-[0_0_0_1px_rgba(120,80,255,0.2),0_40px_120px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-accent-purple to-transparent opacity-60" />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all duration-300 z-50"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-10 md:p-12">
                        {/* Header */}
                        <div className="mb-12">
                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Yangi chaqiriq yaratish</h3>
                            <p className="text-accent-purple/50 text-sm font-medium uppercase tracking-[0.2em]">Jamoa rivoji uchun yangi challenge yarating</p>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
                            {/* LEFT FORM */}
                            <div className="space-y-8">
                                {/* Field 1: Title */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1 flex items-center gap-2">
                                        <Sparkles size={12} className="text-accent-purple" /> Chaqiriq nomi
                                    </label>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={title}
                                        onChange={(e) => { setTitle(e.target.value); if (error) setError(''); }}
                                        placeholder='Masalan: "Haftalik 20 soat Deep Work"'
                                        className={cn(
                                            "w-full bg-white/5 border rounded-2xl px-6 py-5 text-white text-lg font-bold transition-all focus:outline-none focus:ring-4 focus:ring-accent-purple/10",
                                            error && title.length < 3 ? "border-red-500/50" : "border-white/10 focus:border-accent-purple/40"
                                        )}
                                    />
                                </div>

                                {/* Field 2: Target Type */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1 flex items-center gap-2">
                                        <Target size={12} className="text-accent-purple" /> Maqsad turi
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {TYPE_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setType(opt.value)}
                                                className={cn(
                                                    "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 group",
                                                    type === opt.value
                                                        ? "bg-accent-purple/10 border-accent-purple text-white shadow-lg shadow-accent-purple/5"
                                                        : "bg-white/5 border-white/5 text-white/30 hover:bg-white/[0.08]"
                                                )}
                                            >
                                                <opt.icon size={20} className={cn(type === opt.value ? "text-accent-purple" : "text-white/20 group-hover:text-white/40")} />
                                                <span className="text-[9px] font-black uppercase text-center leading-tight">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Field 3: Target Value */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1 flex items-center gap-2">
                                            <Zap size={12} className="text-accent-purple" /> Maqsad qiymati
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={targetValue}
                                                onChange={(e) => setTargetValue(e.target.value)}
                                                placeholder={selectedType?.placeholder}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-accent-purple/40 transition-all pr-16"
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-white/20">{selectedType?.unit}</span>
                                        </div>
                                    </div>

                                    {/* Field 4: Duration */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1 flex items-center gap-2">
                                            <Calendar size={12} className="text-accent-purple" /> Muddat
                                        </label>
                                        <select
                                            value={durationDays}
                                            onChange={(e) => setDurationDays(parseInt(e.target.value))}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-accent-purple/40 transition-all appearance-none"
                                        >
                                            {DURATION_OPTIONS.map(d => (
                                                <option key={d.value} value={d.value} className="bg-[#0B1020]">{d.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Field 5: Starts At */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1 flex items-center gap-2">
                                        <Clock size={12} className="text-accent-purple" /> Boshlanish vaqti
                                    </label>
                                    <div className="flex flex-col gap-4">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div
                                                onClick={() => setUseNow(!useNow)}
                                                className={cn(
                                                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    useNow ? "bg-accent-purple border-accent-purple" : "bg-white/5 border-white/10 group-hover:border-white/20"
                                                )}
                                            >
                                                {useNow && <CheckCircle2 size={14} className="text-white" />}
                                            </div>
                                            <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">Hozirdan boshlansin</span>
                                        </label>

                                        {!useNow && (
                                            <motion.input
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                type="datetime-local"
                                                value={startsAt}
                                                onChange={(e) => setStartsAt(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-accent-purple/40 transition-all"
                                            />
                                        )}
                                    </div>
                                </div>

                                {error && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1">
                                        {error}
                                    </motion.p>
                                )}
                            </div>

                            {/* RIGHT PREVIEW */}
                            <div className="space-y-6">
                                <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#121A33]/80 to-[#0B1020]/80 border border-accent-purple/20 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                        <Swords size={120} className="text-accent-purple" />
                                    </div>

                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-accent-purple uppercase tracking-[0.3em] mb-6">Preview / Ko'rinish</p>

                                        <h4 className="text-2xl font-black text-white leading-tight mb-4 min-h-[3rem]">
                                            {title || "Masalan: Haftalik Challenge..."}
                                        </h4>

                                        <div className="flex flex-wrap gap-2 mb-8">
                                            <span className="px-3 py-1.5 rounded-lg bg-accent-purple/10 border border-accent-purple/20 text-[9px] font-black text-accent-purple uppercase tracking-widest">
                                                {selectedType?.label}
                                            </span>
                                            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                                ACTIVE
                                            </span>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div className="flex justify-between items-end">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Progress</p>
                                                <p className="text-xl font-black text-white">0 / {targetValue || '0'} <span className="text-xs text-white/40">{selectedType?.unit}</span></p>
                                            </div>
                                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full w-[5%] bg-gradient-to-r from-[#60A5FA] to-accent-purple rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/5 space-y-2">
                                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em]">Muddat: <span className="text-white/60">{durationDays} kun</span></p>
                                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em]">Tugash vaqti: <span className="text-white/60">{endDateStr()}</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Footer info */}
                                <div className="px-4 py-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <p className="text-[9px] font-medium text-white/30 leading-relaxed uppercase tracking-widest">
                                        * Chaqiriq jamoaning barcha a'zolari uchun amal qiladi. Maqsadga erishilganda jamoa ochkosi beriladi.
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="space-y-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading || !isFormValid}
                                        className={cn(
                                            "w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn",
                                            !isFormValid || loading
                                                ? "bg-white/5 text-white/10 border border-white/5 cursor-not-allowed"
                                                : "bg-gradient-to-r from-accent-purple to-accent-blue text-white shadow-[0_20px_50px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95 translate-y-0 hover:-translate-y-1"
                                        )}
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Swords size={16} className="group-hover/btn:rotate-12 transition-transform" />
                                                Yaratish
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-full py-5 rounded-2xl bg-transparent border border-white/5 text-[11px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Bekor qilish
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
