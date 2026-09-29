import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Season } from '@workspace/api-client-react';
import { useI18n } from '@/contexts/I18nContext';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface SeasonBannerProps {
  season: Season | null;
}

export function SeasonBanner({ season }: SeasonBannerProps) {
  const colors = useColors();
  const { t } = useI18n();
  const [timeLeft, setTimeLeft] = useState('');
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    if (!season) return;

    const start = new Date(season.startDate).getTime();
    const end = new Date(season.endDate).getTime();
    const now = Date.now();
    
    const total = end - start;
    const current = now - start;
    const percentage = Math.min(Math.max(current / total, 0), 1);
    
    progressWidth.value = withTiming(percentage * 100, { duration: 1500 });

    const updateTimer = () => {
      const remaining = end - Date.now();
      if (remaining <= 0) {
        setTimeLeft(t('season.ended'));
        return;
      }
      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) {
        setTimeLeft(t('season.daysLeft', { days }));
      } else {
        setTimeLeft(t('season.hoursLeft', { hours }));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // update every minute
    return () => clearInterval(interval);
  }, [season]);

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  if (!season) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="star" size={16} color={season.themeColor || colors.accent} />
          <Text style={[styles.title, { color: colors.foreground }]}>
            {season.name}
          </Text>
        </View>
        <Text style={[styles.timeLeft, { color: colors.mutedForeground }]}>
          {timeLeft}
        </Text>
      </View>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        {season.description || t('season.number', { number: season.number })}
      </Text>
      
      <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
        <Animated.View 
          style={[
            styles.progressFill, 
            { backgroundColor: season.themeColor || colors.accent },
            animatedProgressStyle
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeLeft: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    marginBottom: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
