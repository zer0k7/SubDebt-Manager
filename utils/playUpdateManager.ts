import { Platform } from 'react-native';
import SpInAppUpdates, {
  IAUUpdateKind,
  IAUInstallStatus,
  StatusUpdateEvent,
} from 'sp-react-native-in-app-updates';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import {
  PLAY_STORE_UPDATE_MODE,
  PLAY_UPDATE_CONFIG,
} from '../constants/updateConfig';

const inAppUpdatesInstance = Platform.OS === 'android' ? new SpInAppUpdates(false) : null;

let activeStatusListener: ((status: StatusUpdateEvent) => void) | null = null;

export const checkAndTriggerPlayUpdate = async (
  force = false,
  onDownloaded?: () => void
): Promise<boolean> => {
  if (Platform.OS !== 'android' || !inAppUpdatesInstance) {
    return false;
  }

  try {
    if (!force) {
      const lastCheck = await storage.getString(STORAGE_KEYS.LAST_PLAY_UPDATE_CHECK);
      if (lastCheck) {
        const timePassed = Date.now() - parseInt(lastCheck, 10);
        if (timePassed < PLAY_UPDATE_CONFIG.checkIntervalMs) {
          return false;
        }
      }
    }

    const checkResult = await inAppUpdatesInstance.checkNeedsUpdate();
    await storage.set(STORAGE_KEYS.LAST_PLAY_UPDATE_CHECK, Date.now().toString());

    if (!checkResult.shouldUpdate) {
      return false;
    }

    if (activeStatusListener) {
      inAppUpdatesInstance.removeStatusUpdateListener(activeStatusListener);
      activeStatusListener = null;
    }

    if (onDownloaded) {
      activeStatusListener = (event: StatusUpdateEvent) => {
        if (event.status === IAUInstallStatus.DOWNLOADED) {
          onDownloaded();
        }
      };
      inAppUpdatesInstance.addStatusUpdateListener(activeStatusListener);
    }

    const chosenUpdateKind =
      PLAY_STORE_UPDATE_MODE === 'IMMEDIATE'
        ? IAUUpdateKind.IMMEDIATE
        : IAUUpdateKind.FLEXIBLE;

    await inAppUpdatesInstance.startUpdate({
      updateType: chosenUpdateKind,
    });

    return true;
  } catch (err) {
    return false;
  }
};

export const completePlayStoreUpdate = (): void => {
  if (Platform.OS === 'android' && inAppUpdatesInstance) {
    try {
      inAppUpdatesInstance.installUpdate();
    } catch (err) {}
  }
};
