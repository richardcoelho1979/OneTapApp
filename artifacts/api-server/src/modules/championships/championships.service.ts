import { AppError } from '../../shared/errors/AppError';
import { championshipsRepository } from './championships.repository';

function fmt(c: Awaited<ReturnType<typeof championshipsRepository.getAll>>[number]) {
  return {
    id: c.id,
    name: c.name,
    gameId: c.gameId ?? null,
    description: c.description ?? null,
    status: c.status,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    maxParticipants: c.maxParticipants,
    currentParticipants: c.currentParticipants,
    prizeDescription: c.prizeDescription ?? null,
    isExclusive: c.isExclusive,
    bannerUrl: c.bannerUrl ?? null,
  };
}

export const championshipsService = {
  async getAll(status?: string) {
    const valid = ['upcoming', 'active', 'finished'] as const;
    type ValidStatus = (typeof valid)[number];
    const s = valid.includes(status as ValidStatus) ? (status as ValidStatus) : undefined;
    return (await championshipsRepository.getAll(s)).map(fmt);
  },

  async getById(id: string) {
    const c = await championshipsRepository.findById(id);
    if (!c) throw AppError.notFound('Championship not found');
    return fmt(c);
  },
};
