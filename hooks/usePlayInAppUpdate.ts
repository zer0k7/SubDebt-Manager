import { useEffect, useState, useCallback } from 'react';
import {
  checkAndTriggerPlayUpdate,
  completePlayStoreUpdate,
} from '../utils/playUpdateManager';

export const usePlayInAppUpdate = () => {
  const [isUpdateReady, setIsUpdateReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const runCheck = async () => {
      await checkAndTriggerPlayUpdate(false, () => {
        if (isMounted) {
          setIsUpdateReady(true);
        }
      });
    };

    runCheck();

    return () => {
      isMounted = false;
    };
  }, []);

  const installDownloadedUpdate = useCallback(() => {
    completePlayStoreUpdate();
  }, []);

  return {
    isUpdateReady,
    installDownloadedUpdate,
  };
};
