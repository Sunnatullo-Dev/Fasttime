import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Timer, Zap, BarChart3, Grid, Maximize2, RefreshCw,
    Trophy, Check, X, Shield, Star, Award, ArrowRight,
    Download, Bell, Music, Layout, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface PricingProps {
    onUpgrade: () => void;
    onClose?: () => void;
}

export default function PremiumLanding({ onUpgrade, onClose }: PricingProps) {
    const { t } = useTranslation();
    const benefits = [
        {
            icon: Zap,
            title: t('premium.benefit_ai_title', "AI Productivity Score"),
            description: t('premium.benefit_ai_desc', "Sun'iy intellekt tahlili yordamida ish uslubingiz haqida chuqur ma'lumot oling."),
            color: "text-yellow-400",
            bg: "bg-yellow-400/10"
        },
        {
            icon: BarChart3,
            title: t('premium.benefit_analytics_title', "Advanced Analytics"),
            description: t('premium.benefit_analytics_desc', "90 kunlik tahlil, grafiklar va tendensiya prognozlari bilan natijalaringizni kuzating."),
            color: "text-blue-400",
            bg: "bg-blue-400/10"
        },
        {
            icon: Grid,
            title: t('premium.benefit_heatmap_title', "Focus Heatmap"),
            description: t('premium.benefit_heatmap_desc', "Interactive heatmap yordamida yillik fokus intensivligidan xabardor bo'ling."),
            color: "text-purple-400",
            bg: "bg-purple-400/10"
        },
        {
            icon: Maximize2,
            title: t('premium.benefit_deep_title', "Deep Focus Mode"),
            description: t('premium.benefit_deep_desc', "Minimalistik, to'liq ekranli muhit yordamida chalg'ituvchi omillarni yo'q qiling."),
            color: "text-emerald-400",
            bg: "bg-emerald-400/10"
        },
        {
            icon: RefreshCw,
            title: t('premium.benefit_auto_title', "Smart Auto Cycle"),
            description: t('premium.benefit_auto_desc', "Tugmalarga tegmasdan fokus va tanaffus sessiyalarini avtomatik almashtiring."),
            color: "text-orange-400",
            bg: "bg-orange-400/10"
        },
        {
            icon: Trophy,
            title: t('premium.benefit_gamify_title', "Streak & Badge System"),
            description: t('premium.benefit_gamify_desc', "O'yin elementlari va eksklyuziv yutuqlar bilan mahsuldorlikni rag'batlantiring."),
            color: "text-rose-400",
            bg: "bg-rose-400/10"
        }
    ];

    const testimonials = [
        {
            name: "Alex Rivera",
            role: "Senior Developer",
            content: "FASTTIME changed how I code. The AI score actually helped me find my most productive hours. Best $49 I've spent.",
            avatar: "https://i.pravatar.cc/150?u=alex"
        },
        {
            name: "Sarah Chen",
            role: "Digital Artist",
            content: "Deep Focus Mode is a game changer for my creative flow. The 1-click lifetime access is so refreshing in a world of subscriptions.",
            avatar: "https://i.pravatar.cc/150?u=sarah"
        },
        {
            name: "Marcus Thorne",
            role: "Founder, TechFlow",
            content: "The heatmap revealed exactly where my energy was dipping. No more guessing. My team loves the export features too.",
            avatar: "https://i.pravatar.cc/150?u=marcus"
        }
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-accent-purple/30 overflow-x-hidden">
            {/* Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest uppercase mb-8 backdrop-blur-md">
                            <Sparkles size={14} className="text-yellow-400" />
                            {t('premium.limited_offer', 'Limited Time Lifetime Offer')}
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                            {t('premium.hero_title_1', 'UNLOCK YOUR TRUE')} <br />
                            <span className="bg-gradient-to-r from-accent-purple via-accent-blue to-accent-purple bg-[length:200%_auto] animate-gradient text-transparent bg-clip-text">
                                {t('premium.hero_title_2', 'FOCUS POWER')}
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-white/40 max-w-2xl mx-auto mb-12 font-medium">
                            {t('premium.hero_subtitle', 'Bir martalik to\'lov. Umrbod mahsuldorlik. Obunasiz. Yashirin to\'lovlarsiz.')}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button
                                onClick={onUpgrade}
                                className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                            >
                                {t('premium.upgrade_btn', 'Upgrade to Lifetime Premium')}
                            </button>
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    {t('premium.continue_free', 'Continue with Free')}
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* Floating UI Mockup Placeholder */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="mt-20 relative max-w-5xl mx-auto"
                    >
                        <div className="relative z-10 p-4 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl">
                            <div className="aspect-video rounded-[32px] bg-[#0A0A0A] overflow-hidden border border-white/5 flex items-center justify-center">
                                {/* Simulated UI UI */}
                                <div className="grid grid-cols-12 gap-4 w-full h-full p-8">
                                    <div className="col-span-3 space-y-4">
                                        <div className="h-12 bg-white/5 rounded-xl w-3/4" />
                                        <div className="h-8 bg-white/5 rounded-xl w-full" />
                                        <div className="h-8 bg-white/5 rounded-xl w-5/6" />
                                        <div className="h-8 bg-white/5 rounded-xl w-4/5" />
                                    </div>
                                    <div className="col-span-6 flex items-center justify-center">
                                        <div className="w-48 h-48 rounded-full border-8 border-accent-purple/20 flex items-center justify-center">
                                            <span className="text-4xl font-black">25:00</span>
                                        </div>
                                    </div>
                                    <div className="col-span-3 space-y-4">
                                        <div className="h-32 bg-accent-purple/10 rounded-2xl border border-accent-purple/20" />
                                        <div className="h-32 bg-accent-blue/10 rounded-2xl border border-accent-blue/20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative Elements */}
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-accent-purple rounded-full blur-[80px] opacity-30" />
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-accent-blue rounded-full blur-[80px] opacity-30" />
                    </motion.div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">{t('premium.benefits_title', 'NIYAGA PREMIUM?')}</h2>
                        <p className="text-white/40 font-bold uppercase tracking-widest">{t('premium.benefits_subtitle', 'Professional vositalar bilan vaqtingizni boshqaring')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {benefits.map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-8 rounded-[40px] bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all hover:bg-white/[0.04]"
                            >
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform", benefit.bg, benefit.color)}>
                                    <benefit.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{benefit.title}</h3>
                                <p className="text-white/40 font-medium leading-relaxed">
                                    {benefit.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="py-32 px-6 bg-white/[0.01]">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black mb-4">{t('premium.comp_title', 'BEPUL VS PREMIUM')}</h2>
                        <p className="text-white/40 uppercase tracking-widest font-bold">{t('premium.comp_subtitle', 'Jiddiy ish uchun oddiy tanlov')}</p>
                    </div>

                    <div className="rounded-[40px] overflow-hidden border border-white/10 backdrop-blur-xl bg-white/[0.02]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="p-8 text-white/40 font-black uppercase tracking-widest text-xs">{t('premium.comp_feature', 'Funksiya')}</th>
                                    <th className="p-8 text-white/40 font-black uppercase tracking-widest text-xs text-center line-through">{t('premium.comp_free', 'Bepul')}</th>
                                    <th className="p-8 text-white font-black uppercase tracking-widest text-xs text-center bg-accent-purple/20">{t('premium.comp_premium', 'Premium')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[
                                    { name: t('premium.feature_timer', "Pomodoro Taymer"), free: true, prem: true },
                                    { name: t('premium.feature_analytics', "Analitika muddati"), free: t('premium.val_7_days', "7 Kun"), prem: t('premium.val_90_days', "90 Kun") },
                                    { name: t('premium.feature_ai', "AI Productivity Score"), free: false, prem: true },
                                    { name: t('premium.feature_heatmap', "Focus Heatmap"), free: false, prem: true },
                                    { name: t('premium.feature_deep', "Deep Focus Mode"), free: false, prem: true },
                                    { name: t('premium.feature_autocycle', "Auto-Cycle Pro"), free: false, prem: true },
                                    { name: t('premium.feature_sounds', "Maxsus bildirishnoma ovozlari"), free: false, prem: true },
                                    { name: t('premium.feature_export', "Ma'lumotlarni eksport qilish (CSV/PDF)"), free: false, prem: true },
                                    { name: t('premium.feature_reminders', "Smart ish rejasi eslatmalari"), free: false, prem: true },
                                    { name: t('premium.feature_updates', "Umrbod yangilanishlar"), free: false, prem: true },
                                ].map((row, i) => (
                                    <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="p-8 font-bold text-white/60">{row.name}</td>
                                        <td className="p-8 text-center">
                                            {typeof row.free === 'string' ? (
                                                <span className="text-xs font-black text-white/20 uppercase tracking-tighter">{row.free}</span>
                                            ) : row.free ? (
                                                <Check className="mx-auto text-emerald-500" size={20} />
                                            ) : (
                                                <X className="mx-auto text-white/10" size={20} />
                                            )}
                                        </td>
                                        <td className="p-8 text-center bg-accent-purple/5 group-hover:bg-accent-purple/10 transition-colors">
                                            {typeof row.prem === 'string' ? (
                                                <span className="text-xs font-black text-white uppercase tracking-tighter">{row.prem}</span>
                                            ) : (
                                                <Check className="mx-auto text-accent-purple" size={24} strokeWidth={3} />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Lifetime Offer Card */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="p-10 md:p-20 rounded-[60px] bg-gradient-to-br from-accent-purple/30 via-accent-blue/20 to-transparent border border-white/20 relative overflow-hidden text-center"
                    >
                        <div className="absolute top-0 right-0 p-8">
                            <Shield className="text-white/20" size={120} />
                        </div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400 text-black text-[10px] font-black tracking-[0.2em] uppercase mb-8 shadow-xl shadow-yellow-400/20">
                                <Star size={12} fill="black" />
                                Limited Early Supporter Offer
                            </div>

                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">PAY ONCE. <br />USE FOREVER.</h2>
                            <p className="text-xl text-white/60 mb-12 max-w-xl mx-auto font-bold uppercase tracking-wide">
                                {t('premium.lifetime_subtitle', 'NO SUBSCRIPTIONS. NO MONTHLY FEES. NO HIDDEN CHARGES.')}
                            </p>

                            <div className="flex flex-col items-center gap-4 mb-12">
                                <div className="flex items-baseline gap-6">
                                    <span className="text-white/20 text-5xl line-through font-black">$49</span>
                                    <span className="text-9xl font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">$19</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs font-black uppercase tracking-[0.4em] text-accent-purple">Special Launch Price</span>
                                    <div className="px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t('premium.spots_left', 'Faqat 127 ta joy qoldi', { count: 127 })}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onUpgrade}
                                className="w-full md:w-auto px-16 py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.2)] mb-12"
                            >
                                {t('premium.get_lifetime_btn', '$19 evaziga umrbod kirish')}
                            </button>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-2xl mx-auto border-t border-white/10 pt-12">
                                {[
                                    "No credit card required",
                                    "Lifetime updates included",
                                    "Priority community support"
                                ].map((text, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="bg-emerald-500/20 p-1 rounded-full shrink-0">
                                            <Check className="text-emerald-500" size={14} />
                                        </div>
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                            {i === 0 ? t('premium.no_card', 'Kredit karta shart emas') : i === 1 ? t('premium.lifetime_updates', 'Umrbod yangilanishlar') : t('premium.priority_support', 'Ustuvor qo\'llab-quvvatlash')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black mb-4 uppercase">{t('premium.testimonials_title', 'Professionallar tomonidan seviladi')}</h2>
                        <div className="flex items-center justify-center gap-1 text-yellow-500">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} fill="currentColor" />)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <div key={i} className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                                <p className="text-xl font-medium text-white/80 italic mb-8">"{t.content}"</p>
                                <div className="flex items-center gap-4">
                                    <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full border border-white/10" />
                                    <div>
                                        <h4 className="font-bold">{t.name}</h4>
                                        <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-40 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-accent-purple/10 blur-[150px] rounded-full scale-150" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-12">
                        {t('premium.ready_title', 'ISH FAOLIYATINGIZNI YAXSHILASHGA TAYYORMISIZ?')}
                    </h2>
                    <button
                        onClick={onUpgrade}
                        className="group relative inline-flex items-center gap-4 px-12 py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_40px_100px_rgba(255,255,255,0.1)]"
                    >
                        {t('premium.get_now_btn', 'Hozir Lifetime Premiumga o\'ting')}
                        <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                    </button>

                    <div className="mt-12 flex items-center justify-center gap-8 text-white/20">
                        <div className="flex items-center gap-2">
                            <Shield size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t('premium.secure_payments', 'Xavfsiz To\'lovlar')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Award size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t('premium.best_ui', 'Eng yaxshi interfeys')}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="py-20 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center">
                            <Timer size={18} />
                        </div>
                        <span className="font-black tracking-tighter">FASTTIME</span>
                    </div>
                    <div className="flex gap-8 text-[10px] font-black text-white/30 uppercase tracking-widest">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                    <div className="flex flex-col items-center gap-6">
                        <a
                            href="https://t.me/sunat_dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-6 py-3 bg-[#24A1DE]/10 hover:bg-[#24A1DE]/20 text-[#24A1DE] rounded-2xl border border-[#24A1DE]/20 transition-all hover:scale-105 active:scale-95 group font-black text-[10px] uppercase tracking-widest"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.3-.48.82-.74 3.2-1.39 5.33-2.31 6.4-2.75 3.03-1.25 3.66-1.47 4.07-1.47.09 0 .29.02.42.13.11.08.14.19.16.27.02.08.02.24 0 .33z" />
                            </svg>
                            {t('premium.contact_support', 'Yordam bilan bog\'lanish')}
                        </a>
                        <p className="text-[10px] text-white/10 font-black uppercase tracking-widest">
                            {t('premium.footer_all_rights', '© 2026 FASTTIME. FLOW UCHUN MAXSUS ISHLAB CHIQILDI.')}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
