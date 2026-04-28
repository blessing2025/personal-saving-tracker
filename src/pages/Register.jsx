import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../App';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ShieldPlus, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-500">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-indigo-900/5 border border-slate-100 dark:border-slate-800 p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-emerald-500"></div>
        
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <ShieldPlus size={24} />
            </div>
            <span className="text-xl font-black text-indigo-900 dark:text-white tracking-tighter">Personal Saving Tracker</span>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-2 font-headline">{t('createAccount')}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{t('startJourney')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('firstName')}</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  {...register('firstName', { required: true })} 
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-5 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('lastName')}</label>
              <input 
                {...register('lastName', { required: true })} 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('email')}</label>
            <input 
              {...register('email', { required: true })} 
              type="email" 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" 
            />
          </div>
           <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('location')}</label>
            <input 
              {...register('location', { required: true })} 
              type="text" 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('phoneNumber')}</label>
            <input 
              {...register('phoneNumber', { required: true })} 
              type="tel" 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('password')}</label>
            <div className="relative">
              <input 
                {...register('password', { required: true, minLength: 6 })} 
                type={showPassword ? "text" : "password"} 
                className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-5 pr-12 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none ${errors.password ? 'ring-2 ring-rose-500/50' : ''}`} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password?.type === 'minLength' && (
              <p className="text-rose-500 text-[10px] font-bold uppercase ml-1 mt-1">{t('passwordTooShort')}</p>
            )}
          </div>
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group mt-4"
          >
            {loading ? t('creating') : (
              <>
                {t('createFreeAccount')} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm text-slate-600">
          {t('alreadyHaveAccount')} <Link to="/login" className="text-blue-600 font-bold hover:underline">{t('logIn')}</Link>
        </p>
      </div>
    </div>
  );
}