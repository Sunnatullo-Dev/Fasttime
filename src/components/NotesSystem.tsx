import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, FileText, Save, X, CheckCircle2 } from 'lucide-react';
import { Note } from '../types';
import api from '../lib/api';
import { cn } from '../lib/utils';

export default function NotesSystem() {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<Note>>({ title: '', content: '' });
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await api.get('/notes');
      setNotes(response.data);
    } catch (error) {
      console.error('Eslatmalarni yuklashda xatolik:', error);
    }
  };

  const handleSave = async (noteToSave: Partial<Note>) => {
    if (!noteToSave.title?.trim()) return;

    try {
      if (noteToSave.id) {
        await api.patch(`/notes/${noteToSave.id}`, noteToSave);
        setNotes(prev => prev.map(n => n.id === noteToSave.id ? { ...n, ...noteToSave, updated_at: new Date().toISOString() } as Note : n));
      } else {
        const response = await api.post('/notes', noteToSave);
        setNotes(prev => [response.data, ...prev]);
        setCurrentNote(response.data);
      }
    } catch (error) {
      console.error('Saqlashda xatolik:', error);
    }
  };

  const handleNoteChange = (updates: Partial<Note>) => {
    const updatedNote = { ...currentNote, ...updates };
    setCurrentNote(updatedNote);

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(updatedNote);
    }, 1500); // 1.5 sekundlik debounce
  };

  const deleteNote = async (id: number) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter(n => n.id !== id));
      if (currentNote.id === id) {
        setIsEditing(false);
        setCurrentNote({ title: '', content: '' });
      }
    } catch (error) {
      console.error('O\'chirishda xatolik:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">{t('notes.title', "O'quv Eslatmalari")}</h3>
        <button
          onClick={() => {
            setIsEditing(true);
            setCurrentNote({ title: '', content: '' });
          }}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-white/5"
        >
          <Plus size={16} className="text-accent-purple" />
          {t('notes.add_note', 'Yangi Eslatma')}
        </button>
      </div>

      {isEditing ? (
        <div className="glass-card rounded-[32px] p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center">
            <input
              type="text"
              placeholder={t('notes.title_placeholder', "Eslatma sarlavhasi")}
              value={currentNote.title}
              onChange={(e) => handleNoteChange({ title: e.target.value })}
              className="bg-transparent text-2xl font-bold text-white placeholder:text-white/10 focus:outline-none tracking-tight"
            />
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/20 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          <textarea
            placeholder={t('notes.content_placeholder', "Fikrlaringizni yozishni boshlang...")}
            value={currentNote.content}
            onChange={(e) => handleNoteChange({ content: e.target.value })}
            className="w-full bg-transparent text-white/60 placeholder:text-white/10 focus:outline-none min-h-[400px] resize-none leading-relaxed text-lg custom-scrollbar"
          />
          <div className="flex justify-between items-center pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/20">
              <div className="w-1.5 h-1.5 bg-accent-purple rounded-full animate-pulse" />
              {t('notes.auto_save', 'Avto-saqlash yoqilgan')}
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl"
            >
              <CheckCircle2 size={16} />
              {t('common.done', 'Tayyor')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notes.map(note => (
            <div
              key={note.id}
              className="group glass-card rounded-[32px] p-8 transition-all hover:scale-[1.02] cursor-pointer"
              onClick={() => {
                setCurrentNote(note);
                setIsEditing(true);
              }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-accent-purple/10 text-accent-purple rounded-2xl">
                  <FileText size={24} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                  className="text-white/0 group-hover:text-red-400/40 hover:text-red-400 transition-all p-2 rounded-xl hover:bg-red-400/10"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <h4 className="text-xl font-bold text-white mb-3 line-clamp-1 tracking-tight">{note.title}</h4>
              <p className="text-white/40 text-sm line-clamp-3 leading-relaxed mb-6">
                {note.content || t('notes.no_content', "Hali kontent yo'q...")}
              </p>
              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">
                  {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
              </div>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="col-span-full text-center py-32 text-white/10 border-2 border-dashed border-white/5 rounded-[40px]">
              {t('notes.no_notes', "Eslatmalar hali mavjud emas. Birinchi o'quv eslatmangizni yarating.")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
