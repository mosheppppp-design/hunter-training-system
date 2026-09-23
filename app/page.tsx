'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Web Audio API for sound effects without external audio files
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
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'quest') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.15);
      });
    } else if (type === 'levelup') {
      const arpeggio = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      arpeggio.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.09 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.2);
      });
    } else if (type === 'dice') {
      for (let i = 0; i < 5; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200 + Math.random() * 400, ctx.currentTime + i * 0.06);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.05);
      }
    } else if (type === 'bossHit') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Audio Context fail silent fallback
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
  { text: '20 שכיבות סמיכה יהלום', xp: 80 },
  { text: '1 דקה Hollow Hold', xp: 70 },
  { text: '15 עליות מתח רחבות', xp: 90 },
  { text: '30 קפיצות סקוואט עמוקות', xp: 80 },
  { text: '25 מקבילים בקצב איטי (3 שניות ירידה)', xp: 100 },
  { text: '15 שכיבות סמיכה באגרופים', xp: 75 },
];

export default function HunterSystemApp() {
  // Hunter Core Stats
  const [level, setLevel] = useState<number>(1);
  const [xp, setXp] = useState<number>(0);
  const [str, setStr] = useState<number>(10);
  const [agi, setAgi] = useState<number>(10);
  const [end, setEnd] = useState<number>(10);

  // Weekly Quests Progress
  const [pullups, setPullups] = useState<number>(0); // Target: 300
  const [dips, setDips] = useState<number>(0);       // Target: 300
  const [pushups, setPushups] = useState<number>(0); // Target: 300
  const [frontLeverSec, setFrontLeverSec] = useState<number>(0); // Target: 120s (2 min)
  const [plancheSec, setPlancheSec] = useState<number>(0);       // Target: 60s (1 min)
  const [proteinDays, setProteinDays] = useState<boolean[]>([false, false, false, false, false]); // 5 days
  const [jumpSquats, setJumpSquats] = useState<number>(0); // Target: 100

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

  // PRs State
  const [maxPullups, setMaxPullups] = useState<number>(0);
  const [maxDips, setMaxDips] = useState<number>(0);
  const [maxPushups, setMaxPushups] = useState<number>(0);

  // Load initial data
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

  // Show toast utility
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const addXpAndStats = useCallback((earnedXp: number, sourceName: string, strAdd = 1, agiAdd = 1, endAdd = 1) => {
    playSystemSound('quest');
    
    setXp((prevXp) => {
      let newXp = prevXp + earnedXp;
      let newLevel = level;

      // Level calculation threshold (1000 XP per level)
      while (newXp >= 1000) {
        newXp -= 1000;
        newLevel += 1;
        playSystemSound('levelup');
        showToast(`🎉 עלית לדרגה ${newLevel}! כוחות האנטר שלך התחזקו!`);
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

    // Boss damage calculation (1 XP = 1 Boss Damage)
    setBoss((prevBoss) => {
      if (prevBoss.defeated) return prevBoss;
      const damage = earnedXp;
      const newHp = Math.max(0, prevBoss.currentHp - damage);
      const isDefeated = newHp === 0;

      if (isDefeated && !prevBoss.defeated) {
        playSystemSound('levelup');
        showToast(`💥 נצחת את הבוס ${prevBoss.name}! קיבלת +${prevBoss.rewardXp} XP בונוס!`);
        setTimeout(() => addXpAndStats(prevBoss.rewardXp, 'ניצחון על בוס שבועי', 5, 5, 5), 500);
      } else {
        playSystemSound('bossHit');
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
      date: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('he-IL'),
    };
    setLogs((prev) => {
      const updated = [newEntry, ...prev.slice(0, 19)];
      localStorage.setItem('hunter_logs', JSON.stringify(updated));
      return updated;
    });
  }, [level, showToast]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = (type: 'fl' | 'planche') => {
    playSystemSound('click');
    if (activeTimer === type) {
      // Pause
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
    playSystemSound('quest');
    if (timerRef.current) clearInterval(timerRef.current);

    if (activeTimer === 'fl' && timerSeconds > 0) {
      setFrontLeverSec((prev) => {
        const val = Math.min(120, prev + timerSeconds);
        localStorage.setItem('hunter_frontlever', val.toString());
        return val;
      });
      addXpAndStats(timerSeconds * 2, `החזקת פרונט לבר (${timerSeconds} שנ')`, 1, 2, 1);
      showToast(`⚡ נרשמו ${timerSeconds} שניות של פרונט לבר! (+${timerSeconds * 2} XP)`);
    } else if (activeTimer === 'planche' && timerSeconds > 0) {
      setPlancheSec((prev) => {
        const val = Math.min(60, prev + timerSeconds);
        localStorage.setItem('hunter_planche', val.toString());
        return val;
      });
      addXpAndStats(timerSeconds * 3, `החזקת פלאנץ' (${timerSeconds} שנ')`, 2, 2, 1);
      showToast(`⚡ נרשמו ${timerSeconds} שניות של פלאנץ'! (+${timerSeconds * 3} XP)`);
    }

    setActiveTimer(null);
    setTimerSeconds(0);
  };

  const addWorkoutReps = (type: 'pullups' | 'dips' | 'pushups' | 'jumpsquats', amount: number) => {
    playSystemSound('click');
    if (type === 'pullups') {
      setPullups((prev) => {
        const val = Math.min(300, prev + amount);
        localStorage.setItem('hunter_pullups', val.toString());
        return val;
      });
      addXpAndStats(amount * 2, `עשיית ${amount} מתח`, 2, 1, 1);
    } else if (type === 'dips') {
      setDips((prev) => {
        const val = Math.min(300, prev + amount);
        localStorage.setItem('hunter_dips', val.toString());
        return val;
      });
      addXpAndStats(amount * 1.5, `עשיית ${amount} מקבילים`, 2, 1, 1);
    } else if (type === 'pushups') {
      setPushups((prev) => {
        const val = Math.min(300, prev + amount);
        localStorage.setItem('hunter_pushups', val.toString());
        return val;
      });
      addXpAndStats(amount * 1, `עשיית ${amount} שכיבות סמיכה`, 1, 1, 2);
    } else if (type === 'jumpsquats') {
      setJumpSquats((prev) => {
        const val = Math.min(100, prev + amount);
        localStorage.setItem('hunter_jumpsquats', val.toString());
        return val;
      });
      addXpAndStats(amount * 1.2, `עשיית ${amount} קפיצות סקוואט`, 1, 2, 2);
    }
  };

  // Thursday 100/100/100 Challenge
  const completeThursdayChallenge = () => {
    playSystemSound('levelup');
    addWorkoutReps('pullups', 100);
    addWorkoutReps('dips', 100);
    addWorkoutReps('pushups', 100);
    addXpAndStats(300, '🔥 אתגר יום חמישי - 100/100/100 מושלם!', 5, 5, 5);
    showToast('🏆 אתגר 100/100/100 הושלם בהצלחה! קיבלת XP אדיר!');
  };

  // Toggle Protein Day
  const toggleProteinDay = (index: number) => {
    playSystemSound('click');
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
    playSystemSound('dice');
    setDiceChallenge(null);

    let count = 0;
    const interval = setInterval(() => {
      setDiceRoll(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 12) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 6);
        setDiceRoll(finalVal + 1);
        setDiceChallenge(DICE_CHALLENGES[finalVal]);
        setIsRolling(false);
        playSystemSound('quest');
      }
    }, 100);
  };

  // Reset Week
  const resetWeeklyProgress = () => {
    if (confirm('האם אתה בטוח שברצונך לאפס את המשימות השבועיות שטרם הושלמו?')) {
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
      showToast('🔄 המשימות השבועיות אופסו בהצלחה!');
    }
  };

  // Calculate Rank Title
  const getRank = (lvl: number) => {
    if (lvl >= 50) return { rank: 'S-Rank', title: 'Monarch of Shadows', color: 'text-purple-400 border-purple-500' };
    if (lvl >= 35) return { rank: 'A-Rank', title: 'High Hunter', color: 'text-red-400 border-red-500' };
    if (lvl >= 20) return { rank: 'B-Rank', title: 'Calisthenics Master', color: 'text-yellow-400 border-yellow-500' };
    if (lvl >= 10) return { rank: 'C-Rank', title: 'Elite Striker', color: 'text-cyan-400 border-cyan-500' };
    if (lvl >= 5)  return { rank: 'D-Rank', title: 'Dedicated Novice', color: 'text-green-400 border-green-500' };
    return { rank: 'E-Rank', title: 'Weakest Hunter', color: 'text-gray-400 border-gray-600' };
  };

  const hunterRank = getRank(level);

  return (
    <div dir="rtl" className="min-h-screen bg-[#030712] text-gray-100 font-sans p-3 sm:p-6 pb-24 select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-cyan-950/90 border border-cyan-400 text-cyan-200 px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md font-bold text-sm text-center animate-bounce">
          {toastMessage}
        </div>
      )}

      <div className="max-w-xl mx-auto space-y-6">
        
        {/* TOP STATUS WINDOW (Solo Leveling Aesthetic) */}
        <div className={`bg-gray-900/80 border-2 ${hunterRank.color} rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-sm`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500"></div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono">system status</span>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                ⚡ HUNTER SYSTEM ⚡
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">{hunterRank.title}</p>
            </div>
            <div className={`px-3 py-1 rounded-lg border text-xs font-black uppercase ${hunterRank.color} bg-black/40`}>
              {hunterRank.rank}
            </div>
          </div>

          {/* Level & XP Bar */}
          <div className="space-y-1.5 mb-5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-300">דרגה {level}</span>
              <span className="text-cyan-400">{xp} / 1000 XP</span>
            </div>
            <div className="w-full bg-gray-950 rounded-full h-3 p-0.5 border border-cyan-900/50">
              <div
                className="bg-gradient-to-r from-cyan-500 to-purple-600 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                style={{ width: `${Math.min(100, (xp / 1000) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Hunter Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-800/80 text-xs">
            <div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800">
              <p className="text-gray-400 font-mono">💪 כוח (STR)</p>
              <p className="text-lg font-black text-cyan-400">{str}</p>
            </div>
            <div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800">
              <p className="text-gray-400 font-mono">⚡ זריזות (AGI)</p>
              <p className="text-lg font-black text-purple-400">{agi}</p>
            </div>
            <div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800">
              <p className="text-gray-400 font-mono">🛡️ סבולת (END)</p>
              <p className="text-lg font-black text-amber-400">{end}</p>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-gray-800 gap-1 overflow-x-auto pb-1 text-sm font-semibold scrollbar-none">
          <button
            onClick={() => { playSystemSound('click'); setActiveTab('quests'); }}
            className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl transition-all ${
              activeTab === 'quests' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-400 hover:text-white'
            }`}
          >
            🏆 משימות
          </button>
          <button
            onClick={() => { playSystemSound('click'); setActiveTab('boss'); }}
            className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl transition-all relative ${
              activeTab === 'boss' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-gray-400 hover:text-white'
            }`}
          >
            👹 בוס
            {!boss.defeated && <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
          </button>
          <button
            onClick={() => { playSystemSound('click'); setActiveTab('skills'); }}
            className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl transition-all ${
              activeTab === 'skills' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'text-gray-400 hover:text-white'
            }`}
          >
            🎲 אתגרים
          </button>
          <button
            onClick={() => { playSystemSound('click'); setActiveTab('prs'); }}
            className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl transition-all ${
              activeTab === 'prs' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 שיאים
          </button>
          <button
            onClick={() => { playSystemSound('click'); setActiveTab('log'); }}
            className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl transition-all ${
              activeTab === 'log' ? 'bg-gray-800 text-gray-200' : 'text-gray-400 hover:text-white'
            }`}
          >
            📜 לוג
          </button>
        </div>

        {/* TAB 1: WEEKLY QUESTS */}
        {activeTab === 'quests' && (
          <div className="space-y-4">
            
            {/* Quick Challenge Button */}
            <div className="bg-gradient-to-r from-purple-950/80 to-cyan-950/80 border border-purple-500/40 p-4 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <h3 className="font-black text-purple-300 text-sm">🔥 אתגר יום חמישי 100/100/100</h3>
                <p className="text-xs text-gray-300 mt-0.5">סגור 100 מתח + 100 מקבילים + 100 שכיבות סמיכה במכה!</p>
              </div>
              <button
                onClick={completeThursdayChallenge}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition active:scale-95 whitespace-nowrap"
              >
                בצע כעת! 🚀
              </button>
            </div>

            {/* 300 / 300 / 300 Reps Tracker */}
            <div className="bg-gray-900/80 border border-gray-800 p-4 rounded-2xl space-y-4">
              <h2 className="text-sm font-black text-cyan-400 uppercase tracking-wide flex justify-between items-center">
                <span>🎯 משימות חזרות שבועיות (300/300/300)</span>
                <span className="text-xs text-gray-400">חזרות באימונים נחשבות!</span>
              </h2>

              {/* PULLUPS (300) */}
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-200">💪 מתח</span>
                  <span className="text-xs font-mono text-cyan-400">{pullups} / 300 חזרות</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (pullups / 300) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex gap-2 pt-1">
                  {[10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => addWorkoutReps('pullups', amt)}
                      className="flex-1 bg-gray-900 hover:bg-cyan-950 hover:text-cyan-300 text-gray-300 text-xs py-1.5 rounded-lg border border-gray-800 transition font-medium"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* DIPS (300) */}
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-200">🔥 מקבילים</span>
                  <span className="text-xs font-mono text-purple-400">{dips} / 300 חזרות</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (dips / 300) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex gap-2 pt-1">
                  {[10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => addWorkoutReps('dips', amt)}
                      className="flex-1 bg-gray-900 hover:bg-purple-950 hover:text-purple-300 text-gray-300 text-xs py-1.5 rounded-lg border border-gray-800 transition font-medium"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* PUSHUPS (300) */}
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-200">🏋️ שכיבות סמיכה</span>
                  <span className="text-xs font-mono text-amber-400">{pushups} / 300 חזרות</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (pushups / 300) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex gap-2 pt-1">
                  {[15, 30, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => addWorkoutReps('pushups', amt)}
                      className="flex-1 bg-gray-900 hover:bg-amber-950 hover:text-amber-300 text-gray-300 text-xs py-1.5 rounded-lg border border-gray-800 transition font-medium"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Holds & Timer Section */}
            <div className="bg-gray-900/80 border border-gray-800 p-4 rounded-2xl space-y-4">
              <h2 className="text-sm font-black text-purple-400 uppercase tracking-wide">
                ⏱️ אתגרי החזקה סטטית (טיימר מובנה)
              </h2>

              {/* Active Timer Interface */}
              {activeTimer && (
                <div className="bg-purple-950/60 border border-purple-500/50 p-4 rounded-xl text-center space-y-2 animate-pulse">
                  <p className="text-xs text-purple-300 font-bold uppercase">
                    מדידה פעילה: {activeTimer === 'fl' ? '🦅 פרונט לבר' : '🤸 פלאנץ\''}
                  </p>
                  <p className="text-4xl font-mono font-black text-white">{timerSeconds} שניות</p>
                  <button
                    onClick={stopAndSaveTimer}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xs px-6 py-2 rounded-xl shadow-lg"
                  >
                    שמור זמן והוסף XP! 💾
                  </button>
                </div>
              )}

              {/* FRONT LEVER */}
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-gray-200">🦅 פרונט לבר</p>
                  <p className="text-xs text-gray-400">יעד: 2 דקות (120 שנ') מצטברות</p>
                  <p className="text-xs font-mono text-cyan-400 mt-0.5">{frontLeverSec} / 120 שניות</p>
                </div>
                <button
                  onClick={() => startTimer('fl')}
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition border ${
                    activeTimer === 'fl'
                      ? 'bg-red-600 text-white border-red-500'
                      : 'bg-cyan-950/80 text-cyan-300 border-cyan-800 hover:bg-cyan-900'
                  }`}
                >
                  {activeTimer === 'fl' ? 'עצור' : 'הפעל טיימר ⏱️'}
                </button>
              </div>

              {/* PLANCHE */}
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-gray-200">🤸 פלאנץ'</p>
                  <p className="text-xs text-gray-400">יעד: דקה (60 שנ') מצטברת</p>
                  <p className="text-xs font-mono text-purple-400 mt-0.5">{plancheSec} / 60 שניות</p>
                </div>
                <button
                  onClick={() => startTimer('planche')}
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition border ${
                    activeTimer === 'planche'
                      ? 'bg-red-600 text-white border-red-500'
                      : 'bg-purple-950/80 text-purple-300 border-purple-800 hover:bg-purple-900'
                  }`}
                >
                  {activeTimer === 'planche' ? 'עצור' : 'הפעל טיימר ⏱️'}
                </button>
              </div>

            </div>

            {/* Protein & Jump Squats */}
            <div className="bg-gray-900/80 border border-gray-800 p-4 rounded-2xl space-y-4">
              <h2 className="text-sm font-black text-amber-400 uppercase tracking-wide">
                🍗 חלבון ורגליים
              </h2>

              {/* PROTEIN 5 DAYS */}
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-200">🍗 חלבון מספיק (5 ימים)</span>
                  <span className="text-xs text-amber-400">
                    {proteinDays.filter(Boolean).length} / 5 ימים (+200 XP)
                  </span>
                </div>
                <div className="flex gap-2">
                  {['א', 'ב', 'ג', 'ד', 'ה'].map((day, idx) => (
                    <button
                      key={day}
                      onClick={() => toggleProteinDay(idx)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                        proteinDays[idx]
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      יום {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* JUMP SQUATS */}
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-gray-200">🦵 קפיצות סקוואט בשבוע</p>
                  <p className="text-xs font-mono text-emerald-400">{jumpSquats} / 100 קפיצות</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => addWorkoutReps('jumpsquats', 20)}
                    className="bg-gray-900 hover:bg-emerald-950 hover:text-emerald-300 text-gray-300 text-xs px-3 py-1.5 rounded-lg border border-gray-800 font-medium"
                  >
                    +20
                  </button>
                </div>
              </div>

            </div>

            {/* Reset Week Button */}
            <div className="text-center pt-2">
              <button
                onClick={resetWeeklyProgress}
                className="text-xs text-gray-500 hover:text-red-400 transition underline"
              >
                איפוס שבועי של המשימות 🔄
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: WEEKLY BOSS */}
        {activeTab === 'boss' && (
          <div className="bg-gray-900/90 border-2 border-red-900/60 p-6 rounded-2xl shadow-2xl space-y-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-red-600"></div>
            
            <div>
              <span className="text-xs font-mono text-red-500 uppercase tracking-widest">{boss.title}</span>
              <h2 className="text-2xl font-black text-red-400 mt-1">{boss.name}</h2>
              <p className="text-xs text-gray-400 mt-1">
                {boss.defeated
                  ? '🏆 הבוס חוסל בהצלחה השבוע! עבודה מדהימה האנטר!'
                  : 'הבוס סופג נזק בכל פעם שאתה מרוויח XP באימונים ומשימות!'}
              </p>
            </div>

            {/* Boss HP Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-red-400">HP בוס:</span>
                <span>{boss.currentHp} / {boss.maxHp}</span>
              </div>
              <div className="w-full bg-gray-950 rounded-full h-5 p-1 border border-red-900/80">
                <div
                  className="bg-gradient-to-r from-red-700 to-orange-500 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                  style={{ width: `${(boss.currentHp / boss.maxHp) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Boss Status Avatar */}
            <div className="py-6 bg-gray-950/80 rounded-2xl border border-red-900/40 my-4 flex flex-col items-center justify-center space-y-2">
              <div className="text-6xl animate-pulse">
                {boss.defeated ? '💀' : '👹'}
              </div>
              <p className="text-xs font-bold text-gray-300">
                {boss.defeated ? 'אויב הושמד' : 'הבוס ממתין לאתגר שלך!'}
              </p>
            </div>

            {!boss.defeated && (
              <p className="text-xs text-red-300/80 bg-red-950/40 p-3 rounded-xl border border-red-900/30">
                💥 פרס חיסול: +{boss.rewardXp} XP + העלאת דרגה מידית!
              </p>
            )}
          </div>
        )}

        {/* TAB 3: LUCKY DICE */}
        {activeTab === 'skills' && (
          <div className="bg-gray-900/80 border border-purple-500/30 p-6 rounded-2xl text-center space-y-6 shadow-xl">
            <div>
              <h2 className="text-xl font-black text-purple-400">🎲 אתגר המזל השבועי</h2>
              <p className="text-xs text-gray-400 mt-1">
                הטֵל את קוביית המזל כדי לקבל משימת פתע מיוחדת עם ניקוד XP גבוה!
              </p>
            </div>

            {/* Dice Visual */}
            <div className="py-8 flex justify-center items-center">
              <div
                onClick={rollDice}
                className={`w-24 h-24 bg-gradient-to-br from-purple-900 to-indigo-950 border-2 border-purple-400 rounded-2xl flex items-center justify-center text-4xl font-black text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] cursor-pointer transform transition active:scale-90 ${
                  isRolling ? 'animate-spin' : 'hover:scale-105'
                }`}
              >
                {diceRoll ? diceRoll : '🎲'}
              </div>
            </div>

            <button
              onClick={rollDice}
              disabled={isRolling}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm px-8 py-3 rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              {isRolling ? 'מטיל קובייה...' : 'הטל קובייה! 🎲'}
            </button>

            {/* Challenge Result */}
            {diceChallenge && (
              <div className="bg-purple-950/60 border border-purple-400/50 p-4 rounded-xl space-y-3 animate-fade-in">
                <p className="text-xs font-mono text-purple-300 uppercase">משימת הפתע שלך:</p>
                <p className="text-lg font-bold text-white">{diceChallenge.text}</p>
                <button
                  onClick={() => {
                    addXpAndStats(diceChallenge.xp, `אתגר קובייה: ${diceChallenge.text}`, 2, 2, 2);
                    showToast(`🏆 השלמת את אתגר הקובייה! (+${diceChallenge.xp} XP)`);
                    setDiceChallenge(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-lg transition shadow"
                >
                  סימנתי ביצוע! (+{diceChallenge.xp} XP) ✅
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PERSONAL RECORDS (PRs) */}
        {activeTab === 'prs' && (
          <div className="bg-gray-900/80 border border-amber-500/30 p-5 rounded-2xl space-y-5">
            <h2 className="text-base font-black text-amber-400 flex items-center gap-2">
              📊 יום השיאים החודשי
            </h2>

            <div className="space-y-3 text-sm">
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between items-center">
                <span>💪 שיא מתח בסט אחד:</span>
                <input
                  type="number"
                  value={maxPullups || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setMaxPullups(val);
                    localStorage.setItem('hunter_max_pullups', val.toString());
                  }}
                  placeholder="0"
                  className="w-20 bg-gray-900 text-amber-400 font-bold border border-gray-700 text-center rounded-lg py-1"
                />
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between items-center">
                <span>🔥 שיא מקבילים בסט אחד:</span>
                <input
                  type="number"
                  value={maxDips || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setMaxDips(val);
                    localStorage.setItem('hunter_max_dips', val.toString());
                  }}
                  placeholder="0"
                  className="w-20 bg-gray-900 text-amber-400 font-bold border border-gray-700 text-center rounded-lg py-1"
                />
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between items-center">
                <span>🏋️ שיא שכיבות סמיכה בסט אחד:</span>
                <input
                  type="number"
                  value={maxPushups || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setMaxPushups(val);
                    localStorage.setItem('hunter_max_pushups', val.toString());
                  }}
                  placeholder="0"
                  className="w-20 bg-gray-900 text-amber-400 font-bold border border-gray-700 text-center rounded-lg py-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: HISTORY LOG */}
        {activeTab === 'log' && (
          <div className="bg-gray-900/80 border border-gray-800 p-5 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-gray-200">📜 היסטוריית פעילות והישגים</h2>
            {logs.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">טרם נרשמו פעילויות. צא להתאמן!</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="bg-gray-950 p-2.5 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-gray-200">{log.title}</p>
                      <p className="text-[10px] text-gray-500">{log.date}</p>
                    </div>
                    <span className="text-cyan-400 font-bold font-mono">+{log.xpEarned} XP</span>
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
