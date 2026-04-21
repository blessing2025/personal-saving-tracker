import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { syncData } from '../lib/syncManager';

export const useOfflineSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const handleSync = () => syncData(user.id);

    // Sync when coming online
    window.addEventListener('online', handleSync);
    // Initial sync attempt
    handleSync();

    return () => window.removeEventListener('online', handleSync);
  }, [user]);
};