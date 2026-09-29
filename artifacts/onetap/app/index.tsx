import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Text } from 'react-native';

export default function Index() {
  const { user, accessToken, isLoading } = useAuth();
  const { t } = useI18n();
  const colors = useColors();
  
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (accessToken && user) {
        router.replace('/(main)/(tabs)/play');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isLoading, accessToken, user]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Text style={[styles.logo, { color: colors.primary }]}>OneTap</Text>
      </Animated.View>
      <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
        {t('app.warmingUp')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
