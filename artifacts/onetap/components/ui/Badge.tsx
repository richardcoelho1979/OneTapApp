import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { FontAwesome } from '@expo/vector-icons';

type BadgeVariant = 'default' | 'plus' | 'notification' | 'success';

interface BadgeProps {
  label?: string | number;
  variant?: BadgeVariant;
  icon?: boolean;
}

export function Badge({ label, variant = 'default', icon = false }: BadgeProps) {
  const colors = useColors();

  const getStyle = () => {
    switch (variant) {
      case 'plus':
        return {
          bg: colors.accent,
          text: colors.accentForeground,
        };
      case 'notification':
        return {
          bg: colors.destructive,
          text: colors.destructiveForeground,
        };
      case 'success':
        return {
          bg: colors.success,
          text: '#FFFFFF',
        };
      case 'default':
      default:
        return {
          bg: colors.secondary,
          text: colors.secondaryForeground,
        };
    }
  };

  const style = getStyle();

  return (
    <View style={[
      styles.container, 
      { backgroundColor: style.bg },
      !label && !icon ? styles.dot : null
    ]}>
      {icon && variant === 'plus' && (
        <FontAwesome name="star" size={10} color={style.text} style={{ marginRight: label ? 4 : 0 }} />
      )}
      {label !== undefined && (
        <Text style={[styles.label, { color: style.text }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
