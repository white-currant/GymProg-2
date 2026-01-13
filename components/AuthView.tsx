
import React, { useEffect } from 'react';
import { ShieldCheck, LogIn, UserCircle, Lock } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthViewProps {
  onLogin: (profile: UserProfile) => void;
}

// Персональный Client ID пользователя интегрирован в код
const GOOGLE_CLIENT_ID = "493846459902-fi9ma2l18sciq5lr3t8bh8fm81e63bao.apps.googleusercontent.com";

interface GoogleTokenPayload {
  name: string;
  email: string;
  picture: string;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  useEffect(() => {
    const handleCredentialResponse = (response: any) => {
      try {
        const payload = JSON.parse(atob(response.credential.split('.')[1])) as GoogleTokenPayload;
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
          auto_select: false,
        });

        const btnContainer = document.getElementById("googleBtn");
        if (btnContainer) {
          google.accounts.id.renderButton(
            btnContainer,
            { theme: "filled_blue", size: "large", width: 280, shape: "pill" }
          );
        }
      } catch (err) {
        console.error("Google init failed", err);
      }
    }
  }, [onLogin]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="mb-12 space-y-4">
        <div className="w-24 h-24 bg-indigo-600/10 rounded-[40px] flex items-center justify-center mx-auto border border-indigo-500/20 shadow-[0_0_60px_rgba(79,70,229,0.1)]">
          <Lock className="text-indigo-400" size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-zinc-100 tracking-tighter text-white">GymProg</h1>
          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.4em]">Personal Data Shield</p>
        </div>
      </div>

      <div className="w-full max-w-[280px] space-y-4">
        <div id="googleBtn" className="flex justify-center h-[44px]"></div>

        <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase font-black text-zinc-600 bg-[#0a0a0a] px-2 tracking-widest">Или</div>
        </div>

        <button 
          onClick={() => onLogin({ name: 'Гость', email: 'guest@local.app', picture: '' })}
          className="w-full py-3.5 bg-zinc-900 text-zinc-400 rounded-full border border-zinc-800 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <UserCircle size={16} className="text-zinc-600" />
          Продолжить локально (Гость)
        </button>

        <div className="pt-8 opacity-40">
           <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <ShieldCheck size={12} className="text-indigo-500" /> Конфиденциальность гарантирована
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
