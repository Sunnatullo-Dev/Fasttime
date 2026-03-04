import React, { useState } from 'react';
import api from '../lib/api';
import { toast } from 'sonner';
import { Link as LinkIcon, Users } from 'lucide-react';
import { motion } from 'motion/react';

export default function JoinByCode({ onComplete }: { onComplete: () => void }) {
    const [code, setCode] = useState('');

    const handleJoin = async () => {
        if (!code) return;
        try {
            await api.post('/teams/join', { code });
            toast.success("Jamoaga muvaffaqiyatli qo'shildingiz!");
            onComplete();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Xatolik yuz berdi.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card rounded-[48px] p-12 max-w-md w-full border-2 border-accent-blue/20 bg-gradient-to-br from-accent-blue/5 to-transparent shadow-2xl"
            >
                <div className="w-20 h-20 bg-accent-blue/10 rounded-3xl flex items-center justify-center mb-8 mx-auto border border-accent-blue/20">
                    <LinkIcon size={32} className="text-accent-blue" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase">Kod orqali qo'shilish</h2>
                <p className="text-white/40 mb-10 text-sm font-medium leading-relaxed">
                    Sizga yuborilgan jamoa kodini kiriting va hamkasblaringiz bilan birga fokusni boshlang.
                </p>
                <div className="space-y-6 text-left">
                    <div className="relative">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="FT7K2Q9"
                            maxLength={8}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-3xl font-black text-center tracking-[0.4em] text-white focus:outline-none focus:border-accent-blue transition-all"
                        />
                    </div>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleJoin}
                            disabled={!code}
                            className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 disabled:opacity-20 disabled:scale-100"
                        >
                            Jamoaga qo'shilish
                        </button>
                        <button
                            onClick={onComplete}
                            className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            Orqaga qaytish
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
