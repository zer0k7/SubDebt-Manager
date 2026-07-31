import * as LocalAuthentication from 'expo-local-authentication';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';

export async function hasBiometrics(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function authenticate(): Promise<boolean> {
  const isBiometricAuthEnabledStr = await storage.getString(STORAGE_KEYS.IS_BIOMETRIC_AUTH_ENABLED);
  const isBiometricAuthEnabled = isBiometricAuthEnabledStr === 'true';
  
  if (!isBiometricAuthEnabled) return true;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access SubDebt',
    fallbackLabel: 'Use Passcode',
  });

  return result.success;
}

export async function toggleBiometricAuth(enabled: boolean): Promise<boolean> {
  if (enabled) {
    const supported = await hasBiometrics();
    if (!supported) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm to enable biometric lock',
    });

    if (result.success) {
      await storage.set(STORAGE_KEYS.IS_BIOMETRIC_AUTH_ENABLED, 'true');
      return true;
    }
    return false;
  } else {
    await storage.set(STORAGE_KEYS.IS_BIOMETRIC_AUTH_ENABLED, 'false');
    return true;
  }
}
