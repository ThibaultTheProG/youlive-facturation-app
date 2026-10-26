#!/usr/bin/env bash
#
# psql sur la branche Neon Production (PROD_DATABASE_URL du .env).
#
# C'est la base en service : 115 conseillers et leurs factures émises. Y écrire
# est légitime — la facturation est propriétaire du schéma `public` — mais jamais
# anodin. Avant un UPDATE ou un DELETE, lire d'abord les lignes visées, et
# préférer une transaction explicite (BEGIN … COMMIT) à une commande sèche.
#
#   ./scripts/psql-prod.sh -c 'SELECT count(*) FROM factures'
#   ./scripts/psql-prod.sh -v ON_ERROR_STOP=1 -f /tmp/correction.sql
set -euo pipefail
exec "$(dirname "${BASH_SOURCE[0]}")/lib/psql-cible.sh" PROD_DATABASE_URL "PRODUCTION" "$@"
