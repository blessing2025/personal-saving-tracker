import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNumberFormatter } from 'react-aria';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../App';
import toast from 'react-hot-toast';
import { Trash2, PlusCircle } from 'lucide-react';

export default function ExpensePage() {
  const { t, profile } = useTranslation();
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm();
  const [expenses, setExpenses] = useState([]);
  const [totalMonthly, setTotalMonthly] = useState(0);

  const formatter = useNumberFormatter({
    style: 'currency',
    currency: profile?.currency === 'FCAF' ? 'XOF' : profile?.currency || 'USD',
    currencyDisplay: 'symbol'
  });

  const getCurrencySymbol = (code) => {
    const symbols = { USD: '$', EUR: '€', NGN: '₦', GBP: '£', FCAF: 'CFA' };
    return symbols[code] || '$';
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    const data = await db.expenses.where('user_id').equals(user.id).toArray();
    const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
    setExpenses(sortedData);
    setTotalMonthly(data.reduce((sum, item) => sum + parseFloat(item.amount), 0));
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data) => {
    try {
      await db.expenses.add({
        id: crypto.randomUUID(),
        user_id: user.id,
        amount: parseFloat(data.amount),
        category: data.category,
        date: new Date().toISOString(),
        synced_at: null
      });
      toast.success(t('expenseRecorded'));
      reset();
      fetchData();
    } catch (err) {
      toast.error('Failed to add expense');
    }
  };

  const handleDelete = async (id) => {
    await db.expenses.delete(id);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('expenseManagement')}</h2>
        <div className="bg-rose-50 text-rose-700 px-4 py-2 rounded-lg font-bold border border-rose-100">
          {t('monthlyTotal')}: -{formatter.format(totalMonthly)}
        </div>
      </div>

      {/* Add Expense Form */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="font-semibold mb-4 text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">{t('recordNew')}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select 
            {...register('category', { required: true })}
            className="border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
          >
            <option value="">{t('category')}</option>
            <option value="Rent">{t('categoryRent') || 'Rent'}</option>
            <option value="Food">{t('categoryFood') || 'Food'}</option>
            <option value="Transport">{t('categoryTransport') || 'Transport'}</option>
          </select>
          <input 
            {...register('amount', { required: true })}
            className="border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-700 dark:text-white" 
            placeholder={t('amount')} 
            type="number" 
            step="0.01" 
          />
          <button className="bg-rose-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-rose-700 transition shadow-sm">
            {t('add')}
          </button>
        </form>
      </div>

      {/* Expense History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="p-4 border-b border-slate-100 dark:border-slate-700 text-center w-16">#</th>
              <th className="p-4 border-b border-slate-100 dark:border-slate-700">{t('category')}</th>
              <th className="p-4 border-b border-slate-100 dark:border-slate-700">{t('date')}</th>
              <th className="p-4 border-b border-slate-100 dark:border-slate-700 text-right">{t('amount')}</th>
              <th className="p-4 border-b border-slate-100 dark:border-slate-700 text-center">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {expenses.map((item, index) => (
              <tr key={item.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-colors group">
                <td className="p-4 text-slate-400 dark:text-slate-500 text-center">
                  {String(index + 1).padStart(2, '0')}
                </td>
                <td className="p-4">
                  <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                    {item.category}
                  </span>
                </td>
                <td className="p-4 text-slate-500 dark:text-slate-400">
                  {new Date(item.date).toLocaleDateString()}
                </td>
                <td className="p-4 text-right text-rose-600 font-bold">
                  -{formatter.format(item.amount)}
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-400 dark:text-slate-600 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
