import { gamesRepository } from './games.repository';

function fmt(g: Awaited<ReturnType<typeof gamesRepository.getActive>>[number]) {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    minPlayers: g.minPlayers,
    maxPlayers: g.maxPlayers,
    averageDuration: g.averageDuration,
    iconUrl: g.iconUrl ?? null,
    isActive: g.isActive,
    isPlusExclusive: g.isPlusExclusive,
    tags: g.tags,
  };
}

export const gamesService = {
  async getActive() {
    return (await gamesRepository.getActive()).map(fmt);
  },
};
