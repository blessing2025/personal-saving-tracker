import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNumberFormatter } from 'react-aria';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../App';
import toast from 'react-hot-toast';
import { Target, Plus, Trash2 } from 'lucide-react';

export default function GoalPage() {
  const { t, profile } = useTranslation();
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm();
  const [goals, setGoals] = useState([]);
  const [contributionInputs, setContributionInputs] = useState({});

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

    const data = await db.goals.where('user_id').equals(user.id).toArray();
    setGoals(data);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data) => {
    try {
      await db.goals.add({
        id: crypto.randomUUID(),
        user_id: user.id,
        name: data.name,
        target_amount: parseFloat(data.target_amount),
        saved_amount: 0,
        deadline: data.deadline,
        color: 'bg-blue-600',
        synced_at: null
      });
      toast.success(t('goalCreated'));
      reset();
      fetchData();
    } catch (err) {
      toast.error('Failed to create goal');
    }
  };

  const handleContribution = async (id, currentAmount) => {
    const amount = contributionInputs[id];
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error(t('validAmount'));
      return;
    }

    try {
      await db.goals.update(id, {
        saved_amount: (currentAmount || 0) + parsedAmount,
        synced_at: null
      });
      toast.success(t('contributionAdded'));
      // Clear the input for this specific goal
      setContributionInputs(prev => ({ ...prev, [id]: '' }));
      fetchData();
    } catch (err) {
      toast.error('Failed to update goal');
    }
  };

  const handleDelete = async (id) => {
    await db.goals.delete(id);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('savingGoals')}</h2>

      {/* Add Goal Form */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="font-semibold mb-4 text-slate-700 dark:text-slate-300">{t('setNewGoal')}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input {...register('name', { required: true })} className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg dark:text-white" placeholder={t('goalName')} />
          <input {...register('target_amount', { required: true })} className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg dark:text-white" placeholder={t('target')} type="number" />
          <input {...register('deadline')} className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg text-slate-500" type="date" />
          <button type="submit" className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
            <Plus size={18} /> {t('add')}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const percentage = (goal.saved_amount / goal.target_amount) * 100;
          return (
            <div key={goal.name} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
                  <Target size={20} />
                </div>
                <button onClick={() => handleDelete(goal.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{goal.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">{t('deadline')}: {goal.deadline}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatter.format(goal.saved_amount)} {t('saved')}</span>
                  <span className="text-slate-500">{percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className={`${goal.color} h-full transition-all duration-500`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder={t('amount')}
                  value={contributionInputs[goal.id] || ''}
                  onChange={(e) => setContributionInputs({ 
                    ...contributionInputs, 
                    [goal.id]: e.target.value 
                  })}
                  className="flex-1 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={() => handleContribution(goal.id, goal.saved_amount)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  {t('add')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}