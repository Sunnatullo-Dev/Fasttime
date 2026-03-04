import db from "../db";

const calculateOptimalSessionLength = (userId: number) => {
  try {
    // 1. Last session stats
    const lastSession = db.prepare(`
      SELECT duration, target_duration, type, status 
      FROM pomodoro_sessions 
      WHERE user_id = ? AND type = 'focus' AND status = 'completed'
      ORDER BY completed_at DESC LIMIT 1
    `).get(userId) as any;

    // 2. Return time from breaks (how long did it take to start focus after break ended)
    const lastBreak = db.prepare(`
      SELECT completed_at 
      FROM pomodoro_sessions 
      WHERE user_id = ? AND type LIKE '%break%' AND status = 'completed'
      ORDER BY completed_at DESC LIMIT 1
    `).get(userId) as any;

    const nextSessionAfterBreak = db.prepare(`
      SELECT started_at 
      FROM pomodoro_sessions 
      WHERE user_id = ? AND type = 'focus' AND started_at > ?
      ORDER BY started_at ASC LIMIT 1
    `).get(userId, lastBreak?.completed_at || '1970-01-01') as any;

    let returnTimeMinutes = 0;
    if (lastBreak && nextSessionAfterBreak) {
      const breakEnd = new Date(lastBreak.completed_at).getTime();
      const focusStart = new Date(nextSessionAfterBreak.started_at).getTime();
      returnTimeMinutes = (focusStart - breakEnd) / 60000;
    }

    // 3. AI Score Trend (Last 7 calculated scores)
    const aiTrend = db.prepare(`
      SELECT score, burnout_risk, calculated_at 
      FROM ai_productivity_scores 
      WHERE user_id = ? 
      ORDER BY calculated_at DESC LIMIT 7
    `).all(userId) as any[];

    if (aiTrend.length === 0) {
      return {
        optimalFocusDuration: 25,
        optimalShortBreak: 5,
        mode: "Standard",
        message: "Ma'lumotlar yetarli emas. Standart rejim yoqildi."
      };
    }

    const latest = aiTrend[0];
    const prev = aiTrend[1] || latest;
    const isDecreasing = latest.score < prev.score;
    const isStable = Math.abs(latest.score - prev.score) < 5;

    let focusDur = lastSession?.duration || 25;
    let breakDur = 5;
    let mode = "Stable Focus";
    let message = "Sizning ritmingiz barqaror. Davom eting!";

    // Logic 1: Fatigue Risk > 70% -> Recovery Mode
    if (latest.burnout_risk > 70) {
      focusDur = 15;
      breakDur = 10;
      mode = "Recovery (Tiklanish)";
      message = "Charchoq darajasi yuqori. Qisqa fokus va uzoq tanaffus tavsiya etiladi.";
    }
    // Logic 2: Efficiency drop after 40 mins -> reduce by 15-20%
    else if (lastSession?.duration > 40 && isDecreasing) {
      focusDur = Math.round(lastSession.duration * 0.82);
      mode = "Efficiency Shield (Himoya)";
      message = "Uzoq sessiyadan so'ng samaradorlik pasaydi. Fokusni biroz qisqartirdik.";
    }
    // Logic 3: Stable/Increasing efficiency -> increase by 5-10%
    else if (!isDecreasing && latest.score > 60) {
      focusDur = Math.min(60, Math.round((lastSession?.duration || 25) * 1.08));
      mode = "Growth (O'sish)";
      message = "Sizda o'sish kuzatilmoqda! Fokus vaqtini biroz ko'paytirdik.";
    }

    // Adjust breaks based on return time
    if (returnTimeMinutes > 15) {
      breakDur = Math.min(15, breakDur + 2); // Suggest slightly longer breaks if user takes time to return
    }

    return {
      optimalFocusDuration: focusDur,
      optimalShortBreak: breakDur,
      mode,
      message,
      burnoutRisk: latest.burnout_risk,
      aiScoreTrend: aiTrend.map(t => t.score).reverse()
    };
  } catch (err) {
    console.error("calculateOptimalSessionLength error:", err);
    return { optimalFocusDuration: 25, optimalShortBreak: 5, mode: "Standard" };
  }
};

export const getDailyStats = (req: any, res: any) => {
  const userId = req.user.id;

  try {
    const stats = db.prepare(`
      SELECT 
        SUM(duration) as totalFocusTime,
        COUNT(*) as completedSessions,
        AVG(duration) as avgDuration
      FROM pomodoro_sessions 
      WHERE user_id = ? AND type = 'focus' AND DATE(completed_at) = DATE('now')
    `).get(userId) as any || { totalFocusTime: 0, completedSessions: 0, avgDuration: 0 };

    const tasks = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
      FROM tasks 
      WHERE user_id = ?
    `).get(userId) as any || { total: 0, completed: 0 };

    // Calculate Streak
    const sessions = db.prepare(`
      SELECT DISTINCT DATE(completed_at) as date
      FROM pomodoro_sessions
      WHERE user_id = ? AND type = 'focus'
      ORDER BY date DESC
    `).all(userId);

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (sessions.length > 0) {
      let lastDate = sessions[0].date;
      if (lastDate === today || lastDate === yesterday) {
        streak = 1;
        for (let i = 1; i < sessions.length; i++) {
          const d1 = new Date(sessions[i - 1].date);
          const d2 = new Date(sessions[i].date);
          const diff = (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
          if (diff === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    const completionRate = tasks?.total > 0 ? (tasks.completed / tasks.total) * 100 : 0;

    const aiData = calculateProfessionalAIScore(userId);

    const userLevelData = db.prepare("SELECT level, total_focus_minutes FROM users WHERE id = ?").get(userId) as any;

    res.json({
      ...stats,
      totalFocusTime: stats.totalFocusTime || 0,
      completedSessions: stats.completedSessions || 0,
      avgDuration: Math.round(stats.avgDuration || 0),
      taskCompletionRate: Math.round(completionRate),
      streak,
      aiScore: aiData.score,
      burnoutRisk: aiData.burnoutRisk,
      focusDNA: aiData.focusDNA,
      level: userLevelData.level,
      totalFocusMinutes: userLevelData.total_focus_minutes
    });
  } catch (error) {
    console.error('getDailyStats error:', error);
    res.status(500).json({ error: "Failed to fetch daily stats" });
  }
};

// Helper to get streak
const getStreak = (userId: number) => {
  const sessions = db.prepare(`
    SELECT DISTINCT DATE(completed_at) as date
    FROM pomodoro_sessions
    WHERE user_id = ? AND type = 'focus' AND status = 'completed'
    ORDER BY date DESC
  `).all(userId) as any[];

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (sessions.length > 0) {
    let lastDate = sessions[0].date;
    if (lastDate === today || lastDate === yesterday) {
      streak = 1;
      for (let i = 1; i < sessions.length; i++) {
        const d1 = new Date(sessions[i - 1].date);
        const d2 = new Date(sessions[i].date);
        const diff = (Math.abs(d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
        if (Math.round(diff) === 1) streak++; else break;
      }
    }
  }
  return { streak };
};

// Professional AI Score Calculation using Neuroscience Formula
const calculateProfessionalAIScore = (userId: number) => {
  try {
    // 1. DeepFocusMinutes (Daily)
    const focusData = db.prepare(`
      SELECT SUM(duration) as total 
      FROM pomodoro_sessions 
      WHERE user_id = ? AND type = 'focus' AND status = 'completed' 
      AND DATE(completed_at) = DATE('now')
    `).get(userId) as any;
    const deepFocusMinutes = focusData?.total || 0;

    // 2. CompletionRate
    const sessionStats = db.prepare(`
      SELECT 
        COUNT(*) as started,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM pomodoro_sessions
      WHERE user_id = ? AND DATE(started_at) = DATE('now')
    `).get(userId) as any;
    const completionRate = sessionStats.started > 0 ? (sessionStats.completed / sessionStats.started) : 1;

    // 3. ConsistencyFactor (weighted streak growth)
    const streakData = getStreak(userId);
    const streak = streakData.streak;
    const consistencyFactor = 1 + (streak * 0.05);

    // 4. ContextSwitchPenalty (interruptions)
    const interruptionData = db.prepare(`
      SELECT SUM(interruptions) as total
      FROM pomodoro_sessions
      WHERE user_id = ? AND DATE(started_at) = DATE('now')
    `).get(userId) as any;
    const interruptions = interruptionData?.total || 0;
    const penaltyWeight = 5;
    const contextSwitchPenalty = interruptions * penaltyWeight;

    // 5. BreakOverusePenalty
    const breakData = db.prepare(`
      SELECT SUM(duration - target_duration) as excess
      FROM pomodoro_sessions
      WHERE user_id = ? AND type LIKE '%break%' AND status = 'completed' 
      AND duration > target_duration AND DATE(completed_at) = DATE('now')
    `).get(userId) as any;
    const breakOverusePenalty = Math.max(0, (breakData?.excess || 0) * 0.5);

    // 6. FatigueDrift
    const sessionsToday = db.prepare(`
        SELECT duration, type, started_at 
        FROM pomodoro_sessions 
        WHERE user_id = ? AND DATE(started_at) = DATE('now') 
        ORDER BY started_at ASC
    `).all(userId) as any[];

    let continuousFocus = 0;
    let fatigueDrift = 0;
    sessionsToday.forEach(s => {
      if (s.type === 'focus') {
        continuousFocus += s.duration;
        if (continuousFocus > 90) {
          fatigueDrift += (continuousFocus - 90) * 0.15;
        }
      } else if (s.type === 'long_break') {
        continuousFocus = 0;
      } else {
        continuousFocus = Math.max(0, continuousFocus - 30);
      }
    });

    // Final Formula: (Focus × Rate × Consistency) - (SwitchPenalty + BreakPenalty + Fatigue)
    let rawScore = (deepFocusMinutes * completionRate * consistencyFactor) -
      (contextSwitchPenalty + breakOverusePenalty + fatigueDrift);

    // Normalize: An elite day (100) is approx 250 quality focus minutes
    const score = Math.round(Math.max(0, Math.min(100, (rawScore / 2.5))));

    // Burnout Risk
    const burnoutRisk = Math.min(100, Math.round(fatigueDrift + (deepFocusMinutes / 400) * 50));

    // Focus DNA Profile
    let focusDNA = "Explorer";
    if (score > 85) focusDNA = "Deep Diver";
    else if (completionRate > 0.9 && score > 60) focusDNA = "Consistent Closer";
    else if (interruptions > 3) focusDNA = "Fragmented Focus";
    else if (deepFocusMinutes > 300) focusDNA = "Power Worker";

    return {
      score,
      deepFocusMinutes,
      completionRate,
      consistencyFactor,
      contextSwitchPenalty,
      breakOverusePenalty,
      fatigueDrift,
      burnoutRisk,
      focusDNA
    };
  } catch (e) {
    console.error('Professional Score Error:', e);
    return { score: 0, deepFocusMinutes: 0, completionRate: 0, consistencyFactor: 1, contextSwitchPenalty: 0, breakOverusePenalty: 0, fatigueDrift: 0, burnoutRisk: 0, focusDNA: "Unknown" };
  }
};

export const getWeeklyStats = (req: any, res: any) => {
  const userId = req.user.id;
  const days = parseInt(req.query.days as string) || 7;

  try {
    const dailyHistory = db.prepare(`
      SELECT 
        DATE(completed_at) as date,
        SUM(duration) as duration
      FROM pomodoro_sessions
      WHERE user_id = ? AND type = 'focus' AND completed_at >= date('now', ?)
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `).all(userId, `-${days} days`);

    const aggregate = db.prepare(`
      SELECT 
        SUM(duration) as totalFocusTime,
        COUNT(*) as completedSessions
      FROM pomodoro_sessions
      WHERE user_id = ? AND type = 'focus' AND completed_at >= date('now', ?)
    `).get(userId, `-${days} days`) as any || { totalFocusTime: 0, completedSessions: 0 };

    // Most productive day and hour
    const mostProductiveDay = db.prepare(`
      SELECT strftime('%w', completed_at) as day, SUM(duration) as total
      FROM pomodoro_sessions
      WHERE user_id = ? AND type = 'focus'
      GROUP BY day ORDER BY total DESC LIMIT 1
    `).get(userId) as any;

    const mostProductiveHour = db.prepare(`
      SELECT strftime('%H', completed_at) as hour, SUM(duration) as total
      FROM pomodoro_sessions
      WHERE user_id = ? AND type = 'focus'
      GROUP BY hour ORDER BY total DESC LIMIT 1
    `).get(userId) as any;

    res.json({
      history: dailyHistory,
      totalFocusTime: aggregate.totalFocusTime || 0,
      completedSessions: aggregate.completedSessions || 0,
      mostProductiveDay: mostProductiveDay?.day || '0',
      mostProductiveHour: mostProductiveHour?.hour || '00',
      daysTracked: days
    });
  } catch (error) {
    console.error('getWeeklyStats error:', error);
    res.status(500).json({ error: "Failed to fetch weekly stats" });
  }
};

export const getSessionHistory = (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const sessions = db.prepare(`
      SELECT id, duration, type, completed_at
      FROM pomodoro_sessions
      WHERE user_id = ?
      ORDER BY completed_at DESC
      LIMIT 50
    `).all(userId);
    res.json(sessions);
  } catch (error) {
    console.error('getSessionHistory error:', error);
    res.status(500).json({ error: "Failed to fetch session history" });
  }
};

export const getHeatmapData = (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const data = db.prepare(`
      SELECT DATE(completed_at) as date, COUNT(*) as count
      FROM pomodoro_sessions
      WHERE user_id = ? AND type = 'focus' AND completed_at >= date('now', '-365 days')
      GROUP BY DATE(completed_at)
    `).all(userId);
    res.json(data);
  } catch (error) {
    console.error('getHeatmapData error:', error);
    res.status(500).json({ error: "Failed to fetch heatmap data" });
  }
};

export const getStats = (req: any, res: any) => {
  const totalFocusTime = db.prepare("SELECT SUM(duration) as total FROM pomodoro_sessions WHERE user_id = ? AND type = 'focus'").get(req.user.id);
  const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND is_completed = 1").get(req.user.id);

  res.json({
    totalFocusTime: totalFocusTime.total || 0,
    completedTasks: completedTasks.count || 0
  });
};

export const getAIProductivityScore = (req: any, res: any) => {
  const userId = req.user.id;
  const aiData = calculateProfessionalAIScore(userId);

  // Store in DB for history
  const todayDate = new Date().toISOString().split('T')[0];
  const existingScore = db.prepare("SELECT id FROM ai_productivity_scores WHERE user_id = ? AND DATE(calculated_at) = ?").get(userId, todayDate);

  if (existingScore) {
    db.prepare(`
      UPDATE ai_productivity_scores 
      SET score = ?, deep_focus_minutes = ?, completion_rate = ?, consistency_factor = ?, 
          context_switch_penalty = ?, break_overuse_penalty = ?, fatigue_drift = ?, 
          burnout_risk = ?, focus_dna_profile = ?
      WHERE id = ?
    `).run(
      aiData.score, aiData.deepFocusMinutes, aiData.completionRate, aiData.consistencyFactor,
      aiData.contextSwitchPenalty, aiData.breakOverusePenalty, aiData.fatigueDrift,
      aiData.burnoutRisk, aiData.focusDNA, existingScore.id
    );
  } else {
    db.prepare(`
      INSERT INTO ai_productivity_scores (
        user_id, score, deep_focus_minutes, completion_rate, consistency_factor, 
        context_switch_penalty, break_overuse_penalty, fatigue_drift, burnout_risk, focus_dna_profile
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId, aiData.score, aiData.deepFocusMinutes, aiData.completionRate, aiData.consistencyFactor,
      aiData.contextSwitchPenalty, aiData.breakOverusePenalty, aiData.fatigueDrift,
      aiData.burnoutRisk, aiData.focusDNA
    );
  }

  // Trend Comparison (last week average)
  const lastWeekScore = db.prepare(`
    SELECT AVG(score) as avgScore FROM ai_productivity_scores 
    WHERE user_id = ? AND calculated_at < date('now') AND calculated_at >= date('now', '-7 days')
  `).get(userId)?.avgScore || 0;

  let statusLabel = "Needs Improvement";
  if (aiData.score > 85) statusLabel = "Elite Focus";
  else if (aiData.score > 70) statusLabel = "Highly Productive";
  else if (aiData.score > 40) statusLabel = "Good";

  res.json({
    ...aiData,
    lastWeekScore,
    statusLabel
  });
};

export const getAdaptiveConfig = (req: any, res: any) => {
  const config = calculateOptimalSessionLength(req.user.id);
  res.json(config);
};

export const getWeeklyAIReport = async (req: any, res: any) => {
  const userId = req.user.id;
  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split('T')[0];

  try {
    const existingReport = db.prepare("SELECT report_data FROM ai_weekly_reports WHERE user_id = ? AND week_start_date = ?").get(userId, weekStart) as any;

    if (existingReport) {
      return res.json(JSON.parse(existingReport.report_data));
    }

    // Generate new report
    const weeklyData = db.prepare(`
      SELECT 
        SUM(duration) as totalFocusTime,
        COUNT(*) as completedSessions,
        strftime('%w', completed_at) as day,
        strftime('%H', completed_at) as hour
      FROM pomodoro_sessions
      WHERE user_id = ? AND type = 'focus' AND completed_at >= date('now', '-7 days')
      GROUP BY day, hour
    `).all(userId) as any[];

    if (weeklyData.length === 0) {
      return res.json({ message: "Hisobot yaratish uchun ma'lumotlar etarli emas." });
    }

    const totalMinutes = weeklyData.reduce((acc, d) => acc + d.totalFocusTime, 0);
    const dayStats: any = {};
    const hourStats: any = {};

    weeklyData.forEach(d => {
      dayStats[d.day] = (dayStats[d.day] || 0) + d.totalFocusTime;
      hourStats[d.hour] = (hourStats[d.hour] || 0) + d.totalFocusTime;
    });

    const bestDay = Object.keys(dayStats).reduce((a, b) => dayStats[a] > dayStats[b] ? a : b);
    const bestHour = Object.keys(hourStats).reduce((a, b) => hourStats[a] > hourStats[b] ? a : b);

    const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const streakData = getStreak(userId);

    const aiProductivity = calculateProfessionalAIScore(userId);
    const report = {
      totalDeepWorkHours: (totalMinutes / 60).toFixed(1),
      bestDay: dayNames[parseInt(bestDay)],
      bestHour: `${bestHour}:00`,
      streak: streakData.streak,
      aiSummary: `Sizning Focus DNA profilingiz: ${aiProductivity.focusDNA}. Siz doimo soat ${bestHour}:00 dan ${(parseInt(bestHour) + 2) % 24}:00 gacha eng yuqori kognitiv ko'rsatkichlarga erishasiz. ${dayNames[parseInt(bestDay)]} - bu sizning eng kuchli diqqatni jamlash kuningiz.`,
      burnoutTrend: "Stabil",
      recommendation: "Kechki payt vazifalarni bajarishda samaradorlik tushishi kuzatildi. Bu vaqtni rejalashtirishga ajrating."
    };

    db.prepare("INSERT INTO ai_weekly_reports (user_id, week_start_date, report_data) VALUES (?, ?, ?)")
      .run(userId, weekStart, JSON.stringify(report));

    res.json(report);
  } catch (error) {
    console.error("getWeeklyAIReport error:", error);
    res.status(500).json({ error: "Failed to generate weekly report" });
  }
};
