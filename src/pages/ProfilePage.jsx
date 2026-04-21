import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../App';
import { User, ShieldCheck, Mail, Camera } from 'lucide-react';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('userProfile')}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t('manageAccount')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                <User size={40} />
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-slate-600 dark:text-slate-300 hover:text-blue-600 transition shadow-sm">
                <Camera size={14} />
              </button>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">{user?.email?.split('@')[0]}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm italic">{t('authenticatedMember')}</p>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Details Form */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-50 dark:border-slate-700">
              <Mail size={18} className="text-blue-600 dark:text-blue-400" />
              <h4 className="font-semibold text-slate-700 dark:text-slate-200">{t('personalDetails')}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{t('fullName')}</label>
                <input 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  defaultValue={user?.user_metadata?.firstName ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}` : 'Not set'} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{t('emailAddress')}</label>
                <input className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-slate-400 rounded-lg outline-none" readOnly value={user?.email} />
              </div>
            </div>
            <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">{t('updateProfile')}</button>
          </div>

          {/* Security Form */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-50 dark:border-slate-700">
              <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400" />
              <h4 className="font-semibold text-slate-700 dark:text-slate-200">{t('securityPassword')}</h4>
            </div>
            <div className="space-y-4">
              <input type="password" placeholder={t('currentPassword')} className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" placeholder={t('newPassword')} className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button className="mt-6 border border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">{t('changePassword')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}