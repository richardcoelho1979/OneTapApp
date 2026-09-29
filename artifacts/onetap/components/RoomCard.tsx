import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useColors } from '@/hooks/useColors';
import { Room } from '@workspace/api-client-react';
import { useI18n } from '@/contexts/I18nContext';
import { FontAwesome } from '@expo/vector-icons';

interface RoomCardProps {
  room: Room;
  onJoin: () => void;
}

export function RoomCard({ room, onJoin }: RoomCardProps) {
  const colors = useColors();
  const { t } = useI18n();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {room.name}
          </Text>
          {room.isPrivate && (
            <FontAwesome name="lock" size={14} color={colors.mutedForeground} style={{ marginLeft: 6 }} />
          )}
        </View>
        <View style={[styles.playerCount, { backgroundColor: colors.secondary }]}>
          <FontAwesome name="users" size={12} color={colors.secondaryForeground} />
          <Text style={[styles.playerCountText, { color: colors.secondaryForeground }]}>
            {room.currentPlayers}/{room.maxPlayers}
          </Text>
        </View>
      </View>
      
      <View style={styles.details}>
        {room.gameId && (
          <Text style={[styles.gameName, { color: colors.primary }]}>
            Game: {room.gameId}
          </Text>
        )}
        <Text style={[styles.host, { color: colors.mutedForeground }]}>
          {t('room.code')}: {room.code}
        </Text>
      </View>

      <Button
        title={t('play.joinByCode').split(' ')[0]} // Just "Join" / "Entrar"
        onPress={onJoin}
        variant={room.currentPlayers >= room.maxPlayers ? 'outline' : 'primary'}
        disabled={room.currentPlayers >= room.maxPlayers}
        style={styles.joinBtn}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  playerCountText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  details: {
    marginBottom: 16,
    gap: 4,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '600',
  },
  host: {
    fontSize: 13,
  },
  joinBtn: {
    width: '100%',
  },
});
