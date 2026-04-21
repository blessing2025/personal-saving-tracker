import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useSavings = () => {
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

  const fetchSavingsData = async () => {
    try {
      setLoading(true);
      
      // Fetch Incomes
      const { data: incomes } = await supabase.from('incomes').select('amount');
      // Fetch Expenses
      const { data: expenses } = await supabase.from('expenses').select('amount');

      const totalInc = incomes?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      const totalExp = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      setStats({
        totalIncome: totalInc,
        totalExpense: totalExp,
        balance: totalInc - totalExp
      });
    } catch (error) {
      console.error('Error fetching savings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavingsData();
  }, []);

  return { stats, loading, refresh: fetchSavingsData };
};
