import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../App';
import { Mail, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { t } = useTranslation();
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/login`, // Redirect to login page to handle session update
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset link sent to your email!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-500">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-indigo-900/5 border border-slate-100 dark:border-slate-800 p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-emerald-500"></div>
        
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <ShieldCheck size={24} />
            </div>
            <span className="text-xl font-black text-indigo-900 dark:text-white tracking-tighter">Personal Saving Tracker</span>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-2 font-headline">
            {t('forgotPassword')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Enter your email to receive a recovery link.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('emailAddress')}</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                {...register('email', { required: true })}
                type="email" 
                placeholder="name@atelier.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-5 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
              />
            </div>
          </div>
          
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            {loading ? t('loading') : (
              <>
                {t('sendResetLink')} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={16} /> {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}