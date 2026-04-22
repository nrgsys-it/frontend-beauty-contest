import { PrismaClient } from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL non impostata');
}
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });
async function main() {
  const user1 = await prisma.user.upsert({
    where: { email: 'mario@example.com' },
    update: {},
    create: {
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario@example.com',
      passwordHash: 'hash-demo',
    },
  });
  const user2 = await prisma.user.upsert({
    where: { email: 'luigi@example.com' },
    update: {},
    create: {
      name: 'Luigi',
      surname: 'Verdi',
      email: 'luigi@example.com',
      passwordHash: 'hash-demo',
    },
  });
  await prisma.conversation.create({
    data: {
      title: 'Chat demo',
      users: {
        connect: [{ id: user1.id }, { id: user2.id }],
      },
    },
  });
}
main().finally(() => prisma.$disconnect());
