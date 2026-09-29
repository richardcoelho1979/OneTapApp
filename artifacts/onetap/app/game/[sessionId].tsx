/**
 * Generic game screen — works for ANY game plugin.
 *
 * Polls the session, renders the game board (memory for now — future games add
 * their own renderer keyed by session.gameId) and shows the platform chrome:
 * scores, turn indicator, pause/leave and the final results modal.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  useGetSession,
  getGetSessionQueryKey,
  useSubmitGameAction,
  GameSession,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

// ─── Memory game state types (mirror of the server engine) ───────────────────

interface MemoryCard {
  id: number;
  pairId: number;
  isMatched: boolean;
  matchedBy?: string;
}

interface MemoryState {
  cards: MemoryCard[];
  playerOrder: string[];
  currentTurnIndex: number;
  pendingFlip: number | null;
  scores: Record<string, number>;
  moves: Record<string, number>;
  lastResult?: 'match' | 'no_match';
  lastPairIds?: number[];
}

const PAIR_EMOJIS = ['🍎', '🚀', '🐬', '🌵', '🎩', '⚽', '🎸', '🍕', '🦋', '⭐'];

export default function GameScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: session, isLoading } = useGetSession(sessionId as string, {
    query: {
      queryKey: getGetSessionQueryKey(sessionId as string),
      refetchInterval: 2000,
    },
  });

  const submitAction = useSubmitGameAction();

  const state = (session?.state ?? null) as MemoryState | null;
  const isFinished = session?.status === 'finished';
  const myTurn =
    !!state && !!user && state.playerOrder?.[state.currentTurnIndex] === user.id;

  const playersById = useMemo(() => {
    const map: Record<string, GameSession['players'][number]> = {};
    for (const p of session?.players ?? []) map[p.userId] = p;
    return map;
  }, [session?.players]);

  const handleFlip = async (cardId: number) => {
    if (!myTurn || submitAction.isPending || isFinished) return;
    setActionError(null);
    try {
      await submitAction.mutateAsync({
        sessionId: sessionId as string,
        data: { type: 'flip', payload: { cardId } },
      });
    } catch (e: any) {
      // Invalid moves (e.g. stale board) are harmless — surface briefly.
      setActionError(e?.message ?? 'invalid move');
      setTimeout(() => setActionError(null), 2000);
    }
  };

  if (isLoading || !session || !state?.cards) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>
          {t('gameScreen.loading')}
        </Text>
      </View>
    );
  }

  const faceUp = (card: MemoryCard) =>
    card.isMatched ||
    state.pendingFlip === card.id ||
    (state.lastPairIds?.includes(card.id) ?? false);

  // ─── Finished: results screen ───────────────────────────────────────────────
  if (isFinished) {
    const ranked = [...session.players].sort(
      (a, b) => (a.finalRank ?? 99) - (b.finalRank ?? 99),
    );
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <Text style={[styles.resultsTitle, { color: colors.foreground }]}>
            🏆 {t('memoryGame.game_over')}
          </Text>
          {ranked.map((p) => (
            <View
              key={p.userId}
              style={[styles.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.resultRank, { color: colors.primary }]}>
                {p.finalRank ?? '-'}º
              </Text>
              <Avatar url={p.avatarUrl} username={p.username} size="sm" />
              <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={1}>
                {p.username} {p.userId === user?.id ? `(${t('gameScreen.you')})` : ''}
              </Text>
              <Text style={[styles.resultScore, { color: colors.mutedForeground }]}>
                {p.score} {t('gameScreen.score').toLowerCase()}
              </Text>
            </View>
          ))}
          <Button
            title={t('gameScreen.back_home')}
            onPress={() => router.replace('/(main)/(tabs)/play')}
            size="lg"
            style={{ marginTop: 24 }}
          />
        </ScrollView>
      </View>
    );
  }

  // ─── Live board ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={28} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('memoryGame.name')}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Turn banner */}
      <View
        style={[
          styles.turnBanner,
          { backgroundColor: myTurn ? colors.primary : colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={{ color: myTurn ? colors.primaryForeground : colors.mutedForeground, fontWeight: '700' }}>
          {actionError
            ? actionError
            : myTurn
              ? t('memoryGame.your_turn')
              : state.playerOrder.length === 1
                ? t('memoryGame.solo_instruction')
                : `${playersById[state.playerOrder[state.currentTurnIndex]]?.username ?? '...'} — ${t('memoryGame.waiting_turn')}`}
        </Text>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreRow}>
        {state.playerOrder.map((uid) => (
          <View
            key={uid}
            style={[
              styles.scoreChip,
              {
                backgroundColor: colors.card,
                borderColor:
                  uid === state.playerOrder[state.currentTurnIndex] ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.scoreName, { color: colors.foreground }]} numberOfLines={1}>
              {playersById[uid]?.username ?? '...'}
            </Text>
            <Text style={[styles.scoreValue, { color: colors.primary }]}>
              {state.scores[uid] ?? 0} 🃏
            </Text>
          </View>
        ))}
      </View>

      {/* Board */}
      <ScrollView contentContainerStyle={styles.board}>
        {state.cards.map((card) => {
          const up = faceUp(card);
          return (
            <TouchableOpacity
              key={card.id}
              onPress={() => handleFlip(card.id)}
              disabled={!myTurn || card.isMatched || submitAction.isPending}
              style={[
                styles.card,
                {
                  backgroundColor: card.isMatched
                    ? colors.secondary
                    : up
                      ? colors.card
                      : colors.primary,
                  borderColor: colors.border,
                  opacity: card.isMatched ? 0.55 : 1,
                },
              ]}
            >
              <Text style={styles.cardFace}>
                {up ? PAIR_EMOJIS[card.pairId % PAIR_EMOJIS.length] : '❓'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: 'bold' },
  turnBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 2,
  },
  scoreName: { fontSize: 12, fontWeight: '600', maxWidth: 90 },
  scoreValue: { fontSize: 13, fontWeight: '800' },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  card: {
    width: 72,
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFace: { fontSize: 32 },
  resultsContent: { padding: 24, paddingBottom: 80 },
  resultsTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 24,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  resultRank: { fontSize: 18, fontWeight: '900', width: 34 },
  resultName: { flex: 1, fontSize: 15, fontWeight: '600' },
  resultScore: { fontSize: 13, fontWeight: '600' },
});
