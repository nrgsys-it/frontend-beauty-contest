import type { Conversation } from '@prisma/client';
import { prisma } from '../prisma';

export interface ConversationGateway {
  getAllConversations(): Promise<Conversation[]>;
}

export const conversationGateway: ConversationGateway = {
  getAllConversations() {
    return prisma.conversation.findMany();
  },
};

export const getAllConversations = () =>
  conversationGateway.getAllConversations();
