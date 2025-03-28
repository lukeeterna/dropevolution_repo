 from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api_routes.backup_endpoint import backup_bp

app = FastAPI()

# Middleware CORS (se necessario)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Puoi restringerlo in produzione
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Includi solo il router di backup per il test
app.include_router(backup_bp)

# Temporaneamente disattivati gli import delle route principali
# from backend.routes import products, auth, orders, user
# app.include_router(products.router)
# app.include_router(auth.router)
# app.include_router(orders.router)
# app.include_router(user.router)
