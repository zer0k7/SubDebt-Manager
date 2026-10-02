import { init, trackEvent } from '@aptabase/react-native';

const telemetryKey = process.env.EXPO_PUBLIC_APTABASE_APP_KEY;

export const initTelemetry = () => {
  if (!telemetryKey) {
    return;
  }
  init(telemetryKey, {
    flushInterval: 5000,
  });
};

export const logEvent = (eventName: string, props?: Record<string, string | number | boolean>) => {
  if (!telemetryKey) {
    return;
  }
  trackEvent(eventName, props);
};
