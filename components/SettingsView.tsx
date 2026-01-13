
import React, { useState, useEffect } from 'react';
import { Database, CloudDownload, CloudUpload, Check, AlertCircle, Settings as SettingsIcon, Code, Copy, Shield, LogOut, Smartphone, GlobeLock, User, Trash2 } from 'lucide-react';
import { Workout, UserProfile } from '../types';

interface SettingsProps {
  workouts: Workout[];
  onImport: (workouts: Workout[]) => void;
  onFetch: () => void | Promise<void>;
  onLogout: () => void;
  user: UserProfile | null;
}

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwVVNjgGy_qyHofaYkpn99jsaN5x453kdQsFaSU7mWgZn4O3Lo0q9H76lpI7o7LSDjieg/exec';

const RECOMMENDED_SCRIPT = `function doPost(e) {
  var request = JSON.parse(e.postData.contents);
  var email = request.email;
  var workouts = request.workouts;
  
  if (!email) return ContentService.createTextOutput("Error: No email provided");
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(email) || ss.insertSheet(email);
  
  sheet.clear();
  sheet.appendRow(["ID", "Date", "Type", "Raw JSON"]);
  
  workouts.forEach(function(w) {
    sheet.appendRow([w.id, w.date, w.type, JSON.stringify(w)]);
  });
  
  return ContentService.createTextOutput("OK");
}

function doGet(e) {
  var email = e.parameter.email;
  if (!email) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(email);
  
  if (!sheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
  
  var rows = sheet.getDataRange().getValues();
  var data = [];
  
  for (var i = 1; i < rows.length; i++) {
    try {
      data.push(JSON.parse(rows[i][3]));
    } catch(err) {}
  }
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

const SettingsView: React.FC<SettingsProps> = ({ workouts, onImport, onFetch, onLogout, user }) => {
  const [scriptUrl, setScriptUrl] = useState(localStorage.getItem('google-script-url') || DEFAULT_SCRIPT_URL);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading', msg: string } | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('google-script-url', scriptUrl);
  }, [scriptUrl]);

  const handleSync = async (type: 'up' | 'down') => {
    if (type === 'down') {
        await onFetch();
        return;
    }
    if (!user) return;
    
    setStatus({ type: 'loading', msg: 'Синхронизация...' });
    try {
      const payload = {
        email: user.email,
        workouts: workouts
      };
      await fetch(scriptUrl, { 
        method: 'POST', 
        mode: 'no-cors', 
        body: JSON.stringify(payload) 
      });
      setStatus({ type: 'success', msg: 'Данные в облаке!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus({ type: 'error', msg: 'Ошибка сети' });
    }
  };

  const copyScript = () => {
    navigator.clipboard.writeText(RECOMMENDED_SCRIPT);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 3000);
  };

  const clearAllLocalData = () => {
    if (confirm('ВНИМАНИЕ: Это удалит ВСЕ данные тренировок с этого устройства. Вы уверены?')) {
        localStorage.clear();
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
               <div className="w-16 h-16 bg-zinc-800 rounded-[22px] flex items-center justify-center text-zinc-500"><User size={28} /></div>
             )}
             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-zinc-900 flex items-center justify-center shadow-lg">
                <Check size={10} className="text-white font-black" />
             </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-zinc-100 leading-tight">{user?.name || 'Пользователь'}</h3>
            <p className="text-xs text-zinc-500 font-medium">{user?.email}</p>
          </div>
          <button onClick={onLogout} className="p-3 bg-zinc-800 text-rose-500 rounded-2xl border border-zinc-700 active:scale-90 transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                <GlobeLock size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Облако</h2>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Google Таблицы</p>
              </div>
            </div>
            <button onClick={clearAllLocalData} className="p-3 text-zinc-600 hover:text-rose-500 transition-colors" title="Полная очистка">
                <Trash2 size={18} />
            </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-1.5 ml-1">Apps Script URL</label>
            <input 
              type="text" 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3.5 px-4 text-[10px] font-bold text-zinc-400 focus:border-indigo-500 outline-none transition-all truncate"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleSync('up')} className="flex flex-col items-center gap-2 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl border border-zinc-700 transition-all active:scale-95 shadow-sm">
              <CloudUpload size={20} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-wider">Выгрузить</span>
            </button>
            <button onClick={() => handleSync('down')} className="flex flex-col items-center gap-2 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl border border-zinc-700 transition-all active:scale-95 shadow-sm">
              <CloudDownload size={20} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-wider">Загрузить</span>
            </button>
          </div>
        </div>

        {status && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : status.type === 'loading' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'}`}>
            <span className="text-xs font-bold">{status.msg}</span>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                <Code className="text-indigo-400" size={20} />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-100">Серверный код</h4>
        </div>
        
        <p className="text-[11px] text-zinc-500 leading-relaxed">
            Этот код обеспечивает изоляцию ваших данных. Каждая почта получает свою вкладку в таблице.
        </p>

        <button onClick={() => setShowCode(!showCode)} className="w-full py-3 bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 border border-zinc-700 active:scale-95 transition-all">
            {showCode ? 'Скрыть код' : 'Показать код'}
        </button>

        {showCode && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="bg-black/40 rounded-xl p-3 border border-zinc-800 relative group">
                    <pre className="text-[9px] text-zinc-500 overflow-x-auto font-mono leading-tight max-h-48">
                        {RECOMMENDED_SCRIPT}
                    </pre>
                    <button onClick={copyScript} className="absolute top-2 right-2 p-2 bg-indigo-600 rounded-lg text-white shadow-lg active:scale-90 transition-all">
                        {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
