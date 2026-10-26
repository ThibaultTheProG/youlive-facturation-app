#!/usr/bin/env bash
#
# psql sur la branche Neon Preproduction (DATABASE_URL du .env).
# C'est la cible par défaut du projet : tout ce qui peut s'y faire s'y fait.
#
#   ./scripts/psql-preprod.sh -c 'SELECT count(*) FROM factures'
#   ./scripts/psql-preprod.sh -f /tmp/requete.sql
set -euo pipefail
exec "$(dirname "${BASH_SOURCE[0]}")/lib/psql-cible.sh" DATABASE_URL "Preproduction" "$@"
