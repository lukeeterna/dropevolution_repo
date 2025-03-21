# app/core/auth.py
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import ValidationError

from app.core.config import settings
from app.models.user import User
from app.schemas.token import TokenPayload
from app.services.user_service import get_user_by_id

# OAuth2 scheme per l'autenticazione con bearer token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

# Context per l'hashing e la verifica delle password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Verifica della password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Hashing della password
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Creazione dei token JWT
def create_token(subject: Union[str, int], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "iat": datetime.utcnow(),
        "nbf": datetime.utcnow(),
        "jti": str(uuid.uuid4())  # JWT ID per identificare univocamente il token
    }
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt

# Validazione del token JWT
def decode_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_signature": True, "verify_exp": True}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.InvalidTokenError, jwt.PyJWTError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Dependency per ottenere l'utente corrente
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = decode_token(token)
        token_data = TokenPayload(**payload)
        
        # Verifica che il token non sia scaduto
        if datetime.fromtimestamp(token_data.exp) < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except (jwt.PyJWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await get_user_by_id(token_data.sub)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
        
    return user

# Dependency per verificare che l'utente sia un admin
async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user
