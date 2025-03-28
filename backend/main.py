from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api_routes.backup_endpoint import backup_bp  # Assicurati che questa importazione sia presente

app = FastAPI()

# Middleware CORS (opzionale)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Puoi restringere in produzione
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Includi solo il router di backup per il test
app.include_router(backup_bp)  # Questa è la linea critica per rendere funzionante il backup

# Altri import/commenti non necessari per questo test
