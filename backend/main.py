from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import jwt
from jwt import DecodeError, ExpiredSignatureError
import os

app = FastAPI(title="Drop Evolution API")

# Carica la secret key in modo dinamico da variabile d'ambiente o usa fallback
SECRET_KEY = os.getenv("SECRET_KEY", "VQV8519S8srKFF6iOBAqgJgxUAbbqWUfd0psC19nSi_K-0uAl3_Do-195v4_iKeQs9Q8GXXrDMrr8cacMIqUsw")

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload["sub"]
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")

# CORS settings
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Drop Evolution API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/products")
def get_products(current_user: str = Depends(get_current_user)):
    return [{"id": 1, "name": "Test Product", "price": 49.99}]

@app.post("/products")
def create_product(product: dict, current_user: str = Depends(get_current_user)):
    return {"message": "Product created", "product": product}
