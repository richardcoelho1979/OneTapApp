import { AppError } from '../../shared/errors/AppError';
import { seasonsRepository } from './seasons.repository';

function fmt(s: Awaited<ReturnType<typeof seasonsRepository.getAll>>[number]) {
  return {
    id: s.id,
    name: s.name,
    number: s.number,
    description: s.description ?? null,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    isActive: s.isActive,
    themeColor: s.themeColor ?? null,
  };
}

export const seasonsService = {
  async getAll() {
    return (await seasonsRepository.getAll()).map(fmt);
  },
  async getCurrent() {
    const s = await seasonsRepository.getCurrent();
    if (!s) throw AppError.notFound('No active season');
    return fmt(s);
  },
};
