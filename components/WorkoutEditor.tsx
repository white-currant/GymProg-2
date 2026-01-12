
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Workout, Exercise, WorkoutType, WorkoutSet } from '../types';
import { Save, X, Plus, Trash, Scale, RotateCcw, ChevronUp, ChevronDown, Clock, Calendar } from 'lucide-react';

interface EditorProps {
  onSave: (workout: Workout) => void;
  onCancel: () => void;
  workouts: Workout[];
  initialWorkout?: Workout;
}

const STATIC_TEMPLATES: Record<WorkoutType, string[]> = {
  A: [
    'Жим в блоке в наклоне',
    'Пресс в блоке',
    'Жим в блоке горизонтально',
    'Сгибание ног в блоке',
    'Жим ногами в блоке',
    'Разгибание ног в блоке',
    'Икры в блоке',
    'Трицепс в блоке (x/2)'
  ],
  B: [
    'Пресс в блоке',
    'Тяга в блоке вертикально (узким хватом)',
    'Upper back',
    'Бицепс в блоке сидя',
    'Плечи в блоке сидя (разведение)',
    'Плечи в блоке стоя (x/2)',
    'Бицепс гантели',
    'Плечи гантели (разведение)'
  ]
};

const WorkoutEditor: React.FC<EditorProps> = ({ onSave, onCancel, workouts, initialWorkout }) => {
  const [date, setDate] = useState(() => initialWorkout?.date || new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<WorkoutType>(initialWorkout?.type || 'A');
  const [userWeight, setUserWeight] = useState<string>(initialWorkout?.userWeight?.toString() || '');
  const [exercises, setExercises] = useState<Exercise[]>(initialWorkout?.exercises || []);
  const [newExerciseName, setNewExerciseName] = useState('');
  
  const startTimeRef = useRef<number>(Date.now());

  const getLastSetsForExercise = (name: string): WorkoutSet[] => {
    const cleanName = name.trim();
    const minSets = cleanName === 'Жим в блоке горизонтально' ? 4 : 1;

    for (const workout of workouts) {
      const found = workout.exercises.find(e => e.name.trim().toLowerCase() === cleanName.toLowerCase());
      if (found && found.sets.length > 0) {
        let setsCount = found.sets.length;
        if (cleanName === 'Жим в блоке горизонтально' && setsCount < 4) {
          setsCount = 4;
        }
        return Array(setsCount).fill(null).map(() => ({ reps: 0, weight: 0 }));
      }
    }
    return Array(minSets).fill(null).map(() => ({ reps: 0, weight: 0 }));
  };

  const loadTemplate = (selectedType: WorkoutType) => {
    const templateNames = STATIC_TEMPLATES[selectedType];
    const newExercises: Exercise[] = templateNames.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      sets: getLastSetsForExercise(name)
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

  const handleTypeChange = (newType: WorkoutType) => {
    if (newType === type) return;
    if (!initialWorkout) {
      const hasEnteredData = exercises.some(ex => ex.sets.some(s => s.reps > 0 || s.weight > 0));
      if (!hasEnteredData || confirm(`Сменить шаблон на "${newType}"?`)) {
        setType(newType);
        loadTemplate(newType);
      }
    } else {
      setType(newType);
    }
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newExercises.length) return;
    const temp = newExercises[index];
    newExercises[index] = newExercises[targetIndex];
    newExercises[targetIndex] = temp;
    setExercises(newExercises);
  };

  const handleSave = () => {
    if (exercises.length === 0) return alert('Добавьте упражнения');
    const durationMs = Date.now() - startTimeRef.current;
    const durationMin = Math.max(1, Math.round(durationMs / 60000));

    onSave({
      id: initialWorkout?.id || Date.now().toString(),
      date,
      type,
      userWeight: userWeight ? parseFloat(userWeight.replace(',', '.')) : undefined,
      exercises,
      duration: initialWorkout?.duration || durationMin
    });
  };

  return (
    <div className="space-y-4 pb-10 animate-in slide-in-from-right-4 duration-300">
      {/* Переработанный компактный заголовок */}
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-[24px] p-3 border border-zinc-800 shadow-xl space-y-3">
        <div className="grid grid-cols-12 gap-2">
          {/* Блок даты */}
          <div className="col-span-6 space-y-1">
            <label className="text-[8px] font-black text-zinc-500 uppercase flex items-center gap-1 ml-1">
              <Calendar size={10} /> Дата
            </label>
            <input 
              type="date" 
              className="w-full bg-zinc-800/80 border border-zinc-700/50 rounded-xl py-2 px-2 text-sm font-bold text-zinc-100 outline-none focus:border-indigo-500 transition-colors" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>

          {/* Блок типа тренировки */}
          <div className="col-span-4 space-y-1">
            <label className="text-[8px] font-black text-zinc-500 uppercase block text-center">Тип</label>
            <div className="flex bg-zinc-800/80 rounded-xl p-0.5 border border-zinc-700/50 h-[38px]">
              <button onClick={() => handleTypeChange('A')} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${type === 'A' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-zinc-500'}`}>A</button>
              <button onClick={() => handleTypeChange('B')} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${type === 'B' ? 'bg-white text-emerald-600 shadow-md scale-105' : 'text-zinc-500'}`}>B</button>
            </div>
          </div>

          {/* Кнопка сброса */}
          <div className="col-span-2 flex flex-col justify-end">
            <button 
                onClick={() => loadTemplate(type)} 
                className="h-[38px] w-full flex items-center justify-center bg-zinc-800/80 text-zinc-500 rounded-xl border border-zinc-700/50 active:text-indigo-400 active:scale-90 transition-all"
                title="Сбросить список"
              >
                <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Блок веса тела */}
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
              <Scale size={14} />
            </div>
            <input 
              type="text" 
              inputMode="decimal"
              className="w-full bg-zinc-800/50 border border-zinc-700/30 rounded-xl py-2 pl-9 pr-4 text-sm font-bold text-zinc-100 outline-none focus:border-indigo-500/50 transition-all" 
              value={userWeight} 
              onChange={(e) => setUserWeight(e.target.value)} 
              placeholder="Вес тела (кг)"
            />
        </div>
      </div>

      <div className="space-y-4">
        {exercises.map((exercise, index) => (
          <div key={exercise.id} className="bg-zinc-900 rounded-[28px] p-4 border border-zinc-800 shadow-lg border-l-4 border-l-indigo-500/30">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 mr-2">
                <input
                  type="text"
                  className="font-bold text-zinc-100 bg-transparent border-b border-dashed border-zinc-800 focus:border-indigo-500 focus:outline-none py-1 w-full text-base"
                  value={exercise.name}
                  onChange={(e) => setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, name: e.target.value} : ex))}
                />
              </div>
              <div className="flex items-center gap-0.5">
                <button disabled={index === 0} onClick={() => moveExercise(index, 'up')} className={`p-1.5 ${index === 0 ? 'text-zinc-800' : 'text-zinc-500'}`}><ChevronUp size={16} /></button>
                <button disabled={index === exercises.length - 1} onClick={() => moveExercise(index, 'down')} className={`p-1.5 ${index === exercises.length - 1 ? 'text-zinc-800' : 'text-zinc-500'}`}><ChevronDown size={16} /></button>
                <button onClick={() => setExercises(exercises.filter(ex => ex.id !== exercise.id))} className="p-1.5 text-rose-500/30 active:text-rose-500 ml-1"><Trash size={16} /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5">
              {exercise.sets.map((set, sIdx) => (
                <div key={sIdx} className="flex items-center gap-2">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-zinc-800 text-[10px] flex items-center justify-center font-black text-zinc-500 border border-zinc-700">{sIdx + 1}</div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input 
                      type="number" 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-base font-bold text-zinc-100 outline-none focus:bg-zinc-700/50"
                      value={set.reps || ''} placeholder="Повт"
                      onChange={(e) => setExercises(exercises.map(ex => {
                        if (ex.id === exercise.id) {
                          const newSets = [...ex.sets];
                          newSets[sIdx] = {...newSets[sIdx], reps: parseInt(e.target.value) || 0};
                          return {...ex, sets: newSets};
                        }
                        return ex;
                      }))}
                    />
                    <input 
                      type="text" inputMode="decimal"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-base font-bold text-zinc-100 outline-none focus:bg-zinc-700/50"
                      value={set.weight || ''} placeholder="КГ"
                      onChange={(e) => setExercises(exercises.map(ex => {
                        if (ex.id === exercise.id) {
                          const newSets = [...ex.sets];
                          newSets[sIdx] = {...newSets[sIdx], weight: parseFloat(e.target.value.replace(',','.')) || 0};
                          return {...ex, sets: newSets};
                        }
                        return ex;
                      }))}
                    />
                  </div>
                  <button onClick={() => setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, sets: ex.sets.filter((_, i) => i !== sIdx)} : ex))} className="p-1.5 text-zinc-700 active:text-zinc-400"><X size={16} /></button>
                </div>
              ))}
              <button onClick={() => setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, sets: [...ex.sets, {reps: 0, weight: 0}]} : ex))} className="w-full py-2.5 border border-dashed border-zinc-800 rounded-lg text-[10px] font-black text-zinc-600 uppercase active:bg-zinc-800 transition-all">+ Подход</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 rounded-[24px] p-4 border border-dashed border-indigo-900/30 space-y-3">
        <input 
          type="text" 
          placeholder="Новое упражнение..." 
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 px-4 text-base font-bold text-zinc-100 outline-none focus:border-indigo-500" 
          value={newExerciseName} 
          onChange={(e) => setNewExerciseName(e.target.value)} 
        />
        <button 
          onClick={() => { 
            if(newExerciseName) { 
              setExercises(prev => [...prev, {id: Math.random().toString(36).substr(2, 9), name: newExerciseName, sets: getLastSetsForExercise(newExerciseName)}]); 
              setNewExerciseName(''); 
            } 
          }} 
          className="w-full py-3 bg-indigo-600/10 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest active:bg-indigo-600/20 border border-indigo-500/20"
        >
          <Plus size={14} className="inline mr-1" /> Добавить
        </button>
      </div>

      <div className="flex gap-3 pt-6 pb-12">
        <button 
          onClick={onCancel} 
          className="flex-1 py-4 bg-zinc-900 text-zinc-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-zinc-800 active:scale-95 transition-all"
        >
          Отмена
        </button>
        <button 
          onClick={handleSave} 
          className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Save size={18} /> Сохранить
        </button>
      </div>
    </div>
  );
}

export default WorkoutEditor;
