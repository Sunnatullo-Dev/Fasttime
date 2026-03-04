import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, X, Terminal, Sparkles, Hash } from 'lucide-react';
import { cn } from '../lib/utils';
import { createPortal } from 'react-dom';

interface SprintCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (topic: string, duration: number) => Promise<void>;
    loading: boolean;
}

const QUICK_CHIPS = ["Bug fix", "UI/UX Redesign", "Backend Integration", "Code Review", "V1.0 Release"];

export default function SprintCreateModal({ isOpen, onClose, onSubmit, loading }: SprintCreateModalProps) {
    const [topic, setTopic] = useState('');
    const [duration, setDuration] = useState(45);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTopic('');
            setError('');
            // Autofocus with slight delay for animation
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (loading) return;

        if (topic.trim().length < 3) {
            setError("Iltimos, 3 ta belgidan kam bo'lmagan mavzu kiriting.");
            return;
        }
        if (topic.trim().length > 60) {
            setError("Mavzu juda uzun (maksimal 60 ta belgi).");
            return;
        }

        await onSubmit(topic.trim(), duration);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                        className="relative w-[92vw] max-w-[920px] rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0B1020]/90 via-[#070A12]/90 to-[#0B1020]/85 shadow-[0_0_0_1px_rgba(120,80,255,0.18),0_40px_140px_rgba(0,0,0,0.72)] overflow-hidden p-8 md:p-10"
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-8 right-8 p-2.5 rounded-2xl text-white/20 hover:text-white hover:bg-white/10 transition-all duration-300 z-50 border border-white/5 bg-white/[0.02]"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10 h-full flex flex-col">
                            {/* Header */}
                            <div className="flex items-start gap-6 mb-10">
                                <div className="w-16 h-16 rounded-[22px] bg-accent-purple/10 flex items-center justify-center border border-accent-purple/20 shadow-[0_0_30px_rgba(168,85,247,0.2)] shrink-0 group-hover:scale-110 transition-transform duration-500">
                                    <Zap className="text-accent-purple" size={32} fill="currentColor" />
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-2 leading-none">Sprint Yaratish</h3>
                                    <p className="text-sm font-medium text-accent-purple/50 uppercase tracking-[0.2em]">Jamoaviy fokus sessiyasini boshlash</p>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="flex-1">
                                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10">
                                    {/* Left Side: Topic and Presets */}
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end px-1">
                                                <label className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2.5">
                                                    <Terminal size={14} className="text-accent-purple" />
                                                    Sprint mavzusi
                                                </label>
                                                <span className={cn(
                                                    "text-[10px] font-mono font-bold tracking-widest",
                                                    topic.length > 50 ? "text-yellow-500" : "text-white/10"
                                                )}>
                                                    {topic.length}/60
                                                </span>
                                            </div>

                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                                    <Hash className={cn(
                                                        "transition-all duration-300",
                                                        topic ? "text-accent-purple scale-110" : "text-white/10"
                                                    )} size={20} />
                                                </div>
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={topic}
                                                    onChange={(e) => {
                                                        setTopic(e.target.value);
                                                        if (error) setError('');
                                                    }}
                                                    placeholder="Masalan: UI Redesign..."
                                                    className={cn(
                                                        "w-full bg-[#05070a]/60 border-2 rounded-[24px] pl-16 pr-8 py-6 text-white placeholder:text-white/10 transition-all focus:outline-none focus:ring-8 focus:ring-accent-purple/5 text-xl font-bold",
                                                        error
                                                            ? "border-red-500/30 focus:border-red-500/50"
                                                            : "border-white/5 focus:border-accent-purple/30"
                                                    )}
                                                />
                                            </div>

                                            <AnimatePresence>
                                                {error && (
                                                    <motion.p
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -10 }}
                                                        className="text-[10px] font-bold text-red-400 uppercase tracking-widest px-2 flex items-center gap-2"
                                                    >
                                                        <span className="w-1 h-1 rounded-full bg-red-400" /> {error}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-1 flex items-center gap-2.5">
                                                <Sparkles size={12} className="text-accent-purple/40" /> Tezkor tanlovlar
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                {QUICK_CHIPS.map(chip => (
                                                    <button
                                                        key={chip}
                                                        type="button"
                                                        onClick={() => {
                                                            setTopic(chip);
                                                            setError('');
                                                            inputRef.current?.focus();
                                                        }}
                                                        className="px-5 py-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] font-black text-white/30 hover:bg-accent-purple/10 hover:border-accent-purple/30 hover:text-white transition-all duration-300"
                                                    >
                                                        {chip}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Duration and Actions */}
                                    <div className="space-y-8 lg:border-l lg:border-white/5 lg:pl-10">
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2.5 px-1">
                                                <Zap size={14} className="text-accent-purple" />
                                                Davomiyligi
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[15, 25, 45, 60, 90].map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => setDuration(m)}
                                                        className={cn(
                                                            "py-4.5 rounded-[20px] text-[11px] font-black transition-all duration-300 border-2",
                                                            duration === m
                                                                ? "bg-accent-purple/10 border-accent-purple text-white shadow-lg shadow-accent-purple/10"
                                                                : "bg-white/5 border-transparent text-white/20 hover:bg-white/10 hover:text-white/40"
                                                        )}
                                                    >
                                                        {m} MINUT
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <button
                                                type="submit"
                                                disabled={loading || topic.trim().length < 3}
                                                className={cn(
                                                    "w-full py-6 rounded-[24px] font-black uppercase tracking-[0.3em] text-[12px] transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn",
                                                    loading || topic.trim().length < 3
                                                        ? "bg-white/5 text-white/10 cursor-not-allowed border border-white/5"
                                                        : "bg-accent-purple text-white shadow-[0_20px_40px_rgba(168,85,247,0.25)] hover:scale-[1.02] active:scale-95"
                                                )}
                                            >
                                                {loading ? (
                                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Zap size={18} fill="currentColor" className="group-hover/btn:animate-pulse" />
                                                        Sprintni yaratish
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="w-full py-5 rounded-[22px] bg-transparent border border-white/5 text-[11px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white hover:bg-white/5 transition-all duration-300"
                                            >
                                                Bekor qilish
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
