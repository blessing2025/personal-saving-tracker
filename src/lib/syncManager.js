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
      if (data) {
        // Identify items that have unsynced local changes (including deletions)
        const localPending = await db[table].filter(item => !item.synced_at).toArray();
        const pendingIds = new Set(localPending.map(i => i.id));
        
        // Only update local records that are already in sync with the server
        const toUpdate = data.filter(remoteItem => !pendingIds.has(remoteItem.id));
        await db[table].bulkPut(toUpdate);
      }
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
      // Find records that haven't been synced yet (includes new, modified, and deleted)
      const unsyncedItems = await db[table].filter(item => !item.synced_at).toArray();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // Filter only items belonging to the current user with valid UUIDs
      const userItems = unsyncedItems.filter(item => {
        const belongsToUser = table === 'profiles' ? item.id === userId : item.user_id === userId;
        return belongsToUser && uuidRegex.test(item.id);
      });

      if (userItems.length === 0) continue;

      // 1. Handle Deletions: Push removals to Supabase first
      const itemsToDelete = userItems.filter(item => item._deleted);
      for (const item of itemsToDelete) {
        const { error: delError } = await supabase.from(table).delete().eq('id', item.id);
        if (!delError) {
          await db[table].delete(item.id); // Hard delete locally once cloud is confirmed
        } else {
          console.error(`[Sync] Delete failed for ${table}/${item.id}:`, delError);
        }
      }

      // 2. Handle Upserts: Push new/modified records
      const itemsToUpsert = userItems.filter(item => !item._deleted);
      if (itemsToUpsert.length === 0) continue;

      const payload = itemsToUpsert.map(({ synced_at, _deleted, ...item }) => {
          const payload = { ...item };
          if (table === 'profiles') {
            payload.id = userId; // Force ID to match current authenticated user
          } else {
            payload.user_id = userId;
          }
          return payload;
      });
      const { data: supabaseData, error: supabaseError } = await supabase
        .from(table)
        .upsert(payload, { onConflict: 'id' })
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
