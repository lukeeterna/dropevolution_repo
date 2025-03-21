# app/core/errors.py
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from fastapi import HTTPException, status

class ErrorCode(str, Enum):
    """Enumerazione dei codici di errore dell'applicazione"""
    # Errori di autenticazione
    AUTHENTICATION_REQUIRED = "auth_required"
    INVALID_CREDENTIALS = "invalid_credentials"
    SESSION_EXPIRED = "session_expired"
    TOKEN_EXPIRED = "token_expired"
    TOKEN_INVALID = "token_invalid"
    
    # Errori di autorizzazione
    PERMISSION_DENIED = "permission_denied"
    INSUFFICIENT_RIGHTS = "insufficient_rights"
    
    # Errori di validazione
    VALIDATION_ERROR = "validation_error"
    INVALID_INPUT = "invalid_input"
    ENTITY_NOT_FOUND = "not_found"
    ENTITY_ALREADY_EXISTS = "already_exists"
    
    # Errori di business logic
    BUSINESS_LOGIC_ERROR = "business_error"
    RESOURCE_EXHAUSTED = "resource_exhausted"
    OPERATION_FORBIDDEN = "operation_forbidden"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    
    # Errori di sistema
    INTERNAL_ERROR = "internal_error"
    SERVICE_UNAVAILABLE = "service_unavailable"
    DATABASE_ERROR = "database_error"
    EXTERNAL_SERVICE_ERROR = "external_service_error"


class APIException(HTTPException):
    """
    Eccezione personalizzata per gli errori API con formattazione standardizzata.
    Estende HTTPException di FastAPI per mantenere la compatibilità.
    """
    def __init__(
        self,
        status_code: int,
        error_code: ErrorCode,
        detail: str,
        details: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        """
        Inizializza una nuova APIException.
        
        Args:
            status_code: Codice HTTP di stato.
            error_code: Codice di errore standardizzato dall'enumerazione ErrorCode.
            detail: Messaggio di errore leggibile dall'utente.
            details: Informazioni aggiuntive sull'errore, utili per il debug o per fornire più contesto.
            headers: Intestazioni HTTP opzionali (es. per errori di autenticazione).
        """
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code
        self.details = details


# Errori di autenticazione
class AuthenticationError(APIException):
    """Base class per errori di autenticazione."""
    def __init__(
        self,
        error_code: ErrorCode = ErrorCode.AUTHENTICATION_REQUIRED,
        detail: str = "Autenticazione richiesta",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=error_code,
            detail=detail,
            details=details,
            headers={"WWW-Authenticate": "Bearer"},
        )


class InvalidCredentialsError(AuthenticationError):
    """Errore per credenziali non valide."""
    def __init__(self, detail: str = "Credenziali non valide", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            error_code=ErrorCode.INVALID_CREDENTIALS,
            detail=detail,
            details=details,
        )


class TokenExpiredError(AuthenticationError):
    """Errore per token scaduto."""
    def __init__(self, detail: str = "Il token di autenticazione è scaduto", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            error_code=ErrorCode.TOKEN_EXPIRED,
            detail=detail,
            details=details,
        )


# Errori di autorizzazione
class PermissionDeniedError(APIException):
    """Errore per mancanza di permessi."""
    def __init__(
        self,
        detail: str = "Non hai i permessi necessari per eseguire questa operazione",
        error_code: ErrorCode = ErrorCode.PERMISSION_DENIED,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=error_code,
            detail=detail,
            details=details,
        )


# Errori di validazione
class ValidationError(APIException):
    """Errore per dati di input non validi."""
    def __init__(
        self,
        detail: str = "Dati di input non validi",
        details: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None,
        error_code: ErrorCode = ErrorCode.VALIDATION_ERROR,
    ):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code=error_code,
            detail=detail,
            details=details,
        )


class EntityNotFoundError(APIException):
    """Errore per entità non trovata."""
    def __init__(
        self,
        entity_type: str,
        entity_id: Optional[Union[str, int]] = None,
        detail: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if detail is None:
            if entity_id is not None:
                detail = f"{entity_type} con ID {entity_id} non trovato"
            else:
                detail = f"{entity_type} non trovato"
                
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=ErrorCode.ENTITY_NOT_FOUND,
            detail=detail,
            details=details or {"entity_type": entity_type, "entity_id": entity_id},
        )


class EntityAlreadyExistsError(APIException):
    """Errore per entità già esistente."""
    def __init__(
        self,
        entity_type: str,
        field: str,
        value: Any,
        detail: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if detail is None:
            detail = f"{entity_type} con {field} '{value}' esiste già"
            
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            error_code=ErrorCode.ENTITY_ALREADY_EXISTS,
            detail=detail,
            details=details or {"entity_type": entity_type, "field": field, "value": value},
        )


# Errori di business logic
class BusinessLogicError(APIException):
    """Base class per errori di business logic."""
    def __init__(
        self,
        detail: str,
        error_code: ErrorCode = ErrorCode.BUSINESS_LOGIC_ERROR,
        details: Optional[Dict[str, Any]] = None,
        status_code: int = status.HTTP_400_BAD_REQUEST,
    ):
        super().__init__(
            status_code=status_code,
            error_code=error_code,
            detail=detail,
            details=details,
        )


# Errori di sistema
class InternalServerError(APIException):
    """Errore interno del server."""
    def __init__(
        self,
        detail: str = "Si è verificato un errore interno. Riprova più tardi.",
        error_code: ErrorCode = ErrorCode.INTERNAL_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code=error_code,
            detail=detail,
            details=details,
        )


class ServiceUnavailableError(APIException):
    """Errore per servizio non disponibile."""
    def __init__(
        self,
        detail: str = "Il servizio non è attualmente disponibile. Riprova più tardi.",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code=ErrorCode.SERVICE_UNAVAILABLE,
            detail=detail,
            details=details,
        )


class DatabaseError(InternalServerError):
    """Errore del database."""
    def __init__(
        self,
        detail: str = "Si è verificato un errore con il database. Riprova più tardi.",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            detail=detail,
            error_code=ErrorCode.DATABASE_ERROR,
            details=details,
        )


class ExternalServiceError(APIException):
    """Errore di servizio esterno."""
    def __init__(
        self,
        service_name: str,
        detail: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        status_code: int = status.HTTP_502_BAD_GATEWAY,
    ):
        if detail is None:
            detail = f"Errore durante la comunicazione con il servizio esterno '{service_name}'"
            
        super().__init__(
            status_code=status_code,
            error_code=ErrorCode.EXTERNAL_SERVICE_ERROR,
            detail=detail,
            details=details or {"service_name": service_name},
        )
