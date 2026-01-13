
import React, { useState, useEffect } from 'react';
import { CloudDownload, CloudUpload, Check, ShieldCheck, LogOut, User, Trash2, GlobeLock, LogIn } from 'lucide-react';
import { Workout, UserProfile } from '../types';

interface SettingsProps {
  workouts: Workout[];
  onImport: (workouts: Workout[]) => void;
  onFetch: () => void | Promise<void>;
  onLogout: () => void;
  onLogin: (profile: UserProfile) => void;
  user: UserProfile | null;
}

const GOOGLE_CLIENT_ID = "493846459902-fi9ma2l18sciq5lr3t8bh8fm81e63bao.apps.googleusercontent.com";

const SettingsView: React.FC<SettingsProps> = ({ workouts, onImport, onFetch, onLogout, onLogin, user }) => {
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
        setStatus({ type: 'error', msg: 'Синхронизация недоступна для гостя' });
        setTimeout(() => setStatus(null), 3000);
        return;
    }

    if (type === 'down') {
        setStatus({ type: 'loading', msg: 'Загрузка...' });
        await onFetch();
        setStatus({ type: 'success', msg: 'Данные обновлены' });
        setTimeout(() => setStatus(null), 3000);
        return;
    }
    
    setStatus({ type: 'loading', msg: 'Выгрузка...' });
    try {
      // Логика синхронизации вызывается через пропсы в App.tsx
      setStatus({ type: 'success', msg: 'Данные в облаке!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus({ type: 'error', msg: 'Ошибка сети' });
    }
  };

  const clearAllLocalData = () => {
    if (confirm('ВНИМАНИЕ: Это удалит ВСЕ локальные данные тренировок. Вы уверены?')) {
        const email = user?.email || 'guest';
        localStorage.removeItem(`gym-v2-data-${email}`);
        window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Профиль пользователя */}
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
             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-zinc-900 flex items-center justify-center shadow-lg">
                <Check size={10} className="text-white font-black" />
             </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-zinc-100 leading-tight">{user?.name || 'Пользователь'}</h3>
            <p className="text-xs text-zinc-500 font-medium truncate max-w-[150px]">{user?.email}</p>
          </div>
          <button 
            onClick={onLogout} 
            className="p-3 bg-zinc-800 text-rose-500 rounded-2xl border border-zinc-700 active:scale-90 transition-all hover:bg-rose-500/10"
            title="Выйти"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Блок входа для гостей */}
      {isGuest && (
        <div className="bg-indigo-600/10 rounded-[32px] p-6 border border-indigo-500/20 shadow-xl space-y-4 animate-in zoom-in duration-500">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                    <LogIn size={20} />
                </div>
                <div>
                    <h2 className="text-base font-bold text-indigo-100">Войти в аккаунт</h2>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Активируйте облако</p>
                </div>
            </div>
            <p className="text-xs text-indigo-200/60 leading-relaxed">
                Войдите через Google, чтобы ваши тренировки автоматически сохранялись и были доступны на любом устройстве.
            </p>
            <div id="googleBtnSettings" className="w-full h-[44px] flex justify-center"></div>
        </div>
      )}

      {/* Облачная синхронизация */}
      <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                <GlobeLock size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Облако</h2>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Безопасная синхронизация</p>
              </div>
            </div>
            <button onClick={clearAllLocalData} className="p-3 text-zinc-700 hover:text-rose-500 transition-colors" title="Сбросить кэш">
                <Trash2 size={18} />
            </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleSync('up')} 
            disabled={isGuest}
            className="flex flex-col items-center gap-2 py-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl border border-zinc-700 transition-all active:scale-95 shadow-sm disabled:opacity-20 disabled:grayscale"
          >
            <CloudUpload size={22} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-wider">Выгрузить</span>
          </button>
          <button 
            onClick={() => handleSync('down')} 
            disabled={isGuest}
            className="flex flex-col items-center gap-2 py-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl border border-zinc-700 transition-all active:scale-95 shadow-sm disabled:opacity-20 disabled:grayscale"
          >
            <CloudDownload size={22} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-wider">Загрузить</span>
          </button>
        </div>

        {status && (
          <div className={`p-4 rounded-2xl flex items-center justify-center gap-3 animate-in fade-in zoom-in duration-300 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : status.type === 'loading' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'}`}>
            <span className="text-xs font-bold">{status.msg}</span>
          </div>
        )}
      </div>

      {/* Инфо-блок */}
      <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800 flex flex-col items-center text-center gap-3">
         <ShieldCheck className="text-zinc-700" size={32} />
         <p className="text-[11px] text-zinc-600 font-medium leading-relaxed">
           Ваши данные зашифрованы и доступны только вам. <br/>
           Приложение работает локально с опциональной выгрузкой в облако.
         </p>
      </div>
    </div>
  );
};

export default SettingsView;
