import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { useNumberFormatter } from 'react-aria';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../App';
import toast from 'react-hot-toast';
import { 
  Trash2, 
  PlusCircle, 
  ShoppingBag, 
  Car, 
  Utensils, 
  Zap, 
  MoreHorizontal, 
  Lightbulb,
  ArrowRight,
  CreditCard,
  ShoppingBasket,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExpensePage() {
  const { t, profile } = useTranslation();
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm();

  const categoryIcons = {
    Rent: <CreditCard size={18} />,
    Food: <Utensils size={18} />,
    Transport: <Car size={18} />,
    Groceries: <ShoppingBasket size={18} />,
    Utilities: <Zap size={18} />,
    Other: <MoreHorizontal size={18} />
  };

  const formatter = useNumberFormatter({
    style: 'currency',
    currency: profile?.currency === 'FCAF' ? 'XOF' : profile?.currency || 'USD',
    currencyDisplay: 'symbol'
  });

  // Reactive data fetching
  const expenses = useLiveQuery(() => 
    db.expenses.where('user_id').equals(user?.id || '').toArray()
  , [user]);

  // Calculate metrics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const thisMonthExpenses = expenses?.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }) || [];

  const lastMonthExpenses = expenses?.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  }) || [];

  const totalMonthly = thisMonthExpenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const prevMonthTotal = lastMonthExpenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const variance = prevMonthTotal > 0 ? ((totalMonthly - prevMonthTotal) / prevMonthTotal) * 100 : 0;
  
  const budgetLimit = 1000; // Simulated limit, could be connected to Goals
  const budgetUsage = Math.min((totalMonthly / budgetLimit) * 100, 100);

  const onSubmit = async (data) => {
    try {
      await db.expenses.add({
        id: crypto.randomUUID(),
        user_id: user.id,
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description,
        date: new Date().toISOString(),
        synced_at: null
      });
      toast.success(t('expenseRecorded'));
      reset();
    } catch (err) {
      toast.error('Failed to add expense');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('deleteConfirm'))) {
      await db.expenses.delete(id);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-screen-2xl mx-auto space-y-10">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-headline">
          {t('expenseManagement')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Track, analyze, and optimize your financial outflows.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Hero Summary Card */}
        <div className="lg:col-span-12">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div>
              <span className="text-slate-500 dark:text-rose-400 font-label text-xs font-bold uppercase tracking-[0.1em]">{t('totalExpenses')}</span>
              <div className="text-5xl font-extrabold text-rose-600 dark:text-rose-400 font-headline mt-2">
                -{formatter.format(totalMonthly)}
              </div>
            </div>
            <div className="flex gap-4">
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">{t('bestMonth')}</span>
                <span className="text-xl font-bold dark:text-white">{formatter.format(prevMonthTotal)}</span>
              </div>
              <div className={`px-6 py-3 rounded-xl border ${variance <= 0 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800'}`}>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Variance</span>
                <span className={`text-xl font-bold ${variance <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Left Column: Form and Insight */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-xl font-bold font-headline text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <PlusCircle className="text-indigo-600 dark:text-indigo-400" size={20} />
              {t('recordNew')}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('category')}</label>
                <select 
                  {...register('category', { required: true })}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-body outline-none"
                >
                  <option value="">{t('category')}</option>
                  <option value="Rent">{t('categoryRent') || 'Rent'}</option>
                  <option value="Food">{t('categoryFood') || 'Food'}</option>
                  <option value="Transport">{t('categoryTransport') || 'Transport'}</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('amount')}</label>
                <input 
                  {...register('amount', { required: true })}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-body text-lg outline-none" 
                  placeholder="0.00" 
                  type="number" 
                  step="0.01" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('description')}</label>
                <textarea 
                  {...register('description')}
                  className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-body outline-none" 
                  placeholder="Description of the expense..." 
                  rows="3"
                ></textarea>
              </div>
              <button className="w-full bg-rose-600 text-white font-bold py-4 rounded-full active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-200 dark:shadow-none" type="submit">
                <CreditCard size={20} />
                {t('add')}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <h2 className="text-xl font-bold font-headline text-slate-800 dark:text-white mb-2">Spending Insight</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">You have utilized {budgetUsage.toFixed(0)}% of your monthly budget.</p>
            <div className="space-y-4">
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-4 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${budgetUsage > 90 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-rose-500'}`} 
                  style={{ width: `${budgetUsage}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-800 dark:text-slate-200">{formatter.format(totalMonthly)} used</span>
                <span className="text-slate-500">Limit: {formatter.format(budgetLimit)}</span>
              </div>
            </div>
            <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-start gap-4 border border-indigo-100 dark:border-indigo-800">
              <Lightbulb className="text-indigo-600 dark:text-indigo-400 shrink-0" size={20} />
              <p className="text-xs text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed">
                Strategy: Reducing Dining expenses by 15% next week could help you stay within your primary goal.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Table */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 h-full border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold font-headline text-slate-800 dark:text-white">{t('recentActivity')}</h2>
              <Link to="/transactions" className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1 hover:underline">
                {t('viewAllHistory')} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-slate-100 dark:border-slate-700">
                    <th className="pb-4 font-label text-xs font-bold text-slate-400 uppercase tracking-widest">{t('date')}</th>
                    <th className="pb-4 font-label text-xs font-bold text-slate-400 uppercase tracking-widest">{t('category')}</th>
                    <th className="pb-4 font-label text-xs font-bold text-slate-400 uppercase tracking-widest text-right">{t('amount')}</th>
                    <th className="pb-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {expenses?.slice(0, 5).map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-5 font-medium text-slate-600 dark:text-slate-400">{new Date(item.date).toLocaleDateString(profile?.language, { month: 'short', day: 'numeric' })}</td>
                      <td className="py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                            {categoryIcons[item.category] || <MoreHorizontal size={18} />}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.category}</span>
                        </div>
                      </td>
                      <td className="py-5 text-right font-headline font-bold text-rose-600 dark:text-rose-400">
                        -{formatter.format(item.amount)}
                      </td>
                      <td className="py-5 text-right">
                        <button onClick={() => handleDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-600 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-900/40 rounded-2xl flex items-center gap-6 border border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Zap className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-bold font-headline text-slate-800 dark:text-white">Smart Categorization</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">Our system automatically logs recurring expenses to spot waste faster.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
