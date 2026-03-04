import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { toast } from 'sonner';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function JoinTeam({ token, onComplete }: { token: string, onComplete: () => void }) {
    const [invite, setInvite] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                const res = await api.get(`/teams/invites/${token}`);
                setInvite(res.data);
                setLoading(false);
            } catch (error: any) {
                toast.error(error.response?.data?.error || "Noto'g'ri taklif havolasi.");
                onComplete();
            }
        };
        fetchInvite();
    }, [token, onComplete]);

    const handleJoin = async () => {
        try {
            await api.post('/teams/invites/accept', { token });
            toast.success("Jamoaga muvaffaqiyatli qo'shildingiz!");
            onComplete();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Xatolik yuz berdi.");
            onComplete();
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-accent-purple" size={32} />
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card rounded-[48px] p-12 max-w-md w-full border-2 border-accent-purple/20 bg-gradient-to-br from-accent-purple/5 to-transparent shadow-2xl"
            >
                <div className="w-20 h-20 bg-accent-purple/10 rounded-3xl flex items-center justify-center mb-8 mx-auto border border-accent-purple/20">
                    <ShieldCheck size={32} className="text-accent-purple" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase">Jamoaga Taklif</h2>
                <p className="text-white/60 mb-1 font-bold text-sm uppercase tracking-widest">Sizni taklif qilishdi:</p>
                <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">{invite.team_name}</h3>
                <p className="text-white/40 mb-10 text-sm font-medium leading-relaxed">
                    Siz ushbu jamoaga <span className="text-white font-bold">{invite.role}</span> sifatida qo'shilmoqchimisiz?
                </p>
                <div className="flex flex-col gap-4">
                    <button
                        onClick={handleJoin}
                        className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10"
                    >
                        Qo'shilish
                    </button>
                    <button
                        onClick={onComplete}
                        className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                        Bekor qilish
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
