import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, Animated } from 'react-native';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  icon?: React.ReactNode;
}

export function Button({ 
  onPress, 
  title, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  disabled = false,
  style,
  textStyle,
  icon
}: ButtonProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePress = () => {
    if (disabled || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: colors.radius,
      opacity: disabled ? 0.5 : 1,
      gap: 8,
    };

    switch (size) {
      case 'sm':
        base.paddingVertical = 8;
        base.paddingHorizontal = 12;
        break;
      case 'md':
        base.paddingVertical = 14;
        base.paddingHorizontal = 20;
        break;
      case 'lg':
        base.paddingVertical = 18;
        base.paddingHorizontal = 28;
        break;
    }

    switch (variant) {
      case 'primary':
        base.backgroundColor = colors.primary;
        break;
      case 'secondary':
        base.backgroundColor = colors.secondary;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1;
        base.borderColor = colors.border;
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
      case 'destructive':
        base.backgroundColor = colors.destructive;
        break;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    switch (size) {
      case 'sm':
        base.fontSize = 14;
        break;
      case 'md':
        base.fontSize = 16;
        break;
      case 'lg':
        base.fontSize = 18;
        break;
    }

    switch (variant) {
      case 'primary':
        base.color = colors.primaryForeground;
        break;
      case 'secondary':
        base.color = colors.secondaryForeground;
        break;
      case 'outline':
      case 'ghost':
        base.color = colors.foreground;
        break;
      case 'destructive':
        base.color = colors.destructiveForeground;
        break;
    }

    return base;
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || isLoading}
        style={getContainerStyle()}
      >
        {isLoading ? (
          <ActivityIndicator color={getTextStyle().color as string} size="small" />
        ) : (
          <>
            {icon}
            {title && <Text style={[getTextStyle(), textStyle]}>{title}</Text>}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
