import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;

declare global {
  var prisma: PrismaClient | undefined;
}

// Le pool n'est créé qu'avec le client : en dev, chaque rechargement à chaud
// réévalue ce module, et un `new Pool` hors de cette fonction ouvrait un pool de
// plus à chaque fois, alors que le client réutilisé (global.prisma) ne s'en
// servait jamais.
function creerClient(): PrismaClient {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter: new PrismaPg(pool),
    // En production, ne pas logger chaque requête : sur les crons de synchro
    // (centaines de requêtes), l'écriture des logs devient un coût mesurable.
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  });
}

const prisma = global.prisma ?? creerClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;