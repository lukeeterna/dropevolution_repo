from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes import products, auth, orders, user
from backend.jwt_middleware import JWTMiddleware
import os

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY non trovata nell'ambiente. Configura la variabile d'ambiente.")

app = FastAPI()
app.add_middleware(JWTMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/products")
app.include_router(auth.router, prefix="/auth")
app.include_router(orders.router, prefix="/orders")
app.include_router(user.router, prefix="/user")

@app.get("/")
def read_root():
    return {"message": "DropEvolution API is running."}
