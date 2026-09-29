import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { useColors } from '@/hooks/useColors';
import { UserProfile } from '@workspace/api-client-react';

interface UserCardProps {
  user: UserProfile;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

export function UserCard({ user, onPress, rightElement }: UserCardProps) {
  const colors = useColors();

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container 
      style={[styles.container, { borderBottomColor: colors.border }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar 
        url={user.avatarUrl} 
        username={user.username} 
        status={user.onlineStatus} 
        size="md" 
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.username, { color: colors.foreground }]}>
            {user.username}
          </Text>
          {user.isPlusMember && <Badge variant="plus" icon />}
        </View>
        <Text style={[styles.level, { color: colors.mutedForeground }]}>
          Lv {user.level}
        </Text>
      </View>
      {rightElement && (
        <View style={styles.right}>
          {rightElement}
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  level: {
    fontSize: 13,
  },
  right: {
    marginLeft: 12,
  },
});
