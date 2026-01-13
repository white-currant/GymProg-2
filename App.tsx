
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Workout, Tab, UserProfile } from './types';
import { Home, History, BarChart2, Plus, Settings as SettingsIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import WorkoutHistory from './components/WorkoutHistory';
import AnalyticsView from './components/AnalyticsView';
import WorkoutEditor from './components/WorkoutEditor';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('gym_user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const getScriptUrl = () => localStorage.getItem('google-script-url') || '';
  
  // Ключ хранилища теперь ВСЕГДА привязан к email. Нет email - нет данных.
  const storageKey = useMemo(() => user ? `gym-v2-data-${user.email}` : null, [user]);

  const processWorkouts = (data: Workout[]): Workout[] => {
    if (!Array.isArray(data)) return [];
    const uniqueMap = new Map<string, Workout>();
    data.forEach(w => { if (w && w.id) uniqueMap.set(w.id, w); });
    return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const syncToCloud = useCallback(async (data: Workout[]) => {
    const url = getScriptUrl();
    if (!user || !url || user.email === 'guest@local.app') return;
    
    setSyncStatus('loading');
    try {
      const payload = {
        email: user.email,
        workouts: data
      };
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e) {
      setSyncStatus('error');
    }
  }, [user]);

  const fetchFromCloud = useCallback(async () => {
    const url = getScriptUrl();
    if (!user || !url || syncStatus === 'loading' || user.email === 'guest@local.app') return;
    
    setSyncStatus('loading');
    try {
      const fullUrl = new URL(url);
      fullUrl.searchParams.append('email', user.email);
      
      const response = await fetch(fullUrl.toString());
      const data = await response.json();
      if (Array.isArray(data)) {
        const merged = processWorkouts([...data]);
        setWorkouts(merged);
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(merged));
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    } catch (e) {
      setSyncStatus('error');
    }
  }, [user, syncStatus, storageKey]);

  // Загрузка данных при входе в аккаунт
  useEffect(() => {
    if (user && storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setWorkouts(processWorkouts(JSON.parse(stored)));
      } else {
        // Никаких INITIAL_DATA. Чистый лист для каждого пользователя.
        setWorkouts([]);
      }
      setIsLoaded(true);
      
      // Автоматическая загрузка из облака только для Google-аккаунтов
      if (user.email !== 'guest@local.app') {
        fetchFromCloud();
      }
    } else {
      setIsLoaded(false);
      setWorkouts([]);
    }
  }, [user, storageKey, fetchFromCloud]);

  // Локальное сохранение при изменениях
  useEffect(() => {
    if (isLoaded && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(workouts));
    }
  }, [workouts, isLoaded, storageKey]);

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('gym_user_profile', JSON.stringify(profile));
  };

  const handleLogout = () => {
    if (!confirm('Выйти из аккаунта?')) return;
    setUser(null);
    localStorage.removeItem('gym_user_profile');
    setWorkouts([]);
    setActiveTab('dashboard');
  };

  const addWorkout = (workout: Workout) => {
    setWorkouts(prev => {
      let newWorkouts: Workout[];
      if (editingWorkout) {
        newWorkouts = prev.map(w => w.id === editingWorkout.id ? workout : w);
        setEditingWorkout(null);
      } else {
        newWorkouts = [workout, ...prev];
      }
      const processed = processWorkouts(newWorkouts);
      syncToCloud(processed); 
      return processed;
    });
    setActiveTab('history');
  };

  const deleteWorkout = (id: string) => {
    if (!confirm('Удалить тренировку?')) return;
    setWorkouts(prev => {
      const newWorkouts = prev.filter(w => w.id !== id);
      const processed = processWorkouts(newWorkouts);
      syncToCloud(processed);
      return processed;
    });
  };

  const renderContent = () => {
    if (!isLoaded) return null;
    switch (activeTab) {
      case 'dashboard': return <Dashboard workouts={workouts} onAddClick={() => { setEditingWorkout(null); setActiveTab('add'); }} />;
      case 'history': return <WorkoutHistory workouts={workouts} onDelete={deleteWorkout} onEdit={(w) => { setEditingWorkout(w); setActiveTab('add'); }} />;
      case 'analytics': return <AnalyticsView workouts={workouts} />;
      case 'add': return <WorkoutEditor onSave={addWorkout} onCancel={() => { setEditingWorkout(null); setActiveTab('dashboard'); }} workouts={workouts} initialWorkout={editingWorkout || undefined} />;
      case 'settings': return <SettingsView workouts={workouts} onImport={(data) => setWorkouts(processWorkouts(data))} onFetch={fetchFromCloud} onLogout={handleLogout} user={user} />;
      default: return null;
    }
  };

  if (!user) return <AuthView onLogin={handleLogin} />;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col pb-24 relative">
      <header className="bg-zinc-900/80 backdrop-blur-xl px-6 pt-8 pb-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-30">
        <button onClick={() => setActiveTab('settings')} className={`p-2 rounded-xl transition-colors ${activeTab === 'settings' ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-500'}`}>
          <SettingsIcon size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-white">GymProg</h1>
          <p className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.3em]">Strong Tracker</p>
        </div>
        <button 
          onClick={() => fetchFromCloud()} 
          disabled={syncStatus === 'loading' || user.email === 'guest@local.app'} 
          className={`p-2 rounded-xl transition-all active:scale-90 ${(syncStatus === 'loading' || user.email === 'guest@local.app') ? 'text-zinc-800' : syncStatus === 'error' ? 'text-rose-400' : 'text-zinc-500'}`}
        >
          {syncStatus === 'error' ? <AlertTriangle size={18} /> : <RefreshCw size={18} className={syncStatus === 'loading' ? 'animate-spin' : ''} />}
        </button>
      </header>

      <main className="flex-1 px-4 py-6">{renderContent()}</main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-900/90 backdrop-blur-2xl border-t border-zinc-800 px-6 py-4 flex justify-between items-center z-40">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Home size={22} />} label="Дом" />
        <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={22} />} label="История" />
        <div className="relative -top-10">
           <button onClick={() => { setEditingWorkout(null); setActiveTab('add'); }} className="w-14 h-14 bg-indigo-600 rounded-2xl rotate-45 flex items-center justify-center text-white shadow-[0_8px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all"><Plus size={32} className="-rotate-45" /></button>
        </div>
        <NavButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart2 size={22} />} label="Графики" />
        <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={22} />} label="Профиль" />
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
