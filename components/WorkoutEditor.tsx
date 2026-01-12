
import React, { useState, useEffect, useMemo } from 'react';
import { Workout, Exercise, WorkoutType, WorkoutSet } from '../types';
import { Save, X, Plus, Trash, Scale, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';

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
  const [date, setDate] = useState(initialWorkout?.date || new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<WorkoutType>(initialWorkout?.type || 'A');
  const [userWeight, setUserWeight] = useState<string>(initialWorkout?.userWeight?.toString() || '');
  const [exercises, setExercises] = useState<Exercise[]>(initialWorkout?.exercises || []);
  const [newExerciseName, setNewExerciseName] = useState('');

  const allExerciseNames = useMemo(() => {
    const names = new Set<string>();
    workouts.forEach(w => w.exercises.forEach(e => {
      if (e.name) names.add(e.name.trim());
    }));
    Object.values(STATIC_TEMPLATES).flat().forEach(name => names.add(name));
    return Array.from(names).sort();
  }, [workouts]);

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
      if (!hasEnteredData || confirm(`Сменить на шаблон "${newType}"?`)) {
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
    onSave({
      id: initialWorkout?.id || Date.now().toString(),
      date,
      type,
      userWeight: userWeight ? parseFloat(userWeight.replace(',', '.')) : undefined,
      exercises
    });
  };

  return (
    <div className="space-y-6 pb-40 animate-in slide-in-from-right-4 duration-300">
      <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-zinc-400">{initialWorkout ? 'Редактирование' : 'Новый лог'}</h2>
          {!initialWorkout && (
            <button 
              onClick={() => loadTemplate(type)} 
              className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-1 active:opacity-50"
            >
              <RotateCcw size={12} /> Сбросить список
            </button>
          )}
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase">Дата</label>
            <input type="date" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-base font-bold text-zinc-100 outline-none focus:border-indigo-500" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="w-1/3 space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase text-center block">Тип</label>
            <div className="flex bg-zinc-800 rounded-xl p-1 border border-zinc-700">
              <button onClick={() => handleTypeChange('A')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'A' ? 'bg-zinc-100 text-indigo-600 shadow-md' : 'text-zinc-500'}`}>A</button>
              <button onClick={() => handleTypeChange('B')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'B' ? 'bg-zinc-100 text-emerald-600 shadow-md' : 'text-zinc-500'}`}>B</button>
            </div>
          </div>
        </div>
        <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-1"><Scale size={12} /> Вес тела (кг)</label>
            <input 
              type="text" 
              inputMode="decimal"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3.5 px-4 text-base font-bold text-zinc-100 outline-none focus:border-indigo-500" 
              value={userWeight} 
              onChange={(e) => setUserWeight(e.target.value)} 
              placeholder="0.0"
            />
        </div>
      </div>

      <div className="space-y-4">
        {exercises.map((exercise, index) => (
          <div key={exercise.id} className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl border-l-4 border-l-indigo-500/40">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 mr-2">
                <input
                  type="text"
                  className="font-bold text-zinc-100 bg-transparent border-b border-dashed border-zinc-700 focus:border-indigo-500 focus:outline-none py-1 w-full text-base"
                  value={exercise.name}
                  onChange={(e) => setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, name: e.target.value} : ex))}
                />
              </div>
              <div className="flex items-center gap-1">
                <div className="flex flex-col gap-0.5">
                  <button disabled={index === 0} onClick={() => moveExercise(index, 'up')} className={`p-1 rounded ${index === 0 ? 'text-zinc-800' : 'text-zinc-500'}`}><ChevronUp size={16} /></button>
                  <button disabled={index === exercises.length - 1} onClick={() => moveExercise(index, 'down')} className={`p-1 rounded ${index === exercises.length - 1 ? 'text-zinc-800' : 'text-zinc-500'}`}><ChevronDown size={16} /></button>
                </div>
                <button onClick={() => setExercises(exercises.filter(ex => ex.id !== exercise.id))} className="p-2 text-rose-500/50 active:text-rose-500"><Trash size={18} /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {exercise.sets.map((set, sIdx) => (
                <div key={sIdx} className="flex items-center gap-2">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-zinc-800 text-[11px] flex items-center justify-center font-bold text-zinc-500">{sIdx + 1}</div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input 
                      type="number" 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-3 text-base font-bold text-zinc-100 outline-none focus:bg-zinc-700/50"
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
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-3 text-base font-bold text-zinc-100 outline-none focus:bg-zinc-700/50"
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
                  <button onClick={() => setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, sets: ex.sets.filter((_, i) => i !== sIdx)} : ex))} className="p-2 text-zinc-700 active:text-zinc-400"><X size={16} /></button>
                </div>
              ))}
              <button onClick={() => setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, sets: [...ex.sets, {reps: 0, weight: 0}]} : ex))} className="w-full py-3 border border-dashed border-zinc-800 rounded-xl text-xs font-bold text-zinc-600 uppercase active:bg-zinc-800">+ Подход</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 rounded-3xl p-5 border border-dashed border-indigo-900/50 space-y-3">
        <input 
          type="text" 
          placeholder="Название упражнения..." 
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-4 px-4 text-base font-bold text-zinc-100 outline-none focus:border-indigo-500" 
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
          className="w-full py-4 bg-indigo-600/10 text-indigo-400 rounded-xl text-xs font-black uppercase tracking-widest active:bg-indigo-600/20 border border-indigo-500/20"
        >
          <Plus size={14} className="inline mr-2" /> Добавить в список
        </button>
      </div>

      <div className="fixed bottom-[90px] left-0 right-0 px-4 z-20 pointer-events-none">
        <div className="max-w-md mx-auto flex gap-3 pointer-events-auto">
          <button onClick={onCancel} className="flex-1 py-4 bg-zinc-900 text-zinc-400 rounded-2xl font-bold shadow-2xl border border-zinc-800 active:scale-95 transition-all">Отмена</button>
          <button onClick={handleSave} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"><Save size={18} /> Сохранить лог</button>
        </div>
      </div>
    </div>
  );
}

export default WorkoutEditor;
