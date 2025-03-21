from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "Drop Evolution API is running"}

@app.get("/products")
async def get_products():
    try:
        products = [{"id": 1, "name": "Test Product", "price": 19.99}]
        return {"products": products}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Errore nel recupero prodotti")

@app.get("/orders")
async def get_orders(user_id: int):
    try:
        orders = [{"id": 1, "user_id": user_id, "total": 59.99}]
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Errore nel recupero ordini")