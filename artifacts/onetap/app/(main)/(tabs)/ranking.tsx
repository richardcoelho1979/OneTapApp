import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useI18n } from '@/contexts/I18nContext';
import { RankingRow } from '@/components/RankingRow';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  useGetGlobalRanking,
  useGetFriendsRanking,
  RankingEntry
} from '@workspace/api-client-react';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesome } from '@expo/vector-icons';

export default function RankingScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');

  const { data: globalRanking, isLoading: globalLoading } = useGetGlobalRanking({ limit: 100 });
  const { data: friendsRanking, isLoading: friendsLoading } = useGetFriendsRanking({});

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'global' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        onPress={() => setActiveTab('global')}
      >
        <Text style={[styles.tabText, { color: activeTab === 'global' ? colors.foreground : colors.mutedForeground }]}>
          {t('ranking.global')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'friends' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        onPress={() => setActiveTab('friends')}
      >
        <Text style={[styles.tabText, { color: activeTab === 'friends' ? colors.foreground : colors.mutedForeground }]}>
          {t('ranking.friends')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const data = activeTab === 'global' ? globalRanking : friendsRanking;
  const isLoading = activeTab === 'global' ? globalLoading : friendsLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('ranking.title')}</Text>
      </View>

      {renderTabs()}

      {isLoading ? (
        <View style={{ padding: 20 }}>
          <SkeletonLoader style={{ height: 60, marginBottom: 12 }} />
          <SkeletonLoader style={{ height: 60, marginBottom: 12 }} />
          <SkeletonLoader style={{ height: 60, marginBottom: 12 }} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <RankingRow 
              entry={item} 
              isCurrentUser={item.userId === user?.id} 
            />
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome name="trophy" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t('ranking.noData')}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
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
});
