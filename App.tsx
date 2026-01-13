
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Workout, Tab, UserProfile } from './types';
import { Home, History, BarChart2, Plus, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import Dashboard from './components/Dashboard';
import WorkoutHistory from './components/WorkoutHistory';
import AnalyticsView from './components/AnalyticsView';
import WorkoutEditor from './components/WorkoutEditor';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';

const SYNC_URL = 'https://script.google.com/macros/s/AKfycbyRN6M--Fz-gTndleVhN9KKeD_l07ctwQSknsaFik0gaRo7tpxt0KlR4r-WtTqcDP4Wmw/exec';

// Утилита для вибрации
export const haptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

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

  const storageKey = useMemo(() => user ? `gym-v2-data-${user.email}` : null, [user]);

  const processWorkouts = (data: Workout[]): Workout[] => {
    if (!Array.isArray(data)) return [];
    const uniqueMap = new Map<string, Workout>();
    data.forEach(w => { if (w && w.id) uniqueMap.set(w.id, w); });
    return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const syncToCloud = useCallback(async (data: Workout[]) => {
    if (!user || user.email === 'guest@local.app') return;
    
    setSyncStatus('loading');
    haptic(15);
    try {
      await fetch(SYNC_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, workouts: data })
      });
      setSyncStatus('success');
      haptic([20, 50, 20]);
    } catch (e) {
      console.error("Sync error:", e);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [user]);

  const fetchFromCloud = useCallback(async (targetEmail?: string) => {
    const emailToFetch = targetEmail || user?.email;
    if (!emailToFetch || emailToFetch === 'guest@local.app') return;
    
    setSyncStatus('loading');
    haptic(15);
    try {
      const fullUrl = new URL(SYNC_URL);
      fullUrl.searchParams.append('email', emailToFetch);
      
      const response = await fetch(fullUrl.toString());
      if (!response.ok) throw new Error('HTTP Error');

      const text = await response.text();
      let data = JSON.parse(text);
      
      if (Array.isArray(data)) {
        const merged = processWorkouts([...data]);
        setWorkouts(merged);
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(merged));
        setSyncStatus('success');
        haptic([20, 50, 20]);
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [user, storageKey]);

  useEffect(() => {
    if (user && storageKey) {
      const stored = localStorage.getItem(storageKey);
      const localData = stored ? processWorkouts(JSON.parse(stored)) : [];
      setWorkouts(localData);
      setIsLoaded(true);
      if (user.email !== 'guest@local.app') fetchFromCloud();
    }
  }, [user, storageKey, fetchFromCloud]);

  useEffect(() => {
    if (isLoaded && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(workouts));
    }
  }, [workouts, isLoaded, storageKey]);

  const handleTabChange = (tab: Tab) => {
    haptic(10);
    setActiveTab(tab);
  };

  const handleDeleteWorkout = (id: string) => {
    haptic([50, 30, 10]);
    const newList = workouts.filter(w => w.id !== id);
    setWorkouts(newList);
    syncToCloud(newList);
  };

  if (!user) return <AuthView onLogin={setUser} />;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col pb-24 relative">
      <header className="bg-zinc-900/80 backdrop-blur-xl px-6 pt-8 pb-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-30">
        <button onClick={() => handleTabChange('settings')} className={`p-2 rounded-xl transition-colors ${activeTab === 'settings' ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-500'}`}>
          <SettingsIcon size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-white">GymProg</h1>
          <p className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.3em]">Strong Tracker</p>
        </div>
        <button 
          onClick={() => fetchFromCloud()} 
          disabled={user.email === 'guest@local.app' || syncStatus === 'loading'} 
          className="p-2 text-zinc-500 disabled:opacity-50"
        >
          <RefreshCw size={18} className={syncStatus === 'loading' ? 'animate-spin text-indigo-400' : ''} />
        </button>
      </header>

      <main className="flex-1 px-4 py-6">
        {activeTab === 'dashboard' && <Dashboard workouts={workouts} onAddClick={() => { haptic(40); setActiveTab('add'); }} />}
        {activeTab === 'history' && <WorkoutHistory workouts={workouts} onDelete={handleDeleteWorkout} onEdit={(w) => { setEditingWorkout(w); handleTabChange('add'); }} />}
        {activeTab === 'analytics' && <AnalyticsView workouts={workouts} />}
        {activeTab === 'add' && <WorkoutEditor onSave={(w) => { 
          const newList = editingWorkout ? workouts.map(ex => ex.id === editingWorkout.id ? w : ex) : [w, ...workouts];
          const processed = processWorkouts(newList);
          setWorkouts(processed);
          setEditingWorkout(null);
          handleTabChange('history');
          syncToCloud(processed);
        }} onCancel={() => handleTabChange('dashboard')} workouts={workouts} initialWorkout={editingWorkout || undefined} />}
        {activeTab === 'settings' && <SettingsView workouts={workouts} onImport={setWorkouts} onFetch={fetchFromCloud} onLogout={() => setUser(null)} onLogin={setUser} onMigrate={() => {}} user={user} />}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-900/95 backdrop-blur-2xl border-t border-zinc-800/50 py-3 grid grid-cols-5 items-center z-40 px-2">
        <NavButton active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} icon={<Home size={22} />} label="Дом" />
        <NavButton active={activeTab === 'history'} onClick={() => handleTabChange('history')} icon={<History size={22} />} label="История" />
        <div className="flex justify-center">
          <button onClick={() => { haptic(40); setEditingWorkout(null); setActiveTab('add'); }} className="w-14 h-14 bg-indigo-600 rounded-2xl rotate-45 flex items-center justify-center text-white shadow-lg -mt-12 active:scale-90 transition-all">
            <Plus size={32} className="-rotate-45" />
          </button>
        </div>
        <NavButton active={activeTab === 'analytics'} onClick={() => handleTabChange('analytics')} icon={<BarChart2 size={22} />} label="Графики" />
        <NavButton active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} icon={<SettingsIcon size={22} />} label="Профиль" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all w-full ${active ? 'text-indigo-400' : 'text-zinc-600'}`}>
    <div className={`p-1 rounded-xl ${active ? 'bg-indigo-500/10' : ''}`}>{icon}</div>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
