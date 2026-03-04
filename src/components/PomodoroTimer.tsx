import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play, Pause, RotateCcw, Timer, Coffee, Moon, Settings,
  Bell, BellOff, Volume2, VolumeX, X, Crown, Music, Zap,
  CloudRain, Trees, Coffee as CafeIcon, Waves, Maximize2,
  Minimize2, Upload, Trash2, Check, Brain, Lock
} from 'lucide-react';
import { cn, formatTime } from '../lib/utils';
import api from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { toast } from 'sonner';
import { playSound } from '../lib/sounds';
import confetti from 'canvas-confetti';

type Mode = 'focus' | 'short_break' | 'long_break';

const INITIAL_MODES = {
  focus: { label: 'Diqqat', minutes: 25, color: 'text-accent-purple', bg: 'bg-accent-purple' },
  short_break: { label: 'Qisqa tanaffus', minutes: 5, color: 'text-accent-blue', bg: 'bg-accent-blue' },
  long_break: { label: 'Uzoq tanaffus', minutes: 15, color: 'text-indigo-400', bg: 'bg-indigo-400' },
};

const SOUNDS = [
  { id: 'classic', name: 'Klassik', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', premium: false },
  { id: 'zen', name: 'Zen', url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', premium: true },
  { id: 'digital', name: 'Raqamli', url: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', premium: true },
  { id: 'bell', name: "Qo'ng'iroq", url: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3', premium: true },
];

const AMBIENT_SOUNDS = [
  { id: 'rain', name: "Yomg'ir", icon: CloudRain, url: 'https://assets.mixkit.co/active_storage/sfx/2418/2418-preview.mp3' },
  { id: 'forest', name: "O'rmon", icon: Trees, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'cafe', name: 'Kofexona', icon: CafeIcon, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'waves', name: "To'lqinlar", icon: Waves, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

interface Props {
  user: User;
  onSessionComplete?: () => void;
}

export default function PomodoroTimer({ user, onSessionComplete }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('focus');
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isDeepFocus, setIsDeepFocus] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [interruptions, setInterruptions] = useState(0);

  // Custom Sound state
  const [customSound, setCustomSound] = useState<{ name: string, data: string } | null>(() => {
    const saved = localStorage.getItem('pomodoro_custom_sound');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeAmbientId, setActiveAmbientId] = useState<string | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isAdaptiveMode, setIsAdaptiveMode] = useState(() => localStorage.getItem('pomodoro_adaptive') === 'true');
  const [adaptiveConfig, setAdaptiveConfig] = useState<any>(null);
  const [fetchingAdaptive, setFetchingAdaptive] = useState(false);

  const [continuousFocusMinutes, setContinuousFocusMinutes] = useState(0);
  const [lastBreakAt, setLastBreakAt] = useState<number>(Date.now());

  const [cognitiveEnergy, setCognitiveEnergy] = useState(() => {
    const saved = localStorage.getItem('pomodoro_energy');
    return saved ? parseFloat(saved) : 100;
  });

  const [customDurations, setCustomDurations] = useState(() => {
    const saved = localStorage.getItem('pomodoro_durations');
    return saved ? JSON.parse(saved) : { focus: 25, short_break: 5, long_break: 15 };
  });

  const [timeLeft, setTimeLeft] = useState(customDurations[mode] * 60);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('pomodoro_sound') !== 'false');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('pomodoro_notifications') !== 'false');
  const [selectedSoundId, setSelectedSoundId] = useState(() => localStorage.getItem('pomodoro_sound_id') || 'classic');
  const [autoCycle, setAutoCycle] = useState(() => localStorage.getItem('pomodoro_auto_cycle') === 'true');

  const workerRef = useRef<Worker | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Worker
  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/timerWorker.ts', import.meta.url), { type: 'module' });
    }

    const worker = workerRef.current;

    const handleMessage = (e: MessageEvent) => {
      const { type, timeLeft: newTimeLeft, action } = e.data;
      if (type === 'tick') {
        setTimeLeft(newTimeLeft);
        document.title = `(${formatTime(newTimeLeft)}) FASTTIME`;
      } else if (type === 'complete') {
        handleComplete();
      } else if (type === 'TIMER_ACTION') {
        if (action === 'START_NEXT') {
          toggleTimer();
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }
    worker.addEventListener('message', handleMessage);

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
      worker.removeEventListener('message', handleMessage);
    };
  }, [mode, customDurations, autoCycle, sessionsCompleted, currentSessionId, interruptions]);

  // Cognitive Energy Engine (Task 3)
  useEffect(() => {
    const interval = setInterval(() => {
      setCognitiveEnergy(prev => {
        let next = prev;
        if (isActive && mode === 'focus') {
          const decayRate = next > 50 ? 0.05 : 0.1;
          next = Math.max(0, next - decayRate);
        } else {
          // Recovers during breaks or when paused
          const recoveryRate = 0.15;
          next = Math.min(100, next + recoveryRate);
        }

        // Adaptive Volume logic (Task 9)
        if (ambientAudioRef.current) {
          const fatigueFactor = 1 - (next / 100);
          const targetVolume = Math.max(0.1, 0.4 - (fatigueFactor * 0.2));
          ambientAudioRef.current.volume = targetVolume;
        }

        localStorage.setItem('pomodoro_energy', next.toFixed(2));
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [isActive, mode]);

  // Deep Focus Lock (Task 4) - Simulation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive && mode === 'focus') {
        toast.warning("FOKUSNI YO'QOTMANG!", {
          description: "Siz boshqa sahifaga o'tdingiz. Diqqatni jamlash uchun qayting.",
          icon: <Lock size={16} />
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, mode]);

  const fetchAdaptiveConfig = useCallback(async () => {
    if (!isAdaptiveMode) return;
    setFetchingAdaptive(true);
    try {
      const res = await api.get('/stats/adaptive-config');
      setAdaptiveConfig(res.data);

      // If we are currently in focus mode and not active, update the time
      if (mode === 'focus' && !isActive) {
        setTimeLeft(res.data.optimalFocusDuration * 60);
      }
    } catch (e) {
      console.error('Adaptive config error:', e);
    } finally {
      setFetchingAdaptive(false);
    }
  }, [isAdaptiveMode, mode, isActive]);

  useEffect(() => {
    fetchAdaptiveConfig();
  }, [isAdaptiveMode, sessionsCompleted]);

  // Handle Ambient Sounds
  useEffect(() => {
    if (activeAmbientId) {
      const sound = AMBIENT_SOUNDS.find(s => s.id === activeAmbientId);
      if (sound) {
        if (ambientAudioRef.current) ambientAudioRef.current.pause();
        const audio = new Audio(sound.url);
        audio.loop = true;
        audio.volume = 0.4;
        audio.play().catch(() => { });
        ambientAudioRef.current = audio;
      }
    } else {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current = null;
      }
    }
  }, [activeAmbientId]);

  // Team Presence Heartbeat
  useEffect(() => {
    const sendHeartbeat = async () => {
      let status = 'IDLE';
      if (isActive) {
        status = mode === 'focus' ? 'FOCUS' : 'BREAK';
      }

      try {
        await api.post('/teams/heartbeat', {
          status: status, // This will be validated by the server CHECK constraint
          currentSessionStart: currentSessionId ? new Date().toISOString() : null
        });
      } catch (e) {
        // Silently fail if not in a team or unauthorized
      }
    };

    const interval = setInterval(sendHeartbeat, 20000); // Every 20s
    sendHeartbeat();

    return () => clearInterval(interval);
  }, [isActive, mode, currentSessionId]);

  const handleComplete = useCallback(async () => {
    setIsActive(false);
    document.title = 'Vaqt tugadi! - Fasttime';

    // Auto-pause ambient sounds (Task 9)
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      setActiveAmbientId(null);
    }

    // Play Sound
    if (soundEnabled) {
      if (selectedSoundId === 'custom' && customSound) {
        const audio = new Audio(customSound.data);
        audio.play().catch(e => console.error(e));
      } else {
        playSound(mode === 'focus' ? 'complete' : 'break');
      }
    }

    // Notification
    if (notificationsEnabled) {
      const title = mode === 'focus' ? 'FASTTIME – Fokus sessiyasi tugadi' : 'FASTTIME – Tanaffus sessiyasi tugadi';
      const body = mode === 'focus'
        ? `Fokus vaqti tugadi (${customDurations.focus} daqiqa). Endi biroz dam olasizmi?`
        : `Tanaffus vaqti tugadi (${customDurations.short_break} daqiqa). Fokusni boshlaymizmi?`;

      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
          actions: [
            { action: 'start-next', title: mode === 'focus' ? 'Tanaffusni boshlash' : 'Ishni boshlash' },
            { action: 'remind-5', title: '5 daqiqadan so‘ng' }
          ]
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    if (mode === 'focus') {
      setSessionsCompleted(prev => prev + 1);
      setContinuousFocusMinutes(prev => prev + customDurations.focus);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

      // Health Check: Overworking (> 90 mins)
      if (continuousFocusMinutes + customDurations.focus >= 90) {
        toast.warning("SALOMATLIK OGOHLANTIRISHI", {
          description: "Siz 90 daqiqadan ortiq ishlayapsiz. Tanaffus qilish vaqti keldi!",
          duration: 10000
        });
      }

      try {
        let response;
        if (currentSessionId) {
          response = await api.post(`/pomodoro/complete/${currentSessionId}`, { duration: customDurations[mode] });
          setCurrentSessionId(null);

          // Easter Egg: Master Mode (25:00 focus without pauses)
          if (customDurations.focus === 25 && interruptions === 0) {
            toast.success("Deep Focus Master Mode Activated! 🧘‍♂️", {
              description: "You've completed 25 mins without a single interruption.",
              icon: "🏆"
            });
          }

          setInterruptions(0);
        } else {
          response = await api.post('/pomodoro', { duration: customDurations[mode], type: mode });
        }

        // Achievement celebration
        if (response?.data?.newAchievements?.length > 0) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            zIndex: 1000,
          });
          response.data.newAchievements.forEach((achType: string) => {
            toast.success(`🏆 Achievement Unlocked: ${achType.replace(/_/g, ' ')}!`, {
              duration: 5000,
            });
          });
        }

        onSessionComplete?.();
      } catch (error) {
        console.error('Save error:', error);
      }
    } else {
      // It's a break
      setContinuousFocusMinutes(0);
      setLastBreakAt(Date.now());
    }

    // Auto Cycle Logic
    const getDuration = (m: Mode) => {
      if (isAdaptiveMode && adaptiveConfig) {
        if (m === 'focus') return adaptiveConfig.optimalFocusDuration;
        if (m === 'short_break') return adaptiveConfig.optimalShortBreak;
      }
      return customDurations[m];
    };

    let nextMode: Mode = 'focus';
    if (mode === 'focus') {
      nextMode = (sessionsCompleted + 1) % 4 === 0 ? 'long_break' : 'short_break';
    }

    setMode(nextMode);
    const seconds = getDuration(nextMode) * 60;
    setTimeLeft(seconds);

    if (autoCycle) {
      setTimeout(() => {
        setIsActive(true);
        workerRef.current?.postMessage({ command: 'start', value: seconds });
      }, 1500);
    }
  }, [mode, soundEnabled, notificationsEnabled, selectedSoundId, customSound, autoCycle, sessionsCompleted, customDurations, isAdaptiveMode, adaptiveConfig]);

  const toggleTimer = async () => {
    if (!isActive) {
      if (!currentSessionId) {
        try {
          const focusDur = (isAdaptiveMode && adaptiveConfig && mode === 'focus')
            ? adaptiveConfig.optimalFocusDuration
            : customDurations[mode];

          const response = await api.post('/pomodoro/start', { duration: focusDur, type: mode });
          setCurrentSessionId(response.data.id);
          setInterruptions(0);
        } catch (error) {
          console.error("Session start error:", error);
        }
      }
      workerRef.current?.postMessage({ command: 'start', value: timeLeft });
    } else {
      workerRef.current?.postMessage({ command: 'pause' });
      if (currentSessionId) {
        const newInt = interruptions + 1;
        setInterruptions(newInt);
        api.patch(`/pomodoro/update/${currentSessionId}`, { interruptions: newInt }).catch(() => { });
        toast.info(t('timer.interruption_detected', 'Chalg\'ish aniqlandi'), {
          description: t('timer.interruption_desc', 'Fokusni yo\'qotmaslikka harakat qiling. Bu AI Score\'ga ta\'sir qiladi.')
        });
      }
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    const seconds = customDurations[mode] * 60;
    setTimeLeft(seconds);
    workerRef.current?.postMessage({ command: 'reset', value: seconds });
    document.title = 'FASTTIME - Fokus';
  };

  const switchMode = (newMode: Mode) => {
    if (isActive && !confirm("Taymer ishlayapti. Rejimni o'zgartirmoqchimisiz?")) return;
    setMode(newMode);
    const seconds = customDurations[newMode] * 60;
    setTimeLeft(seconds);
    setIsActive(false);
    workerRef.current?.postMessage({ command: 'reset', value: seconds });
  };

  const updateDuration = (m: Mode, mins: number) => {
    const updated = { ...customDurations, [m]: mins };
    setCustomDurations(updated);
    localStorage.setItem('pomodoro_durations', JSON.stringify(updated));
    if (mode === m && !isActive) {
      setTimeLeft(mins * 60);
      workerRef.current?.postMessage({ command: 'reset', value: mins * 60 });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Fayl hajmi 2MB dan kam bo'lishi kerak");
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = { name: file.name, data: ev.target?.result as string };
        setCustomSound(data);
        localStorage.setItem('pomodoro_custom_sound', JSON.stringify(data));
        setSelectedSoundId('custom');
        localStorage.setItem('pomodoro_sound_id', 'custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const totalSeconds = customDurations[mode] * 60;
  const progress = 1 - timeLeft / totalSeconds;

  const toggleUltraFocus = async () => {
    if (!isDeepFocus) {
      setIsDeepFocus(true);
      try {
        await containerRef.current?.requestFullscreen();
      } catch (e) {
        console.error("Fullscreen fail", e);
      }
    } else {
      setIsDeepFocus(false);
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col items-center justify-center transition-all duration-1000 relative",
        isDeepFocus ? "fixed inset-0 z-[200] bg-black p-0 overflow-hidden" : "relative py-10"
      )}>

      {/* Premium Fullscreen Background */}
      <AnimatePresence>
        {isDeepFocus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            {/* Dark Aesthetic Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(25,10,50,0.5)_0%,_rgba(0,0,0,1)_100%)]" />

            {/* Soft Ambient Glows */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={cn(
                "absolute inset-[-20%] blur-[120px] rounded-full",
                INITIAL_MODES[mode].bg
              )}
            />
            {/* Drifting Lights */}
            <motion.div
              animate={{
                x: [-100, 100, -100],
                y: [-50, 50, -50],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent-purple/5 blur-[120px] rounded-full"
            />
            <motion.div
              animate={{
                x: [100, -100, 100],
                y: [50, -50, 50],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-blue/5 blur-[120px] rounded-full"
            />

            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Controls */}
      <div className={cn("absolute top-0 right-12 flex gap-4 z-10", isDeepFocus && "top-8 right-8")}>
        {!isDeepFocus ? (
          <>
            <button
              onClick={toggleUltraFocus}
              className="p-4 rounded-2xl text-white/20 hover:text-white border border-transparent hover:bg-white/5 transition-all"
              title="Ultra Fokus"
            >
              <Maximize2 size={24} />
            </button>
            <button
              onClick={() => {
                const newState = !isAdaptiveMode;
                setIsAdaptiveMode(newState);
                localStorage.setItem('pomodoro_adaptive', String(newState));
                if (newState) toast.success("ADAPTIV REJIM YOQILDI", { icon: <Brain size={16} />, description: "Sizning ritmingizga moslashish boshlandi." });
              }}
              className={cn(
                "p-4 rounded-[22px] border transition-all flex items-center gap-3",
                isAdaptiveMode ? "text-accent-purple bg-accent-purple/10 border-accent-purple/20" : "text-white/20 hover:text-white border-transparent hover:bg-white/5"
              )}
              title="Adaptiv Fokus Rejimi (AI)"
            >
              <Brain size={24} className={cn(isAdaptiveMode && "animate-pulse")} />
              {isAdaptiveMode && <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Adaptiv</span>}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-4 text-white/20 hover:text-white transition-colors"
            >
              <Settings size={24} />
            </button>
          </>
        ) : (
          <button
            onClick={toggleUltraFocus}
            className="p-3 text-white/10 hover:text-white/60 hover:scale-110 transition-all"
          >
            <X size={32} strokeWidth={1} />
          </button>
        )}
      </div>


      {/* Mode Switcher */}
      <AnimatePresence>
        {!isDeepFocus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex gap-2 p-1.5 bg-black/40 rounded-[28px] border border-white/5 backdrop-blur-xl mb-12"
          >
            {(Object.keys(INITIAL_MODES) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cn(
                  "px-8 py-3 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                  mode === m
                    ? "bg-white text-black shadow-2xl"
                    : "text-white/30 hover:text-white/60"
                )}
              >
                {m === 'focus' ? t('timer.focus', 'Fokus') : m === 'short_break' ? t('timer.short_break', 'Qisqa tanaffus') : t('timer.long_break', 'Uzun tanaffus')}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Timer Display */}
      <div className="relative mb-8">
        <div className={cn(
          "absolute -inset-20 rounded-full blur-[120px] opacity-10 transition-all duration-1000",
          INITIAL_MODES[mode].bg
        )} />

        <div className={cn(
          "relative flex items-center justify-center transition-all duration-1000",
          isDeepFocus ? "w-[400px] h-[400px] md:w-[600px] md:h-[600px]" : "w-[340px] h-[340px] md:w-[480px] md:h-[480px]"
        )}>
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="50%" cy="50%" r="46%" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/[0.03]" />
            <motion.circle
              cx="50%" cy="50%" r="46%" fill="none" stroke="currentColor" strokeWidth={isDeepFocus ? "8" : "10"}
              strokeDasharray="1445"
              animate={{ strokeDashoffset: 1445 * (1 - progress) }}
              transition={{ duration: 1, ease: "linear" }}
              className={cn("transition-all duration-1000", INITIAL_MODES[mode].color)}
              strokeLinecap="round"
              style={isDeepFocus ? { filter: `drop-shadow(0 0 12px currentColor)` } : {}}
            />
          </svg>

          <div className="text-center space-y-4 relative z-10">
            <motion.div
              layout
              className={cn(
                "font-black text-white tracking-tighter tabular-nums",
                isDeepFocus ? "text-[100px] md:text-[140px]" : "text-8xl md:text-9xl"
              )}
            >
              {formatTime(timeLeft)}
            </motion.div>
            <div className={cn(
              "flex items-center justify-center gap-3 text-white/20 font-bold uppercase tracking-[0.4em]",
              isDeepFocus ? "text-sm" : "text-[10px]"
            )}>
              {mode === 'focus' ? <Timer size={isDeepFocus ? 20 : 14} /> : mode === 'short_break' ? <Coffee size={isDeepFocus ? 20 : 14} /> : <Moon size={isDeepFocus ? 20 : 14} />}
              {mode === 'focus' ? t('timer.focus', 'Diqqat') : mode === 'short_break' ? t('timer.short_break', 'Qisqa tanaffus') : t('timer.long_break', 'Uzoq tanaffus')}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-10 relative z-10">
        {!isDeepFocus && (
          <button
            onClick={resetTimer}
            className="p-6 rounded-full bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all active:scale-90 border border-white/5 group"
          >
            <RotateCcw size={28} className="group-hover:rotate-[-45deg] transition-transform" />
          </button>
        )}

        {isActive ? (
          <button
            onClick={toggleTimer}
            className={cn(
              "flex items-center justify-center transition-all active:scale-95 relative group",
              isDeepFocus
                ? "w-24 h-24 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-3xl text-white hover:bg-white/10"
                : "w-28 h-28 rounded-full bg-white/5 text-white border border-white/10 hover:bg-white/10 shadow-2xl"
            )}
          >
            <Pause size={isDeepFocus ? 32 : 48} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={toggleTimer}
            className={cn(
              "flex items-center justify-center transition-all active:scale-95 relative group shadow-2xl",
              isDeepFocus
                ? "w-24 h-24 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-3xl text-white hover:bg-white/10"
                : "w-28 h-28 rounded-full bg-white text-black"
            )}
          >
            <Play size={isDeepFocus ? 32 : 48} fill="currentColor" className={isDeepFocus ? "ml-0" : "ml-2"} />
          </button>
        )}

        {!isDeepFocus && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-[84px] h-[84px] flex flex-col items-center justify-center bg-white/5 rounded-full border border-white/10 group">
              <span className="text-2xl font-black text-white group-hover:scale-110 transition-transform">{sessionsCompleted}</span>
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{t('timer.sessions', 'Sessiya')}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className={cn("h-full transition-all duration-1000", cognitiveEnergy > 60 ? "bg-emerald-400" : cognitiveEnergy > 30 ? "bg-orange-400" : "bg-red-500")} style={{ width: `${cognitiveEnergy}%` }} />
              </div>
              <span className="text-[8px] font-black uppercase text-white/20 tracking-tighter">Energy: {Math.round(cognitiveEnergy)}%</span>
            </div>
          </div>
        )}
      </div>


      <AnimatePresence>
        {isAdaptiveMode && adaptiveConfig && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-12 p-6 bg-accent-purple/5 border border-accent-purple/10 rounded-[32px] max-w-md w-full backdrop-blur-xl flex items-start gap-5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Brain size={80} />
            </div>
            <div className="p-4 bg-accent-purple/10 rounded-2xl text-accent-purple relative z-10">
              <Zap size={24} fill="currentColor" />
            </div>
            <div className="relative z-10 flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-purple">AI ADAPTIV: {adaptiveConfig.mode}</h4>
                <div className="flex gap-1">
                  {adaptiveConfig.aiScoreTrend?.slice(-5).map((s: number, i: number) => (
                    <div key={i} className="w-1.5 h-4 bg-white/5 rounded-full overflow-hidden flex items-end">
                      <div className="w-full bg-accent-purple" style={{ height: `${s}%` }} />
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs font-bold text-white/60 leading-relaxed">{adaptiveConfig.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="glass-card rounded-[40px] p-12 flex flex-col items-center gap-6 bg-accent-purple/90 backdrop-blur-3xl shadow-[0_0_100px_rgba(139,92,246,0.3)] border border-white/20">
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-accent-purple shadow-2xl"
              >
                <Crown size={48} fill="currentColor" />
              </motion.div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">{t('common.success', 'Muvaffaqiyat!')}</h2>
                <p className="text-white/80 font-bold uppercase tracking-widest text-xs">{t('timer.level_up', "Siz yana bir bosqichga ko'tarildingiz")}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card rounded-[40px] bg-zinc-950 border border-white/10 overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{t('timer.settings_title', 'Fasttime Sozlamalar')}</h3>
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">{t('timer.settings_subtitle', 'Tajribangizni shaxsiylashtiring')}</p>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 text-white/20 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Durations */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{t('timer.time_settings', 'Vaqt sozlamalari')}</span>
                    {!user.is_premium && <Crown size={12} className="text-yellow-500" />}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(INITIAL_MODES).map(([key, config]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.07] transition-all">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", config.bg)} />
                          <span className="text-xs font-bold text-white/60">{key === 'focus' ? t('timer.focus') : key === 'short_break' ? t('timer.short_break') : t('timer.long_break')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            disabled={!user.is_premium}
                            value={customDurations[key as Mode]}
                            onChange={(e) => updateDuration(key as Mode, parseInt(e.target.value) || 1)}
                            className="w-16 bg-black border border-white/10 rounded-xl px-2 py-2 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-accent-purple/50 disabled:opacity-50"
                          />
                          <span className="text-[10px] text-white/20 font-bold">MIN</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      const newVal = !autoCycle;
                      setAutoCycle(newVal);
                      localStorage.setItem('pomodoro_auto_cycle', String(newVal));
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-sm font-bold">{t('timer.auto_cycle', 'Smart Auto Cycle')}</span>
                      <span className="text-[10px] text-white/20 font-bold uppercase group-hover:text-white/40 transition-colors">{t('timer.auto_cycle_desc', "Fokusdan so'ng avtomatik tanaffus")}</span>
                    </div>
                    <div className={cn("w-12 h-6 rounded-full transition-all relative", autoCycle ? "bg-accent-purple" : "bg-white/10")}>
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", autoCycle ? "left-7" : "left-1")} />
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      const newVal = !soundEnabled;
                      setSoundEnabled(newVal);
                      localStorage.setItem('pomodoro_sound', String(newVal));
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2.5 rounded-xl border border-white/5", soundEnabled ? "bg-accent-purple/20 text-accent-purple" : "bg-white/5 text-white/20")}>
                        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                      </div>
                      <span className="text-sm font-bold">{t('timer.sound_notif', 'Ovozli bildirishnoma')}</span>
                    </div>
                    <div className={cn("w-12 h-6 rounded-full transition-all relative", soundEnabled ? "bg-accent-purple" : "bg-white/10")}>
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", soundEnabled ? "left-7" : "left-1")} />
                    </div>
                  </button>
                </div>

                {/* Ambient Sounds */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                      <Waves size={12} /> {t('timer.ambient_sounds', 'Fon muhiti')}
                    </span>
                    {!user.is_premium && <Crown size={12} className="text-yellow-500" />}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {AMBIENT_SOUNDS.map(sound => (
                      <button
                        key={sound.id}
                        disabled={!user.is_premium}
                        onClick={() => setActiveAmbientId(activeAmbientId === sound.id ? null : sound.id)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all relative overflow-hidden",
                          activeAmbientId === sound.id
                            ? "bg-accent-blue/10 border-accent-blue/50 text-accent-blue"
                            : "bg-white/5 border-white/5 text-white/20 hover:bg-white/10",
                          !user.is_premium && "opacity-40"
                        )}
                      >
                        <sound.icon size={20} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">{sound.name}</span>
                        {activeAmbientId === sound.id && (
                          <motion.div layoutId="ambient-check" className="absolute top-1 right-1">
                            <Check size={8} className="text-accent-blue" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notification Sound & Upload */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                      <Music size={12} /> {t('timer.notif_sound', 'Bildirishnoma ovozi')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {SOUNDS.map(sound => (
                      <button
                        key={sound.id}
                        disabled={sound.premium && !user.is_premium}
                        onClick={() => {
                          setSelectedSoundId(sound.id);
                          localStorage.setItem('pomodoro_sound_id', sound.id);
                          new Audio(sound.url).play().catch(() => { });
                        }}
                        className={cn(
                          "p-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between",
                          selectedSoundId === sound.id ? "bg-white text-black border-white" : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10",
                          sound.premium && !user.is_premium && "opacity-40"
                        )}
                      >
                        {sound.name}
                        {sound.premium && <Crown size={14} className={cn(selectedSoundId === sound.id ? "text-black" : "text-yellow-500")} />}
                      </button>
                    ))}

                    {/* Custom MP3 Upload */}
                    <div className="col-span-2 space-y-3">
                      <div className="relative">
                        <input
                          type="file"
                          accept="audio/mp3"
                          id="sound-upload"
                          className="hidden"
                          disabled={!user.is_premium}
                          onChange={handleFileUpload}
                        />
                        <label
                          htmlFor="sound-upload"
                          className={cn(
                            "w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer",
                            user.is_premium ? "border-white/10 text-white/40 hover:border-accent-purple hover:text-white" : "border-white/5 text-white/10 cursor-not-allowed"
                          )}
                        >
                          <Upload size={18} />
                          <span className="text-xs font-bold uppercase tracking-widest">O'z ovozingizni yuklang (MP3)</span>
                          {!user.is_premium && <Crown size={14} className="text-yellow-500/50" />}
                        </label>
                      </div>

                      {customSound && (
                        <div className="flex items-center justify-between p-4 bg-accent-purple/10 border border-accent-purple/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent-purple rounded-lg">
                              <Music size={14} className="text-white" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white max-w-[150px] truncate">{customSound.name}</span>
                              <span className="text-[8px] text-accent-purple font-black uppercase tracking-widest">Yuklangan</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedSoundId('custom');
                                localStorage.setItem('pomodoro_sound_id', 'custom');
                                new Audio(customSound.data).play();
                              }}
                              className={cn("p-2 rounded-lg transition-all", selectedSoundId === 'custom' ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20")}
                            >
                              {selectedSoundId === 'custom' ? <Check size={16} /> : <Play size={16} />}
                            </button>
                            <button
                              onClick={() => {
                                setCustomSound(null);
                                localStorage.removeItem('pomodoro_custom_sound');
                                if (selectedSoundId === 'custom') setSelectedSoundId('classic');
                              }}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white/[0.02] border-t border-white/5 text-center">
                {!user.is_premium ? (
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Premiumga o'tib barcha sozlamalarni oching</p>
                ) : (
                  <p className="text-[10px] text-accent-purple font-black uppercase tracking-widest">PRODUCTION PREMIUM STATUS: ACTIVE</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
}




