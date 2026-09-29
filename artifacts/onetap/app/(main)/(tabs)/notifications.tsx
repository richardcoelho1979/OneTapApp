import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useI18n } from '@/contexts/I18nContext';
import { NotificationItem } from '@/components/NotificationItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  useListNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  Notification
} from '@workspace/api-client-react';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function NotificationsScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const { data: notifications, isLoading, refetch } = useListNotifications({});
  const markAllReadMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync(undefined as any);
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markReadMutation.mutateAsync({ notificationId: notification.id });
        refetch();
      } catch (e) {
        console.error(e);
      }
    }
    
    // Navigate based on type
    if (notification.type === 'friend_request') {
      router.push('/(main)/(tabs)/friends');
    } else if (notification.type === 'room_invite' && notification.data?.roomId) {
      router.push(`/room/${notification.data.roomId}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('notifications.title')}</Text>
        <TouchableOpacity onPress={handleMarkAllRead} disabled={!notifications?.length}>
          <Text style={[styles.markAllText, { color: colors.primary }]}>{t('notifications.markAllRead')}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View>
          <SkeletonLoader style={{ height: 80, marginHorizontal: 16, marginTop: 12 }} />
          <SkeletonLoader style={{ height: 80, marginHorizontal: 16, marginTop: 12 }} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem 
              notification={item} 
              onPress={() => handleNotificationPress(item)} 
            />
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="bell-off" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t('notifications.noNotifications')}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});
