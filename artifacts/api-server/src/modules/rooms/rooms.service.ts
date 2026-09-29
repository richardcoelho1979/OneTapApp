import { AppError } from '../../shared/errors/AppError';
import { roomsRepository } from './rooms.repository';

async function buildRoom(roomId: string) {
  const room = await roomsRepository.findById(roomId);
  if (!room) return null;
  const players = await roomsRepository.getPlayers(roomId);
  return {
    id: room.id,
    gameId: room.gameId ?? null,
    name: room.name,
    code: room.code,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    currentPlayers: room.currentPlayers,
    status: room.status,
    isPrivate: room.isPrivate,
    createdAt: room.createdAt.toISOString(),
    players: players.map((p) => ({
      userId: p.user.id,
      username: p.user.username,
      avatarUrl: p.user.avatarUrl ?? null,
      isHost: p.player.isHost,
      joinedAt: p.player.joinedAt.toISOString(),
    })),
  };
}

export const roomsService = {
  async getActiveRooms() {
    const rooms = await roomsRepository.getActivePublicRooms();
    const results = await Promise.all(rooms.map((r) => buildRoom(r.id)));
    return results.filter(Boolean);
  },

  async createRoom(
    userId: string,
    data: { name: string; maxPlayers: number; isPrivate?: boolean; gameId?: string },
  ) {
    const roomId = await roomsRepository.create({
      name: data.name,
      hostId: userId,
      maxPlayers: data.maxPlayers,
      isPrivate: data.isPrivate ?? false,
      gameId: data.gameId,
    });
    return buildRoom(roomId);
  },

  async getRoom(roomId: string) {
    const room = await buildRoom(roomId);
    if (!room) throw AppError.notFound('Room not found');
    return room;
  },

  async deleteRoom(roomId: string, userId: string) {
    const room = await roomsRepository.findById(roomId);
    if (!room) throw AppError.notFound('Room not found');
    if (room.hostId !== userId) throw AppError.forbidden('Only the host can delete the room');
    await roomsRepository.delete(roomId);
  },

  async joinRoom(roomId: string, userId: string) {
    const room = await roomsRepository.findById(roomId);
    if (!room) throw AppError.notFound('Room not found');

    const existing = await roomsRepository.findPlayer(roomId, userId);
    if (existing) return buildRoom(roomId);

    if (room.currentPlayers >= room.maxPlayers) throw AppError.conflict('Room is full');

    await roomsRepository.addPlayer(roomId, userId);
    await roomsRepository.updatePlayerCount(roomId, room.currentPlayers + 1);
    return buildRoom(roomId);
  },

  async leaveRoom(roomId: string, userId: string) {
    await roomsRepository.removePlayer(roomId, userId);
    const room = await roomsRepository.findById(roomId);
    if (!room) return;

    const newCount = Math.max(0, room.currentPlayers - 1);
    if (newCount === 0) {
      await roomsRepository.delete(roomId);
    } else {
      await roomsRepository.updatePlayerCount(roomId, newCount);
      if (room.hostId === userId) {
        await roomsRepository.transferHost(roomId);
      }
    }
  },

  async joinByCode(code: string, userId: string) {
    const room = await roomsRepository.findByCode(code);
    if (!room) throw AppError.notFound('Invalid room code');

    const existing = await roomsRepository.findPlayer(room.id, userId);
    if (!existing) {
      if (room.currentPlayers >= room.maxPlayers) throw AppError.conflict('Room is full');
      await roomsRepository.addPlayer(room.id, userId);
      await roomsRepository.updatePlayerCount(room.id, room.currentPlayers + 1);
    }

    return buildRoom(room.id);
  },
};
