import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../App';
import toast from 'react-hot-toast';
import { syncData, pullData } from '../lib/syncManager';

export default function Login() {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    const { data: authData, error } = await signIn(data);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully!');
      if (authData?.user?.id) {
        await pullData(authData.user.id);
        syncData(authData.user.id);
      }
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">S</div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('welcomeBack')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('manageAccount')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('emailAddress')}</label>
            <input 
              {...register('email', { required: true })}
              type="email" 
              placeholder="name@company.com"
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('password')}</label>
              <Link to="/reset-password" name="forgot-password" className="text-sm text-blue-600 hover:underline">Forgot?</Link>
            </div>
            <input 
              {...register('password', { required: true })}
              type="password" 
              placeholder="••••••••"
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {loading ? t('signingIn') : t('signIn')}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-600">
          {t('noAccount')} <Link to="/register" className="text-blue-600 font-bold hover:underline">{t('registerNow')}</Link>
        </p>
      </div>
    </div>
  );
}