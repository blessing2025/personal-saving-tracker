import React, { useState, useEffect, useCallback } from 'react';
import { useNumberFormatter } from 'react-aria';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../App';
import toast from 'react-hot-toast';

export default function Transactions() {
  const { t, profile } = useTranslation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);

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

    const incomes = await db.incomes.toArray();
    const expenses = await db.expenses.toArray();

    const combined = [
      ...incomes.map(i => ({ ...i, type: 'income', tableName: 'incomes' })),
      ...expenses.map(e => ({ ...e, type: 'expense', tableName: 'expenses' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    setTransactions(combined);
  }, [user]);

  const handleDelete = async (table, id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try {
      await db[table].delete(id);
      toast.success(t('deleteSuccess'));
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 px-4 dark:text-white">{t('transactionHistory')}</h1>
      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg mx-4 border dark:border-slate-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('date')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('description')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('type')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('amount')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {transactions.map((t) => (
              <tr key={`${t.tableName}-${t.id}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(t.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                  {t.source || t.category || t.description || t('uncategorized')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {t.type.toUpperCase()}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  t.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {t.type === 'income' ? '+' : '-'}{formatter.format(t.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(t.tableName, t.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    {t('delete')}
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
