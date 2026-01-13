
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Workout, Exercise, WorkoutType, WorkoutSet } from '../types';
import { Save, X, Plus, Trash, Scale, Play, CheckCircle2, Target, TrendingUp } from 'lucide-react';
import { haptic } from '../App';

interface EditorProps {
  onSave: (workout: Workout) => void;
  onCancel: () => void;
  workouts: Workout[];
  initialWorkout?: Workout;
}

const STATIC_TEMPLATES: Record<WorkoutType, string[]> = {
  A: ['Жим в блоке в наклоне', 'Пресс в блоке', 'Жим в блоке горизонтально', 'Сгибание ног в блоке', 'Жим ногами в блоке', 'Разгибание ног в блоке', 'Икры в блоке', 'Трицепс в блоке (x/2)'],
  B: ['Пресс в блоке', 'Тяга в блоке вертикально (узким хватом)', 'Upper back', 'Бицепс в блоке сидя', 'Плечи в блоке сидя (разведение)', 'Плечи в блоке стоя (x/2)', 'Бицепс гантели', 'Плечи гантели (разведение)']
};

const WorkoutEditor: React.FC<EditorProps> = ({ onSave, onCancel, workouts, initialWorkout }) => {
  const [date, setDate] = useState(() => initialWorkout?.date || new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<WorkoutType>(initialWorkout?.type || 'A');
  const [userWeight, setUserWeight] = useState<string>(initialWorkout?.userWeight?.toString() || '');
  const [exercises, setExercises] = useState<Exercise[]>(initialWorkout?.exercises || []);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [isStarted, setIsStarted] = useState(!!initialWorkout);
  
  const startTimeRef = useRef<number>(Date.now());

  // При монтировании, если это новая тренировка, ставим актуальную дату
  useEffect(() => {
    if (!initialWorkout) {
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialWorkout]);

  // Умный расчет: Прогнозный максимум (1RM) и рекомендация
  const getSmartTarget = (name: string) => {
    const cleanName = name.trim().toLowerCase();
    const history = workouts.filter(w => w.exercises.some(e => e.name.trim().toLowerCase() === cleanName));
    if (history.length === 0) return null;

    const lastEx = history[0].exercises.find(e => e.name.trim().toLowerCase() === cleanName)!;
    // Находим лучший подход (по 1RM формуле Бржицки: weight / (1.0278 - (0.0278 * reps)))
    let best1RM = 0;
    let lastMaxWeight = 0;
    let lastRepsAtMax = 0;

    lastEx.sets.forEach(s => {
      if (s.reps > 0) {
        const oneRM = s.weight / (1.0278 - (0.0278 * s.reps));
        if (oneRM > best1RM) best1RM = oneRM;
      }
      if (s.weight >= lastMaxWeight) {
        lastMaxWeight = s.weight;
        lastRepsAtMax = s.reps;
      }
    });

    // Рекомендация: если сделал 10+ повторов, добавляем вес. Иначе закрепляем.
    const targetWeight = lastRepsAtMax >= 10 ? lastMaxWeight + 2.5 : lastMaxWeight;
    return { targetWeight, oneRM: Math.round(best1RM), isProgress: lastRepsAtMax >= 10 };
  };

  const loadTemplate = (selectedType: WorkoutType) => {
    const templateNames = STATIC_TEMPLATES[selectedType];
    const newExercises: Exercise[] = templateNames.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      sets: [{ reps: 0, weight: 0 }] // Всегда 1 подход по умолчанию
    }));
    setExercises(newExercises);
  };

  useEffect(() => {
    if (!initialWorkout && exercises.length === 0) {
      const last = workouts[0];
      const nextType = last ? (last.type === 'A' ? 'B' : 'A') : 'A';
      setType(nextType);
      loadTemplate(nextType);
    }
  }, []);

  const handleStart = () => {
    haptic(50); // Сильная вибрация при старте
    startTimeRef.current = Date.now();
    setIsStarted(true);
  };

  const handleSave = () => {
    if (!isStarted) return;
    if (exercises.length === 0) return;
    haptic([20, 50, 20]); // Особая вибрация при успешном завершении
    const durationMs = Date.now() - startTimeRef.current;
    onSave({
      id: initialWorkout?.id || Date.now().toString(),
      date,
      type,
      userWeight: userWeight ? parseFloat(userWeight.replace(',', '.')) : undefined,
      exercises,
      duration: initialWorkout?.duration || Math.max(1, Math.round(durationMs / 60000))
    });
  };

  return (
    <div className="space-y-4 pb-12 animate-in slide-in-from-right-4 duration-300 overflow-x-hidden">
      {/* Шапка: Исправлено перекрытие на мобильных */}
      <div className="bg-zinc-900 rounded-[24px] p-4 border border-zinc-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input 
            type="date" 
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-3 text-[11px] font-bold text-zinc-100 outline-none flex-[1.5]" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
          <div className="flex bg-zinc-800 rounded-xl p-1 border border-zinc-700 h-[38px] flex-1">
            <button onClick={() => { haptic(10); setType('A'); loadTemplate('A'); }} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${type === 'A' ? 'bg-indigo-600 text-white' : 'text-zinc-500'}`}>A</button>
            <button onClick={() => { haptic(10); setType('B'); loadTemplate('B'); }} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${type === 'B' ? 'bg-emerald-600 text-white' : 'text-zinc-500'}`}>B</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={12} />
            <input 
              type="text" 
              inputMode="decimal" 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 pl-8 pr-2 text-[11px] font-bold text-zinc-100 outline-none placeholder:text-zinc-600" 
              value={userWeight} 
              onChange={(e) => setUserWeight(e.target.value)} 
              placeholder="Вес тела" 
            />
          </div>
          {!isStarted ? (
            <button onClick={handleStart} className="w-full bg-indigo-600 text-white rounded-xl py-2 px-2 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all">
              <Play size={12} fill="currentColor" /> Начать
            </button>
          ) : (
            <div className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl py-2 px-2 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
              <CheckCircle2 size={12} /> Тренировка...
            </div>
          )}
        </div>
      </div>

      {/* Список упражнений */}
      <div className={`space-y-4 transition-all duration-300 ${!isStarted ? 'opacity-30 blur-[2px] pointer-events-none' : 'opacity-100'}`}>
        {exercises.map((exercise) => {
          const smart = getSmartTarget(exercise.name);
          return (
            <div key={exercise.id} className="bg-zinc-900 rounded-[28px] p-4 border border-zinc-800 shadow-md relative overflow-hidden group">
              <div className="flex justify-between items-start mb-3 gap-2">
                <div className="min-w-0 flex-1">
                  <input 
                    type="text" 
                    className="font-black text-white bg-transparent focus:outline-none w-full text-sm mb-0.5 truncate" 
                    value={exercise.name} 
                    onChange={(e) => setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, name: e.target.value} : ex))} 
                  />
                  {smart && (
                    <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                      <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${smart.isProgress ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                        Цель: {smart.targetWeight}кг
                      </span>
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter flex items-center gap-0.5">
                        <TrendingUp size={8} /> Max: {smart.oneRM}кг
                      </span>
                    </div>
                  )}
                </div>
                <button onClick={() => { haptic([30, 20]); setExercises(exercises.filter(ex => ex.id !== exercise.id)); }} className="p-1 text-zinc-800 active:text-rose-500 transition-colors shrink-0">
                  <Trash size={15} />
                </button>
              </div>
              
              <div className="space-y-2">
                {exercise.sets.map((set, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-1.5">
                    <div className="w-5 text-[9px] font-black text-zinc-700 text-center shrink-0">
                      {sIdx + 1}
                    </div>
                    {/* Инпуты с min-w-0 и flex-1 гарантируют, что они займут всё место, но не вылезут */}
                    <input 
                      type="number" 
                      inputMode="numeric"
                      className="min-w-0 flex-1 bg-zinc-800 border border-zinc-700 rounded-lg py-2 text-center text-[12px] font-bold text-zinc-100 outline-none focus:border-indigo-500/50" 
                      value={set.reps || ''} 
                      placeholder="Повт" 
                      onChange={(e) => {
                        const newSets = [...exercise.sets];
                        newSets[sIdx] = {...newSets[sIdx], reps: parseInt(e.target.value) || 0};
                        setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, sets: newSets} : ex));
                      }} 
                    />
                    <input 
                      type="text" 
                      inputMode="decimal" 
                      className="min-w-0 flex-1 bg-zinc-800 border border-zinc-700 rounded-lg py-2 text-center text-[12px] font-bold text-zinc-100 outline-none focus:border-indigo-500/50" 
                      value={set.weight || ''} 
                      placeholder="КГ" 
                      onChange={(e) => {
                        const newSets = [...exercise.sets];
                        newSets[sIdx] = {...newSets[sIdx], weight: parseFloat(e.target.value.replace(',','.')) || 0};
                        setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, sets: newSets} : ex));
                      }} 
                    />
                    <button onClick={() => { haptic(5); setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, sets: ex.sets.filter((_, i) => i !== sIdx)} : ex)); }} className="p-1 text-zinc-800 active:text-rose-500 shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => { haptic(10); setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, sets: [...ex.sets, {reps: 0, weight: 0}]} : ex)); }} className="w-full py-2 bg-zinc-800/30 border border-dashed border-zinc-800/50 rounded-lg text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] active:bg-zinc-800 transition-all">
                  + Подход
                </button>
              </div>
            </div>
          );
        })}
        
        <div className="bg-zinc-900 rounded-[20px] p-4 border border-dashed border-zinc-800">
          <input 
            type="text" 
            placeholder="Другое упражнение..." 
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-xs font-bold text-zinc-100 mb-3 outline-none" 
            value={newExerciseName} 
            onChange={(e) => setNewExerciseName(e.target.value)} 
          />
          <button 
            onClick={() => { if(newExerciseName) { setExercises(prev => [...prev, {id: Math.random().toString(36).substr(2, 9), name: newExerciseName, sets: [{reps: 0, weight: 0}]}]); setNewExerciseName(''); haptic(15); } }} 
            className="w-full py-3 bg-zinc-800 text-zinc-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-zinc-700 active:scale-95 transition-all"
          >
            + В список
          </button>
        </div>

        <div className="flex gap-3 pt-4 pb-10">
          <button onClick={() => { haptic([40, 40]); onCancel(); }} className="flex-1 py-4 bg-zinc-900 text-zinc-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-zinc-800">Отмена</button>
          <button onClick={handleSave} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Завершить</button>
        </div>
      </div>
    </div>
  );
}

export default WorkoutEditor;
