import { useEffect, useState, useRef } from 'react';
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { useTheme } from '../hooks/useTheme';

export default function Index() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const hasResolved = useRef(false);
  const { colors } = useTheme();

  useEffect(() => {
    if (hasResolved.current) return;
    hasResolved.current = true;

    Promise.all([
      storage.getString(STORAGE_KEYS.HAS_SEEN_ONBOARDING),
      storage.getString('default_launch_tab'),
    ])
      .then(([hasSeen, defaultTab]) => {
        if (hasSeen !== 'true') {
          setInitialRoute('/onboarding');
        } else {
          const tab = defaultTab && ['home', 'subscriptions', 'owed', 'spending'].includes(defaultTab) 
            ? defaultTab 
            : 'home';
          setInitialRoute(`/(tabs)/${tab}`);
        }
      })
      .catch(() => {
        setInitialRoute('/(tabs)/home');
      });
  }, []);

  if (!initialRoute) {
    return <View style={{ flex: 1, backgroundColor: colors.background.primary }} />;
  }

  return <Redirect href={initialRoute as any} />;
}
