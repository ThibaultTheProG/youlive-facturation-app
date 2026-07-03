import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * RAPPORT SEUL — aucune écriture.
 *
 * Liste toutes les relations_contrats locales dont l'idrelationapimo n'existe PLUS
 * dans les entries Apimo (toutes années, tous statuts). On collecte l'ensemble des
 * ids d'entries présents côté Apimo (en paginant l'API), puis on compare aux
 * idrelationapimo stockés en base.
 *
 * Usage : node --env-file=.env scripts/audit-relations-orphelines.ts
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL n'est pas définie");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const AUTH = `Basic ${Buffer.from(`${process.env.USERNAME}:${process.env.PASSWORD}`).toString('base64')}`;

interface ApimoEntry { id: string | number; type?: string }
interface ApimoContract { id: string | number; entries?: ApimoEntry[] }

/** Récupère TOUS les contrats Apimo en paginant, et renvoie l'ensemble des ids d'entries. */
async function fetchAllApimoEntryIds(): Promise<Set<number>> {
  const ids = new Set<number>();
  const limit = 100;
  let offset = 0;
  let totalItems = Infinity;
  let pages = 0;

  while (offset < totalItems) {
    const url = `https://api.apimo.pro/agencies/24045/contracts?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { headers: { Authorization: AUTH } });
    if (!res.ok) throw new Error(`Apimo HTTP ${res.status} à offset ${offset}`);
    const brut = await res.json();

    const contracts: ApimoContract[] = brut.contracts || [];
    totalItems = Number(brut.total_items ?? contracts.length);

    for (const c of contracts) {
      for (const e of c.entries ?? []) {
        if (e?.id !== undefined && e?.id !== null) ids.add(Number(e.id));
      }
    }

    pages++;
    if (contracts.length === 0) break; // garde-fou
    offset += limit;
  }

  console.error(`Apimo : ${pages} page(s), total_items=${totalItems}, ${ids.size} ids d'entries distincts collectés.`);
  return ids;
}

async function main() {
  const apimoEntryIds = await fetchAllApimoEntryIds();

  // Toutes les relations locales avec leurs infos
  const relations = await prisma.relations_contrats.findMany({
    select: {
      idrelationapimo: true,
      contrat_id: true,
      honoraires_agent: true,
      vat_rate: true,
      utilisateurs: { select: { id: true, prenom: true, nom: true, idapimo: true } },
      contrats: { select: { idcontratapimo: true, date_signature: true } },
      factures: { select: { id: true, type: true, statut_paiement: true, tranche: true, numero: true } },
    },
    orderBy: { idrelationapimo: 'asc' },
  });

  const orphelines = relations.filter(r => !apimoEntryIds.has(r.idrelationapimo));

  console.error(`\nBase : ${relations.length} relations_contrats, ${orphelines.length} orpheline(s) (absente(s) d'Apimo).\n`);

  const rows = orphelines.map(r => ({
    idrelationapimo: r.idrelationapimo,
    user: `${r.utilisateurs?.prenom ?? ''} ${r.utilisateurs?.nom ?? ''}`.trim() + ` (id=${r.utilisateurs?.id}, apimo=${r.utilisateurs?.idapimo})`,
    contrat_id: r.contrat_id,
    contrat_apimo: r.contrats?.idcontratapimo ?? null,
    date_signature: r.contrats?.date_signature ?? null,
    honoraires_agent: r.honoraires_agent?.toString() ?? null,
    vat_rate: r.vat_rate?.toString() ?? null,
    nb_factures: r.factures.length,
    factures: r.factures.map(f => `#${f.id}[${f.type}/${f.tranche ?? '-'}] ${f.statut_paiement ?? 'null'} (${f.numero ?? 'sans n°'})`),
  }));

  // Sortie JSON complète sur stdout (pour exploitation), résumé lisible sur stderr
  console.log(JSON.stringify(rows, null, 2));

  console.error('\n=== RÉSUMÉ LISIBLE ===');
  for (const row of rows) {
    console.error(`\n• idrelationapimo=${row.idrelationapimo} | ${row.user}`);
    console.error(`  contrat_id=${row.contrat_id} (apimo ${row.contrat_apimo}, signé ${row.date_signature ? new Date(row.date_signature).toISOString().slice(0,10) : '?'})`);
    console.error(`  honoraires_agent=${row.honoraires_agent} | vat_rate=${row.vat_rate}`);
    console.error(`  factures liées: ${row.nb_factures}`);
    for (const f of row.factures) console.error(`    - ${f}`);
  }
  console.error(`\nTotal orphelines: ${rows.length}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
