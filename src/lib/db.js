import Dexie from 'dexie';

export const db = new Dexie('SavingTrackerDB');

// Define the local schema. 
// Syntax: 'primaryKey, indexedField1, indexedField2'
db.version(6).stores({
  incomes: 'id, user_id, amount, source, date, synced_at, _deleted',
  expenses: 'id, user_id, amount, category, date, synced_at, _deleted',
  goals: 'id, user_id, name, target_amount, saved_amount, deadline, color, synced_at, _deleted',
  profiles: 'id, full_name, language, currency, theme, synced_at, _deleted',
  voiceRecords: 'id, user_id, _deleted'
});
