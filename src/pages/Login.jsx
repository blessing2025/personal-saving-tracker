import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { Lock, Mail, ArrowRight, Wallet, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { syncData, pullData } from '../lib/syncManager';
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
export default function Login() {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { signIn, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
 // Effect to handle password reset redirect
  useEffect(() => {
    const { hash } = window.location;
    const params = new URLSearchParams(hash.substring(1)); // Parse hash fragment
    const type = params.get('type');
    const accessToken = params.get('access_token');

    if (type === 'recovery' && accessToken) {
      // Clear the hash from the URL to prevent re-processing on refresh
      window.history.replaceState({}, document.title, window.location.pathname);

      // Supabase's getSession will automatically pick up the access_token from the hash
      // and update the session. We then navigate the user to the profile page
      // where they can update their password.
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          toast.success(t('passwordResetReady'));
          navigate('/profile'); // Redirect to profile page to set new password
        } else {
          toast.error(t('passwordResetFailed'));
        }
      }).catch(err => {
        console.error("Error getting session after password reset:", err);
        toast.error(t('passwordResetFailed'));
      });
    }
  }, [navigate, t]); // Dependencies: navigate and t

  const onSubmit = async (data) => {
    setLoading(true);
    const { data: authData, error } = await signIn(data);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('welcomeBack'));
      if (authData?.user?.id) {
        await syncData(authData.user.id); // Push local deletions first
        await pullData(authData.user.id); // Then pull fresh state
      }
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-500">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-indigo-900/5 border border-slate-100 dark:border-slate-800 p-10 relative overflow-hidden">
        {/* Brand Accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-emerald-500"></div>
        
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-xl font-black text-indigo-900 dark:text-white tracking-tighter">Personal Saving Tracker</span>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-2 font-headline">{t('welcomeBack')}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{t('manageAccount')}</p>
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
              className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-5 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none ${errors.email ? 'ring-2 ring-rose-500/50' : ''}`}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('password')}</label>
            <Link to="/reset-password" name="forgot-password" size="sm" className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">{t('forgotPassword')}</Link>
            </div> 
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                {...register('password', { required: true })}
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
              className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-5 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none ${errors.password ? 'ring-2 ring-rose-500/50' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            {loading ? t('signingIn') : (
              <>
                {t('signIn')} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-600">
          {t('noAccount')} <Link to="/register" className="text-indigo-600 font-bold hover:underline">{t('registerNow')}</Link>
        </p>
      </div>
    </div>
  );
}