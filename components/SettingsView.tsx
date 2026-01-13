
import React, { useState, useEffect } from 'react';
import { Workout, UserProfile } from '../types';
import { 
  Database, 
  LogIn as LoginIcon, 
  LogOut as LogoutIcon, 
  Globe, 
  Shield, 
  RefreshCw,
  CloudDownload, 
  CloudUpload, 
  User, 
  Trash2, 
  ArrowRightLeft, 
  Layers
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

const SettingsView: React.FC<SettingsProps> = ({ workouts, onImport, onFetch, onLogout, onLogin, onMigrate, user }) => {
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading', msg: string } | null>(null);
  const isGuest = user?.email === 'guest@local.app';

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
              { theme: "filled_blue", size: "large", width: btnContainer.offsetWidth || 280, shape: "pill" }
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
        const SYNC_URL = 'https://script.google.com/macros/s/AKfycbyRN6M--Fz-gTndleVhN9KKeD_l07ctwQSknsaFik0gaRo7tpxt0KlR4r-WtTqcDP4Wmw/exec';
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
    }
  };

  const clearLocal = () => {
    if (confirm('Удалить локальную копию тренировок? В облаке данные останутся.')) {
        localStorage.removeItem(`gym-v2-data-${user?.email}`);
        window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl rounded-full"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
             {user?.picture ? (
               <img src={user.picture} alt="Profile" className="w-16 h-16 rounded-[22px] border-2 border-indigo-500/20" />
             ) : (
               <div className="w-16 h-16 bg-zinc-800 rounded-[22px] flex items-center justify-center text-zinc-500">
                 <User size={28} />
               </div>
             )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-zinc-100 leading-tight">{user?.name || 'Атлет'}</h3>
            <p className="text-xs text-zinc-500 font-medium truncate max-w-[150px]">{user?.email}</p>
          </div>
          <button onClick={onLogout} className="p-3 bg-zinc-800 text-rose-500 rounded-2xl border border-zinc-700 active:scale-95 transition-all">
            <LogoutIcon size={20} />
          </button>
        </div>
      </div>

      {!isGuest && localStorage.getItem('gym-v2-data-guest@local.app') && (
        <button onClick={onMigrate} className="w-full p-4 bg-indigo-600 text-white rounded-3xl flex items-center justify-center gap-3 font-bold shadow-lg active:scale-95 transition-all">
          <ArrowRightLeft size={20} />
          <span>Перенести данные гостя</span>
        </button>
      )}

      {isGuest && (
        <div className="bg-indigo-600/10 rounded-[32px] p-6 border border-indigo-500/20 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                    <LoginIcon size={20} />
                </div>
                <h2 className="text-base font-bold text-indigo-100">Включить облако</h2>
            </div>
            <div id="googleBtnSettings" className="w-full h-[44px] flex justify-center"></div>
        </div>
      )}

      <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
                <Layers size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Персональный лист</h2>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Google Таблица</p>
              </div>
            </div>
            <button onClick={clearLocal} className="p-3 text-zinc-700 hover:text-rose-500 transition-colors">
                <Trash2 size={18} />
            </button>
        </div>

        <div className="bg-zinc-800/30 rounded-2xl p-4 border border-zinc-800/50 flex items-center justify-between">
            <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Строк во вкладке</p>
                <p className="text-2xl font-black text-zinc-100">{workouts.length}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Безопасность</p>
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                    <Shield size={12} /> Изолировано
                </p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleSync('up')} 
            disabled={isGuest}
            className="flex flex-col items-center gap-2 py-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl border border-zinc-700 transition-all active:scale-95 disabled:opacity-20"
          >
            <CloudUpload size={22} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-wider">Обновить облако</span>
          </button>
          <button 
            onClick={() => handleSync('down')} 
            disabled={isGuest}
            className="flex flex-col items-center gap-2 py-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl border border-zinc-700 transition-all active:scale-95 disabled:opacity-20"
          >
            <CloudDownload size={22} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-wider">Скачать из облака</span>
          </button>
        </div>

        {status && (
          <div className={`p-4 rounded-2xl flex items-center justify-center gap-3 animate-in fade-in zoom-in duration-300 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : status.type === 'loading' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {status.type === 'loading' && <RefreshCw size={14} className="animate-spin" />}
            <span className="text-xs font-bold">{status.msg}</span>
          </div>
        )}
      </div>

      <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800 flex flex-col items-center text-center gap-3">
         <Globe className="text-zinc-700" size={32} />
         <p className="text-[11px] text-zinc-600 font-medium leading-relaxed">
           Для каждого пользователя в общей таблице создается <strong>персональная вкладка</strong>. <br/>
           Тренировки пишутся построчно — это профессиональный подход к данным.
         </p>
      </div>
    </div>
  );
};

export default SettingsView;
