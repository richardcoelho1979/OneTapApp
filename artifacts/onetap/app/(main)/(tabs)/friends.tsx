import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useI18n } from '@/contexts/I18nContext';
import { UserCard } from '@/components/UserCard';
import { Button } from '@/components/ui/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  useListFriends, 
  useListIncomingRequests, 
  useSearchUsers, 
  useRespondToFriendRequest,
  getSearchUsersQueryKey,
  UserProfile,
  FriendRequest,
  Friendship
} from '@workspace/api-client-react';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

export default function FriendsScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: friends, isLoading: friendsLoading, refetch: refetchFriends } = useListFriends();
  const { data: requests, isLoading: requestsLoading, refetch: refetchRequests } = useListIncomingRequests();
  const { data: searchResults, isLoading: searchLoading } = useSearchUsers({ q: searchQuery }, { query: { enabled: searchQuery.length > 1, queryKey: getSearchUsersQueryKey({ q: searchQuery }) } });
  
  const respondMutation = useRespondToFriendRequest();

  const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      await respondMutation.mutateAsync({ requestId, data: { action } });
      refetchRequests();
      if (action === 'accept') {
        refetchFriends();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefresh = () => {
    refetchFriends();
    refetchRequests();
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'friends' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        onPress={() => setActiveTab('friends')}
      >
        <Text style={[styles.tabText, { color: activeTab === 'friends' ? colors.foreground : colors.mutedForeground }]}>
          {t('nav.friends')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'requests' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        onPress={() => setActiveTab('requests')}
      >
        <View style={styles.requestTabContent}>
          <Text style={[styles.tabText, { color: activeTab === 'requests' ? colors.foreground : colors.mutedForeground }]}>
            {t('friends.requests')}
          </Text>
          {requests && requests.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
              <Text style={styles.badgeText}>{requests.length}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderFriend = ({ item }: { item: Friendship }) => (
    <UserCard 
      user={item.friend} 
      onPress={() => router.push(`/users/${item.friendId}`)}
    />
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <UserCard 
      user={item.fromUser!} 
      onPress={() => router.push(`/users/${item.fromUserId}`)}
      rightElement={
        <View style={styles.requestActions}>
          <TouchableOpacity 
            style={[styles.iconBtn, { backgroundColor: colors.success + '30' }]}
            onPress={() => handleRespond(item.id, 'accept')}
          >
            <Feather name="check" size={20} color={colors.success} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconBtn, { backgroundColor: colors.destructive + '30' }]}
            onPress={() => handleRespond(item.id, 'reject')}
          >
            <Feather name="x" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      }
    />
  );

  const renderSearchResult = ({ item }: { item: UserProfile }) => (
    <UserCard 
      user={item} 
      onPress={() => router.push(`/users/${item.id}`)}
    />
  );

  const renderContent = () => {
    if (searchQuery.length > 1) {
      if (searchLoading) return <SkeletonLoader style={styles.skeletonList} />;
      return (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchResult}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ color: colors.mutedForeground }}>{t('friends.noUsersFound')}</Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'friends') {
      if (friendsLoading) return <SkeletonLoader style={styles.skeletonList} />;
      return (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={friendsLoading} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome name="users" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t('friends.noFriendsYet')}
              </Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'requests') {
      if (requestsLoading) return <SkeletonLoader style={styles.skeletonList} />;
      return (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={requestsLoading} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome name="envelope-open-o" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t('friends.noPendingRequests')}
              </Text>
            </View>
          }
        />
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('friends.title')}</Text>
        <View style={[styles.searchContainer, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Feather name="search" size={20} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={t('friends.search')}
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!searchQuery && renderTabs()}

      <View style={styles.listContainer}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 8,
  },
  skeletonList: {
    height: 60,
    marginHorizontal: 20,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
