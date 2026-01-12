
import React, { useState, useEffect } from 'react';
import { Workout } from '../types';
import { Trash2, Calendar, Search, Filter, Edit2, Copy, Check, AlertCircle } from 'lucide-react';

interface HistoryProps {
  workouts: Workout[];
  onDelete: (id: string) => void;
  onEdit: (workout: Workout) => void;
}

const WorkoutHistory: React.FC<HistoryProps> = ({ workouts, onDelete, onEdit }) => {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (confirmDeleteId) {
      const timer = setTimeout(() => setConfirmDeleteId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmDeleteId]);

  const filteredWorkouts = workouts.filter(w => 
    w.exercises.some(e => e.name.toLowerCase().includes(search.toLowerCase())) ||
    w.date.includes(search)
  );

  const copyToClipboard = (workout: Workout) => {
    const dateStr = new Date(workout.date).toLocaleDateString('ru-RU');
    let text = `${dateStr} - Тип ${workout.type}\n`;
    workout.exercises.forEach(ex => {
      text += `${ex.name} ${ex.sets.map(s => `${s.reps}х${s.weight}`).join(', ')}\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(workout.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="sticky top-[84px] bg-[#0a0a0a]/80 backdrop-blur-md pt-2 pb-3 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text"
            placeholder="Поиск..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-5">
        {filteredWorkouts.map((workout) => (
          <div key={workout.id} className="bg-zinc-900 rounded-[28px] border border-zinc-800 shadow-2xl transition-all overflow-hidden relative">
            <div className="p-4 pb-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/30">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm ${workout.type === 'A' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                  {workout.type}
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100 text-sm">День {workout.type}</h4>
                  <p className="text-[10px] text-zinc-500 flex items-center gap-1 font-semibold uppercase">
                    <Calendar size={10} />
                    {new Date(workout.date).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-1">
                <button onClick={() => copyToClipboard(workout)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${copiedId === workout.id ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {copiedId === workout.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button onClick={() => onEdit(workout)} className="w-8 h-8 text-zinc-500 rounded-lg flex items-center justify-center hover:text-indigo-400">
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => confirmDeleteId === workout.id ? onDelete(workout.id) : setConfirmDeleteId(workout.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${confirmDeleteId === workout.id ? 'text-rose-500 animate-pulse' : 'text-zinc-500 hover:text-rose-400'}`}
                >
                  {confirmDeleteId === workout.id ? <AlertCircle size={16} /> : <Trash2 size={15} />}
                </button>
              </div>
            </div>

            <div className="p-4 pt-3 space-y-4">
              {workout.exercises.map((ex, idx) => (
                <div key={idx}>
                  <h5 className="text-[13px] font-bold text-zinc-300 mb-1.5 flex items-center gap-2">
                    <span className="w-1 h-3 bg-zinc-700 rounded-full"></span>
                    {ex.name}
                  </h5>
                  <div className="flex flex-wrap gap-1.5 pl-3">
                    {ex.sets.map((set, sIdx) => (
                      <div key={sIdx} className="bg-zinc-800 border border-zinc-700 px-2 py-1.5 rounded-xl text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                        <span className="text-zinc-100">{set.reps}</span>
                        <span className="text-zinc-600">х</span>
                        <span className="text-indigo-400">{set.weight}кг</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutHistory;
