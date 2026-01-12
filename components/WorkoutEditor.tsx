
import React, { useState, useEffect, useMemo } from 'react';
import { Workout, Exercise, WorkoutType, Set } from '../types';
import { Save, X, Plus, Trash, Scale, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';

interface EditorProps {
  onSave: (workout: Workout) => void;
  onCancel: () => void;
  workouts: Workout[];
  initialWorkout?: Workout;
}

// Заранее определенные списки упражнений по просьбе пользователя
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

  // Все уникальные названия для подсказок
  const allExerciseNames = useMemo(() => {
    const names = new Set<string>();
    workouts.forEach(w => w.exercises.forEach(e => {
      if (e.name) names.add(e.name.trim());
    }));
    // Добавляем названия из шаблонов, если их еще нет в истории
    Object.values(STATIC_TEMPLATES).flat().forEach(name => names.add(name));
    return Array.from(names).sort();
  }, [workouts]);

  // Функция поиска последних весов для конкретного названия упражнения
  const getLastSetsForExercise = (name: string): Set[] => {
    const cleanName = name.trim();
    // По просьбе пользователя: для жима горизонтально минимум 4 подхода
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

  // Загрузка шаблона
  const loadTemplate = (selectedType: WorkoutType) => {
    const templateNames = STATIC_TEMPLATES[selectedType];
    const newExercises: Exercise[] = templateNames.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      sets: getLastSetsForExercise(name)
    }));
    setExercises(newExercises);
  };

  // Инициализация при создании новой тренировки
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
      if (!hasEnteredData || confirm(`Сменить на шаблон "${newType}"? Текущие изменения в списке будут удалены.`)) {
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
    <div className="space-y-6 pb-12 animate-in slide-in-from-right-4 duration-300">
      <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-zinc-400">{initialWorkout ? 'Редактирование' : 'Новый лог'}</h2>
          {!initialWorkout && (
            <button 
              onClick={() => loadTemplate(type)} 
              className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-1 hover:text-indigo-300 transition-colors"
            >
              <RotateCcw size={12} /> Сбросить список
            </button>
          )}
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase">Дата</label>
            <input type="date" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-sm font-bold text-zinc-100 outline-none focus:border-indigo-500" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="w-1/3 space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase text-center block">Тип</label>
            <div className="flex bg-zinc-800 rounded-xl p-1 border border-zinc-700">
              <button onClick={() => handleTypeChange('A')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'A' ? 'bg-zinc-100 text-indigo-600 shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>A</button>
              <button onClick={() => handleTypeChange('B')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'B' ? 'bg-zinc-100 text-emerald-600 shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>B</button>
            </div>
          </div>
        </div>
        <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-1"><Scale size={12} /> Вес тела (кг)</label>
            <input 
              type="text" 
              inputMode="decimal"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-sm font-bold text-zinc-100 outline-none focus:border-indigo-500" 
              value={userWeight} 
              onChange={(e) => setUserWeight(e.target.value)} 
              placeholder="0.0"
            />
        </div>
      </div>

      <div className="space-y-4">
        {exercises.map((exercise, index) => (
          <div key={exercise.id} className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl border-l-4 border-l-indigo-500/40 transition-all">
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  list="exercise-suggestions"
                  className="font-bold text-zinc-100 bg-transparent border-b border-dashed border-zinc-700 focus:border-indigo-500 focus:outline-none py-1 w-full mr-4 text-sm"
                  value={exercise.name}
                  onChange={(e) => setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, name: e.target.value} : ex))}
                />
              </div>
              <div className="flex items-center gap-1 ml-2">
                <div className="flex flex-col gap-0.5">
                  <button 
                    disabled={index === 0}
                    onClick={() => moveExercise(index, 'up')} 
                    className={`p-1 rounded hover:bg-zinc-800 transition-colors ${index === 0 ? 'text-zinc-800' : 'text-zinc-500 hover:text-indigo-400'}`}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button 
                    disabled={index === exercises.length - 1}
                    onClick={() => moveExercise(index, 'down')} 
                    className={`p-1 rounded hover:bg-zinc-800 transition-colors ${index === exercises.length - 1 ? 'text-zinc-800' : 'text-zinc-500 hover:text-indigo-400'}`}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <button onClick={() => setExercises(exercises.filter(ex => ex.id !== exercise.id))} className="p-2 text-zinc-700 hover:text-rose-500 transition-colors"><Trash size={16} /></button>
              </div>
            </div>
            
            <div className="space-y-3">
              {exercise.sets.map((set, sIdx) => (
                <div key={sIdx} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 text-[10px] flex items-center justify-center font-bold text-zinc-600">{sIdx + 1}</div>
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="number" 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-xs font-bold text-zinc-100 outline-none focus:border-indigo-500/50"
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
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-xs font-bold text-zinc-100 outline-none focus:border-indigo-500/50"
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
                  <button onClick={() => setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, sets: ex.sets.filter((_, i) => i !== sIdx)} : ex))} className="text-zinc-800 hover:text-zinc-500"><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => setExercises(exercises.map(ex => ex.id === exercise.id ? {...ex, sets: [...ex.sets, {reps: 0, weight: 0}]} : ex))} className="w-full py-2 border border-dashed border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-600 uppercase hover:text-zinc-400 transition-colors">+ Подход</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 rounded-3xl p-5 border border-dashed border-indigo-900/50 flex flex-col gap-3">
        <div className="relative">
          <input 
            type="text" 
            list="exercise-suggestions"
            placeholder="Название нового упражнения..." 
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-sm font-bold text-zinc-100 outline-none focus:border-indigo-500" 
            value={newExerciseName} 
            onChange={(e) => setNewExerciseName(e.target.value)} 
          />
          <datalist id="exercise-suggestions">
            {allExerciseNames.map(name => <option key={name} value={name} />)}
          </datalist>
        </div>
        <button 
          onClick={() => { 
            if(newExerciseName) { 
              setExercises(prev => [...prev, {id: Math.random().toString(36).substr(2, 9), name: newExerciseName, sets: getLastSetsForExercise(newExerciseName)}]); 
              setNewExerciseName(''); 
            } 
          }} 
          className="w-full py-3 bg-indigo-600/10 text-indigo-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600/20 transition-all border border-indigo-500/20"
        >
          <Plus size={14} className="inline mr-2" /> Добавить в список
        </button>
      </div>

      <div className="flex gap-4 pt-4 sticky bottom-20 z-10 pb-4">
        <button onClick={onCancel} className="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-bold active:scale-95 transition-all shadow-lg border border-zinc-700">Отмена</button>
        <button onClick={handleSave} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-[0_8px_30px_rgb(79,70,229,0.4)] flex items-center justify-center gap-2 active:scale-95 transition-all"><Save size={18} /> Сохранить лог</button>
      </div>
      
      {/* Скрытый datalist для основного списка подсказок */}
      <datalist id="exercise-suggestions">
        {allExerciseNames.map(name => <option key={name} value={name} />)}
      </datalist>
    </div>
  );
}

export default WorkoutEditor;
