import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useI18n } from '@/contexts/I18nContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import {
  useGetRoom,
  getGetRoomQueryKey,
  useLeaveRoom,
  useStartSession,
  useGetRoomCurrentSession,
  getGetRoomCurrentSessionQueryKey,
  RoomPlayer,
} from '@workspace/api-client-react';
import { useLocalSearchParams, router } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import * as Clipboard from 'expo-clipboard';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [copied, setCopied] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const { data: room, isLoading, error } = useGetRoom(id as string, {
    query: {
      refetchInterval: 3000, // Real-time feel
      queryKey: getGetRoomQueryKey(id as string),
    }
  });

  const leaveRoomMutation = useLeaveRoom();
  const startSessionMutation = useStartSession();

  // When the room enters a game, everyone (host included) is routed to the board.
  const { data: currentSession } = useGetRoomCurrentSession(id as string, {
    query: {
      queryKey: getGetRoomCurrentSessionQueryKey(id as string),
      enabled: room?.status === 'in_game',
      refetchInterval: 2000,
      retry: false,
    },
  });

  useEffect(() => {
    if (currentSession?.id && currentSession.status !== 'finished') {
      router.replace(`/game/${currentSession.id}`);
    }
  }, [currentSession?.id, currentSession?.status]);

  const handleStart = async () => {
    if (!room?.gameId) return;
    try {
      const session = await startSessionMutation.mutateAsync({
        roomId: room.id,
        data: { gameId: room.gameId },
      });
      router.replace(`/game/${session.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleCopyCode = async () => {
    if (!room) return;
    await Clipboard.setStringAsync(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    if (!room) return;
    setIsLeaving(true);
    try {
      await leaveRoomMutation.mutateAsync({ roomId: room.id });
      router.back();
    } catch (e) {
      console.error(e);
      // Even if it fails, maybe we should just go back?
      router.back();
    } finally {
      setIsLeaving(false);
    }
  };

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.destructive, marginBottom: 16 }}>{t('room.notFound')}</Text>
        <Button title={t('common.cancel')} onPress={() => router.back()} />
      </View>
    );
  }

  const isHost = room?.hostId === user?.id;
  const isSolo = room?.maxPlayers === 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeave} disabled={isLeaving} style={styles.backBtn}>
          <Feather name="chevron-left" size={28} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {room?.name || t('common.loading')}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && !room ? (
          <SkeletonLoader style={{ height: 200 }} />
        ) : room ? (
          <>
            <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Animated.View style={[styles.statusDot, { backgroundColor: colors.success }, pulseStyle]} />
              <Text style={[styles.statusText, { color: colors.foreground }]}>
                {isSolo
                  ? t('room.soloInProgress')
                  : room.status === 'waiting' ? t('room.waitingForPlayers') : t('room.gameInProgress')}
              </Text>

              {!isSolo && (
                <View style={styles.codeRow}>
                  <Text style={[styles.codeLabel, { color: colors.mutedForeground }]}>{t('room.code')}:</Text>
                  <TouchableOpacity onPress={handleCopyCode} style={[styles.codePill, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.code, { color: colors.primary }]}>{room.code}</Text>
                    <Feather name={copied ? "check" : "copy"} size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.playersSection}>
              <View style={styles.playersHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('room.players')}</Text>
                <Text style={[styles.playerCount, { color: colors.mutedForeground }]}>
                  {room.currentPlayers} / {room.maxPlayers}
                </Text>
              </View>

              <View style={styles.playersGrid}>
                {room.players?.map((player: RoomPlayer) => (
                  <View key={player.userId} style={styles.playerItem}>
                    <Avatar 
                      url={player.avatarUrl} 
                      username={player.username} 
                      size="lg" 
                    />
                    <Text style={[styles.playerName, { color: colors.foreground }]} numberOfLines={1}>
                      {player.username}
                    </Text>
                    {player.isHost && (
                      <View style={[styles.hostBadge, { backgroundColor: colors.accent }]}>
                        <Text style={styles.hostText}>HOST</Text>
                      </View>
                    )}
                  </View>
                ))}
                
                {Array.from({ length: room.maxPlayers - room.currentPlayers }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.playerItem}>
                    <View style={[styles.emptyAvatar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                      <FontAwesome name="user-plus" size={24} color={colors.mutedForeground} />
                    </View>
                    <Text style={[styles.playerName, { color: colors.mutedForeground }]}>{t('room.empty')}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.actions}>
              {isSolo ? (
                <View style={styles.waitingContainer}>
                  <Text style={{ color: colors.mutedForeground, textAlign: 'center' }}>
                    {t('room.soloComingSoon')}
                  </Text>
                </View>
              ) : isHost ? (
                <Button
                  title={t('room.start')}
                  onPress={handleStart}
                  disabled={room.currentPlayers < 2 || !room.gameId}
                  isLoading={startSessionMutation.isPending}
                  size="lg"
                  style={styles.mainBtn}
                />
              ) : (
                <View style={styles.waitingContainer}>
                  <ActivityIndicator color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ color: colors.mutedForeground }}>{t('room.waitingForHost')}</Text>
                </View>
              )}
            </View>
          </>
        ) : null}
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
    flex: 1,
    textAlign: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  statusCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 32,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: 20,
    right: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeLabel: {
    fontSize: 14,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  code: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  playersSection: {
    marginBottom: 48,
  },
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  playerCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  playerItem: {
    alignItems: 'center',
    width: 80,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  hostBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  hostText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    marginTop: 'auto',
  },
  mainBtn: {
    width: '100%',
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
