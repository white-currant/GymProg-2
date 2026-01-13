
import React, { useState, useEffect, useMemo } from 'react';
import { Workout, UserProfile } from '../types';
import { 
  LogIn as LoginIcon, 
  LogOut as LogoutIcon, 
  Shield, 
  RefreshCw,
  CloudDownload, 
  CloudUpload, 
  User, 
  Trash2, 
  ArrowRightLeft, 
  Dumbbell,
  Target,
  Info,
  ChevronRight
} from 'lucide-react';

interface SettingsProps {
  workouts: Workout[];
  onImport: (workouts: Workout[]) => void;
  onFetch: () => void | Promise<void>;
  onLogout: () => void;
  onLogin: (profile: UserProfile) => void;
  onMigrate: () => void;
  user: UserProfile | null;
}

const GOOGLE_CLIENT_ID = "493846459902-fi9ma2l18sciq5lr3t8bh8fm81e63bao.apps.googleusercontent.com";
const SYNC_URL = 'https://script.google.com/macros/s/AKfycbyRN6M--Fz-gTndleVhN9KKeD_l07ctwQSknsaFik0gaRo7tpxt0KlR4r-WtTqcDP4Wmw/exec';

const SettingsView: React.FC<SettingsProps> = ({ workouts, onImport, onFetch, onLogout, onLogin, onMigrate, user }) => {
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading', msg: string } | null>(null);
  const isGuest = user?.email === 'guest@local.app';

  const stats = useMemo(() => {
    let totalSets = 0;
    let totalVolume = 0;
    workouts.forEach(w => w.exercises.forEach(e => e.sets.forEach(s => {
      totalSets++;
      totalVolume += (s.reps * s.weight);
    })));
    return {
      totalSets,
      totalVolume: (totalVolume / 1000).toFixed(1),
      avgExercises: workouts.length > 0 ? (workouts.reduce((acc, w) => acc + w.exercises.length, 0) / workouts.length).toFixed(1) : 0
    };
  }, [workouts]);

  useEffect(() => {
    if (isGuest) {
      const handleCredentialResponse = (response: any) => {
        try {
          const payload = JSON.parse(atob(response.credential.split('.')[1]));
          onLogin({
            name: payload.name,
            email: payload.email,
            picture: payload.picture
          });
        } catch (e) {
          console.error("Auth error:", e);
        }
      };

      const google = (window as any).google;
      if (google && GOOGLE_CLIENT_ID) {
        try {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
          });

          const btnContainer = document.getElementById("googleBtnSettings");
          if (btnContainer) {
            google.accounts.id.renderButton(
              btnContainer,
              { theme: "filled_blue", size: "large", width: 280, shape: "pill" }
            );
          }
        } catch (err) {
          console.error("Google init failed in settings", err);
        }
      }
    }
  }, [isGuest, onLogin]);

  const handleSync = async (type: 'up' | 'down') => {
    if (isGuest) {
        setStatus({ type: 'error', msg: 'Синхронизация недоступна' });
        setTimeout(() => setStatus(null), 3000);
        return;
    }

    setStatus({ type: 'loading', msg: type === 'down' ? 'Загрузка...' : 'Синхронизация...' });
    
    try {
      if (type === 'down') {
        await onFetch();
      } else {
        await fetch(SYNC_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user?.email, workouts: workouts })
        });
      }
      setStatus({ type: 'success', msg: 'Готово!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus({ type: 'error', msg: 'Ошибка связи' });
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const clearLocal = () => {
    if (confirm('Очистить локальную память? Это сбросит приложение до состояния последней загрузки из облака.')) {
        localStorage.removeItem(`gym-v2-data-${user?.email}`);
        window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Карточка профиля */}
      <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 shadow-xl relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/10 blur-3xl rounded-full"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="relative">
             {user?.picture ? (
               <img src={user.picture} alt="Profile" className="w-20 h-20 rounded-3xl border-2 border-indigo-500/20 shadow-2xl" />
             ) : (
               <div className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center text-zinc-600 border border-zinc-700/50">
                 <User size={32} />
               </div>
             )}
             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-zinc-900 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
             </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-white leading-tight">{user?.name || 'Атлет'}</h3>
            <p className="text-xs text-zinc-500 font-bold truncate max-w-[180px]">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 rounded-lg border border-indigo-500/10">
                <Shield size={10} className="text-indigo-400" />
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-tighter">Данные защищены</span>
            </div>
          </div>
        </div>
      </div>

      {/* Сводка статистики */}
      <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 rounded-[28px] p-5 border border-zinc-800 flex flex-col gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                <Dumbbell size={20} />
            </div>
            <div>
                <p className="text-2xl font-black text-white">{stats.totalSets}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Подходов</p>
            </div>
          </div>
          <div className="bg-zinc-900 rounded-[28px] p-5 border border-zinc-800 flex flex-col gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                <Target size={20} />
            </div>
            <div>
                <p className="text-2xl font-black text-white">{stats.totalVolume}т</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Тоннаж</p>
            </div>
          </div>
      </div>

      {/* Управление облаком */}
      <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <RefreshCw size={18} className="text-indigo-400" /> Облачный архив
            </h2>
            <button onClick={clearLocal} className="p-2 text-zinc-700 active:text-rose-500 transition-colors">
                <Trash2 size={16} />
            </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleSync('up')} 
            disabled={isGuest || (status?.type === 'loading')}
            className="group relative flex flex-col items-center gap-3 py-6 bg-zinc-800 hover:bg-zinc-800/80 text-zinc-100 rounded-3xl border border-zinc-700/50 transition-all active:scale-95 disabled:opacity-20"
          >
            <CloudUpload size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" />
            <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-wider block">Обновить</span>
                <span className="text-[8px] text-zinc-500 font-medium">С телефона в облако</span>
            </div>
          </button>
          <button 
            onClick={() => handleSync('down')} 
            disabled={isGuest || (status?.type === 'loading')}
            className="group relative flex flex-col items-center gap-3 py-6 bg-zinc-800 hover:bg-zinc-800/80 text-zinc-100 rounded-3xl border border-zinc-700/50 transition-all active:scale-95 disabled:opacity-20"
          >
            <CloudDownload size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-wider block">Скачать</span>
                <span className="text-[8px] text-zinc-500 font-medium">Из облака в телефон</span>
            </div>
          </button>
        </div>

        {status && (
          <div className={`p-4 rounded-2xl flex items-center justify-center gap-3 animate-in fade-in zoom-in duration-300 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : status.type === 'loading' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {status.type === 'loading' && <RefreshCw size={14} className="animate-spin" />}
            <span className="text-xs font-bold">{status.msg}</span>
          </div>
        )}

        <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50 flex items-start gap-3">
            <Info size={16} className="text-zinc-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-zinc-600 leading-relaxed font-medium">
                Синхронизация позволяет восстановить данные при смене устройства. Мы храним ваши тренировки в зашифрованном личном архиве.
            </p>
        </div>
      </div>

      {isGuest && (
        <div className="bg-indigo-600/10 rounded-[32px] p-6 border border-indigo-500/20 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                    <LoginIcon size={20} />
                </div>
                <h2 className="text-base font-bold text-indigo-100">Войти для облака</h2>
            </div>
            <div id="googleBtnSettings" className="w-full h-[44px] flex justify-center"></div>
        </div>
      )}

      {/* Список действий */}
      <div className="space-y-2">
          {!isGuest && localStorage.getItem('gym-v2-data-guest@local.app') && (
            <button onClick={onMigrate} className="w-full p-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-[28px] border border-zinc-800 flex items-center justify-between group transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center"><ArrowRightLeft size={18} /></div>
                <span className="text-xs font-bold">Перенести данные гостя</span>
              </div>
              <ChevronRight size={16} className="text-zinc-700 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          <button onClick={onLogout} className="w-full p-5 bg-zinc-900 hover:bg-zinc-800 text-rose-500 rounded-[28px] border border-zinc-800 flex items-center justify-between group transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center"><LogoutIcon size={18} /></div>
              <span className="text-xs font-black uppercase tracking-widest">Выйти из системы</span>
            </div>
            <ChevronRight size={16} className="text-rose-500/30" />
          </button>
      </div>

      <div className="pt-4 text-center">
          <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.4em]">GymProg v2.1.0 • Minimalist Edition</p>
      </div>
    </div>
  );
};

export default SettingsView;
