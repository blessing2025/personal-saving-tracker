import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../App';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed out');
      navigate('/login');
    }
  };

  return (
    <nav className="bg-indigo-600 dark:bg-slate-800 border-b dark:border-slate-700 shadow-lg transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white font-bold text-xl">SavingsTracker</Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/" className="text-indigo-100 hover:text-white px-3 py-2 text-sm font-medium">{t('dashboard')}</Link>
                <Link to="/income" className="text-indigo-100 hover:text-white px-3 py-2 text-sm font-medium">{t('income')}</Link>
                <Link to="/expenses" className="text-indigo-100 hover:text-white px-3 py-2 text-sm font-medium">{t('expenses')}</Link>
                <Link to="/goals" className="text-indigo-100 hover:text-white px-3 py-2 text-sm font-medium">{t('goals')}</Link>
                <Link to="/voice-notes" className="text-indigo-100 hover:text-white px-3 py-2 text-sm font-medium">{t('voiceNotes')}</Link>
                <Link to="/transactions" className="text-indigo-100 hover:text-white px-3 py-2 text-sm font-medium">{t('history')}</Link>
                <Link to="/reports" className="text-indigo-100 hover:text-white px-3 py-2 text-sm font-medium">{t('reports')}</Link>
                <Link to="/settings" className="text-indigo-100 hover:text-white px-3 py-2 text-sm font-medium">{t('settings')}</Link>
                <Link to="/profile" className="text-indigo-100 hover:text-white px-3 py-2 text-sm font-medium border-l border-indigo-500 ml-2 pl-4">{t('profile')}</Link>
                <button onClick={handleLogout} className="bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-800">{t('logout')}</button>
              </>
            ) : (
              <Link to="/login" className="text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500">{t('login')}</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}