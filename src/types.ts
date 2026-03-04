export interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  phone?: string;
  avatar?: string;
  avatar_url?: string;
  plan?: 'FREE' | 'PREMIUM';
  is_verified?: boolean;
  is_premium: boolean;
  premium_until?: string;
  referred_by_id?: number;
  created_at?: string;
}

export interface Achievement {
  id: number;
  user_id: number;
  type: string;
  unlocked_at: string;
}

export interface PomodoroSession {
  id: number;
  duration: number;
  type: 'focus' | 'short_break' | 'long_break';
  completed_at: string;
}

export interface Task {
  id: number;
  title: string;
  is_priority: boolean;
  is_completed: boolean;
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface HealthMetrics {
  focusTimeToday: number;
  breakRatio: number; // break_time / focus_time
  overworkStatus: 'light' | 'optimal' | 'high' | 'risk';
  continuousWorkTime: number; // minutes
  skippingBreaks: boolean;
  balanceScore: number; // 0-100
}

export interface Stats {
  totalFocusTime: number;
  completedTasks: number;
  completedSessions: number;
  avgDuration: number;
  taskCompletionRate: number;
  streak: number;
  dailyStats: { date: string; duration: number }[];
  history?: { day_of_week: string; date: string; duration: number }[];
  heatmap?: { date: string; count: number }[];
  health?: HealthMetrics;
  aiScore?: number;
}

export interface AIAnalysis {
  efficiency_score: number;
  analysis: string;
  recommendations: string[];
  optimal_time: string;
  health_status?: string;
}

export interface Reminder {
  id: number;
  title: string;
  description?: string;
  remind_at: string;
  repeat_option: 'none' | 'daily' | 'weekly' | 'yearly';
  is_completed: boolean;
  created_at: string;
}
