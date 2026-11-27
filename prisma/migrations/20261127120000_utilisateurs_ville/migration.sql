-- Ville du conseiller, `city.name` d'Apimo, réécrite à chaque synchro `/api/conseillers`.
--
-- Demande de Tiphaine (27/11/2026) : l'avis de valeur signe ses documents clients
-- « Fait aux Sables-d'Olonne » pour tout le monde ; il lira cette colonne à la place.
-- `adresse` ne convient pas : posée depuis Apimo à la création seulement, puis éditée à la
-- main, elle porte le plus souvent une adresse postale personnelle.
--
-- Ajout d'une colonne nullable : non cassant pour le contrat (Contrat/UTILISATEURS.md).

-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN "ville" VARCHAR(255);
