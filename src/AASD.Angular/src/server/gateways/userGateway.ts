import {User} from '@prisma/client';
import {prisma} from '../prisma';

export interface UserGateway {
  getAllUsers(): Promise<User[]>;
}

export const userGateway: UserGateway = {
  getAllUsers() {
    return prisma.user.findMany();
  },
}
