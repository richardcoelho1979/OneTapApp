import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { UserProfileOnlineStatus } from '@workspace/api-client-react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  url?: string | null;
  username: string;
  size?: AvatarSize;
  status?: UserProfileOnlineStatus | null;
  style?: ViewStyle;
}

const SIZES = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

export function Avatar({ url, username, size = 'md', status, style }: AvatarProps) {
  const colors = useColors();
  const dimension = SIZES[size];
  
  const initials = username
    ? username.substring(0, 2).toUpperCase()
    : '??';

  const renderStatus = () => {
    if (!status) return null;
    
    let color = colors.mutedForeground;
    if (status === 'online') color = colors.success;
    if (status === 'away') color = colors.accent;

    return (
      <View style={[
        styles.statusDot, 
        { 
          backgroundColor: color,
          borderColor: colors.background,
          width: dimension * 0.25,
          height: dimension * 0.25,
          borderRadius: dimension * 0.125,
          borderWidth: Math.max(2, dimension * 0.05),
          right: dimension * 0.05,
          bottom: dimension * 0.05,
        }
      ]} />
    );
  };

  return (
    <View style={[{ width: dimension, height: dimension, borderRadius: dimension / 2 }, style]}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={[StyleSheet.absoluteFill, { borderRadius: dimension / 2 }]}
          contentFit="cover"
        />
      ) : (
        <View style={[
          StyleSheet.absoluteFill, 
          { 
            backgroundColor: colors.secondary, 
            borderRadius: dimension / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }
        ]}>
          <Text style={{ 
            color: colors.foreground, 
            fontSize: dimension * 0.4, 
            fontWeight: 'bold' 
          }}>
            {initials}
          </Text>
        </View>
      )}
      {renderStatus()}
    </View>
  );
}

const styles = StyleSheet.create({
  statusDot: {
    position: 'absolute',
  },
});
