import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, CreditCard, Target, BarChart3, Settings, Mic } from 'lucide-react';
import { useTranslation } from '../../App';

const Sidebar = ({ children }) => {
  const { t } = useTranslation();
  const menuItems = [
    { name: t('dashboard'), icon: <LayoutDashboard size={20}/>, path: '/' },
    { name: t('income'), icon: <Wallet size={20}/>, path: '/income' },
    { name: t('expenses'), icon: <CreditCard size={20}/>, path: '/expenses' },
    { name: t('goals'), icon: <Target size={20}/>, path: '/goals' },
    { name: t('voiceNotes'), icon: <Mic size={20}/>, path: '/voice-notes' },
    { name: t('reports'), icon: <BarChart3 size={20}/>, path: '/reports' },
    { name: t('settings'), icon: <Settings size={20}/>, path: '/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-6 flex flex-col">
        <h1 className="text-xl font-bold text-blue-600 mb-10 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-md"></div> Tracker
        </h1>
        <nav className="flex-1">
          {menuItems.map((item) => (
            <NavLink 
              key={item.name} 
              to={item.path}
              className={({ isActive }) => `flex items-center gap-3 w-full p-3 rounded-lg transition-colors mb-2 ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
};

export default Sidebar;