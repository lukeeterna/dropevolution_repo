from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api_routes.backup_endpoint import backup_bp

app = FastAPI()

# Middleware CORS (opzionale)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Puoi restringere in produzione
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra il router per /backup
app.include_router(backup_bp)
