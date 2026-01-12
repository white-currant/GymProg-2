
import React, { useMemo } from 'react';
import { Workout, Exercise } from '../types';
import { TrendingUp, BarChart, ArrowUpRight, Award, Flame, Zap, Target, Info } from 'lucide-react';

interface DashboardProps {
  workouts: Workout[];
  onAddClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ workouts, onAddClick }) => {
  const lastWorkout = workouts[0];
  const workoutCount = workouts.length;

  const strengthAnalysis = useMemo(() => {
    if (workouts.length < 2 || !lastWorkout) return null;
    const currentType = lastWorkout.type;
    const sameTypeWorkouts = workouts.slice(1).filter(w => w.type === currentType);
    if (sameTypeWorkouts.length === 0) return null;

    let improvedCount = 0;
    let totalProgressPercent = 0;
    let exercisesCompared = 0;

    lastWorkout.exercises.forEach(currentEx => {
      let prevEx: Exercise | undefined;
      for (const prevWorkout of sameTypeWorkouts) {
        prevEx = prevWorkout.exercises.find(e => e.name === currentEx.name);
        if (prevEx) break;
      }

      if (prevEx) {
        const currentMaxWeight = Math.max(...currentEx.sets.map(s => s.weight));
        const prevMaxWeight = Math.max(...prevEx.sets.map(s => s.weight));
        const currentBestReps = Math.max(...currentEx.sets.filter(s => s.weight === currentMaxWeight).map(s => s.reps));
        const prevBestReps = Math.max(...prevEx.sets.filter(s => s.weight === prevMaxWeight).map(s => s.reps));

        if (currentMaxWeight > prevMaxWeight || (currentMaxWeight === prevMaxWeight && currentBestReps > prevBestReps)) {
          improvedCount++;
        }
        if (prevMaxWeight > 0) {
          totalProgressPercent += ((currentMaxWeight - prevMaxWeight) / prevMaxWeight) * 100;
          exercisesCompared++;
        }
      }
    });

    return {
      avgStrengthGain: exercisesCompared > 0 ? (totalProgressPercent / exercisesCompared).toFixed(1) : "0",
      improvedCount,
      totalExercises: lastWorkout.exercises.length,
      currentType
    };
  }, [workouts, lastWorkout]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {strengthAnalysis ? (
        <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl opacity-60"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Flame size={20} />
                </div>
                <div>
                  <h3 className="font-black text-zinc-100 text-lg leading-tight">Анализ прогресса</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">День {strengthAnalysis.currentType}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 text-sm font-black px-3 py-1.5 rounded-2xl ${parseFloat(strengthAnalysis.avgStrengthGain) > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {parseFloat(strengthAnalysis.avgStrengthGain) > 0 ? <ArrowUpRight size={16} /> : <Zap size={16} />}
                {strengthAnalysis.avgStrengthGain}%
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Award size={12} className="text-orange-400" /> Рекорды
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-zinc-100">{strengthAnalysis.improvedCount}</span>
                  <span className="text-sm font-bold text-zinc-600">/ {strengthAnalysis.totalExercises}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-indigo-400" /> Индекс
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl font-black ${parseFloat(strengthAnalysis.avgStrengthGain) > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {parseFloat(strengthAnalysis.avgStrengthGain) > 0 ? `+${strengthAnalysis.avgStrengthGain}` : strengthAnalysis.avgStrengthGain}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-[32px] p-8 border border-zinc-800 shadow-sm flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-3xl flex items-center justify-center text-zinc-700">
                <Info size={32} />
            </div>
            <h3 className="font-bold text-zinc-400">Копим данные...</h3>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-[28px] p-5 border border-zinc-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-600/5 blur-2xl rounded-full"></div>
          <Zap className="mb-3 text-indigo-400" size={24} />
          <p className="text-3xl font-black text-zinc-100">{workoutCount}</p>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Тренировок</p>
        </div>
        <div className="bg-zinc-900 rounded-[28px] p-5 border border-zinc-800 shadow-sm">
          <Target className="mb-3 text-emerald-400" size={24} />
          <p className="text-3xl font-black text-zinc-100">{lastWorkout?.userWeight || '?'}</p>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Вес тела (кг)</p>
        </div>
      </div>

      <div className="bg-indigo-600 rounded-[32px] p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
            <BarChart size={20} className="text-indigo-200" />
          </div>
          <h4 className="font-black text-sm uppercase tracking-wider">Вердикт</h4>
        </div>
        
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 mb-4">
          <p className="text-xs leading-relaxed font-medium">
            {workoutCount < 3 
              ? "Старт взят! Главное — техника и регулярность."
              : strengthAnalysis && strengthAnalysis.improvedCount >= strengthAnalysis.totalExercises / 2
                ? "Прогрессивная перегрузка зафиксирована. Продолжайте в том же темпе!"
                : "Силовые на плато. Попробуйте увеличить время отдыха или калорийность."}
          </p>
        </div>

        <button 
          onClick={onAddClick}
          className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-[0.1em] hover:bg-zinc-100 transition-all active:scale-95 shadow-sm"
        >
          Записать тренировку
        </button>
      </div>

      <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 flex gap-4">
        <div className="bg-zinc-800 rounded-2xl p-2.5 h-fit">
          <Award className="text-orange-500" size={20} />
        </div>
        <div>
          <h4 className="font-black text-zinc-100 text-[10px] uppercase tracking-wider mb-1">Совет дня</h4>
          <p className="text-zinc-500 text-[11px] leading-snug font-medium">
            Для роста мышц важно не количество упражнений, а близость к отказу. Оставляйте 1-2 повторения в запасе.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
