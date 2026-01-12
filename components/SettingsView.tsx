
import React, { useState, useEffect } from 'react';
import { Database, CloudDownload, CloudUpload, Check, AlertCircle, ExternalLink, Settings as SettingsIcon } from 'lucide-react';
import { Workout } from '../types';

interface SettingsProps {
  workouts: Workout[];
  onImport: (workouts: Workout[]) => void;
}

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwVVNjgGy_qyHofaYkpn99jsaN5x453kdQsFaSU7mWgZn4O3Lo0q9H76lpI7o7LSDjieg/exec';

const SettingsView: React.FC<SettingsProps> = ({ workouts, onImport }) => {
  const [scriptUrl, setScriptUrl] = useState(localStorage.getItem('google-script-url') || DEFAULT_SCRIPT_URL);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading', msg: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('google-script-url', scriptUrl);
  }, [scriptUrl]);

  const handleSync = async (type: 'up' | 'down') => {
    setStatus({ type: 'loading', msg: type === 'up' ? 'Отправка...' : 'Загрузка...' });
    try {
      if (type === 'up') {
        await fetch(scriptUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify(workouts) });
        setStatus({ type: 'success', msg: 'Синхронизировано!' });
      } else {
        const res = await fetch(scriptUrl);
        const data = await res.json();
        if (Array.isArray(data)) { onImport(data); setStatus({ type: 'success', msg: 'Данные загружены!' }); }
      }
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus({ type: 'error', msg: 'Ошибка связи' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Облако</h2>
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Google Таблицы</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-1.5 ml-1">Apps Script URL</label>
            <input 
              type="text" 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3.5 px-4 text-xs font-bold text-zinc-100 focus:border-indigo-500 outline-none transition-all"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleSync('up')} className="flex flex-col items-center gap-2 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl border border-zinc-700 transition-all active:scale-95 shadow-sm">
              <CloudUpload size={20} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-wider">Выгрузить</span>
            </button>
            <button onClick={() => handleSync('down')} className="flex flex-col items-center gap-2 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl border border-zinc-700 transition-all active:scale-95 shadow-sm">
              <CloudDownload size={20} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-wider">Подгрузить</span>
            </button>
          </div>
        </div>

        {status && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            <span className="text-xs font-bold">{status.msg}</span>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-indigo-600/5 blur-3xl rounded-full"></div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl">
            <Database className="text-indigo-400" size={20} />
          </div>
          <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-100">Память</h4>
        </div>
        <p className="text-[11px] text-zinc-500 mb-6 leading-relaxed relative z-10">Данные хранятся локально в браузере и автоматически синхронизируются с облаком.</p>
        <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800 flex justify-between items-center relative z-10">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Записей</span>
            <span className="text-lg font-black text-indigo-400">{workouts.length}</span>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
