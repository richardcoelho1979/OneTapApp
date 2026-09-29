import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from './ui/Avatar';
import { useColors } from '@/hooks/useColors';
import { RankingEntry } from '@workspace/api-client-react';

interface RankingRowProps {
  entry: RankingEntry;
  isCurrentUser?: boolean;
}

export function RankingRow({ entry, isCurrentUser = false }: RankingRowProps) {
  const colors = useColors();

  let rankColor = colors.mutedForeground;
  if (entry.rank === 1) rankColor = colors.accent; // Gold
  else if (entry.rank === 2) rankColor = '#C0C0C0'; // Silver
  else if (entry.rank === 3) rankColor = '#CD7F32'; // Bronze

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: isCurrentUser ? colors.secondary : 'transparent',
        borderBottomColor: colors.border
      }
    ]}>
      <Text style={[
        styles.rank, 
        { 
          color: rankColor,
          fontWeight: entry.rank <= 3 ? 'bold' : 'normal',
          fontSize: entry.rank <= 3 ? 18 : 16
        }
      ]}>
        #{entry.rank}
      </Text>
      <Avatar 
        url={entry.avatarUrl} 
        username={entry.username} 
        size="sm" 
        style={styles.avatar} 
      />
      <View style={styles.info}>
        <Text style={[styles.username, { color: colors.foreground }]} numberOfLines={1}>
          {entry.username}
        </Text>
        <Text style={[styles.level, { color: colors.mutedForeground }]}>
          Lv {entry.level} • {entry.xp} XP
        </Text>
      </View>
      <View style={styles.stats}>
        <Text style={[styles.wins, { color: colors.success }]}>
          {entry.wins} W
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rank: {
    width: 36,
    textAlign: 'center',
  },
  avatar: {
    marginHorizontal: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  level: {
    fontSize: 12,
  },
  stats: {
    alignItems: 'flex-end',
  },
  wins: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
