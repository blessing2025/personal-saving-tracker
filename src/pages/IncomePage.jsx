import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNumberFormatter } from 'react-aria';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../App';
import toast from 'react-hot-toast';
import { Trash2, PlusCircle } from 'lucide-react';

export default function IncomePage() {
  const { t, profile } = useTranslation();
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm();
  const [incomes, setIncomes] = useState([]);
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

    const data = await db.incomes.where('user_id').equals(user.id).toArray();
    const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
    setIncomes(sortedData);
    setTotalMonthly(data.reduce((sum, item) => sum + parseFloat(item.amount), 0));
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data) => {
    try {
      await db.incomes.add({
        id: crypto.randomUUID(),
        user_id: user.id,
        amount: parseFloat(data.amount),
        source: data.source,
        date: new Date().toISOString(),
        synced_at: null
      });
      toast.success('Income added!');
      reset();
      fetchData();
    } catch (err) {
      toast.error('Failed to add income');
    }
  };

  const handleDelete = async (id) => {
    await db.incomes.delete(id);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('incomeManagement')}</h2>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-bold border border-emerald-100">
          {t('monthlyTotal')}: +{formatter.format(totalMonthly)}
        </div>
      </div>

      {/* Add Income Form */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="font-semibold mb-4 text-slate-700 dark:text-slate-300">{t('recordNew')}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input {...register('source', { required: true })} className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white p-2 rounded-lg" placeholder={t('source')} />
          <input {...register('amount', { required: true })} className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white p-2 rounded-lg" placeholder={t('amount')} type="number" step="0.01" />
          <button type="submit" className="bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2">
            <PlusCircle size={18} /> {t('add')}
          </button>
        </form>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm uppercase font-semibold">
            <tr className="border-b dark:border-slate-700">
              <th className="p-4">{t('date')}</th>
              <th className="p-4">{t('source')}</th>
              <th className="p-4">{t('amount')}</th>
              <th className="p-4">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700">
            {incomes.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="p-4 text-slate-600 dark:text-slate-400">
                  {new Date(item.date).toLocaleDateString()}
                </td>
                <td className="p-4 font-medium dark:text-slate-200">{item.source}</td>
                <td className="p-4 text-emerald-600 font-bold">
                  +{formatter.format(item.amount)}
                </td>
                <td className="p-4">
                  <button onClick={() => handleDelete(item.id)} className="text-rose-500 hover:text-rose-700 transition-colors">
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