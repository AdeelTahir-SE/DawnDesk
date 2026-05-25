import { useState, useEffect } from "react";
import { Save, Shield, Bell, Moon, Globe, Download, Database } from "lucide-react";

export default function SettingsView() {
  const [settings, setSettings] = useState({
    currency: "USD",
    weekStart: "monday",
    theme: "dark",
    notifications: true,
    pinLock: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('finance_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('finance_settings', JSON.stringify(settings));
    // Optional: show a toast or something
  };

  return (
    <div className="p-8 flex flex-col gap-8 h-full animate-in fade-in zoom-in-95 duration-300 overflow-y-auto custom-scrollbar">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Settings</h2>
          <p className="text-white/50 text-sm">Customize your finance manager experience.</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-yellow-300 transition-transform active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.25)]">
          <Save className="w-5 h-5" /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* General Settings */}
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
            <Globe className="w-5 h-5 text-white/50" /> Preferences
          </h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/70">Base Currency</label>
              <select 
                value={settings.currency}
                onChange={e => setSettings({...settings, currency: e.target.value})}
                className="bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/70">Start of Week</label>
              <select 
                value={settings.weekStart}
                onChange={e => setSettings({...settings, weekStart: e.target.value})}
                className="bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50"
              >
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-neutral-900/50">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-white/50" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Dark Mode</span>
                  <span className="text-xs text-white/50">App appearance</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked disabled />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security & Data */}
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
            <Shield className="w-5 h-5 text-white/50" /> Security & Alerts
          </h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-neutral-900/50">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-white/50" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">App PIN Lock</span>
                  <span className="text-xs text-white/50">Require PIN to open finance manager</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.pinLock} onChange={e => setSettings({...settings, pinLock: e.target.checked})} />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-neutral-900/50">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-white/50" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Push Notifications</span>
                  <span className="text-xs text-white/50">Alerts for bills and budgets</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.notifications} onChange={e => setSettings({...settings, notifications: e.target.checked})} />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
              </label>
            </div>

            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4 mt-4">
              <Database className="w-5 h-5 text-white/50" /> Data Management
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-neutral-900/50 hover:bg-white/5 transition-colors">
                <Download className="w-5 h-5 text-white/70" />
                <span className="text-sm font-medium text-white">Export to CSV</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors group">
                <Shield className="w-5 h-5 text-red-500/70 group-hover:text-red-500" />
                <span className="text-sm font-medium text-red-500">Reset All Data</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
