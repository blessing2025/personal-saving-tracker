import React, { useState, useEffect } from 'react';
import { Bell, Globe, Moon } from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../App';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en-US');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [theme, setTheme] = useState('light');

  // Load existing settings from the local database on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      const profile = await db.profiles.get(user.id);
      if (profile) {
        if (profile.currency) setCurrency(profile.currency);
        if (profile.language) setLanguage(profile.language);
        if (profile.theme) setTheme(profile.theme);
      }
    };
    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      // Use .put instead of .update to create the record if it doesn't exist
      await db.profiles.put({
        id: user.id,
        currency,
        language,
        theme,
        synced_at: null // Set to null to trigger sync via useOfflineSync/syncData
      });
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('systemSettings')}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t('customizeApp')}</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400"><Globe size={20}/></div>
              <h3 className="font-bold text-slate-800 dark:text-white">{t('generalConfig')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('currency')}</label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="XOF">CFA (XOF)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('languageLocalization')}</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="en-US">English (US)</option>
                  <option value="fr-FR">Français</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('dateFormat')}</label>
                <select 
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none dark:text-white"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications & Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notifications */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400"><Bell size={20}/></div>
              <h3 className="font-bold text-slate-800 dark:text-white">{t('notifications')}</h3>
            </div>
            <div className="space-y-4">
              { [
                { key: 'emailAlertsIncome' },
                { key: 'goalAchievementAlerts' },
                { key: 'monthlyFinancialSummaries' }
              ].map((item, index) => (
                <label key={index} className="flex items-center justify-between p-1 cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{t(item.key)}</span>
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-blue-600 focus:ring-blue-500" defaultChecked />
                </label>
              ))}
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400"><Moon size={20}/></div>
              <h3 className="font-bold text-slate-800 dark:text-white">{t('theme')}</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('chooseInterface')}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setTheme('light')}
                className={`flex-1 py-3 rounded-xl border-2 transition font-bold text-sm ${theme === 'light' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-400'}`}
              >
                {t('lightMode')}
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`flex-1 py-3 rounded-xl border-2 transition font-bold text-sm ${theme === 'dark' ? 'border-blue-600 bg-blue-900 text-white' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-400'}`}
              >
                {t('darkMode')}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition shadow-lg"
          >
            {t('saveAllSettings')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;