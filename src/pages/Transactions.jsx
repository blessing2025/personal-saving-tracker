import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNumberFormatter } from 'react-aria';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../App';
import toast from 'react-hot-toast';
import {
  Download,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Activity,
  ShieldCheck,
  Trash2,
  Laptop,
  TrendingUp,
  Utensils,
  Home,
  Car,
  Tag,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Transactions() {
  const { t, profile } = useTranslation();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all'); // 'all', 'income', 'expense'

  const formatter = useNumberFormatter({
    style: 'currency',
    currency: profile?.currency === 'FCAF' ? 'XOF' : profile?.currency || 'USD',
    currencyDisplay: 'narrowSymbol'
  });

  const expenses = useLiveQuery(() =>
    user ? db.expenses.where('user_id').equals(user.id).toArray() : []
    , [user]) || [];

  const goals = useLiveQuery(() =>
    user ? db.goals.where('user_id').equals(user.id).toArray() : []
    , [user]) || [];

  // Reactive data fetching
  const incomes = useLiveQuery(() =>
    user ? db.incomes.where('user_id').equals(user.id).toArray() : []
    , [user]) || [];

  // Combine and filter
  const allTransactions = useMemo(() => [
    ...incomes.map(i => ({ ...i, type: 'income', tableName: 'incomes' })),
    ...expenses.map(e => ({ ...e, type: 'expense', tableName: 'expenses' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)), [incomes, expenses]);

  const filteredTransactions = useMemo(() => allTransactions.filter(t => {
    if (filter === 'income') return t.type === 'income';
    if (filter === 'expense') return t.type === 'expense';
    return true;
  }), [allTransactions, filter]);

  // Summary Calculations (Current Month)
  const now = new Date();
  const currentMonthTransactions = useMemo(() => allTransactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }), [allTransactions]);

  const totalInflow = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalOutflow = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const netSavings = totalInflow - totalOutflow;

  // Category Breakdown for sidebar
  const categoryTotals = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
      return acc;
    }, {});

  const topCategories = Object.entries(categoryTotals)
    .map(([name, amount]) => ({
      name,
      percent: totalOutflow > 0 ? Math.round((amount / totalOutflow) * 100) : 0
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);

  // Vault Status (Goal progress)
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.saved_amount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const handleDelete = async (table, id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try {
      await db[table].delete(id);
      toast.success(t('deleteSuccess') || 'Transaction deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const getCategoryIcon = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('tech') || cat.includes('electronic')) return <Laptop size={14} />;
    if (cat.includes('din') || cat.includes('food')) return <Utensils size={14} />;
    if (cat.includes('life') || cat.includes('home') || cat.includes('house')) return <Home size={14} />;
    if (cat.includes('transit') || cat.includes('transport') || cat.includes('car')) return <Car size={14} />;
    return <Tag size={14} />;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto space-y-12">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-extrabold text-indigo-900 dark:text-white tracking-tight mb-2 font-headline">
            {t('transactionHistory')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            <CalendarIcon size={16} />
            {now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95">
          <Download size={18} />
          {t('exportPDF')}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Main Transactions */}
        <div className="lg:col-span-8 space-y-6">
          {/* Filters Bar */}
          <div className="flex items-center gap-1 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full w-fit border border-slate-200 dark:border-slate-700">
            {['all', 'income', 'expense'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  filter === f
                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'
                }`}
              >
                {t(f) || f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Transaction Table Container */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">{t('date')}</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">{t('description')}</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">{t('category')}</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">{t('amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {filteredTransactions.map((item) => (
                    <tr key={`${item.tableName}-${item.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                            {item.source || item.description || t('entry')}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-tighter">ID: #{item.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.type === 'income'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {getCategoryIcon(item.category)}
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className={`text-lg font-extrabold ${item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {item.type === 'income' ? '+' : '-'} {formatter.format(item.amount)}
                          </span>
                          <button onClick={() => handleDelete(item.tableName, item.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-600 transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500">{t('showingTransactions', { count: filteredTransactions.length })}</span>
              <div className="flex gap-2">
                <button className="p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button className="p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Insights & Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Monthly Summary Card */}
          <div className="bg-indigo-600 dark:bg-indigo-700 text-white rounded-2xl p-8 relative overflow-hidden shadow-xl shadow-indigo-900/10">
            <div className="relative z-10">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-6 opacity-70">{t('monthlySummary')}</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs opacity-80 mb-1">{t('totalInflow') || 'Total Inflow'}</p>
                  <p className="text-3xl font-black tracking-tight">{formatter.format(totalInflow)}</p>
                </div>
                <div className="h-px bg-white/10 w-full"></div>
                <div>
                  <p className="text-xs opacity-80 mb-1">{t('totalOutflow') || 'Total Outflow'}</p>
                  <p className="text-3xl font-black tracking-tight text-indigo-200">{formatter.format(totalOutflow)}</p>
                </div>
                <div className="h-px bg-white/10 w-full"></div>
                <div>
                  <p className="text-xs opacity-80 mb-1">{t('netSavings')}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-black tracking-tight">{formatter.format(netSavings)}</p>
                    <span className="px-2 py-0.5 bg-emerald-400 text-indigo-900 text-[10px] rounded-full font-bold uppercase">+22%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          </div>

          {/* Spend Breakdown Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t('topCategories')}</h3>
              <Activity size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-6">
              {topCategories.map((cat, i) => (
                <div key={cat.name} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <span className="text-slate-400">{cat.percent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                      style={{ width: `${cat.percent}%`, opacity: 1 - i * 0.25 }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors border border-indigo-100 dark:border-indigo-800 uppercase tracking-widest">
              {t('viewDetailedAnalytics') || 'View Detailed Analytics'}
            </button>
          </div>

          {/* Vault Status Card */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">{t('vaultStatus') || 'Vault Status'}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t('emergencyFundStatus', { percent: overallProgress }) || `Your emergency fund is currently ${overallProgress}% of your target goal.`}
                </p>
              </div>
              <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex -space-x-2">
              {[1, 2].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
                  US
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                +2
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
