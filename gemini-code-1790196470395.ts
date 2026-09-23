'use client';

import { useState, useEffect } from 'react';

export default function HunterTrainingApp() {
  const [xp, setXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [pullups, setPullups] = useState<number>(0);
  const [dips, setDips] = useState<number>(0);
  const [pushups, setPushups] = useState<number>(0);

  // טעינת נתונים מהדפדפן בטעינה ראשונית
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

  // פונקציה לעדכון XP ושמירה
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

  const updateTask = (type: 'pullups' | 'dips' | 'pushups', amount: number) => {
    if (type === 'pullups') {
      const val = Math.min(pullups + amount, 300);
      setPullups(val);
      localStorage.setItem('hunter_pullups', val.toString());
    } else if (type === 'dips') {
      const val = Math.min(dips + amount, 300);
      setValDips(val); // או שיוך ישיר
    } else if (type === 'pushups') {
      const val = Math.min(pushups + amount, 300);
      setPushups(val);
      localStorage.setItem('hunter_pushups', val.toString());
    }
    addXP(100);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-950 text-white p-6 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* כותרת וסטטוס האנטר */}
        <div className="bg-gray-900 border border-cyan-500/30 p-6 rounded-2xl shadow-xl text-center">
          <h1 className="text-2xl font-black text-cyan-400 mb-2">⚡ HUNTER SYSTEM ⚡</h1>
          <div className="flex justify-around items-center my-4">
            <div>
              <p className="text-gray-400 text-sm">דרגה</p>
              <p className="text-3xl font-bold">{level}</p>
            </div>
            <div className="h-8 w-[1px] bg-gray-700"></div>
            <div>
              <p className="text-gray-400 text-sm">XP</p>
              <p className="text-3xl font-bold text-cyan-400">{xp} / 1000</p>
            </div>
          </div>
        </div>

        {/* משימות שבועיות (300/300/300) */}
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-gray-200">🏆 משימות שבועיות</h2>
          
          {/* מתח */}
          <div className="bg-gray-800/50 p-3 rounded-xl flex justify-between items-center">
            <div>
              <p className="font-semibold">💪 מתח ({pullups}/300)</p>
            </div>
            <button 
              onClick={() => updateTask('pullups', 50)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              +50 חזרות
            </button>
          </div>

          {/* מקבילים */}
          <div className="bg-gray-800/50 p-3 rounded-xl flex justify-between items-center">
            <div>
              <p className="font-semibold">🔥 מקבילים ({dips}/300)</p>
            </div>
            <button 
              onClick={() => {
                const val = Math.min(dips + 50, 300);
                setDips(val);
                localStorage.setItem('hunter_dips', val.toString());
                addXP(100);
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              +50 חזרות
            </button>
          </div>

          {/* שכיבות סמיכה */}
          <div className="bg-gray-800/50 p-3 rounded-xl flex justify-between items-center">
            <div>
              <p className="font-semibold">🏋️ שכיבות סמיכה ({pushups}/300)</p>
            </div>
            <button 
              onClick={() => updateTask('pushups', 50)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              +50 חזרות
            </button>
          </div>

        </div>

      </div>
    </main>
  );
}