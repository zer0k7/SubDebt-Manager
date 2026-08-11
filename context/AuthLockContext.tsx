import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { SecurityLockOverlay } from '../components/SecurityLockOverlay';

interface AuthLockContextType {
  isLockEnabled: boolean;
  securityPin: string | null;
  lockApp: () => void;
  unlockApp: () => void;
  enableLock: (pin?: string) => void;
  disableLock: () => void;
  removePin: () => void;
}

const AuthLockContext = createContext<AuthLockContextType | undefined>(undefined);

export const AuthLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [securityPin, setSecurityPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const loadLockSettings = useCallback(async () => {
    try {
      const isBio = await storage.getString(STORAGE_KEYS.IS_BIOMETRIC_AUTH_ENABLED);
      const pin = await storage.getString('security_pin_code');

      const enabled = isBio === 'true';
      setIsLockEnabled(enabled);
      setSecurityPin(pin || null);

      if (enabled) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadLockSettings();
  }, [loadLockSettings]);

  // AppState Listener (Background to Foreground Lock)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && isLockEnabled) {
        setIsLocked(true);
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [isLockEnabled]);

  const lockApp = useCallback(() => setIsLocked(true), []);
  const unlockApp = useCallback(() => setIsLocked(false), []);

  const enableLock = useCallback(async (pin?: string) => {
    await storage.set(STORAGE_KEYS.IS_BIOMETRIC_AUTH_ENABLED, 'true');
    if (pin) await storage.set('security_pin_code', pin);
    setIsLockEnabled(true);
    if (pin) setSecurityPin(pin);
  }, []);

  const disableLock = useCallback(async () => {
    await storage.set(STORAGE_KEYS.IS_BIOMETRIC_AUTH_ENABLED, 'false');
    await storage.delete('security_pin_code');
    setIsLockEnabled(false);
    setSecurityPin(null);
    setIsLocked(false);
  }, []);

  const removePin = useCallback(async () => {
    await storage.delete('security_pin_code');
    setSecurityPin(null);
  }, []);

  return (
    <AuthLockContext.Provider
      value={{
        isLockEnabled,
        securityPin,
        lockApp,
        unlockApp,
        enableLock,
        disableLock,
        removePin,
      }}
    >
      {children}
      <SecurityLockOverlay
        visible={isLocked && isLockEnabled}
        onUnlockSuccess={unlockApp}
        correctPin={securityPin}
        allowBiometric={true}
      />
    </AuthLockContext.Provider>
  );
};

export const useAuthLock = () => {
  const ctx = useContext(AuthLockContext);
  if (!ctx) throw new Error('useAuthLock must be used within AuthLockProvider');
  return ctx;
};
