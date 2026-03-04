import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    X, CreditCard, Lock, Crown, Infinity as InfinityIcon,
    CheckCircle2, Loader2, ShieldCheck, ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { toast } from 'sonner';
import FlagIcon from './FlagIcon';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type BillingPlan = 'MONTHLY' | 'LIFETIME';

// ─────────────────────────────────────────────────────────────────────────────
// Countries Dataset
// ─────────────────────────────────────────────────────────────────────────────
const COUNTRIES = [
    { code: 'AF', name: 'Afgʻoniston' },
    { code: 'AL', name: 'Albaniya' },
    { code: 'DZ', name: 'Jazoir' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AO', name: 'Angola' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AM', name: 'Armaniston' },
    { code: 'AU', name: 'Avstraliya' },
    { code: 'AT', name: 'Avstriya' },
    { code: 'AZ', name: 'Ozarbayjon' },
    { code: 'BH', name: 'Bahrayn' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgiya' },
    { code: 'BR', name: 'Braziliya' },
    { code: 'BG', name: 'Bolgariya' },
    { code: 'CA', name: 'Kanada' },
    { code: 'CL', name: 'Chili' },
    { code: 'CN', name: 'Xitoy' },
    { code: 'CO', name: 'Kolumbiya' },
    { code: 'HR', name: 'Xorvatiya' },
    { code: 'CY', name: 'Kipr' },
    { code: 'CZ', name: 'Chexiya' },
    { code: 'DK', name: 'Daniya' },
    { code: 'EG', name: 'Misr' },
    { code: 'EE', name: 'Estoniya' },
    { code: 'FI', name: 'Finlandiya' },
    { code: 'FR', name: 'Fransiya' },
    { code: 'GE', name: 'Gruziya' },
    { code: 'DE', name: 'Germaniya' },
    { code: 'GR', name: 'Gretsiya' },
    { code: 'HU', name: 'Vengriya' },
    { code: 'IS', name: 'Islandiya' },
    { code: 'IN', name: 'Hindiston' },
    { code: 'ID', name: 'Indoneziya' },
    { code: 'IR', name: 'Eron' },
    { code: 'IQ', name: 'Iroq' },
    { code: 'IE', name: 'Irlandiya' },
    { code: 'IL', name: 'Isroil' },
    { code: 'IT', name: 'Italiya' },
    { code: 'JP', name: 'Yaponiya' },
    { code: 'JO', name: 'Iordaniya' },
    { code: 'KZ', name: 'Qozogʻiston' },
    { code: 'KE', name: 'Keniya' },
    { code: 'KR', name: 'Janubiy Koreya' },
    { code: 'KW', name: 'Quvayt' },
    { code: 'KG', name: 'Qirgʻiziston' },
    { code: 'LV', name: 'Latviya' },
    { code: 'LB', name: 'Livan' },
    { code: 'LY', name: 'Liviya' },
    { code: 'LT', name: 'Litva' },
    { code: 'LU', name: 'Lyuksemburg' },
    { code: 'MY', name: 'Malayziya' },
    { code: 'MT', name: 'Malta' },
    { code: 'MX', name: 'Meksika' },
    { code: 'MD', name: 'Moldova' },
    { code: 'MC', name: 'Monako' },
    { code: 'MN', name: 'Moʻgʻuliston' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MA', name: 'Marokash' },
    { code: 'NL', name: 'Niderlandiya' },
    { code: 'NZ', name: 'Yangi Zelandiya' },
    { code: 'NG', name: 'Nigeriya' },
    { code: 'NO', name: 'Norvegiya' },
    { code: 'OM', name: 'Ummon' },
    { code: 'PK', name: 'Pokiston' },
    { code: 'PS', name: 'Falastin' },
    { code: 'PH', name: 'Filippin' },
    { code: 'PL', name: 'Polsha' },
    { code: 'PT', name: 'Portugaliya' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Ruminiya' },
    { code: 'RU', name: 'Rossiya' },
    { code: 'SA', name: 'Saudiya Arabistoni' },
    { code: 'RS', name: 'Serbiya' },
    { code: 'SG', name: 'Singapur' },
    { code: 'SK', name: 'Slovakiya' },
    { code: 'SI', name: 'Sloveniya' },
    { code: 'ZA', name: 'Janubiy Afrika' },
    { code: 'ES', name: 'Ispaniya' },
    { code: 'LK', name: 'Shri-Lanka' },
    { code: 'SE', name: 'Shvetsiya' },
    { code: 'CH', name: 'Shveytsariya' },
    { code: 'SY', name: 'Suriya' },
    { code: 'TW', name: 'Tayvan' },
    { code: 'TJ', name: 'Tojikiston' },
    { code: 'TH', name: 'Tailand' },
    { code: 'TN', name: 'Tunis' },
    { code: 'TR', name: 'Turkiya' },
    { code: 'TM', name: 'Turkmaniston' },
    { code: 'UA', name: 'Ukraina' },
    { code: 'AE', name: 'BAA' },
    { code: 'GB', name: 'Birlashgan Qirollik' },
    { code: 'US', name: 'AQSH' },
    { code: 'UZ', name: 'Oʻzbekiston' },
    { code: 'VN', name: 'Vyetnam' },
];

interface BillingModalProps {
    isOpen: boolean;
    plan: BillingPlan;
    currentUser?: { username?: string; full_name?: string };
    onClose: () => void;
    onSuccess: () => void;          // called after successful payment → refresh profile
}

interface FormState {
    cardNumber: string;
    expiry: string;
    cvv: string;
    fullName: string;
    countryName: string;
    countryCode: string;
    address: string;
}

interface FormErrors {
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
    address?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan meta
// ─────────────────────────────────────────────────────────────────────────────
const PLAN_META: Record<BillingPlan, {
    label: string;
    sublabel: string;
    price: number;
    priceLabel: string;
    color: string;
    glowClass: string;
    borderClass: string;
    features: string[];
    Icon: React.ElementType;
}> = {
    MONTHLY: {
        label: 'Pro Oylik',
        sublabel: 'Oylik obuna',
        price: 1.50,
        priceLabel: '$1.50 / oy',
        color: 'text-accent-purple',
        glowClass: 'bg-accent-purple/20',
        borderClass: 'border-accent-purple/40',
        features: [
            'Cheksiz AI Analizator',
            "Ilg'or statistika & Heatmap",
            'Custom taymer (20/40/60) + ringtone',
            'Fokus musiqalari',
            'Jamoaviy Deep Monitoring',
            'Golden avatar halqasi',
        ],
        Icon: Crown,
    },
    LIFETIME: {
        label: 'Umrboq',
        sublabel: 'Bir martalik to\'lov',
        price: 49,
        priceLabel: '$49 bir martalik',
        color: 'text-yellow-400',
        glowClass: 'bg-yellow-400/20',
        borderClass: 'border-yellow-400/40',
        features: [
            'Barcha Pro imkoniyatlar',
            'Kelajakdagi barcha yangilanishlar',
            'Early Access (Beta)',
            'Founder Badge',
            'Maxsus asoschilar hamjamiyati',
        ],
        Icon: InfinityIcon,
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatCardNumber(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
}

function getFlagEmoji(code: string) {
    if (!code || code.length !== 2) return "🏳️";
    return code
        .toUpperCase()
        .replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function validateCard(n: string): string | undefined {
    const digits = n.replace(/\s/g, '');
    if (digits.length !== 16 || !/^\d+$/.test(digits)) return "16 ta raqam kiriting";
}

function validateExpiry(val: string): string | undefined {
    const m = val.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return "MM/YY formatida kiriting";
    const month = parseInt(m[1], 10);
    const year = 2000 + parseInt(m[2], 10);
    if (month < 1 || month > 12) return "Noto'g'ri oy";
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
        return "Muddati o'tgan";
    }
}

function validateCVV(v: string): string | undefined {
    if (!/^\d{3}$/.test(v)) return "3 ta raqam kiriting";
}

function validateAddress(a: string): string | undefined {
    if (a.trim().length < 5) return "Kamida 5 ta belgi";
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function BillingModal({ isOpen, plan, currentUser, onClose, onSuccess }: BillingModalProps) {
    const meta = PLAN_META[plan];

    const [form, setForm] = useState<FormState>({
        cardNumber: '',
        expiry: '',
        cvv: '',
        fullName: currentUser?.full_name || currentUser?.username || '',
        countryName: 'Oʻzbekiston',
        countryCode: 'UZ',
        address: '',
    });
    const [countrySearch, setCountrySearch] = useState('');
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [paid, setPaid] = useState(false);

    // Reset state when plan changes or modal reopens
    useEffect(() => {
        if (isOpen) {
            setForm({
                cardNumber: '',
                expiry: '',
                cvv: '',
                fullName: currentUser?.full_name || currentUser?.username || '',
                countryName: 'Oʻzbekiston',
                countryCode: 'UZ',
                address: '',
            });
            setCountrySearch('');
            setIsCountryOpen(false);
            setErrors({});
            setTouched({});
            setLoading(false);
            setPaid(false);
        }
    }, [isOpen, plan]);

    // ESC to close
    useEffect(() => {
        if (!isOpen) return;
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [isOpen, loading, onClose]);

    // Body and Modal scroll lock
    useEffect(() => {
        if (isOpen) {
            if (isCountryOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'hidden';
            }
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, isCountryOpen]);

    // ── Validation ────────────────────────────────────────────────────────
    const validate = useCallback((f: FormState): FormErrors => {
        const e: FormErrors = {};
        const ce = validateCard(f.cardNumber);
        if (ce) e.cardNumber = ce;
        const ee = validateExpiry(f.expiry);
        if (ee) e.expiry = ee;
        const ve = validateCVV(f.cvv);
        if (ve) e.cvv = ve;
        const ae = validateAddress(f.address);
        if (ae) e.address = ae;
        return e;
    }, []);

    const currentErrors = validate(form);
    const isFormValid = Object.keys(currentErrors).length === 0 && form.fullName.trim().length > 0;

    // Diagnostic log
    useEffect(() => {
        if (isOpen) {
            console.log("BillingModal mounted. Countries count:", COUNTRIES.length);
        }
    }, [isOpen]);

    // ── Field helpers ─────────────────────────────────────────────────────
    const handleChange = (field: keyof FormState, raw: string) => {
        let val = raw;
        if (field === 'cardNumber') val = formatCardNumber(raw);
        if (field === 'expiry') val = formatExpiry(raw);
        if (field === 'cvv') val = raw.replace(/\D/g, '').slice(0, 3);
        setForm(prev => ({ ...prev, [field]: val }));
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const showErr = (field: keyof FormErrors) =>
        touched[field] ? currentErrors[field] : undefined;

    const filteredCountries = COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
    );

    // ── Submit ────────────────────────────────────────────────────────────
    const handlePay = async () => {
        // Mark everything touched to show all errors
        setTouched({ cardNumber: true, expiry: true, cvv: true, address: true });
        if (!isFormValid) return;

        setLoading(true);
        try {
            // Mock: 800–1200 ms simulated async payment
            await new Promise(r => setTimeout(r, 800 + Math.random() * 400));

            // Call backend mock checkout
            await api.post('/billing/demo-purchase', { plan });

            setPaid(true);
            // Give user 1.5s to see success before closing
            setTimeout(() => {
                toast.success("To'lov yechildi ✅", {
                    description: plan === 'MONTHLY'
                        ? 'Pro Oylik tarifi faollashtirildi!'
                        : 'Umrboq tarifi faollashtirildi!',
                    duration: 5000,
                });
                onSuccess();   // refresh profile in App
                onClose();
            }, 1500);
        } catch (err: any) {
            if (err.response?.status === 409) {
                toast.error("Siz allaqachon PREMIUMga obuna bo'lgansiz.", {
                    description: "Profil ma'lumotlari yangilandi."
                });
                onSuccess(); // refresh profile
                onClose();
            } else {
                toast.error(err.response?.data?.error || "Xatolik. Keyinroq urinib ko'ring.");
                setLoading(false);
            }
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────
    const isMonthly = plan === 'MONTHLY';
    const accentText = isMonthly ? 'text-accent-purple' : 'text-yellow-400';
    const accentBg = isMonthly ? 'bg-accent-purple' : 'bg-yellow-400';
    const accentBorder = isMonthly ? 'border-accent-purple/40' : 'border-yellow-400/40';
    const accentGlow = isMonthly
        ? 'shadow-[0_0_60px_-10px_rgba(139,92,246,0.4)]'
        : 'shadow-[0_0_60px_-10px_rgba(250,204,21,0.3)]';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[10000] flex items-start justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto"
                    onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 24 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        className="relative w-full max-w-[900px] bg-[#09090d] border border-white/10 rounded-[28px] overflow-hidden my-8"
                    >
                        {/* ── Success Overlay ────────────────────────────────── */}
                        <AnimatePresence>
                            {paid && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#09090d]/95 rounded-[28px]"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
                                    >
                                        <CheckCircle2
                                            size={72}
                                            className={cn("mb-6", accentText)}
                                            strokeWidth={1.5}
                                        />
                                    </motion.div>
                                    <p className="text-2xl font-black text-white tracking-tight mb-2">
                                        To'lov yechildi ✅
                                    </p>
                                    <p className="text-white/40 text-sm">
                                        {meta.label} tarifi faollashtirilmoqda...
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Top bar ───────────────────────────────────────── */}
                        <div className="flex items-center justify-between px-8 pt-7 pb-0">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">
                                    FASTTIME
                                </p>
                                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                                    Premium to'lovini boshlang
                                </h2>
                            </div>
                            <button
                                onClick={() => { if (!loading) onClose(); }}
                                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* ── Two-column body ───────────────────────────────── */}
                        <div className="grid md:grid-cols-[1fr_340px] gap-0 mt-6">

                            {/* ══ LEFT: Payment form ══════════════════════════ */}
                            <div className="px-8 pb-8 md:border-r border-white/[0.06] space-y-7">

                                {/* Card section */}
                                <div>
                                    <SectionLabel icon={<CreditCard size={14} />} label="To'lov usuli" />

                                    <div className="space-y-3 mt-3">
                                        {/* Card number */}
                                        <FieldWrap error={showErr('cardNumber')}>
                                            <input
                                                id="billing-card-number"
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="1234 5678 9012 3456"
                                                value={form.cardNumber}
                                                onChange={e => handleChange('cardNumber', e.target.value)}
                                                onBlur={() => handleBlur('cardNumber')}
                                                maxLength={19}
                                                className={inputCls(!!showErr('cardNumber'))}
                                            />
                                            <FieldLabel>Kartani raqami</FieldLabel>
                                        </FieldWrap>

                                        {/* Expiry + CVV row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <FieldWrap error={showErr('expiry')}>
                                                <div className="flex justify-between items-center mb-1 px-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Muddati</label>
                                                </div>
                                                <input
                                                    id="billing-expiry"
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="MM/YY"
                                                    value={form.expiry}
                                                    onChange={e => handleChange('expiry', e.target.value)}
                                                    onBlur={() => handleBlur('expiry')}
                                                    maxLength={5}
                                                    className={inputCls(!!showErr('expiry'))}
                                                />
                                                <FieldLabel>Amal qilish muddati</FieldLabel>
                                            </FieldWrap>
                                            <FieldWrap error={showErr('cvv')}>
                                                <div className="flex justify-between items-center mb-1 px-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">CVV</label>
                                                </div>
                                                <input
                                                    id="billing-cvv"
                                                    type="password"
                                                    inputMode="numeric"
                                                    placeholder="•••"
                                                    value={form.cvv}
                                                    onChange={e => handleChange('cvv', e.target.value)}
                                                    onBlur={() => handleBlur('cvv')}
                                                    maxLength={3}
                                                    className={inputCls(!!showErr('cvv'))}
                                                />
                                                <FieldLabel>Xavfsizlik kodi</FieldLabel>
                                            </FieldWrap>
                                        </div>
                                    </div>
                                </div>

                                {/* Billing address section */}
                                <div>
                                    <SectionLabel icon={<Lock size={14} />} label="To'lovchi manzili" />

                                    <div className="space-y-3 mt-3">
                                        {/* Full name */}
                                        <FieldWrap>
                                            <input
                                                id="billing-fullname"
                                                type="text"
                                                placeholder="Ism Familiya"
                                                value={form.fullName}
                                                onChange={e => handleChange('fullName', e.target.value)}
                                                className={inputCls(false)}
                                            />
                                            <FieldLabel>To'lovchi ismi</FieldLabel>
                                        </FieldWrap>

                                        {/* Country Selector */}
                                        <div className="relative">
                                            <div className="mt-3">
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log("Country selector clicked, current isCountryOpen:", isCountryOpen);
                                                        setIsCountryOpen(!isCountryOpen);
                                                    }}
                                                    className={cn(
                                                        inputCls(false),
                                                        "flex items-center justify-between cursor-pointer group hover:border-white/20 transition-all",
                                                        isCountryOpen && "border-accent-purple/50 bg-white/[0.08]"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center bg-white/5 border border-white/15 overflow-hidden shadow-[0_0_12px_rgba(59,130,246,0.15)] flex-shrink-0">
                                                            <FlagIcon code={form.countryCode} size={24} className="scale-110" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-0.5">Mamlakat</span>
                                                            <span className="text-sm font-bold text-white/90">{form.countryName}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronDown size={18} className={cn("text-white/20 group-hover:text-white/40 transition-transform duration-300", isCountryOpen && "rotate-180 text-accent-purple/60")} />
                                                </div>

                                                {createPortal(
                                                    <AnimatePresence mode="wait">
                                                        {isCountryOpen && (
                                                            <div
                                                                className="fixed inset-0 z-[2000000] flex items-center justify-center p-4 md:p-8"
                                                                onKeyDown={(e) => { if (e.key === 'Escape') setIsCountryOpen(false); }}
                                                            >
                                                                {/* Backdrop */}
                                                                <motion.div
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    exit={{ opacity: 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    onClick={() => setIsCountryOpen(false)}
                                                                    className="absolute inset-0 bg-black/80 backdrop-blur-[12px] z-[2000001]"
                                                                />

                                                                {/* Dropdown Card */}
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -12, scale: 0.98 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    exit={{ opacity: 0, y: -8, scale: 0.99 }}
                                                                    transition={{
                                                                        duration: 0.18,
                                                                        ease: [0.23, 1, 0.32, 1]
                                                                    }}
                                                                    className="relative w-full max-w-[620px] max-h-[80vh] overflow-hidden rounded-[20px] flex flex-col z-[2000002] border border-blue-500/20 group/modal"
                                                                    style={{
                                                                        background: 'linear-gradient(180deg, rgba(10, 12, 20, 0.98) 0%, rgba(6, 8, 14, 0.99) 100%)',
                                                                        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.8), 0 0 50px rgba(59, 130, 246, 0.12)',
                                                                        backdropFilter: 'blur(20px)'
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onMouseMove={(e) => {
                                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                                        const x = e.clientX - rect.left;
                                                                        const y = e.clientY - rect.top;
                                                                        e.currentTarget.style.setProperty('--mx', `${x}px`);
                                                                        e.currentTarget.style.setProperty('--my', `${y}px`);
                                                                    }}
                                                                >
                                                                    {/* Mouse Follow Radial Light */}
                                                                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover/modal:opacity-100 transition-opacity duration-500"
                                                                        style={{
                                                                            background: 'radial-gradient(400px circle at var(--mx) var(--my), rgba(59, 130, 246, 0.08), transparent 80%)'
                                                                        }}
                                                                    />

                                                                    {/* Inner Glow Border Top */}
                                                                    <div className="absolute inset-0 pointer-events-none rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" />

                                                                    {/* Sticky Search Header */}
                                                                    <div className="sticky top-0 z-20 p-7 border-b border-blue-500/10 bg-white/[0.01] backdrop-blur-xl">
                                                                        <div className="flex items-center justify-between mb-5">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-1 h-5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                                                                                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-400/60">Davlatni tanlash</h3>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => setIsCountryOpen(false)}
                                                                                className="p-2.5 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-all duration-300 transform hover:scale-110"
                                                                            >
                                                                                <X size={18} />
                                                                            </button>
                                                                        </div>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Davlat nomi bo'yicha qidiruv..."
                                                                                value={countrySearch}
                                                                                onChange={e => setCountrySearch(e.target.value)}
                                                                                className="w-full bg-[#10121e]/90 border border-blue-500/10 rounded-xl px-6 py-4.5 text-[#ebf5ff]/95 placeholder:text-blue-400/30 focus:outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 focus:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all font-bold text-lg"
                                                                                autoFocus
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* List Area */}
                                                                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-1.5 min-h-[400px]">
                                                                        {filteredCountries.length > 0 ? (
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                                {filteredCountries.map(c => (
                                                                                    <motion.div
                                                                                        key={c.code}
                                                                                        whileTap={{ scale: 0.98 }}
                                                                                        onClick={() => {
                                                                                            setForm(prev => ({ ...prev, countryName: c.name, countryCode: c.code }));
                                                                                            setIsCountryOpen(false);
                                                                                            setCountrySearch('');
                                                                                        }}
                                                                                        className={cn(
                                                                                            "relative px-6 py-5 rounded-xl transition-all duration-300 flex items-center justify-between cursor-pointer group border overflow-hidden",
                                                                                            form.countryCode === c.code
                                                                                                ? "bg-blue-500/10 border-l-[3px] border-l-blue-500 border-t-white/5 border-r-white/5 border-b-white/5 text-white shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
                                                                                                : "bg-white/[0.02] border-white/5 text-blue-100/60 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-white"
                                                                                        )}
                                                                                    >
                                                                                        {/* Light Sweep Effect */}
                                                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                                                                                        <div className="flex items-center gap-4 relative z-10 flex-1">
                                                                                            <div className={cn(
                                                                                                "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-[#141928]/90 border border-blue-500/25 shadow-[0_0_18px_rgba(59,130,246,0.12)] transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] flex-shrink-0 overflow-hidden",
                                                                                                form.countryCode === c.code && "border-blue-500/55 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                                                                            )}>
                                                                                                <motion.div
                                                                                                    className="w-full h-full flex items-center justify-center p-0"
                                                                                                    whileHover={{ scale: 1.05 }}
                                                                                                >
                                                                                                    <FlagIcon code={c.code} size={32} className="scale-110" />
                                                                                                </motion.div>
                                                                                            </div>

                                                                                            <span className={cn(
                                                                                                "text-sm font-bold tracking-tight transition-colors flex-1 truncate",
                                                                                                form.countryCode === c.code ? "text-white" : "text-blue-100/60 group-hover:text-white"
                                                                                            )}>
                                                                                                {c.name}
                                                                                            </span>

                                                                                            <span className="text-[10px] font-mono tracking-widest text-blue-400/20 group-hover:text-blue-400/40 transition-colors uppercase">
                                                                                                {c.code}
                                                                                            </span>
                                                                                        </div>
                                                                                        {form.countryCode === c.code ? (
                                                                                            <motion.div
                                                                                                initial={{ scale: 0.5, opacity: 0 }}
                                                                                                animate={{ scale: 1, opacity: 1 }}
                                                                                                className="relative z-10"
                                                                                            >
                                                                                                <CheckCircle2 size={18} className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                                                                            </motion.div>
                                                                                        ) : (
                                                                                            <div className="w-5 h-5 rounded-full border border-white/5 group-hover:border-blue-500/30 transition-colors" />
                                                                                        )}
                                                                                    </motion.div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="py-32 text-center flex flex-col items-center justify-center space-y-4">
                                                                                <div className="w-16 h-16 bg-blue-500/5 rounded-full flex items-center justify-center border border-blue-500/10">
                                                                                    <X className="text-blue-500/20" size={32} />
                                                                                </div>
                                                                                <p className="text-xs text-blue-400/20 font-black uppercase tracking-[0.5em]">Hech narsa topilmadi</p>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Footer */}
                                                                    <div className="p-5 bg-[#06080e]/80 border-t border-white/5 text-center backdrop-blur-md">
                                                                        <p className="text-[10px] text-blue-400/20 uppercase tracking-[0.4em] font-black italic">FastTime Secure Checkout Intelligence</p>
                                                                    </div>
                                                                </motion.div>
                                                            </div>
                                                        )}
                                                    </AnimatePresence>,
                                                    document.body
                                                )}
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <FieldWrap error={showErr('address')}>
                                            <input
                                                id="billing-address"
                                                type="text"
                                                placeholder="Ko'cha, uy raqami"
                                                value={form.address}
                                                onChange={e => handleChange('address', e.target.value)}
                                                onBlur={() => handleBlur('address')}
                                                className={inputCls(!!showErr('address'))}
                                            />
                                            <FieldLabel>Manzil</FieldLabel>
                                        </FieldWrap>
                                    </div>
                                </div>

                                {/* Trust badges (desktop — kept in left column) */}
                                <div className="flex items-center gap-2 pt-1">
                                    <ShieldCheck size={14} className="text-white/20 shrink-0" />
                                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
                                        256-bit shifrlangan • Xavfsiz to'lov
                                    </p>
                                </div>
                            </div>

                            {/* ══ RIGHT: Plan summary ═════════════════════════ */}
                            <div className="flex flex-col px-7 py-8">
                                {/* Plan card */}
                                <div className={cn(
                                    "rounded-[20px] border p-5 mb-6 relative overflow-hidden",
                                    accentBorder, accentGlow,
                                    isMonthly ? 'bg-accent-purple/[0.07]' : 'bg-yellow-400/[0.05]'
                                )}>
                                    {/* Subtle ambient glow blob */}
                                    <div className={cn(
                                        "absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-60",
                                        isMonthly ? 'bg-accent-purple/30' : 'bg-yellow-400/25'
                                    )} />

                                    <div className="flex items-center gap-2 mb-3 relative">
                                        <meta.Icon size={18} className={cn(accentText)} />
                                        <h3 className="text-base font-black text-white uppercase tracking-widest">
                                            {meta.label}
                                        </h3>
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-2 mb-4">
                                        {meta.features.map(f => (
                                            <li key={f} className="flex items-start gap-2">
                                                <CheckCircle2 size={13} className={cn("mt-0.5 shrink-0", accentText)} />
                                                <span className="text-[11px] text-white/60 leading-snug">{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Divider */}
                                    <div className="h-px bg-white/[0.06] mb-4" />

                                    {/* Pricing rows */}
                                    <div className="space-y-2 text-xs">
                                        <PriceRow
                                            label={meta.sublabel}
                                            value={`$${meta.price.toFixed(2)}`}
                                            className="text-white/60"
                                        />
                                        <PriceRow
                                            label="Taxminiy soliq"
                                            value="$0.00"
                                            className="text-white/30"
                                        />
                                        <div className="h-px bg-white/[0.06] my-1" />
                                        <PriceRow
                                            label="Bugun to'lanishi kerak"
                                            value={`$${meta.price.toFixed(2)}`}
                                            bold
                                            className={accentText}
                                        />
                                    </div>
                                </div>

                                {/* CTA button */}
                                <motion.button
                                    id="billing-confirm-btn"
                                    onClick={handlePay}
                                    disabled={!isFormValid || loading || paid}
                                    whileHover={isFormValid && !loading ? { scale: 1.02 } : {}}
                                    whileTap={isFormValid && !loading ? { scale: 0.97 } : {}}
                                    className={cn(
                                        "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest",
                                        "flex items-center justify-center gap-2 transition-all duration-300",
                                        isMonthly
                                            ? "bg-accent-purple text-white shadow-xl shadow-accent-purple/25"
                                            : "bg-yellow-400 text-black shadow-xl shadow-yellow-400/20",
                                        (!isFormValid || loading || paid) && "opacity-40 cursor-not-allowed scale-[0.99]"
                                    )}
                                >
                                    {loading ? (
                                        <><Loader2 size={16} className="animate-spin" /> Amalga oshirilmoqda...</>
                                    ) : paid ? (
                                        <><CheckCircle2 size={16} /> Muvaffaqiyatli!</>
                                    ) : (
                                        'YANGILASH'
                                    )}
                                </motion.button>

                                {/* Validation hint */}
                                {!isFormValid && !loading && (
                                    <p className="text-[10px] text-white/25 text-center mt-3 font-medium">
                                        Barcha maydonlarni to'ldiring
                                    </p>
                                )}

                                {/* Legal micro-text */}
                                <p className="text-[9px] text-white/15 text-center mt-4 leading-relaxed">
                                    {plan === 'MONTHLY'
                                        ? "Obuna har oyda avtomatik yangilanadi. Istalgan vaqt bekor qilishingiz mumkin."
                                        : "Bir martalik to'lov. Qaytarib bo'lmaydi."}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-white/30">{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{label}</span>
            <div className="flex-1 h-px bg-white/[0.05]" />
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-white/25 pointer-events-none select-none hidden">
            {children}
        </span>
    );
}

function FieldWrap({ children, error }: { children: React.ReactNode; error?: string }) {
    return (
        <div className="relative group">
            {children}
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-red-400/80 mt-1 pl-1 font-medium"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
}

function PriceRow({
    label, value, bold, className
}: {
    label: string;
    value: string;
    bold?: boolean;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center justify-between", className)}>
            <span className={bold ? "font-black text-[11px]" : "text-[11px]"}>{label}</span>
            <span className={bold ? "font-black text-[13px]" : "font-semibold"}>{value}</span>
        </div>
    );
}

function inputCls(hasError: boolean) {
    return cn(
        "w-full px-4 py-3.5 rounded-2xl text-sm font-medium text-white placeholder:text-white/20",
        "bg-white/[0.04] border transition-all outline-none",
        "focus:bg-white/[0.07] focus:ring-0",
        hasError
            ? "border-red-500/50 focus:border-red-500/70"
            : "border-white/[0.08] focus:border-white/20"
    );
}
