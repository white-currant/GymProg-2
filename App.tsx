
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Workout, Tab } from './types';
import { INITIAL_DATA } from './initialData';
import { Home, History, BarChart2, Plus, ArrowLeft, Settings as SettingsIcon, Cloud, CloudOff, RefreshCw, ChevronDown } from 'lucide-react';
import Dashboard from './components/Dashboard';
import WorkoutHistory from './components/WorkoutHistory';
import AnalyticsView from './components/AnalyticsView';
import WorkoutEditor from './components/WorkoutEditor';
import SettingsView from './components/SettingsView';

const CLOUD_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwVVNjgGy_qyHofaYkpn99jsaN5x453kdQsFaSU7mWgZn4O3Lo0q9H76lpI7o7LSDjieg/exec';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Состояние для Pull-to-refresh
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartRef = useRef<number | null>(null);
  const PULL_THRESHOLD = 80;

  const syncToCloud = useCallback(async (data: Workout[]) => {
    setSyncStatus('loading');
    try {
      await fetch(CLOUD_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e) {
      setSyncStatus('error');
    }
  }, []);

  const fetchFromCloud = useCallback(async () => {
    if (syncStatus === 'loading') return;
    setSyncStatus('loading');
    try {
      const response = await fetch(CLOUD_SCRIPT_URL);
      const data = await response.json();
      if (Array.isArray(data)) {
        setWorkouts(data);
        localStorage.setItem('gym-workouts', JSON.stringify(data));
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    } catch (e) {
      setSyncStatus('error');
    }
  }, [syncStatus]);

  useEffect(() => {
    const stored = localStorage.getItem('gym-workouts');
    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored);
        setWorkouts(Array.isArray(parsed) ? parsed : INITIAL_DATA);
      } catch (e) {
        setWorkouts(INITIAL_DATA);
      }
    } else {
      setWorkouts(INITIAL_DATA);
    }
    setIsLoaded(true);
    fetchFromCloud();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('gym-workouts', JSON.stringify(workouts));
    }
  }, [workouts, isLoaded]);

  // Обработчики жестов Pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      pullStartRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartRef.current !== null) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - pullStartRef.current;
      if (diff > 0) {
        // Эффект сопротивления
        const resistedDiff = Math.min(diff * 0.5, 120);
        setPullDistance(resistedDiff);
        // Отменяем стандартный скролл если тянем вниз в самом верху
        if (diff > 10 && e.cancelable) {
            // e.preventDefault(); // Может вызвать проблемы с прокруткой, используем осторожно
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > PULL_THRESHOLD) {
      fetchFromCloud();
    }
    setPullDistance(0);
    pullStartRef.current = null;
  };

  const addWorkout = (workout: Workout) => {
    let newWorkouts: Workout[];
    if (editingWorkout) {
      newWorkouts = workouts.map(w => w.id === editingWorkout.id ? workout : w);
      setEditingWorkout(null);
    } else {
      newWorkouts = [workout, ...workouts];
    }
    setWorkouts(newWorkouts);
    syncToCloud(newWorkouts); 
    setActiveTab('history');
  };

  const deleteWorkout = (id: string) => {
    const newWorkouts = workouts.filter(w => w.id !== id);
    setWorkouts(newWorkouts);
    syncToCloud(newWorkouts);
    setActiveTab('history');
  };

  const startEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setActiveTab('add');
  };

  const handleCancelAdd = () => {
    setEditingWorkout(null);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    if (!isLoaded) return <div className="p-8 text-center text-zinc-500 font-bold animate-pulse">Загрузка данных...</div>;
    switch (activeTab) {
      case 'dashboard': return <Dashboard workouts={workouts} onAddClick={() => { setEditingWorkout(null); setActiveTab('add'); }} />;
      case 'history': return <WorkoutHistory workouts={workouts} onDelete={deleteWorkout} onEdit={startEditWorkout} />;
      case 'analytics': return <AnalyticsView workouts={workouts} />;
      case 'add': return <WorkoutEditor onSave={addWorkout} onCancel={handleCancelAdd} workouts={workouts} initialWorkout={editingWorkout || undefined} />;
      case 'settings': return <SettingsView workouts={workouts} onImport={(data) => setWorkouts(data)} />;
      default: return <Dashboard workouts={workouts} onAddClick={() => { setEditingWorkout(null); setActiveTab('add'); }} />;
    }
  };

  return (
    <div 
      className="max-w-md mx-auto min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col pb-24 selection:bg-indigo-900/40 relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Визуальный индикатор Pull-to-refresh */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none z-50 overflow-hidden"
        style={{ height: `${pullDistance}px`, transition: pullDistance === 0 ? 'height 0.3s ease-out' : 'none' }}
      >
        <div 
          className="p-2.5 bg-indigo-600 text-white rounded-full shadow-2xl transition-all"
          style={{ 
            opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
            transform: `scale(${Math.min(pullDistance / PULL_THRESHOLD, 1)}) rotate(${pullDistance * 2}deg)` 
          }}
        >
          <RefreshCw size={20} className={syncStatus === 'loading' ? 'animate-spin' : ''} />
        </div>
      </div>

      <header className="bg-zinc-900/80 backdrop-blur-xl px-6 pt-8 pb-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-30">
        <button onClick={() => setActiveTab('settings')} className={`transition-colors ${activeTab === 'settings' ? 'text-indigo-400' : 'text-zinc-500'}`}>
          <SettingsIcon size={20} />
        </button>
        
        <div className="text-center">
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2 justify-center">
            GymProg
            {syncStatus === 'loading' && <RefreshCw size={12} className="text-indigo-400 animate-spin" />}
          </h1>
          <p className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.3em]">Strong Tracker</p>
        </div>

        {/* Кнопка обновления на всех страницах */}
        <button 
          onClick={() => fetchFromCloud()} 
          className={`p-2 rounded-xl transition-all active:scale-90 ${syncStatus === 'loading' ? 'bg-indigo-600/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <RefreshCw size={18} className={syncStatus === 'loading' ? 'animate-spin' : ''} />
        </button>
      </header>

      <main className="flex-1 px-4 py-6">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-900/90 backdrop-blur-2xl border-t border-zinc-800 px-6 py-4 flex justify-between items-center z-40">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Home size={22} />} label="Главная" />
        <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={22} />} label="История" />
        <div className="relative -top-10">
           <button onClick={() => { setEditingWorkout(null); setActiveTab('add'); }} className="w-14 h-14 bg-indigo-600 rounded-2xl rotate-45 flex items-center justify-center text-white shadow-[0_8px_30px_rgb(79,70,229,0.3)] active:scale-95 transition-all"><Plus size={32} className="-rotate-45" /></button>
        </div>
        <NavButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart2 size={22} />} label="Графики" />
        <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={22} />} label="Настр" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-indigo-400 scale-110' : 'text-zinc-600'}`}>
    {icon} <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default App;
