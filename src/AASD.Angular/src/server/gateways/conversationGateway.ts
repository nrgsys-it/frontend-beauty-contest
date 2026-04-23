import type { Conversation } from '@prisma/client';
import { prisma } from '../prisma';

export interface ConversationGateway {
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
}

export const conversationGateway: ConversationGateway = {
  getConversationsByUserId(userId: string) {
    return prisma.conversation.findMany({
      where: {
        users: {
          some: {
            id: userId,
          },
        },
      },
    });
  },
};

