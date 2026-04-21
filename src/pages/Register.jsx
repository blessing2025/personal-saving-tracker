import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../App';
import toast from 'react-hot-toast';

export default function Register() {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    const { error } = await signUp(data);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for confirmation!');
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('createAccount')}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">{t('startJourney')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('firstName')}</label>
              <input 
                {...register('firstName', { required: true })} 
                type="text" 
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('lastName')}</label>
              <input 
                {...register('lastName', { required: true })} 
                type="text" 
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('email')}</label>
            <input 
              {...register('email', { required: true })} 
              type="email" 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('password')}</label>
            <input 
              {...register('password', { required: true, minLength: 6 })} 
              type="password" 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-black transition mt-4 disabled:opacity-50"
          >
            {loading ? t('creating') : t('createFreeAccount')}
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm text-slate-600">
          {t('alreadyHaveAccount')} <Link to="/login" className="text-blue-600 font-bold hover:underline">{t('logIn')}</Link>
        </p>
      </div>
    </div>
  );
}