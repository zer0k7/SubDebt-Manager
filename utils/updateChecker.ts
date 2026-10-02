import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from '../storage/mmkv';

const GITHUB_REPO = 'zer0k7/SubDebt-Manager';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const SKIP_VERSION_KEY = 'skipped_update_version';
const LAST_CHECK_KEY = 'last_update_check';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const ANDROID_PACKAGE = 'com.subdebt.app';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  releaseUrl: string;
  publishedAt: string;
}

const parseVersion = (v: string): number[] => {
  return v.replace(/^v/, '').split('.').map(Number);
};

const isNewer = (latest: string, current: string): boolean => {
  const l = parseVersion(latest);
  const c = parseVersion(current);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const lv = l[i] || 0;
    const cv = c[i] || 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
};

export const getCurrentVersion = (): string => {
  return Constants.expoConfig?.version || '2.12.0';
};

export const openStore = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    const marketUri = `market://details?id=${ANDROID_PACKAGE}`;
    const webUri = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
    try {
      const canOpen = await Linking.canOpenURL(marketUri);
      if (canOpen) {
        await Linking.openURL(marketUri);
        return;
      }
    } catch {}
    await Linking.openURL(webUri);
  } else {
    await Linking.openURL(`https://github.com/${GITHUB_REPO}/releases/latest`);
  }
};

export const checkForUpdate = async (force = false): Promise<UpdateInfo | null> => {
  try {
    if (!force) {
      const lastCheck = await storage.getString(LAST_CHECK_KEY);
      if (lastCheck) {
        const timeSince = Date.now() - parseInt(lastCheck, 10);
        if (timeSince < CHECK_INTERVAL_MS) {
          return null;
        }
      }
    }

    const response = await fetch(API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'SubDebt-App',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const latestTag = data.tag_name || '';
    const latestVersion = latestTag.replace(/^v/, '');
    const currentVersion = getCurrentVersion();

    await storage.set(LAST_CHECK_KEY, Date.now().toString());

    if (!force) {
      const skippedVersion = await storage.getString(SKIP_VERSION_KEY);
      if (skippedVersion === latestVersion) {
        return null;
      }
    }

    if (isNewer(latestVersion, currentVersion)) {
      return {
        available: true,
        currentVersion,
        latestVersion,
        releaseNotes: data.body || '',
        releaseUrl: data.html_url,
        publishedAt: data.published_at || '',
      };
    }

    return null;
  } catch {
    return null;
  }
};

export const skipVersion = async (version: string): Promise<void> => {
  await storage.set(SKIP_VERSION_KEY, version);
};
