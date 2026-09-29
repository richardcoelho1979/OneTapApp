import { AppError } from '../../shared/errors/AppError';
import { buildUserProfile } from '../../shared/mappers/user.mapper';
import { notificationsService } from '../notifications/notifications.service';
import { friendsRepository } from './friends.repository';

export const friendsService = {
  async getFriends(userId: string) {
    const rows = await friendsRepository.getFriends(userId);
    return rows.map((r) => ({
      id: r.friendship.id,
      userId: r.friendship.userId,
      friendId: r.friendship.friendId,
      friend: buildUserProfile(r.friend),
      createdAt: r.friendship.createdAt.toISOString(),
    }));
  },

  async sendFriendRequest(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw AppError.badRequest('Cannot send friend request to yourself');
    }
    if (await friendsRepository.areFriends(fromUserId, toUserId)) {
      throw AppError.conflict('Already friends');
    }
    if (await friendsRepository.hasPendingRequest(fromUserId, toUserId)) {
      throw AppError.conflict('Friend request already pending');
    }

    const req = await friendsRepository.createRequest(fromUserId, toUserId);

    // Cross-module: notify the recipient (in-process service call in monolith,
    // becomes an HTTP/event call when notifications becomes a microservice)
    await notificationsService.create({
      userId: toUserId,
      type: 'friend_request',
      title: 'Novo pedido de amizade',
      body: 'Alguém quer ser seu amigo no OneTap',
      data: { requestId: req.id, fromUserId },
    });

    return {
      id: req.id,
      fromUserId: req.fromUserId,
      toUserId: req.toUserId,
      status: req.status,
      createdAt: req.createdAt.toISOString(),
    };
  },

  async getIncomingRequests(userId: string) {
    const rows = await friendsRepository.getIncomingRequests(userId);
    return rows.map((r) => ({
      id: r.request.id,
      fromUserId: r.request.fromUserId,
      toUserId: r.request.toUserId,
      status: r.request.status,
      fromUser: buildUserProfile(r.fromUser),
      createdAt: r.request.createdAt.toISOString(),
    }));
  },

  async getSentRequests(userId: string) {
    const rows = await friendsRepository.getSentRequests(userId);
    return rows.map((r) => ({
      id: r.request.id,
      fromUserId: r.request.fromUserId,
      toUserId: r.request.toUserId,
      status: r.request.status,
      toUser: buildUserProfile(r.toUser),
      createdAt: r.request.createdAt.toISOString(),
    }));
  },

  async respondToRequest(requestId: string, toUserId: string, action: 'accept' | 'reject') {
    const req = await friendsRepository.findRequest(requestId, toUserId);
    if (!req) throw AppError.notFound('Request not found');

    const updated = await friendsRepository.updateRequestStatus(
      requestId,
      action === 'accept' ? 'accepted' : 'rejected',
    );

    if (action === 'accept') {
      await friendsRepository.createFriendship(req.toUserId, req.fromUserId);

      await notificationsService.create({
        userId: req.fromUserId,
        type: 'friend_accepted',
        title: 'Pedido aceito!',
        body: 'Seu pedido de amizade foi aceito',
        data: { userId: req.toUserId },
      });
    }

    return {
      id: updated.id,
      fromUserId: updated.fromUserId,
      toUserId: updated.toUserId,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
    };
  },

  async removeFriend(userId: string, friendId: string) {
    const isFriend = await friendsRepository.isFriend(userId, friendId);
    if (!isFriend) throw AppError.notFound('Friend not found');
    await friendsRepository.deleteFriendship(userId, friendId);
  },
};
