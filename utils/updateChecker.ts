import { Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import { storage } from '../storage/mmkv';

const GITHUB_REPO = 'zer0k7/SubDebt-Manager';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const SKIP_VERSION_KEY = 'skipped_update_version';
const LAST_CHECK_KEY = 'last_update_check';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  releaseUrl: string;
  downloadUrl: string; // Direct APK download URL or release page
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
  return Constants.expoConfig?.version || '2.2.0';
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
        'Accept': 'application/vnd.github.v3+json',
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
      // Look for an APK asset attached to the GitHub release
      const apkAsset = (data.assets || []).find((asset: any) =>
        asset.name.toLowerCase().endsWith('.apk')
      );

      const downloadUrl = apkAsset ? apkAsset.browser_download_url : data.html_url;

      return {
        available: true,
        currentVersion,
        latestVersion,
        releaseNotes: data.body || '',
        releaseUrl: data.html_url,
        downloadUrl,
        publishedAt: data.published_at || '',
      };
    }

    return null;
  } catch (err) {
    return null;
  }
};

export const skipVersion = async (version: string) => {
  await storage.set(SKIP_VERSION_KEY, version);
};

export const openDownloadUrl = (url: string) => {
  Linking.openURL(url);
};

export const downloadAndInstallAPK = async (
  apkUrl: string,
  onProgress?: (progressPct: number, bytesDownloaded: number, totalBytes: number) => void
): Promise<boolean> => {
  try {
    const fileUri = FileSystem.documentDirectory + 'SubDebt-Update.apk';

    // Delete previous downloaded file if it exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      apkUrl,
      fileUri,
      {},
      (progressData) => {
        const total = progressData.totalBytesExpectedToWrite || 1;
        const written = progressData.totalBytesWritten || 0;
        const pct = Math.min(100, Math.max(0, Math.round((written / total) * 100)));
        if (onProgress) {
          onProgress(pct, written, total);
        }
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result || !result.uri) {
      return false;
    }

    // Launch Android installer intent or sharing modal
    if (Platform.OS === 'android') {
      try {
        const IntentLauncher = require('expo-intent-launcher');
        const contentUri = await FileSystem.getContentUriAsync(result.uri);
        
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          type: 'application/vnd.android.package-archive',
          flags: 1, // Intent.FLAG_GRANT_READ_URI_PERMISSION
        });
        return true;
      } catch (e) {
        // Fallback to sharing if intent launcher fails
        await Sharing.shareAsync(result.uri);
        return true;
      }
    } else {
      await Sharing.shareAsync(result.uri);
      return true;
    }
  } catch (error) {
    // If native download fails, open download URL in system browser
    Linking.openURL(apkUrl);
    return false;
  }
};
