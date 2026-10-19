#!/usr/bin/env bash
#
# Ouvre psql sur une des deux branches Neon, en lisant son URL dans le .env.
# N'est pas appelé directement : ce sont `psql-preprod.sh` et `psql-prod.sh` qui
# le font, et c'est délibéré — la cible se lit alors dans le nom de la commande,
# et non dans un argument qu'on oublie de relire (cf. CLAUDE.md, « Travailler en
# préproduction »).
#
# Usage interne : psql-cible.sh <NOM_DE_VARIABLE> <libellé> [arguments psql…]
set -euo pipefail

variable="$1"
libelle="$2"
shift 2

racine="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
env_file="$racine/.env"

[[ -f "$env_file" ]] || { echo "psql-cible : $env_file est introuvable" >&2; exit 1; }

# L'extraction passe par grep et non par "$VARIABLE" : le .env n'est pas chargé
# dans le shell, l'expansion donnerait une chaîne vide — et une chaîne vide, pour
# un client PostgreSQL, c'est la connexion par défaut. La règle vaut ici comme
# pour les commandes Prisma du CLAUDE.md.
url="$(grep -m1 "^${variable}=" "$env_file" | cut -d= -f2-)"
[[ -n "$url" ]] || { echo "psql-cible : ${variable} est absente ou vide dans .env" >&2; exit 1; }

# Une URL en sslmode=verify-full exige un certificat racine, et
# ~/.postgresql/root.crt n'existe pas sur cette machine : on s'appuie alors sur
# le magasin de certificats du système, ce que Neon documente et accepte. Sous
# les modes plus faibles (sslmode=require, celui de l'URL de préproduction) il
# ne faut surtout pas l'ajouter : psql refuse la combinaison.
if [[ "$url" == *sslmode=verify-* && "$url" != *sslrootcert=* ]]; then
  if [[ "$url" == *\?* ]]; then url="${url}&sslrootcert=system"; else url="${url}?sslrootcert=system"; fi
fi

# L'hôte, sans les identifiants : de quoi vérifier d'un coup d'œil, dans la
# sortie elle-même, que la commande a bien parlé à la branche annoncée.
hote="$(printf '%s' "$url" | sed -E 's#^[^@]*@##; s#[/?].*$##')"
echo "psql → ${libelle} (${hote})" >&2

exec psql "$url" "$@"
