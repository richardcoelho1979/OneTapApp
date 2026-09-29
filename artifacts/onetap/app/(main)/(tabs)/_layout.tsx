import React, { useEffect } from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs, router } from 'expo-router';
import { Icon, Label, NativeTabs, Badge } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useListNotifications, useListIncomingRequests, getListNotificationsQueryKey, getListIncomingRequestsQueryKey } from '@workspace/api-client-react';

function NativeTabLayout({
  unreadCount,
  requestsCount,
}: {
  unreadCount: number;
  requestsCount: number;
}) {
  const { t } = useI18n();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="play">
        <Icon sf={{ default: 'gamecontroller', selected: 'gamecontroller.fill' }} />
        <Label>{t('nav.play')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="friends">
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>{t('nav.friends')}</Label>
        {requestsCount > 0 && <Badge>{String(requestsCount)}</Badge>}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ranking">
        <Icon sf={{ default: 'trophy', selected: 'trophy.fill' }} />
        <Label>{t('nav.ranking')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notifications">
        <Icon sf={{ default: 'bell', selected: 'bell.fill' }} />
        <Label>{t('nav.notifications')}</Label>
        {unreadCount > 0 && <Badge>{String(unreadCount)}</Badge>}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
        <Label>{t('nav.profile')}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout({
  unreadCount,
  requestsCount,
}: {
  unreadCount: number;
  requestsCount: number;
}) {
  const { t } = useI18n();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="play"
        options={{
          title: t('nav.play'),
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="gamecontroller" tintColor={color} size={24} />
            ) : (
              <FontAwesome5 name="gamepad" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: t('nav.friends'),
          tabBarBadge: requestsCount > 0 ? requestsCount : undefined,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.2" tintColor={color} size={24} />
            ) : (
              <Feather name="users" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: t('nav.ranking'),
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="trophy" tintColor={color} size={24} />
            ) : (
              <Feather name="award" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('nav.notifications'),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bell" tintColor={color} size={24} />
            ) : (
              <Feather name="bell" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.crop.circle" tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

  const { data: notifications } = useListNotifications({ unreadOnly: true }, { query: { enabled: !!user, queryKey: getListNotificationsQueryKey({ unreadOnly: true }) } });
  const { data: requests } = useListIncomingRequests({ query: { enabled: !!user, queryKey: getListIncomingRequestsQueryKey() } });

  const unreadCount = notifications?.length || 0;
  const requestsCount = requests?.length || 0;

  if (isLoading || !user) return null;

  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout unreadCount={unreadCount} requestsCount={requestsCount} />;
  }
  return <ClassicTabLayout unreadCount={unreadCount} requestsCount={requestsCount} />;
}
