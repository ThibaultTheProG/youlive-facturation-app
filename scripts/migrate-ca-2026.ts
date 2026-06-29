import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Migration ponctuelle — recompose historique_ca_annuel pour 2026 et SIGNALE
 * (sans rien modifier sur les factures) les factures commission incohérentes.
 *
 * Source de vérité : l'API Apimo (inclut les entries vat/vat_rate = 0 qui étaient
 * auparavant rejetées à l'import). Le CA est recomposé comme la SOMME des
 * honoraires_agent des entries type 9 par conseiller pour 2026, puis le découpage
 * au seuil attendu est re-dérivé chronologiquement et comparé aux factures en base.
 *
 * Usage (Node 23+, exécution TypeScript native, charge le .env) :
 *   node --env-file=.env scripts/migrate-ca-2026.ts
 */

const ANNEE = 2026;
const SEUIL = 70000;
const EPSILON = 0.01; // tolérance de comparaison sur les montants

/** Arrondi 2 décimales (neutralise les artefacts flottants avant comparaison au seuil). */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL n'est pas définie");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Réplique de src/utils/calculs.tsx (inliné pour rendre le script autonome)
function calculRetrocession(
  typecontrat: string,
  chiffre_affaires: number,
  autoParrain?: string
): number {
  let retrocession = 0;
  switch (typecontrat) {
    case 'Offre Youlive':
      retrocession = chiffre_affaires >= SEUIL ? 99 : 70;
      break;
    case 'Offre Découverte':
      retrocession = chiffre_affaires >= SEUIL ? 99 : 60;
      break;
    default:
      retrocession = 0;
  }
  if (autoParrain === 'oui') {
    retrocession += 6;
  }
  return Math.min(retrocession, 99);
}

interface Entry {
  id: string | number;
  user: string | number;
  amount: string | number;
  type: string;
}

interface ApimoContract {
  id: string | number;
  step: string;
  contract_at: string;
  entries?: Entry[];
}

interface RelationType9 {
  idrelationapimo: number;
  idapimoUser: number;
  honoraires: number;
  dateSignature: Date;
}

async function fetchContracts(): Promise<ApimoContract[]> {
  const response = await fetch('https://api.apimo.pro/agencies/24045/contracts', {
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.USERNAME}:${process.env.PASSWORD}`
      ).toString('base64')}`,
      cache: 'force-cache',
    },
  });
  if (!response.ok) {
    throw new Error(`Échec récupération contrats Apimo: ${response.status}`);
  }
  const brut = await response.json();
  return (brut.contracts || []) as ApimoContract[];
}

async function migrateCa2026() {
  console.log(`🚀 Recompute du CA ${ANNEE} + audit des factures commission...\n`);

  const contracts = await fetchContracts();

  // 1. Collecter toutes les entries type 9 de l'année 2026 (contrats step 4)
  const relationsParUser = new Map<number, RelationType9[]>();

  for (const contrat of contracts) {
    if (contrat.step !== '4') continue;
    if (!contrat.contract_at) continue;
    const dateSignature = new Date(contrat.contract_at);
    if (dateSignature.getFullYear() !== ANNEE) continue;

    for (const entry of contrat.entries || []) {
      const { id, user, amount, type } = entry;
      if (type !== '9') continue;
      // id, user et amount obligatoires ; vat/vat_rate = 0 acceptés (non pertinents ici)
      if (!id || !user || amount === undefined || amount === null) continue;

      const idapimoUser = Number(user);
      const utilisateur = await prisma.utilisateurs.findFirst({
        where: { idapimo: idapimoUser },
        select: { id: true },
      });
      if (!utilisateur) continue;

      const liste = relationsParUser.get(utilisateur.id) ?? [];
      liste.push({
        idrelationapimo: Number(id),
        idapimoUser,
        honoraires: Number(amount),
        dateSignature,
      });
      relationsParUser.set(utilisateur.id, liste);
    }
  }

  console.log(`📊 ${relationsParUser.size} conseillers avec des contrats ${ANNEE}\n`);

  let caCorriges = 0;
  let caInchanges = 0;
  let caClotures = 0;
  const incoherences: string[] = [];

  for (const [userId, relations] of relationsParUser.entries()) {
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: userId },
      select: { prenom: true, nom: true, typecontrat: true, auto_parrain: true },
    });
    if (!utilisateur) continue;
    const label = `${utilisateur.prenom} ${utilisateur.nom}`;
    const typecontrat = utilisateur.typecontrat || '';
    const autoParrain = utilisateur.auto_parrain || undefined;

    // 2. Recomposer le CA (SOMME des honoraires type 9), arrondi 2 décimales
    const totalCA = round2(relations.reduce((s, r) => s + r.honoraires, 0));
    const newRetro = calculRetrocession(typecontrat, totalCA, autoParrain);

    const existant = await prisma.historique_ca_annuel.findUnique({
      where: { user_id_annee: { user_id: userId, annee: ANNEE } },
      select: { chiffre_affaires: true, date_cloture: true },
    });

    if (existant?.date_cloture) {
      console.log(`⏭️  ${label} — année ${ANNEE} clôturée, recompute ignoré`);
      caClotures++;
    } else {
      const ancienCA = existant ? Number(existant.chiffre_affaires) : 0;
      await prisma.historique_ca_annuel.upsert({
        where: { user_id_annee: { user_id: userId, annee: ANNEE } },
        update: {
          chiffre_affaires: totalCA,
          retrocession_finale: newRetro,
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          annee: ANNEE,
          chiffre_affaires: totalCA,
          retrocession_finale: newRetro,
          typecontrat,
          auto_parrain: autoParrain,
        },
      });
      // 2026 = année en cours : synchroniser le cache utilisateurs
      await prisma.utilisateurs.update({
        where: { id: userId },
        data: { chiffre_affaires: totalCA, retrocession: newRetro },
      });

      if (Math.abs(ancienCA - totalCA) > EPSILON) {
        console.log(`✅ ${label} — CA ${ancienCA}€ → ${totalCA}€ (rétro ${newRetro}%)`);
        caCorriges++;
      } else {
        caInchanges++;
      }
    }

    // 3. Re-dériver le découpage au seuil attendu (chronologique, base 0)
    //    et le comparer aux factures commission existantes.
    const relationsTriees = [...relations].sort(
      (a, b) => a.dateSignature.getTime() - b.dateSignature.getTime()
    );
    let currentCA = 0;
    for (const rel of relationsTriees) {
      const honoraires = rel.honoraires;
      const caAvant = round2(currentCA);
      const newCA = round2(caAvant + honoraires);

      // Tranches attendues (logique identique à factures/create / decoupageSeuil)
      let montantAvant = 0;
      let montantApres = 0;
      if (caAvant < SEUIL && newCA > SEUIL) {
        montantAvant = round2(SEUIL - caAvant);
        montantApres = round2(honoraires - montantAvant);
      } else if (caAvant >= SEUIL) {
        montantApres = honoraires;
      } else {
        montantAvant = honoraires;
      }
      const tauxAvant = montantAvant > 0 ? calculRetrocession(typecontrat, caAvant, autoParrain) : 0;
      const tauxApres = montantApres > 0 ? calculRetrocession(typecontrat, SEUIL, autoParrain) : 0;
      currentCA = newCA;

      // Factures commission existantes pour cette relation
      const relationDb = await prisma.relations_contrats.findUnique({
        where: { idrelationapimo: rel.idrelationapimo },
        select: { id: true },
      });
      if (!relationDb) {
        incoherences.push(
          `${label} — relation Apimo ${rel.idrelationapimo} (${honoraires}€) ABSENTE en base (entry jamais importée, probable vat=0). À resynchroniser puis régénérer.`
        );
        continue;
      }

      const factures = await prisma.factures.findMany({
        where: { relation_id: relationDb.id, user_id: userId, type: 'commission' },
        select: { tranche: true, montant_honoraires: true, taux_retrocession: true },
      });

      const tranchesAttendues = [
        { tranche: 'avant_seuil', montant: montantAvant, taux: tauxAvant },
        { tranche: 'apres_seuil', montant: montantApres, taux: tauxApres },
      ].filter((t) => t.montant > EPSILON);

      const problemes: string[] = [];

      // Nombre de tranches
      if (factures.length !== tranchesAttendues.length) {
        problemes.push(
          `${factures.length} facture(s) en base vs ${tranchesAttendues.length} attendue(s)`
        );
      }

      // Comparaison tranche par tranche
      for (const attendue of tranchesAttendues) {
        const f = factures.find((x: { tranche: string | null }) => x.tranche === attendue.tranche);
        if (!f) {
          problemes.push(`tranche ${attendue.tranche} manquante (attendu ${attendue.montant.toFixed(2)}€ @${attendue.taux}%)`);
          continue;
        }
        const mh = Number(f.montant_honoraires ?? 0);
        const taux = Number(f.taux_retrocession ?? 0);
        if (Math.abs(mh - attendue.montant) > EPSILON) {
          problemes.push(`${attendue.tranche}: honoraires ${mh}€ vs ${attendue.montant.toFixed(2)}€ attendus`);
        }
        if (Math.abs(taux - attendue.taux) > EPSILON) {
          problemes.push(`${attendue.tranche}: taux ${taux}% vs ${attendue.taux}% attendu`);
        }
      }

      if (problemes.length > 0) {
        incoherences.push(
          `${label} — relation ${relationDb.id} (Apimo ${rel.idrelationapimo}, ${honoraires}€) : ${problemes.join(' | ')}`
        );
      }
    }
  }

  console.log(`\n──────────── Recompute CA ${ANNEE} ────────────`);
  console.log(`   ✅ ${caCorriges} conseillers corrigés`);
  console.log(`   ➖ ${caInchanges} conseillers déjà à jour`);
  console.log(`   ⏭️  ${caClotures} conseillers ignorés (année clôturée)`);

  console.log(`\n──────────── Factures commission incohérentes ────────────`);
  if (incoherences.length === 0) {
    console.log('   🎉 Aucune incohérence détectée.');
  } else {
    console.log(`   ⚠️  ${incoherences.length} relation(s) à régénérer manuellement :\n`);
    for (const ligne of incoherences) {
      console.log(`   • ${ligne}`);
    }
  }
  console.log('\n✨ Audit terminé (aucune facture modifiée).');
}

migrateCa2026()
  .catch((error) => {
    console.error('❌ Erreur lors de la migration:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
