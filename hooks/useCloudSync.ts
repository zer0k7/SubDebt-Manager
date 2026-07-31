import { useState } from 'react';

export const useCloudSync = () => {
  const [isConnected] = useState(false);
  const [isSyncing] = useState(false);
  const [lastSync] = useState<string | null>(null);

  const connect = async () => {
    // Fully offline mock
    return Promise.resolve();
  };

  const disconnect = async () => {
    // Fully offline mock
    return Promise.resolve();
  };

  const backupNow = async (): Promise<boolean> => {
    // Fully offline mock
    return Promise.resolve(false);
  };

  const restoreNow = async (): Promise<any | null> => {
    // Fully offline mock
    return Promise.resolve(null);
  };

  return {
    isConnected,
    isSyncing,
    lastSync,
    connect,
    disconnect,
    backupNow,
    restoreNow,
    isReady: false,
  };
};
