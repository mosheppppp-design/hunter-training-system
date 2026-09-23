'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Web Audio API for immersive sound effects
const playSystemSound = (type: 'click' | 'quest' | 'levelup' | 'dice' | 'bossHit') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'quest') {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + idx * 0.06 + 0.18);
      });
    } else if (type === 'levelup') {
      const arpeggio = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
      arpeggio.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.22);
      });
    } else if (type === 'dice') {
      for (let i = 0; i < 7; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(250 + Math.random() * 500, ctx.currentTime + i * 0.05);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.04);
      }
    } else if (type === 'bossHit') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Fail silently if web audio isn't supported
  }
};

interface LogEntry {
  id: string;
  title: string;
  xpEarned: number;
  date: string;
}

interface BossState {
  name: string;
  title: string;
  maxHp: number;
  currentHp: number;
  rewardXp: number;
  defeated: boolean;
}

const DICE_CHALLENGES = [
  { text: '20 שכיבות סמיכה יהלום בקצב איטי', xp: 85 },
  { text: '1 דקה החזקת Hollow Hold רצופה', xp: 75 },
  { text: '15 עליות מתח באחיזה רחבה', xp: 95 },
  { text: '30 קפיצות סקוואט עמוקות עד למטה', xp: 85 },
  { text: '25 מקבילים איטיים (3 שניות ירידה בכל חזרה)', xp: 110 },
  { text: '15 שכיבות סמיכה באגרופים סגורים', xp: 80 },
];

export default function HunterSystemApp() {
  // Hunter Core Stats
  const [level, setLevel] = useState<number>(1);
  const [xp, setXp] = useState<number>(0);
  const [str, setStr] = useState<number>(10);
  const [agi, setAgi] = useState<number>(10);
  const [end, setEnd] = useState<number>(10);

  // Weekly Quests Progress
  const [pullups, setPullups] = useState<number>(0);
  const [dips, setDips] = useState<number>(0);
  const [pushups, setPushups] = useState<number>(0);
  const [frontLeverSec, setFrontLeverSec] = useState<number>(0);
  const [plancheSec, setPlancheSec] = useState<number>(0);
  const [proteinDays, setProteinDays] = useState<boolean[]>([false, false, false, false, false]);
  const [jumpSquats, setJumpSquats] = useState<number>(0);

  // Active Timers
  const [activeTimer, setActiveTimer] = useState<'fl' | 'planche' | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  // Boss Fight State
  const [boss, setBoss] = useState<BossState>({
    name: 'איגריס אביר הדם האדום',
    title: 'בוס שבועי - דרגה A',
    maxHp: 1000,
    currentHp: 1000,
    rewardXp: 500,
    defeated: false,
  });

  // Lucky Dice State
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [diceChallenge, setDiceChallenge] = useState<{ text: string; xp: number } | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // App Navigation & UI
  const [activeTab, setActiveTab] = useState<'quests' | 'boss' | 'skills' | 'prs' | 'log'>('quests');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Personal Records
  const [maxPullups, setMaxPullups] = useState<number>(0);
  const [maxDips, setMaxDips] = useState<number>(0);
  const [maxPushups, setMaxPushups] = useState<number>(0);

  // Sound toggle state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const safePlaySound = useCallback((type: 'click' | 'quest' | 'levelup' | 'dice' | 'bossHit') => {
    if (soundEnabled) playSystemSound(type);
  }, [soundEnabled]);

  // Load initial data from LocalStorage
  useEffect(() => {
    try {
      const load = (key: string, def: string) => localStorage.getItem(`hunter_${key}`) || def;
      setLevel(parseInt(load('level', '1')));
      setXp(parseInt(load('xp', '0')));
      setStr(parseInt(load('str', '10')));
      setAgi(parseInt(load('agi', '10')));
      setEnd(parseInt(load('end', '10')));

      setPullups(parseInt(load('pullups', '0')));
      setDips(parseInt(load('dips', '0')));
      setPushups(parseInt(load('pushups', '0')));
      setFrontLeverSec(parseInt(load('frontlever', '0')));
      setPlancheSec(parseInt(load('planche', '0')));
      setJumpSquats(parseInt(load('jumpsquats', '0')));

      const savedProtein = localStorage.getItem('hunter_protein');
      if (savedProtein) setProteinDays(JSON.parse(savedProtein));

      const savedBoss = localStorage.getItem('hunter_boss');
      if (savedBoss) setBoss(JSON.parse(savedBoss));

      const savedLogs = localStorage.getItem('hunter_logs');
      if (savedLogs) setLogs(JSON.parse(savedLogs));

      setMaxPullups(parseInt(load('max_pullups', '0')));
      setMaxDips(parseInt(load('max_dips', '0')));
      setMaxPushups(parseInt(load('max_pushups', '0')));
    } catch {
      // LocalStorage fallback
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  }, []);

  const addXpAndStats = useCallback((earnedXp: number, sourceName: string, strAdd = 1, agiAdd = 1, endAdd = 1) => {
    safePlaySound('quest');

    setXp((prevXp) => {
      let newXp = prevXp + earnedXp;
      let newLevel = level;

      while (newXp >= 1000) {
        newXp -= 1000;
        newLevel += 1;
        safePlaySound('levelup');
        showToast(`🎉 ברכות! עלית לדרגה ${newLevel}! הכוחות שלך שודרגו!`);
      }

      setLevel(newLevel);
      localStorage.setItem('hunter_level', newLevel.toString());
      localStorage.setItem('hunter_xp', newXp.toString());
      return newXp;
    });

    setStr((prev) => {
      const val = prev + strAdd;
      localStorage.setItem('hunter_str', val.toString());
      return val;
    });
    setAgi((prev) => {
      const val = prev + agiAdd;
      localStorage.setItem('hunter_agi', val.toString());
      return val;
    });
    setEnd((prev) => {
      const val = prev + endAdd;
      localStorage.setItem('hunter_end', val.toString());
      return val;
    });

    // Boss damage calculation
    setBoss((prevBoss) => {
      if (prevBoss.defeated) return prevBoss;
      const damage = earnedXp;
      const newHp = Math.max(0, prevBoss.currentHp - damage);
      const isDefeated = newHp === 0;

      if (isDefeated && !prevBoss.defeated) {
        safePlaySound('levelup');
        showToast(`💥 ניצחון מוחץ! הבוס ${prevBoss.name} הושמד! (+${prevBoss.rewardXp} XP)`);
        setTimeout(() => addXpAndStats(prevBoss.rewardXp, 'ניצחון על בוס שבועי', 5, 5, 5), 600);
      } else {
        safePlaySound('bossHit');
      }

      const updated = { ...prevBoss, currentHp: newHp, defeated: isDefeated };
      localStorage.setItem('hunter_boss', JSON.stringify(updated));
      return updated;
    });

    // Add log entry
    const newEntry: LogEntry = {
      id: Date.now().toString(),
      title: sourceName,
      xpEarned: earnedXp,
      date: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) + ' | ' + new Date().toLocaleDateString('he-IL'),
    };
    setLogs((prev) => {
      const updated = [newEntry, ...prev.slice(0, 24)];
      localStorage.setItem('hunter_logs', JSON.stringify(updated));
      return updated;
    });
  }, [level, showToast, safePlaySound]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = (type: 'fl' | 'planche') => {
    safePlaySound('click');
    if (activeTimer === type) {
      if (timerRef.current) clearInterval(timerRef.current);
      setActiveTimer(null);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setActiveTimer(type);
      setTimerSeconds(0);

      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopAndSaveTimer = () => {
    safePlaySound('quest');
    if (timerRef.current) clearInterval(timerRef.current);

    if (activeTimer === 'fl' && timerSeconds > 0) {
      setFrontLeverSec((prev) => {
        const val = Math.min(120, prev + timerSeconds);
        localStorage.setItem('hunter_frontlever', val.toString());
        return val;
      });
      addXpAndStats(timerSeconds * 2, `החזקת פרונט לבר (${timerSeconds} שנ')`, 1, 2, 1);
      showToast(`⚡ נרשמו ${timerSeconds} שניות בפרונט לבר! (+${timerSeconds * 2} XP)`);
    } else if (activeTimer === 'planche' && timerSeconds > 0) {
      setPlancheSec((prev) => {
        const val = Math.min(60, prev + timerSeconds);
        localStorage.setItem('hunter_planche', val.toString());
        return val;
      });
      addXpAndStats(timerSeconds * 3, `החזקת פלאנץ' (${timerSeconds} שנ')`, 2, 2, 1);
      showToast(`⚡ נרשמו ${timerSeconds} שניות בפלאנץ'! (+${timerSeconds * 3} XP)`);
    }

    setActiveTimer(null);
    setTimerSeconds(0);
  };

  const addWorkoutReps = (type: 'pullups' | 'dips' | 'pushups' | 'jumpsquats', amount: number) => {
    safePlaySound('click');
    if (type === 'pullups') {
      setPullups((prev) => {
        const val = Math.min(300, prev + amount);
        localStorage.setItem('hunter_pullups', val.toString());
        return val;
      });
      addXpAndStats(amount * 2, `ביצוע ${amount} עליות מתח`, 2, 1, 1);
    } else if (type === 'dips') {
      setDips((prev) => {
        const val = Math.min(300, prev + amount);
        localStorage.setItem('hunter_dips', val.toString());
        return val;
      });
      addXpAndStats(amount * 1.5, `ביצוע ${amount} מקבילים`, 2, 1, 1);
    } else if (type === 'pushups') {
      setPushups((prev) => {
        const val = Math.min(300, prev + amount);
        localStorage.setItem('hunter_pushups', val.toString());
        return val;
      });
      addXpAndStats(amount * 1, `ביצוע ${amount} שכיבות סמיכה`, 1, 1, 2);
    } else if (type === 'jumpsquats') {
      setJumpSquats((prev) => {
        const val = Math.min(100, prev + amount);
        localStorage.setItem('hunter_jumpsquats', val.toString());
        return val;
      });
      addXpAndStats(amount * 1.2, `ביצוע ${amount} קפיצות סקוואט`, 1, 2, 2);
    }
  };

  const completeThursdayChallenge = () => {
    safePlaySound('levelup');
    addWorkoutReps('pullups', 100);
    addWorkoutReps('dips', 100);
    addWorkoutReps('pushups', 100);
    addXpAndStats(350, '🔥 אתגר יום חמישי - 100/100/100 הושלם!', 6, 6, 6);
    showToast('🏆 אתגר חמישי 100/100/100 בוצע בהצלחה! קיבלת בונוס XP אדיר!');
  };

  const toggleProteinDay = (index: number) => {
    safePlaySound('click');
    const updated = [...proteinDays];
    updated[index] = !updated[index];
    setProteinDays(updated);
    localStorage.setItem('hunter_protein', JSON.stringify(updated));

    if (updated[index]) {
      addXpAndStats(40, `עמידה ביעד חלבון ליום ${index + 1}`, 1, 0, 2);
    }
  };

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    safePlaySound('dice');
    setDiceChallenge(null);

    let count = 0;
    const interval = setInterval(() => {
      setDiceRoll(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 14) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 6);
        setDiceRoll(finalVal + 1);
        setDiceChallenge(DICE_CHALLENGES[finalVal]);
        setIsRolling(false);
        safePlaySound('quest');
      }
    }, 90);
  };

  const resetWeeklyProgress = () => {
    if (confirm('האם אתה בטוח שברצונך לאפס את המשימות השבועיות להתחלת שבוע חדש?')) {
      setPullups(0);
      setDips(0);
      setPushups(0);
      setFrontLeverSec(0);
      setPlancheSec(0);
      setJumpSquats(0);
      setProteinDays([false, false, false, false, false]);
      setBoss((prev) => ({ ...prev, currentHp: prev.maxHp, defeated: false }));

      localStorage.removeItem('hunter_pullups');
      localStorage.removeItem('hunter_dips');
      localStorage.removeItem('hunter_pushups');
      localStorage.removeItem('hunter_frontlever');
      localStorage.removeItem('hunter_planche');
      localStorage.removeItem('hunter_jumpsquats');
      localStorage.removeItem('hunter_protein');
      showToast('🔄 השבוע אופס בהצלחה! שבוע אימונים חדש התחיל!');
    }
  };

  const getRank = (lvl: number) => {
    if (lvl >= 50) return { rank: 'S-RANK', title: 'Monarch of Shadows', color: 'from-purple-500 to-indigo-600 border-purple-500 text-purple-300 shadow-purple-900/50' };
    if (lvl >= 35) return { rank: 'A-RANK', title: 'High-Grade Hunter', color: 'from-red-500 to-rose-700 border-red-500 text-red-300 shadow-red-900/50' };
    if (lvl >= 20) return { rank: 'B-RANK', title: 'Master Striker', color: 'from-amber-400 to-yellow-600 border-yellow-500 text-yellow-300 shadow-yellow-900/50' };
    if (lvl >= 10) return { rank: 'C-RANK', title: 'Calisthenics Elite', color: 'from-cyan-400 to-blue-600 border-cyan-400 text-cyan-300 shadow-cyan-900/50' };
    if (lvl >= 5)  return { rank: 'D-RANK', title: 'Dedicated Fighter', color: 'from-emerald-400 to-teal-600 border-emerald-500 text-emerald-300 shadow-emerald-900/50' };
    return { rank: 'E-RANK', title: 'Awakened Novice', color: 'from-gray-500 to-slate-700 border-gray-600 text-gray-300 shadow-gray-900/50' };
  };

  const hunterRank = getRank(level);

  return (
    <div dir="rtl" className="min-h-screen bg-[#030712] text-slate-100 font-sans p-3 sm:p-6 pb-28 select-none relative overflow-x-hidden">
      
      {/* Background Neon Ambient Glows */}
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed top-1/2 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 border border-cyan-400/80 text-cyan-200 px-6 py-3.5 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] backdrop-blur-xl font-bold text-sm text-center animate-bounce flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          {toastMessage}
        </div>
      )}

      <div className="max-w-md mx-auto space-y-5 relative z-10">
        
        {/* HEADER & SOUND CONTROL */}
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">SYSTEM ACTIVE v2.5</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-xs bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl backdrop-blur-md transition flex items-center gap-1.5"
          >
            {soundEnabled ? '🔊 צלילים פעילים' : '🔇 ללא צליל'}
          </button>
        </div>

        {/* TOP STATUS CARD (SOLO LEVELING HUD) */}
        <div className="bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800/80 rounded-3xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl group hover:border-cyan-500/40 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500"></div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-mono font-semibold">STATUS WINDOW</p>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
                ⚡ HUNTER SYSTEM
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">{hunterRank.title}</p>
            </div>
            
            <div className={`px-3 py-1 rounded-xl border bg-gradient-to-br ${hunterRank.color} text-xs font-black tracking-wider uppercase shadow-lg backdrop-blur-md`}>
              {hunterRank.rank}
            </div>
          </div>

          {/* Level & XP Progress Bar */}
          <div className="space-y-1.5 mb-5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-200">דרגה <span className="text-cyan-400 font-mono text-sm">{level}</span></span>
              <span className="text-cyan-400 font-mono">{xp} / 1000 XP</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 h-full rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                style={{ width: `${Math.min(100, (xp / 1000) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Hunter Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-cyan-900/30 hover:border-cyan-500/50 transition">
              <p className="text-[11px] text-slate-400 font-medium">💪 כוח (STR)</p>
              <p className="text-lg font-black text-cyan-400 font-mono mt-0.5">{str}</p>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-purple-900/30 hover:border-purple-500/50 transition">
              <p className="text-[11px] text-slate-400 font-medium">⚡ זריזות (AGI)</p>
              <p className="text-lg font-black text-purple-400 font-mono mt-0.5">{agi}</p>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-amber-900/30 hover:border-amber-500/50 transition">
              <p className="text-[11px] text-slate-400 font-medium">🛡️ סבולת (END)</p>
              <p className="text-lg font-black text-amber-400 font-mono mt-0.5">{end}</p>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="grid grid-cols-5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold gap-1 backdrop-blur-md">
          <button
            onClick={() => { safePlaySound('click'); setActiveTab('quests'); }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'quests' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            🏆 משימות
          </button>
          <button
            onClick={() => { safePlaySound('click'); setActiveTab('boss'); }}
            className={`py-2 rounded-xl transition-all relative ${
              activeTab === 'boss' ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            👹 בוס
            {!boss.defeated && <span className="absolute top-1 left-1.5 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
          </button>
          <button
            onClick={() => { safePlaySound('click'); setActiveTab('skills'); }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'skills' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.2)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎲 אתגרים
          </button>
          <button
            onClick={() => { safePlaySound('click'); setActiveTab('prs'); }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'prs' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 שיאים
          </button>
          <button
            onClick={() => { safePlaySound('click'); setActiveTab('log'); }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'log' ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            📜 לוג
          </button>
        </div>

        {/* TAB 1: WEEKLY QUESTS */}
        {activeTab === 'quests' && (
          <div className="space-y-4">
            
            {/* Thursday Special Challenge Banner */}
            <div className="bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-slate-900/90 border border-purple-500/40 p-4 rounded-3xl shadow-xl flex items-center justify-between gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none"></div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-purple-400 tracking-wider">THURSDAY SPECIAL</span>
                <h3 className="font-black text-white text-sm mt-0.5">🔥 אתגר חמישי 100/100/100</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">100 מתח + 100 מקבילים + 100 שכיבות סמיכה!</p>
              </div>
              <button
                onClick={completeThursdayChallenge}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs px-3.5 py-2.5 rounded-2xl shadow-lg transition active:scale-95 whitespace-nowrap border border-purple-400/40"
              >
                בצע כעת! 🚀
              </button>
            </div>

            {/* 300 / 300 / 300 Reps Tracker */}
            <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-3xl space-y-4 backdrop-blur-md">
              <h2 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-800 pb-2">
                <span>🎯 משימות חזרות שבועיות (300/300/300)</span>
                <span className="text-[10px] text-slate-400 font-mono">300 GOAL</span>
              </h2>

              {/* PULLUPS (300) */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-100 flex items-center gap-1.5">
                    <span>💪</span> עליות מתח
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">{pullups} / 300</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                    style={{ width: `${Math.min(100, (pullups / 300) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex gap-2 pt-1">
                  {[10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => addWorkoutReps('pullups', amt)}
                      className="flex-1 bg-slate-900 hover:bg-cyan-950/80 hover:text-cyan-300 text-slate-300 text-xs py-1.5 rounded-xl border border-slate-800 transition font-mono font-semibold active:scale-95"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* DIPS (300) */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-100 flex items-center gap-1.5">
                    <span>🔥</span> מקבילים
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-400">{dips} / 300</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                    style={{ width: `${Math.min(100, (dips / 300) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex gap-2 pt-1">
                  {[10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => addWorkoutReps('dips', amt)}
                      className="flex-1 bg-slate-900 hover:bg-purple-950/80 hover:text-purple-300 text-slate-300 text-xs py-1.5 rounded-xl border border-slate-800 transition font-mono font-semibold active:scale-95"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* PUSHUPS (300) */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-100 flex items-center gap-1.5">
                    <span>🏋️</span> שכיבות סמיכה
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">{pushups} / 300</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                    style={{ width: `${Math.min(100, (pushups / 300) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex gap-2 pt-1">
                  {[15, 30, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => addWorkoutReps('pushups', amt)}
                      className="flex-1 bg-slate-900 hover:bg-amber-950/80 hover:text-amber-300 text-slate-300 text-xs py-1.5 rounded-xl border border-slate-800 transition font-mono font-semibold active:scale-95"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Static Holds & Integrated Stopwatch */}
            <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-3xl space-y-4 backdrop-blur-md">
              <h2 className="text-xs font-black text-purple-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                ⏱️ החזקה סטטית (טיימר מובנה)
              </h2>

              {/* Active Timer Floating Interface */}
              {activeTimer && (
                <div className="bg-purple-950/80 border border-purple-500/50 p-4 rounded-2xl text-center space-y-2 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                  <p className="text-xs text-purple-300 font-bold uppercase tracking-wider">
                    מדידה פעילה: {activeTimer === 'fl' ? '🦅 פרונט לבר' : '🤸 פלאנץ\''}
                  </p>
                  <p className="text-4xl font-mono font-black text-white">{timerSeconds}s</p>
                  <button
                    onClick={stopAndSaveTimer}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-lg active:scale-95 transition"
                  >
                    שמור זמן והוסף XP! 💾
                  </button>
                </div>
              )}

              {/* FRONT LEVER */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-100">🦅 פרונט לבר</p>
                  <p className="text-[11px] text-slate-400">יעד: 120 שניות (2 דקות)</p>
                  <p className="text-xs font-mono font-bold text-cyan-400 mt-0.5">{frontLeverSec} / 120s</p>
                </div>
                <button
                  onClick={() => startTimer('fl')}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl transition border active:scale-95 ${
                    activeTimer === 'fl'
                      ? 'bg-red-600 text-white border-red-500 shadow-red-900/50'
                      : 'bg-cyan-950/60 text-cyan-300 border-cyan-800 hover:bg-cyan-900/80'
                  }`}
                >
                  {activeTimer === 'fl' ? 'עצור' : 'הפעל טיימר ⏱️'}
                </button>
              </div>

              {/* PLANCHE */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-100">🤸 פלאנץ'</p>
                  <p className="text-[11px] text-slate-400">יעד: 60 שניות (דקה)</p>
                  <p className="text-xs font-mono font-bold text-purple-400 mt-0.5">{plancheSec} / 60s</p>
                </div>
                <button
                  onClick={() => startTimer('planche')}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl transition border active:scale-95 ${
                    activeTimer === 'planche'
                      ? 'bg-red-600 text-white border-red-500 shadow-red-900/50'
                      : 'bg-purple-950/60 text-purple-300 border-purple-800 hover:bg-purple-900/80'
                  }`}
                >
                  {activeTimer === 'planche' ? 'עצור' : 'הפעל טיימר ⏱️'}
                </button>
              </div>

            </div>

            {/* Protein & Leg Days */}
            <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-3xl space-y-4 backdrop-blur-md">
              <h2 className="text-xs font-black text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                🍗 תזונה ורגליים
              </h2>

              {/* PROTEIN 5 DAYS */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-100">🍗 חלבון מספיק (5 ימים)</span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {proteinDays.filter(Boolean).length} / 5 ימים
                  </span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {['א', 'ב', 'ג', 'ד', 'ה'].map((day, idx) => (
                    <button
                      key={day}
                      onClick={() => toggleProteinDay(idx)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition active:scale-95 ${
                        proteinDays[idx]
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                          : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      יום {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* JUMP SQUATS */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-100">🦵 קפיצות סקוואט בשבוע</p>
                  <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">{jumpSquats} / 100</p>
                </div>
                <button
                  onClick={() => addWorkoutReps('jumpsquats', 20)}
                  className="bg-slate-900 hover:bg-emerald-950/80 hover:text-emerald-300 text-slate-300 text-xs px-3.5 py-2 rounded-xl border border-slate-800 font-mono font-bold active:scale-95 transition"
                >
                  +20 קפיצות
                </button>
              </div>

            </div>

            {/* Reset Week Button */}
            <div className="text-center pt-2">
              <button
                onClick={resetWeeklyProgress}
                className="text-xs text-slate-500 hover:text-red-400 transition underline font-medium"
              >
                איפוס שבועי של המשימות 🔄
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: WEEKLY BOSS */}
        {activeTab === 'boss' && (
          <div className="bg-gradient-to-b from-slate-900/90 via-red-950/40 to-slate-950/90 border border-red-900/50 p-6 rounded-3xl shadow-2xl space-y-6 text-center relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>
            
            <div>
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest">{boss.title}</span>
              <h2 className="text-2xl font-black text-red-300 mt-1">{boss.name}</h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {boss.defeated
                  ? '🏆 הבוס חוסל בהצלחה השבוע! עבודה אדירה האנטר!'
                  : 'הבוס סופג נזק ישיר בכל פעם שאתה מרוויח XP באימונים!'}
              </p>
            </div>

            {/* Boss HP Bar */}
            <div className="space-y-2 bg-slate-950/80 p-4 rounded-2xl border border-red-900/40">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-red-400">BOSS HEALTH</span>
                <span className="text-white">{boss.currentHp} / {boss.maxHp} HP</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-4 p-0.5 border border-red-900/60 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-600 via-orange-500 to-red-500 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                  style={{ width: `${(boss.currentHp / boss.maxHp) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Boss Avatar Visual */}
            <div className="py-8 bg-slate-950/90 rounded-2xl border border-red-900/40 flex flex-col items-center justify-center space-y-2 shadow-inner">
              <div className="text-6xl animate-pulse transform hover:scale-110 transition">
                {boss.defeated ? '💀' : '👹'}
              </div>
              <p className="text-xs font-bold text-slate-300 mt-2">
                {boss.defeated ? 'אויב הושמד לחלוטין' : 'הבוס זועם וממתין לאתגר ה-XP שלך!'}
              </p>
            </div>

            {!boss.defeated && (
              <div className="text-xs text-red-300 bg-red-950/40 p-3.5 rounded-2xl border border-red-900/40 font-medium">
                💥 פרס חיסול הבוס: +{boss.rewardXp} XP + ניקוד בונוס לכל המדדים!
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LUCKY DICE */}
        {activeTab === 'skills' && (
          <div className="bg-slate-900/80 border border-purple-500/30 p-6 rounded-3xl text-center space-y-6 shadow-xl backdrop-blur-md">
            <div>
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">RANDOM CHALLENGE</span>
              <h2 className="text-xl font-black text-purple-300 mt-0.5">🎲 אתגר המזל השבועי</h2>
              <p className="text-xs text-slate-400 mt-1">
                הטֵל את הקובייה לקבלת משימת פתע מיוחדת עם ניקוד XP גבוה!
              </p>
            </div>

            {/* Dice Visual */}
            <div className="py-6 flex justify-center items-center">
              <div
                onClick={rollDice}
                className={`w-28 h-28 bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 border-2 border-purple-400/80 rounded-3xl flex items-center justify-center text-5xl font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] cursor-pointer transform transition active:scale-90 ${
                  isRolling ? 'animate-spin' : 'hover:scale-105'
                }`}
              >
                {diceRoll ? diceRoll : '🎲'}
              </div>
            </div>

            <button
              onClick={rollDice}
              disabled={isRolling}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs px-8 py-3.5 rounded-2xl shadow-lg transition active:scale-95 disabled:opacity-50 border border-purple-400/30"
            >
              {isRolling ? 'מטיל קובייה...' : 'הטל קובייה! 🎲'}
            </button>

            {/* Challenge Result Card */}
            {diceChallenge && (
              <div className="bg-purple-950/70 border border-purple-400/50 p-4 rounded-2xl space-y-3 shadow-lg">
                <p className="text-[10px] font-mono text-purple-300 uppercase tracking-widest">משימת הפתע שקיבלת:</p>
                <p className="text-base font-bold text-white">{diceChallenge.text}</p>
                <button
                  onClick={() => {
                    addXpAndStats(diceChallenge.xp, `אתגר קובייה: ${diceChallenge.text}`, 2, 2, 2);
                    showToast(`🏆 השלמת את אתגר הקובייה! (+${diceChallenge.xp} XP)`);
                    setDiceChallenge(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow active:scale-95"
                >
                  סימנתי ביצוע! (+{diceChallenge.xp} XP) ✅
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PERSONAL RECORDS (PRs) */}
        {activeTab === 'prs' && (
          <div className="bg-slate-900/80 border border-amber-500/30 p-5 rounded-3xl space-y-5 backdrop-blur-md">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">MAX RECORDS</span>
              <h2 className="text-base font-black text-amber-300 mt-0.5">📊 יום השיאים החודשי (PRs)</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center">
                <span className="font-semibold text-slate-200">💪 שיא מתח בסט אחד:</span>
                <input
                  type="number"
                  value={maxPullups || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setMaxPullups(val);
                    localStorage.setItem('hunter_max_pullups', val.toString());
                  }}
                  placeholder="0"
                  className="w-20 bg-slate-900 text-amber-400 font-bold border border-slate-700 text-center rounded-xl py-1.5 focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center">
                <span className="font-semibold text-slate-200">🔥 שיא מקבילים בסט אחד:</span>
                <input
                  type="number"
                  value={maxDips || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setMaxDips(val);
                    localStorage.setItem('hunter_max_dips', val.toString());
                  }}
                  placeholder="0"
                  className="w-20 bg-slate-900 text-amber-400 font-bold border border-slate-700 text-center rounded-xl py-1.5 focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center">
                <span className="font-semibold text-slate-200">🏋️ שיא שכיבות סמיכה בסט אחד:</span>
                <input
                  type="number"
                  value={maxPushups || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setMaxPushups(val);
                    localStorage.setItem('hunter_max_pushups', val.toString());
                  }}
                  placeholder="0"
                  className="w-20 bg-slate-900 text-amber-400 font-bold border border-slate-700 text-center rounded-xl py-1.5 focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: HISTORY LOG */}
        {activeTab === 'log' && (
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl space-y-4 backdrop-blur-md">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">📜 היסטוריית פעילות והישגים</h2>
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">טרם נרשמו פעילויות. צא להתאמן!</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{log.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{log.date}</p>
                    </div>
                    <span className="text-cyan-400 font-black font-mono bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/50">
                      +{log.xpEarned} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
