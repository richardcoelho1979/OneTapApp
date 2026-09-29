import { achievementsRepository } from './achievements.repository';

function fmt(a: Awaited<ReturnType<typeof achievementsRepository.getAll>>[number]) {
  return {
    id: a.id,
    key: a.key,
    title: a.title,
    description: a.description,
    icon: a.icon,
    category: a.category,
    xpReward: a.xpReward,
    isSecret: a.isSecret,
  };
}

export const achievementsService = {
  async getAll() {
    return (await achievementsRepository.getAll()).map(fmt);
  },
};
