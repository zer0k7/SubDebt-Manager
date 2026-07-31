import { useTheme } from '../hooks/useTheme';
import React, { useRef, useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Dimensions, 
  Animated, TouchableOpacity, SafeAreaView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AmbientBackground } from '../components/AmbientBackground';
import { GlassButton } from '../components/GlassButton';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Track Your\nSubscriptions',
    description: 'Never get caught off guard by a surprise renewal again. Monitor all your recurring expenses in one beautiful dashboard.',
    icon: 'card-outline',
    color: '#4FC3F7',
  },
  {
    id: '2',
    title: 'Monitor Daily\nSpending',
    description: 'Keep a close eye on your daily expenses, visualize your habits, and build a streak for tracking every day.',
    icon: 'receipt-outline',
    color: '#7c3aed',
  },
  {
    id: '3',
    title: 'Manage Debts\n& Lent Money',
    description: 'Keep track of who owes you money and who you owe. Settle up seamlessly with smart tracking and celebrations.',
    icon: 'wallet-outline',
    color: '#FFB74D',
  },
  {
    id: '4',
    title: '101% Offline\n& Private',
    description: 'Your financial data never leaves your device. No servers, no tracking, just blazing fast local storage.',
    icon: 'shield-checkmark-outline',
    color: '#66BB6A',
  }
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animations for content elements
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [currentIndex]);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
      opacityAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await storage.set(STORAGE_KEYS.HAS_SEEN_ONBOARDING, 'true');
    router.replace('/(tabs)/subscriptions');
  };

  const renderItem = ({ item, index }: { item: typeof SLIDES[0], index: number }) => {
    // Parallax effect for icon
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });
    
    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [100, 0, 100],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale }, { translateY }] }]}>
          <View style={[styles.iconGlow, { backgroundColor: item.color }]} />
          <Ionicons name={item.icon as any} size={100} color={item.color} />
        </Animated.View>

        <Animated.View style={[styles.textContainer, { 
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }]
        }]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      
      {/* Skip Button */}
      <View style={styles.header}>
        {currentIndex < SLIDES.length - 1 ? (
          <TouchableOpacity onPress={finishOnboarding} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : <View />}
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
      />

      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View 
                key={i} 
                style={[styles.dot, { width: dotWidth, opacity }]} 
              />
            );
          })}
        </View>

        {/* Next/Start Button */}
        <View style={styles.buttonContainer}>
          <GlassButton 
            title={currentIndex === SLIDES.length - 1 ? "Get Started" : "Continue"} 
            onPress={scrollToNext} 
            size="large"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 10,
    zIndex: 10,
  },
  skipBtn: {
    padding: 8,
  },
  skipText: {
    color: colors.text.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  slide: {
    width,
    alignItems: 'center',
    paddingTop: height * 0.1,
  },
  iconContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.15,
    transform: [{ scale: 1.5 }],
  },
  textContainer: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  title: {
    color: colors.text.primary,
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  description: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 0 : 24,
    position: 'absolute',
    bottom: 40,
    width: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.blue,
    marginHorizontal: 4,
  },
  buttonContainer: {
    width: '100%',
  },
});
