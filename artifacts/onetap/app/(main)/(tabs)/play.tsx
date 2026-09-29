import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useI18n } from '@/contexts/I18nContext';
import { SeasonBanner } from '@/components/SeasonBanner';
import { RoomCard } from '@/components/RoomCard';
import { Button } from '@/components/ui/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetCurrentSeason, useListRooms, useJoinRoomByCode, useListGames, useStartSoloSession } from '@workspace/api-client-react';
import { router } from 'expo-router';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { FontAwesome } from '@expo/vector-icons';

export default function PlayScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const { data: season, isLoading: seasonLoading } = useGetCurrentSeason();
  const { data: rooms, isLoading: roomsLoading, refetch } = useListRooms();
  
  const joinByCodeMutation = useJoinRoomByCode();
  const { data: games } = useListGames();
  const startSoloMutation = useStartSoloSession();

  const handlePlaySolo = async () => {
    const game = games?.[0];
    if (!game) return;
    try {
      const session = await startSoloMutation.mutateAsync({ data: { gameId: game.id } });
      router.push(`/game/${session.id}`);
    } catch (e) {
      console.error(e);
      Alert.alert(t('play.soloError'));
    }
  };

  const handleJoinByCode = async () => {
    if (!code) return;
    setIsJoining(true);
    try {
      const room = await joinByCodeMutation.mutateAsync({ data: { code } });
      router.push(`/room/${room.id}`);
      setCode('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateRoom = () => {
    router.push('/create-room');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('play.title')}</Text>
        </View>

        {seasonLoading ? (
          <SkeletonLoader style={styles.seasonSkeleton} />
        ) : (
          <SeasonBanner season={season || null} />
        )}

        <View style={styles.actionsRow}>
          <Button
            title={t('play.playSolo')}
            onPress={handlePlaySolo}
            size="lg"
            style={styles.createBtn}
            isLoading={startSoloMutation.isPending}
            disabled={!games || games.length === 0}
            icon={<FontAwesome name="user" size={18} color={colors.primaryForeground} />}
          />
          <Button
            title={t('play.createRoom')}
            onPress={handleCreateRoom}
            size="lg"
            variant="secondary"
            style={styles.createBtn}
            icon={<FontAwesome name="plus" size={18} color={colors.primaryForeground} />}
          />
        </View>

        <View style={[styles.joinContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.joinTitle, { color: colors.foreground }]}>{t('play.joinByCode')}</Text>
          <View style={styles.joinInputRow}>
            <TextInput
              style={[
                styles.codeInput, 
                { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }
              ]}
              placeholder="12345"
              placeholderTextColor={colors.mutedForeground}
              value={code}
              onChangeText={setCode}
              maxLength={6}
              autoCapitalize="characters"
            />
            <Button
              title="GO"
              onPress={handleJoinByCode}
              disabled={code.length < 3}
              isLoading={isJoining}
              variant="secondary"
            />
          </View>
        </View>

        <View style={styles.roomsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('play.activeRooms')}</Text>
          
          {roomsLoading ? (
            <View>
              <SkeletonLoader style={{ height: 100, marginBottom: 12 }} />
              <SkeletonLoader style={{ height: 100, marginBottom: 12 }} />
            </View>
          ) : rooms && rooms.length > 0 ? (
            rooms.map((room) => (
              <RoomCard 
                key={room.id} 
                room={room} 
                onJoin={() => router.push(`/room/${room.id}`)} 
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="gamepad" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t('play.noActiveRooms')}
              </Text>
            </View>
          )}
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
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
  },
  seasonSkeleton: {
    height: 120,
    marginBottom: 16,
    width: '100%',
  },
  actionsRow: {
    marginBottom: 20,
    gap: 12,
  },
  createBtn: {
    width: '100%',
  },
  joinContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  joinTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  joinInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  roomsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});
