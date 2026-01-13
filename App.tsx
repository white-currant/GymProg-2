
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
    try {
      // no-cors не позволяет читать ответ, но гарантирует отправку без блокировок CORS
      await fetch(SYNC_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, workouts: data })
      });
      setSyncStatus('success');
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
    try {
      const fullUrl = new URL(SYNC_URL);
      fullUrl.searchParams.append('email', emailToFetch);
      
      const response = await fetch(fullUrl.toString());
      
      if (!response.ok) throw new Error('HTTP Error');

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        // Если Google вернул HTML (например страницу входа), значит доступ не Anyone
        throw new Error('Script returned HTML instead of JSON. Check access settings.');
      }
      
      if (Array.isArray(data)) {
        const merged = processWorkouts([...data]);
        setWorkouts(merged);
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(merged));
        setSyncStatus('success');
      } else {
        setSyncStatus('success');
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setSyncStatus('error');
      // Оповещаем пользователя, если это ошибка прав доступа
      if (e instanceof Error && e.message.includes('HTML')) {
        alert('Ошибка доступа к Google Скрипту. Убедитесь, что при развертывании выбрано "Anyone" (Все).');
      }
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
      
      if (user.email !== 'guest@local.app') {
        fetchFromCloud();
      }
    } else {
      setIsLoaded(false);
      setWorkouts([]);
    }
  }, [user, storageKey, fetchFromCloud]);

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
    if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.disableAutoSelect();
    }
    localStorage.removeItem('gym_user_profile');
    setUser(null);
    setWorkouts([]);
    setIsLoaded(false);
    setActiveTab('dashboard');
  };

  const handleMigrateGuestData = () => {
    const guestData = localStorage.getItem('gym-v2-data-guest@local.app');
    if (guestData && user && user.email !== 'guest@local.app') {
      const parsed = JSON.parse(guestData);
      const merged = processWorkouts([...workouts, ...parsed]);
      setWorkouts(merged);
      syncToCloud(merged);
      if (confirm('Данные перенесены. Удалить данные из гостевого профиля?')) {
        localStorage.removeItem('gym-v2-data-guest@local.app');
      }
    } else {
      alert('Данные для переноса не найдены');
    }
  };

  if (!user) {
    return <AuthView onLogin={handleLogin} />;
  }

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
          disabled={user.email === 'guest@local.app' || syncStatus === 'loading'} 
          className="p-2 text-zinc-500 disabled:opacity-50"
        >
          <RefreshCw size={18} className={syncStatus === 'loading' ? 'animate-spin text-indigo-400' : syncStatus === 'error' ? 'text-rose-500' : syncStatus === 'success' ? 'text-emerald-500' : ''} />
        </button>
      </header>

      <main className="flex-1 px-4 py-6">
        {activeTab === 'dashboard' && <Dashboard workouts={workouts} onAddClick={() => setActiveTab('add')} />}
        {activeTab === 'history' && <WorkoutHistory workouts={workouts} onDelete={(id) => setWorkouts(workouts.filter(w => w.id !== id))} onEdit={(w) => { setEditingWorkout(w); setActiveTab('add'); }} />}
        {activeTab === 'analytics' && <AnalyticsView workouts={workouts} />}
        {activeTab === 'add' && <WorkoutEditor onSave={(w) => { 
          const newList = editingWorkout ? workouts.map(ex => ex.id === editingWorkout.id ? w : ex) : [w, ...workouts];
          setWorkouts(processWorkouts(newList));
          setEditingWorkout(null);
          setActiveTab('history');
          syncToCloud(newList);
        }} onCancel={() => setActiveTab('dashboard')} workouts={workouts} initialWorkout={editingWorkout || undefined} />}
        {activeTab === 'settings' && (
          <SettingsView 
            workouts={workouts} 
            onImport={(d) => setWorkouts(processWorkouts(d))} 
            onFetch={() => fetchFromCloud()} 
            onLogout={handleLogout} 
            onLogin={handleLogin} 
            onMigrate={handleMigrateGuestData} 
            user={user} 
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-900/90 backdrop-blur-2xl border-t border-zinc-800 px-6 py-4 flex justify-between items-center z-40">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Home size={22} />} label="Дом" />
        <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={22} />} label="История" />
        <button onClick={() => { setEditingWorkout(null); setActiveTab('add'); }} className="w-14 h-14 bg-indigo-600 rounded-2xl rotate-45 flex items-center justify-center text-white shadow-lg -mt-10 active:scale-95 transition-all focus:outline-none"><Plus size={32} className="-rotate-45" /></button>
        <NavButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart2 size={22} />} label="Графики" />
        <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={22} />} label="Профиль" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all focus:outline-none ${active ? 'text-indigo-400 scale-110' : 'text-zinc-600'}`}>
    {icon} <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default App;
