# app/core/config.py
import os
import secrets
from typing import List, Union, Optional, Dict, Any
from pydantic import BaseSettings, validator, PostgresDsn, AnyHttpUrl


class Settings(BaseSettings):
    """Configurazioni dell'applicazione."""
    # Informazioni di base
    PROJECT_NAME: str = "Drop Evolution"
    PROJECT_DESCRIPTION: str = "E-commerce API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    PRODUCTION: bool = os.getenv("ENVIRONMENT", "development").lower() == "production"
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minuti
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7     # 7 giorni
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]
    
    # Configurazione database
    DATABASE_URI: Optional[PostgresDsn] = None
    
    @validator("DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        
        # Costruisce l'URI di connessione al database
        return PostgresDsn.build(
            scheme="postgresql",
            user=os.getenv("POSTGRES_USER", "postgres"),
            password=os.getenv("POSTGRES_PASSWORD", "postgres"),
            host=os.getenv("POSTGRES_HOST", "localhost"),
            port=os.getenv("POSTGRES_PORT", "5432"),
            path=f"/{os.getenv('POSTGRES_DB', 'dropevolution')}",
        )
    
    # Sicurezza e Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: int = 60  # richieste per minuto
    RATE_LIMIT_LOGIN: int = 5     # tentativi di login per minuto
    
    # Security Headers
    SECURITY_HEADERS: Dict[str, str] = {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline';",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
    }
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Singleton delle impostazioni
settings = Settings()



# app/core/security.py
import secrets
import string
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union

import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.core.errors import TokenExpiredError, InvalidCredentialsError

# Context per l'hashing delle password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme per l'autenticazione
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una password in chiaro con quella salvata."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera l'hash sicuro di una password."""
    return pwd_context.hash(password)

def generate_random_password(length: int = 12) -> str:
    """
    Genera una password casuale sicura.
    
    Args:
        length: Lunghezza della password (default: 12)
        
    Returns:
        Una password casuale che soddisfa i requisiti di sicurezza
    """
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()_-+=<>?"
    
    # Assicura che la password contenga almeno una lettera maiuscola, una minuscola, un numero e un carattere speciale
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        
        if (any(c.islower() for c in password) and
            any(c.isupper() for c in password) and
            any(c.isdigit() for c in password) and
            any(c in "!@#$%^&*()_-+=<>?" for c in password)):
            return password



# app/middleware/security.py
from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware per aggiungere header di sicurezza a tutte le risposte.
    """
    
    async def dispatch(self, request: Request, call_next):
        """
        Aggiunge gli header di sicurezza alle risposte.
        
        Args:
            request: La richiesta HTTP
            call_next: Il prossimo handler nella catena
            
        Returns:
            La risposta con gli header di sicurezza applicati
        """
        response = await call_next(request)
        
        # Applica tutti gli header di sicurezza configurati
        for key, value in settings.SECURITY_HEADERS.items():
            response.headers[key] = value
            
        return response


def add_security_middlewares(app: FastAPI) -> None:
    """
    Aggiunge tutti i middleware di sicurezza all'applicazione.
    
    Args:
        app: L'istanza FastAPI
    """
    app.add_middleware(SecurityHeadersMiddleware)



# app/middleware/rate_limit.py
import time
from typing import Dict, Tuple
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_429_TOO_MANY_REQUESTS

from app.core.config import settings
from app.core.errors import APIException, ErrorCode

class RateLimiter:
    """
    Implementazione semplice di rate limiting basata su sliding window.
    """
    def __init__(self, window_size: int = 60, max_requests: int = 60):
        """
        Inizializza il rate limiter.
        
        Args:
            window_size: Dimensione della finestra in secondi (default: 60s)
            max_requests: Numero massimo di richieste nella finestra (default: 60)
        """
        self.window_size = window_size
        self.max_requests = max_requests
        self.requests: Dict[str, list] = {}  # client_id -> [timestamps]
    
    def is_allowed(self, client_id: str) -> Tuple[bool, int, int]:
        """
        Controlla se il client può effettuare una richiesta.
        
        Args:
            client_id: Identificatore del client (es. IP o user_id)
            
        Returns:
            Tupla (allowed, remaining, reset_in_seconds)
        """
        now = time.time()
        
        # Inizializza la lista dei timestamp se non esiste
        if client_id not in self.requests:
            self.requests[client_id] = []
        
        # Rimuove i timestamp più vecchi della finestra
        self.requests[client_id] = [ts for ts in self.requests[client_id] if now - ts < self.window_size]
        
        # Calcola richieste rimanenti
        remaining = self.max_requests - len(self.requests[client_id])
        
        # Calcola secondi fino al reset
        reset_in = self.window_size if not self.requests[client_id] else int(self.window_size - (now - min(self.requests[client_id])))
        
        # Verifica se il client ha superato il limite
        if len(self.requests[client_id]) >= self.max_requests:
            return False, 0, reset_in
        
        # Aggiunge il timestamp corrente
        self.requests[client_id].append(now)
        
        return True, remaining - 1, reset_in


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware per il rate limiting delle richieste API.
    """
    
    def __init__(self, app: FastAPI, **options):
        """
        Inizializza il middleware.
        
        Args:
            app: L'istanza FastAPI
            options: Opzioni aggiuntive
        """
        super().__init__(app)
        
        # Crea rate limiter con configurazioni diverse per endpoint specifici
        self.default_limiter = RateLimiter(
            max_requests=settings.RATE_LIMIT_DEFAULT
        )
        
        self.login_limiter = RateLimiter(
            max_requests=settings.RATE_LIMIT_LOGIN
        )
    
    async def dispatch(self, request: Request, call_next):
        """
        Gestisce il rate limiting delle richieste.
        
        Args:
            request: La richiesta HTTP
            call_next: Il prossimo handler nella catena
        """
        # Skip rate limiting if disabled
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)
        
        # Determina l'identificatore del client
        # Preferibilmente usa l'ID dell'utente autenticato, altrimenti l'IP
        client_id = request.client.host
        
        # JWT token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                from app.core.auth import decode_token
                token = auth_header.replace("Bearer ", "")
                payload = decode_token(token)
                if "sub" in payload:
                    client_id = f"user:{payload['sub']}"
            except Exception:
                # Fallback su IP in caso di token non valido
                pass
        
        # Seleziona il rate limiter in base al percorso
        if request.url.path.endswith("/auth/login"):
            limiter = self.login_limiter
        else:
            limiter = self.default_limiter
        
        # Verifica il rate limit
        allowed, remaining, reset_in = limiter.is_allowed(client_id)
        
        if not allowed:
            # Restituisce una risposta 429 Too Many Requests
            error = APIException(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                error_code=ErrorCode.RATE_LIMIT_EXCEEDED,
                detail="Troppe richieste. Riprova più tardi.",
                details={"reset_in": reset_in}
            )
            
            response = Response(
                content=error.detail,
                status_code=error.status_code,
                headers={
                    "Retry-After": str(reset_in),
                    "X-RateLimit-Limit": str(limiter.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + reset_in))
                }
            )
            return response
        
        # Procede con la richiesta
        response = await call_next(request)
        
        # Aggiunge gli header di rate limiting
        response.headers["X-RateLimit-Limit"] = str(limiter.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time() + reset_in))
        
        return response


def add_rate_limit_middleware(app: FastAPI) -> None:
    """
    Aggiunge il middleware di rate limiting all'applicazione.
    
    Args:
        app: L'istanza FastAPI
    """
    app.add_middleware(RateLimitMiddleware)
