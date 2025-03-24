# 🛠 Copilot: per favore analizza il seguente codice.
# ✅ Controlla eventuali bug logici, problemi di sicurezza e vulnerabilità.
# ✅ Suggerisci ottimizzazioni per performance e leggibilità.
# ✅ Verifica che il codice sia conforme alle best practice Python 3.
# ✅ Se opportuno, proponi funzioni più pulite, nomi di variabili migliori e gestione degli errori.
# ✅ Evidenzia parti del codice che potrebbero creare conflitti o essere migliorate.

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.staticfiles import StaticFiles
import logging
import time
from typing import List, Optional, Union, Dict, Any

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import APIException, ErrorCode
from app.core.logging import setup_logging

# Configurazione dei logger
logger = setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url=None,  # Disabilita /docs di default
    redoc_url=None,  # Disabilita /redoc di default
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if not settings.PRODUCTION else None,
)

# Middleware per la gestione del CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware per il logging delle richieste
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = request.headers.get("X-Request-Id", "")
    logger.info(
        f"Request {request_id} started: {request.method} {request.url.path}",
        extra={"request_id": request_id, "client_ip": request.client.host}
    )
    
    start_time = time.time()
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(
            f"Request {request_id} completed: {response.status_code} in {process_time:.3f}s",
            extra={"request_id": request_id, "status_code": response.status_code}
        )
        response.headers["X-Process-Time"] = str(process_time)
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.exception(
            f"Request {request_id} failed after {process_time:.3f}s: {str(e)}",
            extra={"request_id": request_id}
        )
        raise

# Handler globale per le eccezioni
@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    logger.error(
        f"API Exception: {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "error_code": exc.error_code,
            "path": request.url.path,
        },
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.detail,
                "details": exc.details
            }
        },
    )

# Handler per le eccezioni HTTP standard
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(
        f"HTTP Exception: {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": request.url.path,
        },
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
            }
        },
    )

# Documentazione API protetta
@app.get("/docs", include_in_schema=False)
async def get_docs(request: Request):
    if settings.PRODUCTION:
        raise HTTPException(status_code=404, detail="Not found")
    return get_swagger_ui_html(
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        title=f"{settings.PROJECT_NAME} - API Documentation",
    )

# Healthcheck endpoint
@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "version": settings.VERSION}

# Inclusione dei router delle API
app.include_router(api_router, prefix=settings.API_V1_STR)

# Servizio di file statici se non in produzione
if not settings.PRODUCTION:
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Entry point per l'esecuzione diretta
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=not settings.PRODUCTION,
        log_level="info",
    )
