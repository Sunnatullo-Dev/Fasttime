import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, CheckCircle2, Circle, Star, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { Task } from '../types';
import { cn } from '../lib/utils';

export default function TaskManager() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Vazifalarni yuklashda xatolik:', error);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setError('');

    try {
      const response = await api.post('/tasks', {
        title: newTask,
        is_priority: isPriority,
      });
      setTasks([response.data, ...tasks]);
      setNewTask('');
      setIsPriority(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Vazifa qo\'shishda xatolik');
    }
  };

  const toggleTask = async (id: number, currentStatus: boolean) => {
    try {
      await api.patch(`/tasks/${id}`, { is_completed: !currentStatus });
      setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));
    } catch (error) {
      console.error('Vazifani yangilashda xatolik:', error);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Vazifani o\'chirishda xatolik:', error);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.is_completed;
    if (filter === 'completed') return t.is_completed;
    return true;
  });

  const priorityTasks = filteredTasks.filter(t => t.is_priority && !t.is_completed).slice(0, 3);
  const otherTasks = filteredTasks.filter(t => !priorityTasks.find(pt => pt.id === t.id));

  return (
    <div className="space-y-8">
      <form onSubmit={addTask} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder={t('tasks.add_placeholder', "Yangi vazifa qo'shish...")}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-accent-purple/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setIsPriority(!isPriority)}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all",
                isPriority ? "text-yellow-400 bg-yellow-400/10" : "text-white/20 hover:text-white/40"
              )}
            >
              <Star size={20} fill={isPriority ? "currentColor" : "none"} />
            </button>
          </div>
          <button
            type="submit"
            className="bg-accent-purple hover:bg-accent-purple/90 text-white px-6 rounded-2xl transition-all active:scale-95 shadow-xl shadow-accent-purple/20"
          >
            <Plus size={24} />
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-4 rounded-xl border border-red-400/20">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </form>

      <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-fit">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
              filter === f ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            {f === 'all' ? t('tasks.all', 'Barchasi') : f === 'active' ? t('tasks.active', 'Faol') : t('tasks.completed', 'Bajarilgan')}
          </button>
        ))}
      </div>

      <div className="space-y-12">
        {priorityTasks.length > 0 && filter !== 'completed' && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400 mb-6 flex items-center gap-3">
              <Star size={14} fill="currentColor" />
              {t('tasks.priority_title', 'Kunlik Muhim Vazifalar (Top 3)')}
            </h3>
            <div className="space-y-3">
              {priorityTasks.map(task => (
                <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-6">
            {filter === 'completed' ? t('tasks.completed_title', 'Bajarilgan Vazifalar') : t('tasks.all_title', 'Barcha Vazifalar')}
          </h3>
          <div className="space-y-3">
            {otherTasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
            ))}
            {filteredTasks.length === 0 && (
              <div className="text-center py-20 text-white/10 border-2 border-dashed border-white/5 rounded-[32px]">
                {t('tasks.no_tasks', 'Vazifalar topilmadi.')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: number, status: boolean) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
  key?: React.Key;
}

function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <div className={cn(
      "group flex items-center gap-4 p-5 rounded-[24px] border transition-all duration-300",
      task.is_completed
        ? "bg-white/[0.02] border-transparent opacity-40"
        : "glass-card hover:scale-[1.01] hover:border-white/10"
    )}>
      <button
        onClick={() => onToggle(task.id, task.is_completed)}
        className={cn(
          "transition-all active:scale-90 p-1 rounded-full",
          task.is_completed ? "text-accent-purple" : "text-white/10 hover:text-white/30"
        )}
      >
        {task.is_completed ? <CheckCircle2 size={28} /> : <Circle size={28} />}
      </button>
      <span className={cn(
        "flex-1 text-white font-medium transition-all tracking-tight",
        task.is_completed && "line-through text-white/40"
      )}>
        {task.title}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="text-white/0 group-hover:text-red-400/40 hover:text-red-400 transition-all p-2 rounded-xl hover:bg-red-400/10"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}
