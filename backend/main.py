from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
from jwt import PyJWTError
from datetime import datetime, timedelta

app = FastAPI()

# Secret key for JWT
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"

# Middleware for JWT authentication
security = HTTPBearer()

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload  # Return the decoded payload if valid
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Drop Evolution API is running"}

# Models
class Product(BaseModel):
    id: int
    name: str
    price: float

class Order(BaseModel):
    id: int
    product_id: int
    quantity: int

# In-memory storage for demonstration
products = [
    {"id": 1, "name": "Product A", "price": 10.99},
    {"id": 2, "name": "Product B", "price": 15.49},
]

orders = []

# Products endpoints
@app.get("/products", dependencies=[Depends(verify_jwt)])
async def get_products():
    return {"products": products}

@app.post("/products", dependencies=[Depends(verify_jwt)])
async def create_product(product: Product):
    # Check for duplicate product ID
    if any(p["id"] == product.id for p in products):
        raise HTTPException(status_code=400, detail="Product ID already exists")
    products.append(product.dict())
    return {"message": "Product created", "product": product}

# Orders endpoints
@app.get("/orders", dependencies=[Depends(verify_jwt)])
async def get_orders():
    return {"orders": orders}

@app.post("/orders", dependencies=[Depends(verify_jwt)])
async def create_order(order: Order):
    # Validate product existence
    if not any(p["id"] == order.product_id for p in products):
        raise HTTPException(status_code=400, detail="Product not found")
    # Check for duplicate order ID
    if any(o["id"] == order.id for o in orders):
        raise HTTPException(status_code=400, detail="Order ID already exists")
    orders.append(order.dict())
    return {"message": "Order created", "order": order}

# Endpoint to generate JWT token (for testing purposes)
@app.post("/auth/token")
async def generate_token(username: str):
    expiration = datetime.utcnow() + timedelta(hours=1)
    payload = {"sub": username, "exp": expiration}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}
