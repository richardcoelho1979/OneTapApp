import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function LevelBadge({ level, size = 'md', style }: LevelBadgeProps) {
  const colors = useColors();
  
  const dimensions = {
    sm: { size: 24, fontSize: 10, border: 2 },
    md: { size: 36, fontSize: 14, border: 3 },
    lg: { size: 48, fontSize: 18, border: 4 },
  }[size];

  // Level colors
  let ringColor = colors.primary;
  if (level >= 50) ringColor = colors.accent;
  else if (level >= 100) ringColor = colors.purple;

  return (
    <View style={[
      styles.container,
      {
        width: dimensions.size,
        height: dimensions.size,
        borderRadius: dimensions.size / 2,
        backgroundColor: colors.background,
        borderWidth: dimensions.border,
        borderColor: ringColor,
      },
      style
    ]}>
      <Text style={[
        styles.text,
        {
          fontSize: dimensions.fontSize,
          color: colors.foreground,
        }
      ]}>
        {level}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '900',
  },
});
