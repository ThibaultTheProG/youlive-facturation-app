import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = global.prisma || new PrismaClient({
  adapter,
  log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;