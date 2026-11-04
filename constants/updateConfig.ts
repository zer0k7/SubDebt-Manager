export type PlayStoreUpdateMode = 'FLEXIBLE' | 'IMMEDIATE';

export const PLAY_STORE_UPDATE_MODE: PlayStoreUpdateMode = 'FLEXIBLE';

export const PLAY_UPDATE_CONFIG = {
  mode: PLAY_STORE_UPDATE_MODE,
  checkIntervalMs: 4 * 60 * 60 * 1000,
} as const;
