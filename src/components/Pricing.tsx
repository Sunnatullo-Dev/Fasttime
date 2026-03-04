import React, { useState } from 'react';
import { Check, Crown, Rocket, Star, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { motion } from 'motion/react';

interface PlanProps {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    isPremium?: boolean;
    buttonText: string;
    isLoading?: boolean;
    onUpgrade: () => void;
}

const Plan = ({ name, price, period, description, features, isPremium, buttonText, isLoading, onUpgrade }: PlanProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={cn(
            "relative p-8 rounded-[40px] flex flex-col h-full transition-all duration-500",
            isPremium
                ? "bg-white text-black shadow-[0_40px_100px_-20px_rgba(255,255,255,0.1)] scale-105 z-10"
                : "bg-white/5 border border-white/10 text-white hover:bg-white/[0.08]"
        )}
    >
        {isPremium && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-yellow-400 text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl">
                Eng Mashhur
            </div>
        )}

        <div className="mb-8 text-center sm:text-left">
            <h3 className="text-xl font-black uppercase tracking-widest mb-2 flex items-center justify-center sm:justify-start gap-2">
                {isPremium ? <Crown size={20} /> : <Rocket size={20} />}
                {name}
            </h3>
            <p className={cn("text-sm font-medium", isPremium ? "text-black/60" : "text-white/40")}>{description}</p>
        </div>

        <div className="mb-10 text-center sm:text-left">
            <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-5xl font-black tracking-tighter">{price}</span>
                <span className={cn("text-sm font-bold uppercase tracking-widest", isPremium ? "text-black/40" : "text-white/20")}>{period}</span>
            </div>
        </div>

        <div className="space-y-4 mb-12 flex-1">
            {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className={cn("rounded-full p-1", isPremium ? "bg-black text-white" : "bg-white/10 text-white")}>
                        <Check size={12} strokeWidth={4} />
                    </div>
                    <span className="text-sm font-bold tracking-tight">{feature}</span>
                </div>
            ))}
        </div>

        <button
            onClick={onUpgrade}
            disabled={isLoading}
            className={cn(
                "w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50",
                isPremium
                    ? "bg-black text-white hover:bg-zinc-800 shadow-2xl shadow-black/20"
                    : "bg-white/10 text-white hover:bg-white/20"
            )}
        >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                    {buttonText}
                    <ArrowRight size={18} />
                </>
            )}
        </button>
    </motion.div>
);

export default function Pricing() {
    const [loadingType, setLoadingType] = useState<string | null>(null);

    const handleUpgrade = async (type: 'monthly' | 'lifetime') => {
        setLoadingType(type);
        try {
            const { data } = await api.post('/payment/create-checkout-session', { type });
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Upgrade error:', error);
            setLoadingType(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-20 px-6">
            <div className="text-center mb-20 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple/10 text-accent-purple rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                    <Star size={12} fill="currentColor" />
                    Premium Tariflar
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
                    Mahorat sari <br /> <span className="text-accent-purple">tayyor misiz?</span>
                </h2>
                <p className="text-white/40 font-medium max-w-xl mx-auto text-lg leading-relaxed">
                    FASTTIME'ning to'liq imkoniyatlarini oching — aniq fokus vositalari va AI tahlili bilan.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                <Plan
                    name="Bepul"
                    price="$0"
                    period="Doimo"
                    description="Sinab ko'rish uchun zo'r boshlanish."
                    features={[
                        "25:00 Fokus Taymer",
                        "Asosiy Sessiya Statistikasi",
                        "2MB Avatar Yuklash",
                        "Standart UI Mavzu"
                    ]}
                    buttonText="Joriy Tarif"
                    onUpgrade={() => { }}
                />

                <Plan
                    name="Pro Oylik"
                    price="$1.5"
                    period="/ oy"
                    isPremium
                    description="Jiddiy rivojlanish uchun kuchli vositalar."
                    features={[
                        "5MB Avatar Yuklash",
                        "Kengaytirilgan AI Tahlil",
                        "Issiqlik Xaritasi",
                        "Oltin Avatar Halqasi",
                        "Yutuq Kuchaytiruvchilari",
                        "Ustunlik Qo'llab-quvvatlash"
                    ]}
                    buttonText="Hozir Yangilash"
                    isLoading={loadingType === 'monthly'}
                    onUpgrade={() => handleUpgrade('monthly')}
                />

                <Plan
                    name="Umrboq"
                    price="$49"
                    period="Bir martalik"
                    description="Bir marta to'lang, abadiy foydalaning."
                    features={[
                        "Pro Oylikdagi Hamma Narsa",
                        "Hech Qachon Obuna Yo'q",
                        "Dastlabki Tarafdor Nishoni",
                        "Kelajakdagi Yangiliklar Kiritilgan",
                        "Maxsus Asoschilar Hamjamiyati"
                    ]}
                    buttonText="Umrboq Tarif"
                    isLoading={loadingType === 'lifetime'}
                    onUpgrade={() => handleUpgrade('lifetime')}
                />
            </div>

            <div className="mt-20 p-8 rounded-[40px] bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-accent-blue/10 text-accent-blue rounded-3xl">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-lg">Stripe orqali Xavfsiz To'lov</h4>
                        <p className="text-white/40 text-sm font-medium">Sizning ma'lumotlaringiz va to'lov ma'lumotlari shifrlangan va himoyalangan.</p>
                    </div>
                </div>
                <div className="flex gap-4 opacity-40 grayscale transition-all">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
                </div>
            </div>
        </div>
    );
}
