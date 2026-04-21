import { useForm } from 'react-hook-form';
import { db } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import { syncData } from '../../lib/syncManager';
import toast from 'react-hot-toast';

export default function IncomeForm({ onSaved }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { user } = useAuth();

  const onSubmit = async (data) => {
    if (!user) {
      toast.error('You must be logged in to save data.');
      return;
    }

    try {
      const newIncome = {
        user_id: user.id,
        amount: parseFloat(data.amount),
        source: data.source,
        date: data.date,
        notes: data.notes || '',
        synced_at: null // This tells syncManager it needs to be uploaded
      };

      // Save to local Dexie DB first (Offline-first)
      await db.incomes.add(newIncome);
      
      toast.success('Income recorded locally!');
      reset();
      
      // Trigger UI refresh if parent component needs it
      if (onSaved) onSaved();

      // Attempt to sync to Supabase immediately if online
      syncData(user.id);
    } catch (err) {
      console.error('Error saving income:', err);
      toast.error('Failed to save data.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Add Income</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            step="0.01"
            {...register('amount', { required: 'Amount is required', min: 0.01 })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            placeholder="0.00"
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Source</label>
          <input
            type="text"
            {...register('source', { required: 'Source is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            placeholder="Salary, Freelance, etc."
          />
          {errors.source && <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            {...register('date', { required: 'Date is required' })}
            defaultValue={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Save Income
        </button>
      </form>
    </div>
  );
}