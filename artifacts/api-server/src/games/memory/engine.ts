/**
 * Memory Game Engine — pure state-machine, zero I/O.
 *
 * Rules
 * ─────
 * • Board: N pairs of face-down cards (8 for ≤2 players, 9 for 3, 10 for 4+).
 * • Turn: active player flips two cards.
 *   - Match    → cards stay revealed, player scores +1 and plays again.
 *   - No match → cards flip back, turn passes to the next player.
 * • Game ends when every pair is found.
 * • Ranking: pairs found (desc), then move count (asc) as tie-breaker.
 */

export interface MemoryCard {
  id: number;
  pairId: number;      // cards sharing pairId form a pair
  isMatched: boolean;
  matchedBy?: string;  // userId that matched the pair
}

export interface MemoryGameState {
  cards: MemoryCard[];
  playerOrder: string[];
  currentTurnIndex: number;
  /** cardId of the first (still unresolved) flip this turn, else null. */
  pendingFlip: number | null;
  scores: Record<string, number>;  // pairs found
  moves: Record<string, number>;   // total flips
  mistakes: Record<string, number>; // failed match attempts (for achievements)
  startedAt: number;
  finishedAt?: number;
  /** Result of the last completed flip-pair, for client animation. */
  lastResult?: 'match' | 'no_match';
  /** pairId revealed by lastResult (client shows card faces). */
  lastPairIds?: number[];
  [key: string]: unknown; // index signature so it satisfies GameState
}

// ─── Internals ───────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[], seed: number): T[] {
  // Deterministic Fisher-Yates (LCG) — reproducible boards for tests.
  const a = [...arr];
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function pairCount(playerCount: number): number {
  if (playerCount <= 2) return 8;
  if (playerCount === 3) return 9;
  return 10;
}

function allMatched(cards: MemoryCard[]): boolean {
  return cards.every((c) => c.isMatched);
}

// ─── Engine API ──────────────────────────────────────────────────────────────

export function initialState(playerIds: string[]): MemoryGameState {
  const numPairs = pairCount(playerIds.length);
  const seed = Math.floor(Date.now() / 1000);

  const cards: MemoryCard[] = [];
  for (let p = 0; p < numPairs; p++) {
    cards.push({ id: p * 2, pairId: p, isMatched: false });
    cards.push({ id: p * 2 + 1, pairId: p, isMatched: false });
  }

  const scores: Record<string, number> = {};
  const moves: Record<string, number> = {};
  const mistakes: Record<string, number> = {};
  for (const id of playerIds) {
    scores[id] = 0;
    moves[id] = 0;
    mistakes[id] = 0;
  }

  return {
    cards: shuffle(cards, seed),
    playerOrder: playerIds,
    currentTurnIndex: 0,
    pendingFlip: null,
    scores,
    moves,
    mistakes,
    startedAt: Date.now(),
  };
}

export function processAction(
  raw: Record<string, unknown>,
  action: { type: string; payload: Record<string, unknown> },
  actorId: string,
): { state: MemoryGameState; events: string[] } {
  const state: MemoryGameState = JSON.parse(JSON.stringify(raw));
  const events: string[] = [];

  if (action.type !== 'flip') {
    throw new Error(`Unknown action type: ${action.type}`);
  }

  const cardId = Number(action.payload['cardId']);
  if (!Number.isInteger(cardId)) throw new Error('cardId must be an integer');

  const activePlayer = state.playerOrder[state.currentTurnIndex];
  if (actorId !== activePlayer) throw new Error('Not your turn');

  const card = state.cards.find((c) => c.id === cardId);
  if (!card) throw new Error('Card not found');
  if (card.isMatched) throw new Error('Card already matched');
  if (state.pendingFlip === cardId) throw new Error('Cannot flip the same card twice');

  state.moves[actorId] = (state.moves[actorId] ?? 0) + 1;
  // A new flip clears the previous animation hints.
  state.lastResult = undefined;
  state.lastPairIds = undefined;

  // First flip of the turn — just remember it.
  if (state.pendingFlip === null) {
    state.pendingFlip = cardId;
    events.push('card_flipped');
    return { state, events };
  }

  // Second flip — resolve.
  const first = state.cards.find((c) => c.id === state.pendingFlip)!;
  const second = card;

  if (first.pairId === second.pairId) {
    first.isMatched = true;
    second.isMatched = true;
    first.matchedBy = actorId;
    second.matchedBy = actorId;
    state.scores[actorId] = (state.scores[actorId] ?? 0) + 1;
    state.lastResult = 'match';
    state.lastPairIds = [first.id, second.id];
    events.push('pair_matched');
    // Match ⇒ same player plays again (turn does not advance).
  } else {
    state.mistakes[actorId] = (state.mistakes[actorId] ?? 0) + 1;
    state.lastResult = 'no_match';
    state.lastPairIds = [first.id, second.id];
    state.currentTurnIndex = (state.currentTurnIndex + 1) % state.playerOrder.length;
    events.push('no_match');
  }

  state.pendingFlip = null;

  if (allMatched(state.cards)) {
    state.finishedAt = Date.now();
    events.push('game_finished');
  }

  return { state, events };
}

export function isFinished(raw: Record<string, unknown>): boolean {
  return typeof (raw as MemoryGameState).finishedAt === 'number';
}

export function computeResults(
  raw: Record<string, unknown>,
): Array<{ userId: string; score: number; finalRank: number }> {
  const state = raw as MemoryGameState;
  const elapsedSec = Math.floor(
    ((state.finishedAt ?? Date.now()) - state.startedAt) / 1000,
  );

  const sorted = [...state.playerOrder].sort((a, b) => {
    const dPairs = (state.scores[b] ?? 0) - (state.scores[a] ?? 0);
    if (dPairs !== 0) return dPairs;
    const dMoves = (state.moves[a] ?? 0) - (state.moves[b] ?? 0);
    if (dMoves !== 0) return dMoves;
    return state.playerOrder.indexOf(a) - state.playerOrder.indexOf(b);
  });

  return sorted.map((userId, idx) => ({
    userId,
    // pairs×100 − moves×2 + speed bonus (up to 300)
    score: Math.max(
      0,
      (state.scores[userId] ?? 0) * 100 -
        (state.moves[userId] ?? 0) * 2 +
        Math.max(0, 300 - elapsedSec),
    ),
    finalRank: idx + 1,
  }));
}
