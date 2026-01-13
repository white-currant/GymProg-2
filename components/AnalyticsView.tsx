
import React, { useState, useMemo } from 'react';
import { Workout } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

interface AnalyticsProps {
  workouts: Workout[];
}

const AnalyticsView: React.FC<AnalyticsProps> = ({ workouts }) => {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'all' | '30' | '90'>('all');

  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    workouts.forEach(w => w.exercises.forEach(e => {
        if (e.name) names.add(e.name.trim());
    }));
    return Array.from(names).sort();
  }, [workouts]);

  const chartData = useMemo(() => {
    if (!selectedExercise && exerciseNames.length > 0) setSelectedExercise(exerciseNames[0]);
    if (!selectedExercise) return [];
    
    return workouts
      .filter(w => w.exercises.some(e => e.name.trim() === selectedExercise))
      .map(w => {
        const exercise = w.exercises.find(e => e.name.trim() === selectedExercise)!;
        return {
          date: new Date(w.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
          rawDate: new Date(w.date),
          weight: Math.max(...exercise.sets.map(s => s.weight)),
        };
      })
      .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  }, [workouts, selectedExercise, exerciseNames]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl space-y-4">
        <select 
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-sm font-bold text-zinc-100 outline-none appearance-none cursor-pointer"
        >
          {exerciseNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        
        <div className="flex bg-zinc-800 rounded-xl p-1 border border-zinc-700">
          {(['all', '90', '30'] as const).map(range => (
            <button key={range} onClick={() => setTimeRange(range)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${timeRange === range ? 'bg-zinc-100 text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {range === 'all' ? 'Всё' : range === '90' ? '90д' : '30д'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 shadow-2xl h-96 relative">
        <div className="flex justify-between items-start mb-8">
           <div>
              <h3 className="font-bold text-zinc-100 text-lg">Прогресс</h3>
              <p className="text-xs text-zinc-500">Рабочий вес (кг)</p>
           </div>
           <div className="px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-emerald-500/10 text-emerald-400">
             <TrendingUp size={14} /> Динамика
           </div>
        </div>

        <div className="h-64 w-full -ml-4">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#71717a'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#71717a'}} domain={['dataMin - 5', 'dataMax + 5']} width={30} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #27272a', color: '#f4f4f5'}}
                            itemStyle={{color: '#818cf8'}}
                        />
                        <Area type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-4"><Activity size={48} className="opacity-10" /></div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
