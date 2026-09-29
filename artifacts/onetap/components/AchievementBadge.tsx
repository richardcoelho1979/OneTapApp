import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Achievement } from '@workspace/api-client-react';
import { FontAwesome } from '@expo/vector-icons';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked?: boolean;
}

export function AchievementBadge({ achievement, unlocked = false }: AchievementBadgeProps) {
  const colors = useColors();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: unlocked ? colors.card : 'transparent',
        borderColor: unlocked ? colors.accent : colors.border,
        borderWidth: 1,
        opacity: unlocked ? 1 : 0.6,
      }
    ]}>
      <View style={[
        styles.iconContainer, 
        { backgroundColor: unlocked ? colors.accent + '20' : colors.secondary }
      ]}>
        <Text style={styles.icon}>{achievement.icon || '🏆'}</Text>
      </View>
      <Text 
        style={[styles.title, { color: unlocked ? colors.foreground : colors.mutedForeground }]}
        numberOfLines={1}
      >
        {achievement.title}
      </Text>
      <Text style={[styles.category, { color: colors.mutedForeground }]}>
        {achievement.category}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    width: 100,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 10,
    textAlign: 'center',
  },
});
