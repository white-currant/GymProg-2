
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Workout, Exercise, WorkoutType, WorkoutSet } from '../types';
import { Save, X, Plus, Trash, Scale, RotateCcw, ChevronUp, ChevronDown, Play, CheckCircle2, Target } from 'lucide-react';
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

  const getRecommendation = (name: string) => {
    const cleanName = name.trim().toLowerCase();
    const history = workouts.filter(w => w.exercises.some(e => e.name.trim().toLowerCase() === cleanName));
    if (history.length === 0) return null;

    const lastEx = history[0].exercises.find(e => e.name.trim().toLowerCase() === cleanName)!;
    const lastMaxWeight = Math.max(...lastEx.sets.map(s => s.weight));
    const lastBestReps = Math.max(...lastEx.sets.filter(s => s.weight === lastMaxWeight).map(s => s.reps));

    if (lastBestReps >= 10) {
        return { weight: lastMaxWeight + 2.5, reason: "+2.5кг" };
    }
    return { weight: lastMaxWeight, reason: "закрепить" };
  };

  const loadTemplate = (selectedType: WorkoutType) => {
    const templateNames = STATIC_TEMPLATES[selectedType];
    const newExercises: Exercise[] = templateNames.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      sets: [{ reps: 0, weight: 0 }]
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
    haptic([30, 20]);
    startTimeRef.current = Date.now();
    setIsStarted(true);
  };

  const handleSave = () => {
    if (!isStarted) return alert('Сначала начните тренировку');
    if (exercises.length === 0) return alert('Добавьте упражнения');
    haptic([20, 50]);
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
    <div className="space-y-4 pb-12 animate-in slide-in-from-right-4 duration-300">
      <div className="bg-zinc-900 rounded-[28px] p-4 border border-zinc-800 shadow-xl space-y-3">
        <div className="grid grid-cols-[1.5fr_1fr] gap-2">
          <input 
            type="date" 
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-3 text-[11px] font-bold text-zinc-100 outline-none" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
          <div className="flex bg-zinc-800 rounded-xl p-1 border border-zinc-700 h-[38px]">
            <button onClick={() => { haptic(10); setType('A'); loadTemplate('A'); }} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${type === 'A' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500'}`}>A</button>
            <button onClick={() => { haptic(10); setType('B'); loadTemplate('B'); }} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${type === 'B' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500'}`}>B</button>
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
            <div className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl py-2 px-2 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5">
              <CheckCircle2 size={12} /> В процессе
            </div>
          )}
        </div>
      </div>

      <div className={`space-y-4 transition-opacity duration-300 ${!isStarted ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
        {exercises.map((exercise) => {
          const rec = getRecommendation(exercise.name);
          return (
            <div key={exercise.id} className="bg-zinc-900 rounded-[30px] p-4 border border-zinc-800 shadow-lg relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="flex-1 min-w-0">
                  <input 
                    type="text" 
                    className="font-black text-white bg-transparent focus:outline-none w-full text-base mb-0.5 truncate" 
                    value={exercise.name} 
                    onChange={(e) => setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, name: e.target.value} : ex))} 
                  />
                  {rec && (
                    <div className="flex items-center gap-1 text-[9px] font-black text-indigo-400 uppercase tracking-tighter">
                      <Target size={10} className="shrink-0" /> Цель: {rec.weight}кг ({rec.reason})
                    </div>
                  )}
                </div>
                <button onClick={() => { haptic(5); setExercises(exercises.filter(ex => ex.id !== exercise.id)); }} className="p-1 text-zinc-700 active:text-rose-500 transition-colors shrink-0 mt-1">
                  <Trash size={16} />
                </button>
              </div>
              
              <div className="space-y-2">
                {exercise.sets.map((set, sIdx) => (
                  <div key={sIdx} className="grid grid-cols-[24px_1fr_1fr_24px] items-center gap-1.5">
                    <div className="text-[10px] flex items-center justify-center font-black text-zinc-700">
                      {sIdx + 1}
                    </div>
                    <input 
                      type="number" 
                      inputMode="numeric"
                      className="w-full min-w-0 bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-1 text-center text-sm font-bold text-zinc-100 outline-none focus:border-indigo-500/50 transition-colors" 
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
                      className="w-full min-w-0 bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-1 text-center text-sm font-bold text-zinc-100 outline-none focus:border-indigo-500/50 transition-colors" 
                      value={set.weight || ''} 
                      placeholder="КГ" 
                      onChange={(e) => {
                        const newSets = [...exercise.sets];
                        newSets[sIdx] = {...newSets[sIdx], weight: parseFloat(e.target.value.replace(',','.')) || 0};
                        setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, sets: newSets} : ex));
                      }} 
                    />
                    <button onClick={() => { haptic(2); setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, sets: ex.sets.filter((_, i) => i !== sIdx)} : ex)); }} className="flex items-center justify-center text-zinc-800 active:text-rose-500">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={() => { haptic(5); setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, sets: [...ex.sets, {reps: 0, weight: 0}]} : ex)); }} className="w-full py-2.5 bg-zinc-800/30 border border-dashed border-zinc-800/50 rounded-xl text-[9px] font-black text-zinc-600 uppercase tracking-widest active:bg-zinc-800 transition-all mt-1">
                  + Подход
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isStarted && (
        <>
          <div className="bg-zinc-900 rounded-[24px] p-4 border border-dashed border-zinc-800 mt-2">
            <input 
              type="text" 
              placeholder="Новое упражнение..." 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-sm font-bold text-zinc-100 mb-3 outline-none" 
              value={newExerciseName} 
              onChange={(e) => setNewExerciseName(e.target.value)} 
            />
            <button 
              onClick={() => { if(newExerciseName) { setExercises(prev => [...prev, {id: Math.random().toString(36).substr(2, 9), name: newExerciseName, sets: [{reps: 0, weight: 0}]}]); setNewExerciseName(''); haptic(10); } }} 
              className="w-full py-3 bg-zinc-800 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-700 active:scale-95 transition-all"
            >
              + Добавить в план
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={() => { haptic([40, 40]); onCancel(); }} className="flex-1 py-4 bg-zinc-900 text-zinc-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-zinc-800 active:bg-zinc-800 transition-all">Отмена</button>
            <button onClick={handleSave} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] active:scale-95 transition-all">Завершить</button>
          </div>
        </>
      )}
    </div>
  );
}

export default WorkoutEditor;
