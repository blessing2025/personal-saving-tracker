import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useTranslation } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Wallet, Receipt, Plus, Calendar, MoreHorizontal, ShoppingBag, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { t, profile } = useTranslation();
  const { user } = useAuth();

  // Fetch data from Dexie
  const incomes = useLiveQuery(() => db.incomes.where('user_id').equals(user?.id || '').toArray(), [user]);
  const expenses = useLiveQuery(() => db.expenses.where('user_id').equals(user?.id || '').toArray(), [user]);

  // Calculate Totals
  const totalIncome = incomes?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const totalExpense = expenses?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const netWorth = totalIncome - totalExpense;

  // Combine and sort recent activity
  const recentActivity = [
    ...(incomes || []).map(i => ({ ...i, type: 'income' })),
    ...(expenses || []).map(e => ({ ...e, type: 'expense' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

  const formatCurrency = (val) => {
    try {
      return new Intl.NumberFormat(profile?.language || 'en-US', {
        style: 'currency',
        currency: profile?.currency || 'USD',
      }).format(val);
    } catch (e) {
      // Fallback if currency code is invalid (like the FCAF error)
      return new Intl.NumberFormat(profile?.language || 'en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
      }).format(val) + ` ${profile?.currency || ''}`;
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Section */}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Personal Saving Tracker</p>
          <h1 className="text-5xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
            {t('welcomeBack')}, {profile?.full_name?.split(' ')[0] || user?.user_metadata?.firstName || user?.email?.split('@')[0] || ''}.
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">
            Financial summary for current period
          </p>
        </div>
      </header>

      {/* Key Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <MetricCard title={t('netWorth')} value={formatCurrency(netWorth)} icon={<Wallet />} color="indigo" trend="12.4%" />
        <MetricCard title={t('totalIncome')} value={formatCurrency(totalIncome)} icon={<TrendingUp />} color="emerald" trend="+$2.4k" isPositive />
        <MetricCard title={t('totalExpenses')} value={formatCurrency(totalExpense)} icon={<Receipt />} color="rose" trend="4.2%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-8 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-2xl font-extrabold tracking-tight dark:text-white">{t('recentActivity')}</h3>
              <Link to="/transactions" className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline">{t('viewAllLedger')}</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{t('transactions')}</th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{t('date')}</th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{t('category')}</th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 text-right">{t('amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {recentActivity.map((act, i) => (
                    <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 ${act.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'} rounded-full flex items-center justify-center`}>
                             {act.type === 'income' ? <Briefcase className="text-emerald-600 dark:text-emerald-400" size={18}/> : <ShoppingBag className="text-indigo-600 dark:text-indigo-400" size={18}/>}
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{act.source || act.description || 'Entry'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-slate-500 dark:text-slate-400 font-medium">{new Date(act.date).toLocaleDateString()}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">
                          {act.category || 'General'}
                        </span>
                      </td>
                      <td className={`px-8 py-6 text-right font-extrabold ${act.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-white'}`}>
                        {act.type === 'income' ? '+' : '-'}{formatCurrency(act.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-indigo-600 dark:bg-indigo-700 text-white rounded-xl overflow-hidden relative p-8 flex flex-col justify-between min-h-[350px] shadow-xl">
            <div className="relative z-10">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">
                {t('editorialInsight')}
              </span>
              <h3 className="text-3xl font-black tracking-tighter mt-6 leading-tight">
                {t('savingsVelocityMsg')}
              </h3>
              <p className="mt-4 text-indigo-100/80 leading-relaxed font-medium">
                {t('lifestyleInsightMsg')}
              </p>
            </div>
            <button className="relative z-10 w-full bg-white text-indigo-600 font-bold py-4 rounded-full transition-transform active:scale-95 shadow-xl hover:bg-slate-50">
              {t('detailedForecast')}
            </button>
          </div>

          {/* Chart Mockup */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-extrabold text-lg tracking-tight dark:text-white">{t('incomeFlow')}</h3>
              <MoreHorizontal className="text-slate-400 cursor-pointer" />
            </div>
            <div className="flex items-end gap-2 h-40 mb-6">
              {[40, 65, 55, 90, 45, 75].map((h, i) => (
                <div key={i} style={{ height: `${h}%` }} className={`flex-1 ${h === 90 ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-700'} rounded-t-lg transition-all hover:bg-indigo-400`} />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
              <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
            </div>
            <div className="pt-8 border-t border-slate-100 dark:border-slate-700 flex justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('averageMonthly')}</p>
                <p className="text-xl font-extrabold mt-1 dark:text-white">$9,240</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('bestMonth')}</p>
                <p className="text-xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">$12,450</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contextual FAB */}
    </div>
  );
};

const MetricCard = ({ title, value, icon, color, trend, isPositive }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between min-h-[220px]">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-full ${
        color === 'indigo' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' :
        color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
        'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
      }`}>
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <span className={`flex items-center gap-1 font-bold text-sm px-3 py-1 rounded-full ${isPositive ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400'}`}>
        {trend}
      </span>
    </div>
    <div className="mt-4">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</p>
      <h2 className={`text-4xl font-extrabold tracking-tighter mt-1 dark:text-white`}>{value}</h2>
    </div>
  </div>
);

export default Dashboard;