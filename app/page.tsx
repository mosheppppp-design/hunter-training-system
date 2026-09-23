'use client';

import { useState, useEffect } from 'react';

export default function HunterPage() {
  const [xp, setXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [pullups, setPullups] = useState<number>(0);
  const [dips, setDips] = useState<number>(0);
  const [pushups, setPushups] = useState<number>(0);

  // טעינת נתונים שמורים מהדפדפן
  useEffect(() => {
    const savedXp = localStorage.getItem('hunter_xp');
    const savedLevel = localStorage.getItem('hunter_level');
    const savedPullups = localStorage.getItem('hunter_pullups');
    const savedDips = localStorage.getItem('hunter_dips');
    const savedPushups = localStorage.getItem('hunter_pushups');

    if (savedXp) setXp(parseInt(savedXp));
    if (savedLevel) setLevel(parseInt(savedLevel));
    if (savedPullups) setPullups(parseInt(savedPullups));
    if (savedDips) setDips(parseInt(savedDips));
    if (savedPushups) setPushups(parseInt(savedPushups));
  }, []);

  // הוספת XP ועליית רמות
  const addXP = (amount: number) => {
    let newXp = xp + amount;
    let newLevel = level;
    if (newXp >= 1000) {
      newLevel += 1;
      newXp = 0;
    }
    setXp(newXp);
    setLevel(newLevel);
    localStorage.setItem('hunter_xp', newXp.toString());
    localStorage.setItem('hunter_level', newLevel.toString());
  };

  // עדכון משימות שבועיות (עד 300)
  const updateTask = (type: 'pullups' | 'dips' | 'pushups', amount: number) => {
    if (type === 'pullups') {
      const val = Math.min(pullups + amount, 300);
      setPullups(val);
      localStorage.setItem('hunter_pullups', val.toString());
    } else if (type === 'dips') {
      const val = Math.min(dips + amount, 300);
      setDips(val);
      localStorage.setItem('hunter_dips', val.toString());
    } else if (type === 'pushups') {
      const val = Math.min(pushups + amount, 300);
      setPushups(val);
      localStorage.setItem('hunter_pushups', val.toString());
    }
    addXP(100);
  };

  return (
    <main className="max-w-md mx-auto p-4 space-y-6">
      
      {/* סטטוס האנטר */}
      <div className="bg-gray-900 border border-cyan-500/40 p-6 rounded-2xl shadow-xl text-center">
        <h1 className="text-xl font-black text-cyan-400 mb-2">⚡ HUNTER SYSTEM ⚡</h1>
        <div className="flex justify-around items-center my-4">
          <div>
            <p className="text-gray-400 text-xs">דרגה</p>
            <p className="text-2xl font-bold">{level}</p>
          </div>
          <div className="h-8 w-[1px] bg-gray-700"></div>
          <div>
            <p className="text-gray-400 text-xs">XP</p>
            <p className="text-2xl font-bold text-cyan-400">{xp} / 1000</p>
          </div>
        </div>
      </div>

      {/* משימות שבועיות (300/300/300) */}
      <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold text-gray-200">🏆 משימות שבועיות (300)</h2>
        
        {/* מתח */}
        <div className="bg-gray-800/50 p-3 rounded-xl flex justify-between items-center">
          <div>
            <p className="font-semibold text-sm">💪 מתח</p>
            <p className="text-xs text-cyan-400">{pullups} / 300</p>
          </div>
          <button 
            onClick={() => updateTask('pullups', 50)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            +50
          </button>
        </div>

        {/* מקבילים */}
        <div className="bg-gray-800/50 p-3 rounded-xl flex justify-between items-center">
          <div>
            <p className="font-semibold text-sm">🔥 מקבילים</p>
            <p className="text-xs text-cyan-400">{dips} / 300</p>
          </div>
          <button 
            onClick={() => updateTask('dips', 50)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            +50
          </button>
        </div>

        {/* שכיבות סמיכה */}
        <div className="bg-gray-800/50 p-3 rounded-xl flex justify-between items-center">
          <div>
            <p className="font-semibold text-sm">🏋️ שכיבות סמיכה</p>
            <p className="text-xs text-cyan-400">{pushups} / 300</p>
          </div>
          <button 
            onClick={() => updateTask('pushups', 50)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            +50
          </button>
        </div>

      </div>
    </main>
  );
}
