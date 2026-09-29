import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Notification } from '@workspace/api-client-react';
import { FontAwesome, Feather, Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from '@/utils/date';

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const colors = useColors();

  const getIconInfo = () => {
    switch (notification.type) {
      case 'friend_request':
        return { comp: Feather, name: 'user-plus', color: colors.primary };
      case 'friend_accepted':
        return { comp: Feather, name: 'user-check', color: colors.success };
      case 'room_invite':
        return { comp: Ionicons, name: 'game-controller-outline', color: colors.accent };
      case 'achievement_unlocked':
        return { comp: FontAwesome, name: 'trophy', color: colors.accent };
      case 'season_start':
      case 'season_end':
        return { comp: Feather, name: 'calendar', color: colors.purple };
      default:
        return { comp: Feather, name: 'bell', color: colors.mutedForeground };
    }
  };

  const IconInfo = getIconInfo();
  const IconComp = IconInfo.comp as any;

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          backgroundColor: notification.isRead ? 'transparent' : colors.card,
          borderBottomColor: colors.border
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
        <IconComp name={IconInfo.name} size={20} color={IconInfo.color} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {notification.title}
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {formatDistanceToNow(new Date(notification.createdAt))}
        </Text>
      </View>
      {!notification.isRead && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
});
