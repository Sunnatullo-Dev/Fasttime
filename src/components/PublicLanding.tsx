import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Timer, Zap, Shield, ArrowRight, Loader2, Star, CheckCircle2, Instagram, Mail, Github, Send, ExternalLink, Copy, Check, Brain as BrainIcon } from 'lucide-react';
import BrandLogo from './BrandLogo';
import api from '../lib/api';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface Props {
    onLogin: () => void;
}

export default function PublicLanding({ onLogin }: Props) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [joined, setJoined] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyEmail = () => {
        navigator.clipboard.writeText('sunnatullasamandarov7@gmail.com');
        setCopied(true);
        toast.success(t('common.copied', 'Nusxalandi!'));
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWaitlist = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/launch/waitlist', { email });
            setJoined(true);
            toast.success(t('landing.waitlist_success', "Waitlistga qo'shildingiz!"));
        } catch (err: any) {
            toast.error(err.response?.data?.error || t('common.error', "Xatolik yuz berdi."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-accent-purple/30 overflow-hidden font-sans">
            {/* Background Glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-purple/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-blue/10 blur-[150px] rounded-full animate-pulse" />
            </div>

            <nav className="fixed top-0 left-0 right-0 h-24 flex items-center justify-between px-12 z-50 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-3 md:gap-4 group cursor-pointer transition-all active:scale-95 duration-300">
                    <div className="relative">
                        <BrandLogo variant="header" className="w-12 h-12 md:w-14 md:h-14" />
                    </div>
                    <span className="text-xl md:text-2xl font-semibold tracking-tight text-white/90 hover:text-white transition-colors">
                        Fasttime 👑
                    </span>
                </div>
                <button
                    onClick={onLogin}
                    className="px-8 py-3 bg-white/5 hover:bg-accent-purple text-white rounded-2xl font-black uppercase tracking-widest transition-all border border-white/10"
                >
                    SIGN IN
                </button>
            </nav>

            <main className="relative max-w-7xl mx-auto px-6">
                {/* Hero Section */}
                <section className="pt-32 pb-40 grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-left"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-[10px] font-black tracking-widest uppercase mb-8">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />
                            FASTTIME v2.0.0-PRO
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 leading-none">
                            FLOW STATE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-blue">
                                REIMAGINED.
                            </span>
                        </h1>
                        <h2 className="text-xl md:text-2xl font-black text-white/60 uppercase tracking-widest mb-6">
                            BIR MARTA TO'LANG. UMRBOD FOYDALANING.
                        </h2>
                        <p className="text-lg text-white/40 font-medium leading-relaxed max-w-xl mb-12 uppercase tracking-wide">
                            Fokusga kirish endi qiyin emas. FASTTIME orqali flow holatiga sho'ng'ing va mahsuldorlikni sun'iy intellekt yordamida yangi bosqichga olib chiqing. Stresssiz natija va maksimal unumdorlik.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={onLogin}
                                className="px-10 py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-white/10"
                            >
                                Boshlash
                            </button>
                            <button
                                onClick={onLogin}
                                className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Premium olish
                            </button>
                        </div>
                    </motion.div>

                    {/* Mockup / Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-accent-purple/20 blur-[100px] rounded-full" />
                        <div className="glass-card rounded-[40px] border border-white/10 p-8 aspect-square flex flex-col items-center justify-center relative overflow-hidden group">
                            <div className="w-64 h-64 rounded-full border-[16px] border-white/5 flex items-center justify-center relative">
                                <span className="text-7xl font-black tracking-tighter">25:00</span>
                                <div className="absolute inset-0 border-[16px] border-accent-purple border-t-transparent rounded-full animate-[spin_10s_linear_infinite]" />
                            </div>
                            <div className="mt-12 space-y-4 text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/20 text-accent-blue text-[10px] font-black uppercase tracking-widest mx-auto">
                                    <Zap size={12} /> AI ANALYZER ACTIVE
                                </div>
                            </div>

                            {/* Floating elements */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-10 right-10 p-4 glass-card border border-white/10 rounded-2xl shadow-2xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase">VAZIFA BAJARILDI</p>
                                        <p className="text-[8px] font-bold text-white/40 uppercase">STREAK: 12 KUN</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </section>

                {/* Value Proposition */}
                <section className="py-40 border-t border-white/5">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6">Nega FASTTIME?</h2>
                        <p className="text-white/40 font-bold uppercase tracking-widest">FASTTIME boshqalardan nimasi bilan ajralib turadi?</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: 'AI Master Analyzer', desc: 'Gemini AI yordamida barcha seanslaringizni tahlil qiling va shaxsiy tavsiyalar oling.', icon: BrainIcon },
                            { title: 'Flow Mode', desc: 'Distractionsiz, faqat ish uchun mo\'ljallangan maxsus minimal interfeys.', icon: Zap },
                            { title: 'Offline-First', desc: 'Internet bo\'lmasa ham ma\'lumotlar saqlanadi va server bilan keyin sinxronlashadi.', icon: Shield },
                            { title: 'One-time Payment', desc: 'Obunalardan voz keching. Bir marta to\'lang va umrbod foydalaning.', icon: Star }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-accent-purple/30 transition-all group">
                                <item.icon className="text-accent-purple mb-6 group-hover:scale-110 transition-transform" size={40} />
                                <h3 className="text-xl font-black mb-4 uppercase">{item.title}</h3>
                                <p className="text-sm font-bold text-white/40 uppercase tracking-widest leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Reviesed Features */}
                <section className="py-40 border-t border-white/5">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="order-2 lg:order-1 relative px-10">
                            <div className="absolute inset-0 bg-accent-blue/10 blur-[80px] rounded-full" />
                            <div className="grid gap-6 relative">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`p-6 glass-card border border-white/10 rounded-[2rem] ml-${i * 8}`}>
                                        <div className="h-4 w-1/2 bg-white/5 rounded-full mb-4" />
                                        <div className="h-2 w-3/4 bg-white/5 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="order-1 lg:order-2 text-left">
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-12 leading-[0.9]">PROFESSIONAL <br /> TOOLKIT.</h2>
                            <div className="space-y-12">
                                {[
                                    { title: "Real-time Statistics", desc: "Har bir soniyangizni tahlil qiladigan jonli statistikalar grafiklar." },
                                    { title: "Deep Focus Timer", desc: "Maksimal diqqat uchun optimallashgan ilg'or Pomodoro tizimi." },
                                    { title: "AI Productivity Insights", desc: "Haftalik ish faoliyatingiz asosida AI unumdorlik balini hisoblaydi." },
                                    { title: "Premium Analytics", desc: "Chuqurlashtirilgan tahlillar: charchoq darajasi va eng samarali vaqtlar." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6">
                                        <div className="text-accent-purple font-black text-2xl">0{i + 1}</div>
                                        <div>
                                            <h4 className="text-xl font-black uppercase mb-2">{item.title}</h4>
                                            <p className="text-sm font-bold text-white/40 uppercase tracking-widest">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing Philosophy */}
                <section className="py-40 border-t border-white/5">
                    <div className="max-w-4xl mx-auto glass-card rounded-[3rem] p-12 md:p-20 text-center border border-accent-purple/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-purple to-transparent" />
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-8 leading-none">FAIR PRICING. <br /> NO SUBSCRIPTIONS.</h2>
                        <p className="text-lg text-white/40 font-bold uppercase tracking-widest mb-12 leading-relaxed">
                            Biz SaaS sanoatidagi har oylik obunalar charchatishiga ishonamiz. <br />
                            FASTTIME - bu mahsulot, xizmat emas. Bir marta to'laysiz, <br />
                            barcha yangilanishlarni tekin olasiz. Bu adolatli.
                        </p>
                        <div className="inline-block p-1 rounded-3xl bg-white/5 border border-white/10 mb-8">
                            <div className="px-8 py-3 bg-accent-purple text-white rounded-[1.2rem] font-black text-xs uppercase tracking-widest">
                                LIFETIME ACCESS
                            </div>
                        </div>
                    </div>
                </section>

                {/* Social Proof Position */}
                <section className="py-40 border-t border-white/5 text-center">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[1em] mb-8">BREND PHILOSOPHY</p>
                    <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase text-white/10">
                        FLOW UCHUN MAXSUS ISHLAB CHIQILDI.
                    </h2>
                </section>
                {/* Contact Section */}
                <section id="contact" className="mt-40 mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h3 className="text-3xl font-black tracking-tighter uppercase flex items-center justify-center gap-3">
                            <Send className="text-accent-purple" size={24} />
                            BOG'LANISH
                        </h3>
                    </motion.div>

                    <div className="flex justify-center items-center gap-6 max-w-2xl mx-auto">
                        {[
                            { icon: Instagram, label: 'Instagram', value: 'sunat_dev', link: 'https://instagram.com/sunat_dev', color: 'hover:text-pink-500 hover:shadow-pink-500/20 hover:border-pink-500/30' },
                            { icon: Mail, label: 'Email', value: 'sunnatullasamandarov7@gmail.com', link: 'mailto:sunnatullasamandarov7@gmail.com', onClick: copyEmail, color: 'hover:text-blue-500 hover:shadow-blue-500/20 hover:border-blue-500/30' },
                            { icon: Github, label: 'GitHub', value: 'Sunnatullo-Dev', link: 'https://github.com/Sunnatullo-Dev', color: 'hover:text-white hover:shadow-white/20 hover:border-white/30' },
                            { icon: Send, label: 'Telegram', value: 'sunat_dev', link: 'https://t.me/sunat_dev', color: 'hover:text-sky-500 hover:shadow-sky-500/20 hover:border-sky-500/30' }
                        ].map((item, i) => {
                            const Content = () => (
                                <div className={cn(
                                    "w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-[20px] bg-white/[0.03] border border-white/10 backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer shadow-lg",
                                    item.color
                                )}>
                                    <item.icon size={32} className="transition-transform duration-300" />
                                    {/* Tooltip for copy indication */}
                                    {item.onClick && copied && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-[8px] font-black rounded-full uppercase tracking-widest whitespace-nowrap shadow-xl">
                                            COPIED!
                                        </div>
                                    )}
                                </div>
                            );

                            return item.onClick ? (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <button onClick={item.onClick} onContextMenu={(e) => { e.preventDefault(); window.location.href = item.link || '#'; }} className="outline-none">
                                        <Content />
                                    </button>
                                </div>
                            ) : (
                                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="block outline-none">
                                    <Content />
                                </a>
                            );
                        })}
                    </div>
                </section>
            </main>

            <footer className="py-12 px-12 border-t border-white/5 mt-20 bg-black/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                    {/* Left Side */}
                    <div className="flex items-center gap-3">
                        <BrandLogo variant="sidebar" className="w-8 h-8 rounded-lg" />
                        <span className="text-xl font-black tracking-tighter">FASTTIME 👑</span>
                    </div>

                    {/* Center Links */}
                    <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
                        {['Privacy', 'Terms', 'Contact', 'Yordam bilan bog\'lanish'].map((link) => (
                            <a
                                key={link}
                                href={link === 'Contact' ? '#contact' : '#'}
                                className="text-[10px] font-black text-white/30 hover:text-white uppercase tracking-widest transition-all relative group"
                            >
                                {link}
                                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-accent-purple transition-all group-hover:w-full" />
                            </a>
                        ))}
                    </div>

                    {/* Right Side */}
                    <div className="text-right">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 leading-relaxed">
                            © 2026 FASTTIME. FLOW UCHUN MAXSUS ISHLAB CHIQILDI.
                        </p>
                        <div className="flex justify-center md:justify-end gap-3 items-center">
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black text-white/20 uppercase tracking-widest">
                                v2.0.0-PRO
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
