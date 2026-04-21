import { db } from './db';
import { supabase } from './supabaseClient';

export const pullData = async (userId) => {
  if (!navigator.onLine || !userId) return;

  const tables = ['incomes', 'expenses', 'goals', 'profiles'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(
          table === 'profiles' ? 'id' : 'user_id', // Profiles table uses 'id' as user ID
          userId
        );

      if (error) throw error;
      if (data) await db[table].bulkPut(data);
    } catch (err) {
      console.error(`[Sync] Failed to pull ${table}:`, err);
    }
  }
};

export const syncData = async (userId) => {
  if (!navigator.onLine || !userId) return;

  const tables = ['incomes', 'expenses', 'goals', 'profiles'];

  for (const table of tables) {
    try {
      // Find records that haven't been synced yet
      const unsyncedItems = await db[table]
        .filter(item => !item.synced_at)
        .toArray();

      // Filter out legacy records with non-UUID IDs (like "1") to avoid Supabase 400s
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validItems = unsyncedItems.filter(item => uuidRegex.test(item.id));

      if (validItems.length === 0) continue;

      // Prepare items for sync
      // CRITICAL FIX: Only sync records belonging to the current session user.
      const itemsToPush = validItems
        .filter(item => table === 'profiles' ? item.id === userId : item.user_id === userId)
        .map(({ synced_at, ...item }) => {
          const payload = { ...item };
          if (table !== 'profiles') payload.user_id = userId;
          return payload;
      });

      // 1. Sync to Supabase
      const { data: supabaseData, error: supabaseError } = await supabase
        .from(table)
        .upsert(itemsToPush, { onConflict: 'id' })
        .select();

      if (supabaseError) {
        console.error(`[Sync] Supabase Error (${supabaseError.code}) for ${table}:`, {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          payload: itemsToPush[0] // Log the first item to see structure
        });
      }

      if (!supabaseError && supabaseData) {
        // Mark as synced in local DB
        const now = new Date().toISOString();
        const updatePromises = itemsToPush.map(item => 
          db[table].update(item.id, { synced_at: now })
        );
        await Promise.all(updatePromises);
        console.log(`Synced ${supabaseData.length} items to Supabase for ${table}`);
      }
    } catch (err) {
      console.error(`[Sync] Critical failure for ${table}:`, err);
    }
  }
};
