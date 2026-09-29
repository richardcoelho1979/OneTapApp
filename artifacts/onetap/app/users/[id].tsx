import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useI18n } from '@/contexts/I18nContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetUserById, getGetUserByIdQueryKey, useGetUserAchievements, getGetUserAchievementsQueryKey, useSendFriendRequest } from '@workspace/api-client-react';
import { useLocalSearchParams, router } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { LevelBadge } from '@/components/LevelBadge';
import { AchievementBadge } from '@/components/AchievementBadge';
import { Button } from '@/components/ui/Button';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const { data: user, isLoading, error } = useGetUserById(id as string, { query: { enabled: !!id, queryKey: getGetUserByIdQueryKey(id as string) } });
  const { data: achievements } = useGetUserAchievements(id as string, { query: { enabled: !!id, queryKey: getGetUserAchievementsQueryKey(id as string) } });
  
  const sendRequestMutation = useSendFriendRequest();

  const handleAddFriend = async () => {
    if (!user) return;
    setIsSendingRequest(true);
    try {
      await sendRequestMutation.mutateAsync({ data: { toUserId: user.id } });
      setRequestSent(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingRequest(false);
    }
  };

  if (isLoading || !user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={28} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center', padding: 20 }}>
          <SkeletonLoader style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 16 }} />
          <SkeletonLoader style={{ width: 150, height: 24, marginBottom: 32 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={28} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('profile.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View>
            <Avatar 
              url={user.avatarUrl} 
              username={user.username} 
              size="xl" 
              status={user.onlineStatus}
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

          {user.isPlusMember && (
            <View style={[styles.plusBadge, { backgroundColor: colors.accent + '30', borderColor: colors.accent }]}>
              <FontAwesome name="star" size={14} color={colors.accent} />
              <Text style={[styles.plusText, { color: colors.accent }]}>OneTap Plus</Text>
            </View>
          )}

          <Button
            title={requestSent ? t('friends.requestSent') : t('friends.addFriend')}
            onPress={handleAddFriend}
            disabled={requestSent}
            isLoading={isSendingRequest}
            variant={requestSent ? "secondary" : "primary"}
            style={styles.addBtn}
            icon={!requestSent && <Feather name="user-plus" size={18} color={colors.primaryForeground} />}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
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
  addBtn: {
    marginTop: 24,
    minWidth: 160,
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
