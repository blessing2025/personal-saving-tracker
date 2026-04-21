import { useForm } from 'react-hook-form';
import { db } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import { syncData } from '../../lib/syncManager';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Utilities', 
  'Rent/Mortgage', 'Entertainment', 'Health', 'Other'
];

export default function ExpenseForm({ onSaved }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { user } = useAuth();

  const onSubmit = async (data) => {
    if (!user) {
      toast.error('You must be logged in to save data.');
      return;
    }

    try {
      const newExpense = {
        user_id: user.id,
        amount: parseFloat(data.amount),
        category: data.category,
        date: data.date,
        notes: data.notes || '',
        synced_at: null
      };

      await db.expenses.add(newExpense);
      
      toast.success('Expense recorded locally!');
      reset();
      
      if (onSaved) onSaved();

      syncData(user.id);
    } catch (err) {
      console.error('Error saving expense:', err);
      toast.error('Failed to save data.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Add Expense</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            step="0.01"
            {...register('amount', { required: 'Amount is required', min: 0.01 })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            placeholder="0.00"
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            {...register('category', { required: 'Category is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          >
            <option value="">Select Category</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            {...register('date', { required: 'Date is required' })}
            defaultValue={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Save Expense
        </button>
      </form>
    </div>
  );
}