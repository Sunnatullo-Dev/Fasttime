import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Crown, ArrowRight, Loader2 } from 'lucide-react';
import api from '../lib/api';

interface Props {
    sessionId?: string;
    onContinue: () => void;
    onProfileRefresh?: () => void;
}

export default function PaymentSuccess({ sessionId, onContinue, onProfileRefresh }: Props) {
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!sessionId) {
            setVerified(true);
            return;
        }

        const verify = async () => {
            setVerifying(true);
            try {
                await api.get(`/billing/verify?session_id=${sessionId}`);
                setVerified(true);
                // Refresh global user profile
                onProfileRefresh?.();
            } catch (err: any) {
                // Even if verify fails (e.g. dev mode), still show success
                setVerified(true);
                const msg = err.response?.data?.message || '';
                if (!msg.includes('Dev mode')) {
                    setError(err.response?.data?.error || '');
                }
            } finally {
                setVerifying(false);
            }
        };

        verify();
    }, [sessionId]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                className="w-full max-w-md text-center space-y-8"
            >
                {/* Icon */}
                <div className="relative mx-auto w-24 h-24">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1.2 }}
                        className="absolute inset-0 bg-accent-purple/20 blur-[60px] rounded-full"
                    />
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                        className="w-24 h-24 bg-accent-purple rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(139,92,246,0.5)] relative z-10"
                    >
                        {verifying
                            ? <Loader2 size={48} className="text-white animate-spin" />
                            : <Check size={48} strokeWidth={4} className="text-white" />
                        }
                    </motion.div>
                </div>

                {/* Text */}
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                        <Crown size={18} className="text-yellow-400" fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">
                            Premium Faollashtirildi
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Tabriklaymiz! 🎉</h1>
                    <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">
                        {verifying
                            ? "Premium tasdiqlanmoqda..."
                            : "Siz FASTTIME Premium foydalanuvchisiga aylandingiz. Barcha imkoniyatlar endi sizga ochiq!"
                        }
                    </p>
                    {error && (
                        <p className="text-orange-400 text-xs font-bold">{error}</p>
                    )}
                </div>

                {/* CTA */}
                <button
                    onClick={onContinue}
                    disabled={verifying}
                    className="w-full py-4 bg-accent-purple text-white rounded-2xl font-black text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-accent-purple/90 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-accent-purple/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Davom etish
                    <ArrowRight size={18} />
                </button>
            </motion.div>
        </motion.div>
    );
}
