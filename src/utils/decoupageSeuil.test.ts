import { test } from "node:test";
import assert from "node:assert/strict";
import { decoupageSeuil, round2, SEUIL_CA } from "./decoupageSeuil.ts";

// Scénarios réels ayant motivé la correction du découpage au seuil (BUG 2).
// Tous les conseillers concernés sont en "Offre Youlive" sans auto-parrainage.

test("Gaële — 5000€ entièrement sous le seuil @70%", () => {
  const r = decoupageSeuil(0, 5000, "Offre Youlive");
  assert.deepEqual(r, {
    montantAvant: 5000,
    tauxAvant: 70,
    montantApres: 0,
    tauxApres: 0,
  });
});

test("Lory — franchissement : 10617.43€@70% + 4221.28€@99%", () => {
  // CA déjà acquis : 59382.57 ; honoraires : 14838.71 → newCA 74221.28
  const r = decoupageSeuil(59382.57, 14838.71, "Offre Youlive");
  assert.equal(r.montantAvant, 10617.43);
  assert.equal(r.tauxAvant, 70);
  assert.equal(r.montantApres, 4221.28);
  assert.equal(r.tauxApres, 99);
});

test("Myriam — franchissement : 6000.01€@70% + 1499.99€@99%", () => {
  // CA déjà acquis : 63999.99 ; honoraires : 7500 → newCA 71499.99
  const r = decoupageSeuil(63999.99, 7500, "Offre Youlive");
  assert.equal(r.montantAvant, 6000.01);
  assert.equal(r.tauxAvant, 70);
  assert.equal(r.montantApres, 1499.99);
  assert.equal(r.tauxApres, 99);
});

test("CA déjà au-dessus du seuil : une seule tranche @99%", () => {
  const r = decoupageSeuil(80000, 3000, "Offre Youlive");
  assert.deepEqual(r, {
    montantAvant: 0,
    tauxAvant: 0,
    montantApres: 3000,
    tauxApres: 99,
  });
});

test("Offre Découverte : 60% sous le seuil", () => {
  const r = decoupageSeuil(0, 5000, "Offre Découverte");
  assert.equal(r.tauxAvant, 60);
});

test("auto-parrainage : +6% plafonné à 99%", () => {
  // Sous le seuil : 70 + 6 = 76
  assert.equal(decoupageSeuil(0, 1000, "Offre Youlive", "oui").tauxAvant, 76);
  // Au-dessus : 99 + 6 plafonné à 99
  assert.equal(
    decoupageSeuil(80000, 1000, "Offre Youlive", "oui").tauxApres,
    99
  );
});

test("round2 neutralise les artefacts flottants", () => {
  assert.equal(round2(103999.98000000001), 103999.98);
  assert.equal(round2(0.1 + 0.2), 0.3);
});

test("le franchissement exact au seuil ne crée pas de tranche après vide", () => {
  // newCA === SEUIL : reste intégralement sous le seuil (pas de tranche après)
  const r = decoupageSeuil(SEUIL_CA - 1000, 1000, "Offre Youlive");
  assert.equal(r.montantAvant, 1000);
  assert.equal(r.montantApres, 0);
});
