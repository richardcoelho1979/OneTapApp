import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useI18n } from '@/contexts/I18nContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useGetUserAchievements, getGetUserAchievementsQueryKey, useGetMySubscription, getGetMySubscriptionQueryKey } from '@workspace/api-client-react';
import { Avatar } from '@/components/ui/Avatar';
import { LevelBadge } from '@/components/LevelBadge';
import { AchievementBadge } from '@/components/AchievementBadge';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: achievements } = useGetUserAchievements(user?.id || '', { query: { enabled: !!user?.id, queryKey: getGetUserAchievementsQueryKey(user?.id || '') } });
  const { data: subscription } = useGetMySubscription({ query: { enabled: !!user, queryKey: getGetMySubscriptionQueryKey() } });

  if (!user) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('profile.title')}</Text>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
            <Feather name="settings" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileHeader}>
          <View>
            <Avatar 
              url={user.avatarUrl} 
              username={user.username} 
              size="xl" 
            />
            <View style={styles.levelBadgeContainer}>
              <LevelBadge level={user.level} size="md" />
            </View>
          </View>
          
          <Text style={[styles.username, { color: colors.foreground }]}>
            {user.username}
          </Text>
          
          <Text style={[styles.xpText, { color: colors.mutedForeground }]}>
            {user.xp} XP
          </Text>

          {subscription?.isPlusMember && (
            <View style={[styles.plusBadge, { backgroundColor: colors.accent + '30', borderColor: colors.accent }]}>
              <FontAwesome name="star" size={14} color={colors.accent} />
              <Text style={[styles.plusText, { color: colors.accent }]}>OneTap Plus</Text>
            </View>
          )}
        </View>

        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{user.gamesPlayed || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('profile.gamesPlayed')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.success }]}>{user.wins || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('profile.wins')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {user.gamesPlayed ? Math.round(((user.wins || 0) / user.gamesPlayed) * 100) : 0}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('profile.winRate')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('profile.achievements')}</Text>
          <View style={styles.achievementsGrid}>
            {achievements?.map((userAch) => (
              <AchievementBadge 
                key={userAch.achievement.id} 
                achievement={userAch.achievement} 
                unlocked={true} 
              />
            ))}
            {(!achievements || achievements.length === 0) && (
              <Text style={{ color: colors.mutedForeground, marginTop: 16 }}>{t('profile.noAchievements')}</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
  },
  settingsBtn: {
    padding: 8,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  levelBadgeContainer: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  xpText: {
    fontSize: 16,
    marginTop: 4,
  },
  plusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  plusText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
});
