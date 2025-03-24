#!/bin/bash

export $(grep -v '^#' .env.local | xargs)

# Controlla se uvicorn è installato, altrimenti avvisa
if ! command -v uvicorn &> /dev/null
then
    echo "[ERRORE] Uvicorn non è installato. Installa con: pip install uvicorn o brew install uvicorn se disponibile in wheels."
    exit 1
fi

# Controlla se sono presenti altri pacchetti critici (fastapi, sqlalchemy, jwt)
for pkg in fastapi sqlalchemy python-jose alembic pydantic aiofiles aiohttp
  do
    if ! pip show $pkg > /dev/null; then
      echo "[ATTENZIONE] Il pacchetto $pkg non risulta installato. Puoi cercarlo come wheel con: brew search $pkg o installarlo con pip."
    fi
  done

uvicorn backend.main:app \
  --reload \
  --host 0.0.0.0 \
  --port 8000
```