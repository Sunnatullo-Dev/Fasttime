import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Plus, Calendar, Clock, RotateCcw, Trash2, CheckCircle2, X, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { Reminder } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function ReminderSystem() {
    const { t } = useTranslation();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('12:00');
    const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'yearly'>('none');

    useEffect(() => {
        fetchReminders();

        const handleUpdate = () => fetchReminders();
        window.addEventListener('reminders-updated', handleUpdate);

        return () => {
            window.removeEventListener('reminders-updated', handleUpdate);
        };
    }, []);

    const fetchReminders = async () => {
        try {
            const res = await api.get('/reminders');
            setReminders(res.data);
        } catch (err) {
            console.error('Fetch reminders error:', err);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const remindAt = new Date(`${date}T${time}`).toISOString();

        try {
            if (editingReminder) {
                await api.put(`/reminders/${editingReminder.id}`, {
                    title, description, remind_at: remindAt, repeat_option: repeat, is_completed: editingReminder.is_completed
                });
                toast.success(t('reminders.updated_success', 'Eslatma yangilandi'));
            } else {
                await api.post('/reminders', {
                    title, description, remind_at: remindAt, repeat_option: repeat
                });
                toast.success(t('reminders.added_success', "Yangi eslatma qo'shildi"));
            }
            setShowForm(false);
            setEditingReminder(null);
            resetForm();
            fetchReminders();
        } catch (err) {
            toast.error(t('common.error', 'Xatolik yuz berdi'));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        setRepeat('none');
    };

    const handleEdit = (rem: Reminder) => {
        setEditingReminder(rem);
        setTitle(rem.title);
        setDescription(rem.description || '');
        const d = new Date(rem.remind_at);
        setDate(d.toISOString().split('T')[0]);
        setTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        setRepeat(rem.repeat_option);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('reminders.delete_confirm', "Ushbu eslatmani o'chirmoqchimisiz?"))) return;
        try {
            await api.delete(`/reminders/${id}`);
            setReminders(reminders.filter(r => r.id !== id));
            toast.success(t('common.deleted', "O'chirildi"));
        } catch (err) {
            toast.error(t('reminders.delete_error', "O'chirishda xatolik"));
        }
    };

    const handleMarkDone = async (id: number) => {
        try {
            await api.post(`/reminders/${id}/done`);
            fetchReminders();
            toast.success(t('common.success', 'Bajarildi!'));
        } catch (err) {
            toast.error(t('common.error', 'Xatolik'));
        }
    };

    const activeReminders = reminders.filter(r => !r.is_completed);
    const completedReminders = reminders.filter(r => r.is_completed);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">{t('reminders.title', 'Eslatmalar & Rejalar')}</h3>
                    <p className="text-xl font-black tracking-tighter">{t('reminders.subtitle', 'SCHEDULE MANAGER')}</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingReminder(null); resetForm(); }}
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                >
                    <Plus size={16} /> {t('reminders.new_reminder', "Yangi Qo'shish")}
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-card p-8 rounded-[40px] bg-white/[0.02] border border-white/10"
                    >
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/20 tracking-widest ml-4 mb-2 block">{t('reminders.title_label', 'Sarlavha')}</label>
                                        <input
                                            required
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            placeholder={t('reminders.title_placeholder', "Masalan: Muhim uchrashuv")}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-accent-purple transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/20 tracking-widest ml-4 mb-2 block">{t('reminders.desc_label', 'Tavsif (ixtiyoriy)')}</label>
                                        <textarea
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder={t('reminders.desc_placeholder', "Batafsil ma'lumot...")}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-accent-purple transition-all h-32 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-white/20 tracking-widest ml-4 mb-2 block">{t('reminders.date_label', 'Sana')}</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                                <input
                                                    type="date"
                                                    required
                                                    value={date}
                                                    onChange={e => setDate(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-accent-purple transition-all [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-white/20 tracking-widest ml-4 mb-2 block">{t('reminders.time_label', 'Vaqt')}</label>
                                            <div className="relative">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                                <input
                                                    type="time"
                                                    required
                                                    value={time}
                                                    onChange={e => setTime(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-accent-purple transition-all [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/20 tracking-widest ml-4 mb-2 block">{t('reminders.repeat_label', 'Takrorlash')}</label>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                            {(['none', 'daily', 'weekly', 'yearly'] as const).map(opt => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setRepeat(opt)}
                                                    className={cn(
                                                        "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                        repeat === opt ? "bg-accent-purple border-accent-purple text-white" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                                    )}
                                                >
                                                    {opt === 'none' ? t('reminders.repeat_none', 'Yo\'q') : opt === 'daily' ? t('reminders.repeat_daily', 'Kunlik') : opt === 'weekly' ? t('reminders.repeat_weekly', 'Haftalik') : t('reminders.repeat_yearly', 'Yillik')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                                        >
                                            {loading ? t('reminders.saving', 'SAQLANMOQDA...') : t('reminders.save_btn', 'ESLATMANI SAQLASH')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="px-6 bg-white/5 text-white/40 hover:text-white rounded-2xl transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Reminders */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-2">
                        <Bell size={18} className="text-yellow-400" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-white/40">{t('reminders.active', 'Faol Eslatmalar')}</h4>
                    </div>
                    <div className="space-y-4">
                        {activeReminders.map(rem => (
                            <motion.div
                                layout
                                key={rem.id}
                                className="glass-card p-6 rounded-[32px] bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h5 className="text-lg font-black text-white">{rem.title}</h5>
                                            {rem.repeat_option !== 'none' && (
                                                <span className="px-2 py-0.5 bg-accent-purple/10 text-accent-purple rounded-md text-[8px] font-black uppercase">
                                                    <RotateCcw size={10} className="inline mr-1" /> {rem.repeat_option}
                                                </span>
                                            )}
                                        </div>
                                        {rem.description && <p className="text-sm text-white/40 font-medium leading-relaxed">{rem.description}</p>}
                                        <div className="flex items-center gap-4 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5 text-accent-blue">
                                                <Calendar size={12} />
                                                {new Date(rem.remind_at).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-yellow-400">
                                                <Clock size={12} />
                                                {new Date(rem.remind_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleMarkDone(rem.id)} className="p-3 bg-emerald-400/10 text-emerald-400 rounded-2xl hover:bg-emerald-400 hover:text-black transition-all">
                                            <CheckCircle2 size={20} />
                                        </button>
                                        <button onClick={() => handleEdit(rem)} className="p-3 bg-white/5 text-white/20 rounded-2xl hover:bg-white/10 hover:text-white transition-all">
                                            <Clock size={20} />
                                        </button>
                                        <button onClick={() => handleDelete(rem.id)} className="p-3 bg-red-400/10 text-red-400 rounded-2xl hover:bg-red-400 hover:text-white transition-all">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {activeReminders.length === 0 && (
                            <div className="p-10 text-center border-2 border-dashed border-white/5 rounded-[32px] text-white/10 font-black uppercase text-[10px] tracking-widest">
                                {t('reminders.no_reminders', "Hali rejalashtirilgan ishlar yo'q")}
                            </div>
                        )}
                    </div>
                </div>

                {/* Completed Reminders */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-2">
                        <CheckCircle2 size={18} className="text-white/20" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-white/20">{t('reminders.completed', 'Yakunlanganlar')}</h4>
                    </div>
                    <div className="space-y-4 opacity-40">
                        {completedReminders.map(rem => (
                            <div key={rem.id} className="glass-card p-6 rounded-[32px] bg-black/20 border border-white/5 line-through decoration-white/20">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h5 className="text-sm font-bold text-white/60">{rem.title}</h5>
                                        <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">
                                            {new Date(rem.remind_at).toLocaleDateString()} {t('reminders.completed_at', 'da yakunlangan')}
                                        </p>
                                    </div>
                                    <button onClick={() => handleDelete(rem.id)} className="p-3 text-white/10 hover:text-red-400 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {completedReminders.length === 0 && (
                            <div className="p-10 text-center border border-white/5 rounded-[32px] text-white/5 font-black uppercase text-[10px] tracking-widest">
                                {t('reminders.history_empty', 'Tarix bo\'sh')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
