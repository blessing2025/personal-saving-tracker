import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  Globe, 
  Palette, 
  ShieldCheck, 
  Download, 
  Trash2, 
  ChevronRight, 
  Calendar,
  Sparkles,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { syncData, pullData } from '../lib/syncManager';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en-US');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [theme, setTheme] = useState('light');
  const [isSyncing, setIsSyncing] = useState(false);
  const [emailInflow, setEmailInflow] = useState(true);
  const [goalAlerts, setGoalAlerts] = useState(true);
  const [monthlySummaries, setMonthlySummaries] = useState(true);
 

  // Load existing settings from the local database on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      const profile = await db.profiles.get(user.id);
      if (profile) {
        if (profile.currency) setCurrency(profile.currency);
        if (profile.language) setLanguage(profile.language);
        if (profile.date_format) setDateFormat(profile.date_format);
        if (profile.theme) setTheme(profile.theme);
        if (profile.email_inflow !== undefined) setEmailInflow(profile.email_inflow);
        if (profile.goal_alerts !== undefined) setGoalAlerts(profile.goal_alerts);
        if (profile.monthly_summaries !== undefined) setMonthlySummaries(profile.monthly_summaries);
      
      }
    };
    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      // Get existing profile to avoid overwriting fields like full_name or avatar_url
      const existingProfile = await db.profiles.get(user.id);
      await db.profiles.put({
        ...existingProfile,
        id: user.id,
        currency,
        language,
        date_format: dateFormat,
        theme,
        email_inflow: emailInflow,
        goal_alerts: goalAlerts,
        monthly_summaries: monthlySummaries,
        synced_at: null // Set to null to trigger sync via useOfflineSync/syncData
      });
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings. Please try again.');
    }
  };

  const handleReset = () => {
    setCurrency('USD');
    setLanguage('en-US');
    setDateFormat('DD/MM/YYYY');
    setTheme('light');
    setEmailInflow(true);
    setGoalAlerts(true);
    setMonthlySummaries(true);
  };

  const handleManualSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    const syncToast = toast.loading('Syncing with cloud...');
    await syncData(user.id);
    await pullData(user.id);
    setIsSyncing(false);
    toast.success('System synchronized', { id: syncToast });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto space-y-12">
      {/* Header Section */}
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-2 font-label">
          {t('workspacePreferences') || 'Workspace Preferences'}
        </p>
        <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-headline">
          {t('systemSettings')}
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Config & Appearance (7/12) */}
        <section className="lg:col-span-7 space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Globe size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-headline">{t('generalConfig')}</h3>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">{t('primaryCurrency') || 'Primary Currency'}</label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-full py-4 px-6 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="XOF">CFA (XOF)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">{t('language')}</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-full py-4 px-6 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="fr-FR">Français</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">{t('dateFormat')}</label>
                  <select 
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-full py-4 px-6 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Palette size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-headline">{t('appearance') || 'Appearance'}</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Light Mode Option */}
              <button 
                onClick={() => setTheme('light')}
                className={`relative p-1 rounded-2xl border-4 transition-all text-left ${theme === 'light' ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-transparent bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'}`}
              >
                <div className="bg-white rounded-xl p-4 mb-2 shadow-sm aspect-video flex flex-col justify-between border border-slate-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                    <div className="w-8 h-2 rounded-full bg-slate-100"></div>
                  </div>
                  <div className="h-8 w-full bg-slate-50 rounded-lg"></div>
                </div>
                <div className="px-3 pb-2 flex items-center justify-between">
                  <span className={`font-bold text-sm ${theme === 'light' ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-500'}`}>Light Atelier</span>
                  {theme === 'light' && <CheckCircle2 size={18} className="text-indigo-600" />}
                </div>
              </button>

              {/* Dark Mode Option */}
              <button 
                onClick={() => setTheme('dark')}
                className={`relative p-1 rounded-2xl border-4 transition-all text-left ${theme === 'dark' ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-transparent bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'}`}
              >
                <div className="bg-slate-950 rounded-xl p-4 mb-2 shadow-sm aspect-video flex flex-col justify-between border border-slate-800">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                    <div className="w-8 h-2 rounded-full bg-slate-900"></div>
                  </div>
                  <div className="h-8 w-full bg-slate-800 rounded-lg"></div>
                </div>
                <div className="px-3 pb-2 flex items-center justify-between">
                  <span className={`font-bold text-sm ${theme === 'dark' ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-500'}`}>Midnight Ledger</span>
                  {theme === 'dark' && <CheckCircle2 size={18} className="text-indigo-600" />}
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Notifications & Maintenance (5/12) */}
        <section className="lg:col-span-5 space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400">
                <BellRing size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-headline">{t('notifications')}</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between group">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('emailAlertsIncome')}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-0.5">System activity and alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={emailInflow} onChange={(e) => setEmailInflow(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between group">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('goalAchievementAlerts')}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-0.5">Alert when goals are completed</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={goalAlerts} onChange={(e) => setGoalAlerts(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between group">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('monthlyFinancialSummaries')}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-0.5">Monthly performance notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={monthlySummaries} onChange={(e) => setMonthlySummaries(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div> 
        </section>
      </div>

      {/* Footer Actions */}
      <footer className="mt-12 flex flex-col sm:flex-row justify-between items-center py-10 border-t border-slate-200 dark:border-slate-800 gap-6">
        <button 
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          <Zap size={14} className={isSyncing ? "animate-pulse text-amber-500" : "text-amber-500"} />
          <p className="text-sm font-medium">
            {isSyncing ? 'Syncing...' : `Last synced: Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </button>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={handleReset}
            className="flex-1 sm:px-8 py-3 text-slate-500 font-bold hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            {t('resetDefaults') || 'Reset Defaults'}
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 sm:px-10 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-xl shadow-indigo-900/20 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95"
          >
            {t('saveAllSettings')}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default SettingsPage;