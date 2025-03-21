# app/schemas/base.py
from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from pydantic import BaseModel, Field, validator, root_validator
from pydantic.generics import GenericModel
import re

# Generic type per i modelli di dati
T = TypeVar('T')

class BaseSchema(BaseModel):
    """Schema di base per tutti i modelli Pydantic."""
    
    class Config:
        """Configurazione per lo schema di base."""
        populate_by_name = True  # Supporta popolamento sia da alias che da nome campo
        use_enum_values = True   # Usa i valori enum invece delle istanze enum
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
        }


class TimeStampMixin(BaseSchema):
    """Mixin per campi timestamp comuni."""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ResponseSchema(GenericModel, Generic[T]):
    """Schema generico per le risposte API."""
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    
    class Config:
        """Configurazione per lo schema di risposta."""
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {},
                "message": "Operazione completata con successo"
            }
        }


class PaginatedResponseSchema(GenericModel, Generic[T]):
    """Schema generico per le risposte API paginate."""
    items: List[T]
    total: int
    page: int
    per_page: int
    pages: int
    has_next: bool
    has_prev: bool
    
    class Config:
        """Configurazione per lo schema di risposta paginata."""
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 100,
                "page": 1,
                "per_page": 10,
                "pages": 10,
                "has_next": True,
                "has_prev": False
            }
        }


# app/schemas/user.py
from typing import Optional
import re
from pydantic import EmailStr, Field, validator

from app.schemas.base import BaseSchema, TimeStampMixin

# Regex per validazione password
PASSWORD_PATTERN = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")

class UserBase(BaseSchema):
    """Schema base per gli utenti."""
    email: EmailStr
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    
    @validator('email')
    def email_must_be_valid(cls, v):
        """Valida l'email con regole aggiuntive."""
        if not v:
            raise ValueError("L'email è obbligatoria")
        
        # Verifica che il dominio non sia temporaneo/usa e getta
        disposable_domains = ["mailinator.com", "yopmail.com", "tempmail.com"]
        domain = v.split('@')[-1].lower()
        if domain in disposable_domains:
            raise ValueError("Gli indirizzi email temporanei non sono accettati")
        
        return v


class UserCreate(UserBase):
    """Schema per la creazione di un utente."""
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def password_must_be_strong(cls, v):
        """Valida che la password soddisfi i requisiti di sicurezza."""
        if not PASSWORD_PATTERN.match(v):
            raise ValueError(
                "La password deve contenere almeno 8 caratteri, "
                "una lettera maiuscola, una lettera minuscola, "
                "un numero e un carattere speciale (@$!%*?&)"
            )
        return v


class UserUpdate(BaseSchema):
    """Schema per l'aggiornamento di un utente."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    is_active: Optional[bool] = None


class UserInDB(UserBase, TimeStampMixin):
    """Schema per un utente nel database."""
    id: int
    is_active: bool = True
    is_admin: bool = False
    
    class Config:
        """Configurazione per lo schema utente nel DB."""
        orm_mode = True


class User(UserInDB):
    """Schema per la risposta API dell'utente."""
    pass


class UserWithToken(User):
    """Schema per la risposta API con utente e token."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# app/schemas/product.py
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from pydantic import Field, validator

from app.schemas.base import BaseSchema, TimeStampMixin

class ProductBase(BaseSchema):
    """Schema base per i prodotti."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    price: Decimal = Field(..., ge=0, decimal_places=2)
    stock: int = Field(..., ge=0)
    category_id: Optional[int] = None
    
    @validator('price')
    def price_must_be_positive(cls, v):
        """Valida che il prezzo sia positivo e con massimo 2 decimali."""
        if v < 0:
            raise ValueError("Il prezzo non può essere negativo")
        
        # Assicura massimo 2 decimali
        if v.as_tuple().exponent < -2:
            raise ValueError("Il prezzo può avere al massimo 2 decimali")
        
        return v


class ProductCreate(ProductBase):
    """Schema per la creazione di un prodotto."""
    pass


class ProductUpdate(BaseSchema):
    """Schema per l'aggiornamento di un prodotto."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    stock: Optional[int] = Field(None, ge=0)
    category_id: Optional[int] = None


class ProductInDB(ProductBase, TimeStampMixin):
    """Schema per un prodotto nel database."""
    id: int
    
    class Config:
        """Configurazione per lo schema prodotto nel DB."""
        orm_mode = True


class Product(ProductInDB):
    """Schema per la risposta API del prodotto."""
    pass


# app/schemas/order.py
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from enum import Enum
from pydantic import Field, validator, root_validator

from app.schemas.base import BaseSchema, TimeStampMixin
from app.schemas.user import User
from app.schemas.product import Product

class OrderStatus(str, Enum):
    """Enumerazione per lo stato dell'ordine."""
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderItemBase(BaseSchema):
    """Schema base per gli item dell'ordine."""
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0, decimal_places=2)
    
    @validator('unit_price')
    def validate_unit_price(cls, v):
        """Valida il prezzo unitario."""
        if v < 0:
            raise ValueError("Il prezzo unitario non può essere negativo")
        return v
    
    @validator('quantity')
    def validate_quantity(cls, v):
        """Valida la quantità."""
        if v <= 0:
            raise ValueError("La quantità deve essere maggiore di zero")
        return v


class OrderItemCreate(OrderItemBase):
    """Schema per la creazione di un item dell'ordine."""
    pass


class OrderItemInDB(OrderItemBase, TimeStampMixin):
    """Schema per un item dell'ordine nel database."""
    id: int
    order_id: int
    subtotal: Decimal
    
    @root_validator
    def calculate_subtotal(cls, values):
        """Calcola il subtotale per l'item."""
        quantity = values.get('quantity', 0)
        unit_price = values.get('unit_price', 0)
        values['subtotal'] = quantity * unit_price
        return values
    
    class Config:
        """Configurazione per lo schema item dell'ordine nel DB."""
        orm_mode = True


class OrderItem(OrderItemInDB):
    """Schema per la risposta API dell'item dell'ordine."""
    product: Optional[Product] = None


class OrderBase(BaseSchema):
    """Schema base per gli ordini."""
    user_id: int
    status: OrderStatus = OrderStatus.PENDING
    shipping_address: str = Field(..., min_length=5, max_length=255)
    notes: Optional[str] = Field(None, max_length=1000)


class OrderCreate(BaseSchema):
    """Schema per la creazione di un ordine."""
    items: List[OrderItemCreate]
    shipping_address: str = Field(..., min_length=5, max_length=255)
    notes: Optional[str] = Field(None, max_length=1000)
    
    @validator('items')
    def validate_items(cls, v):
        """Valida che ci sia almeno un item nell'ordine."""
        if not v or len(v) == 0:
            raise ValueError("L'ordine deve contenere almeno un prodotto")
        return v


class OrderUpdate(BaseSchema):
    """Schema per l'aggiornamento di un ordine."""
    status: Optional[OrderStatus] = None
    shipping_address: Optional[str] = Field(None, min_length=5, max_length=255)
    notes: Optional[str] = Field(None, max_length=1000)


class OrderInDB(OrderBase, TimeStampMixin):
    """Schema per un ordine nel database."""
    id: int
    total_amount: Decimal
    
    class Config:
        """Configurazione per lo schema ordine nel DB."""
        orm_mode = True


class Order(OrderInDB):
    """Schema per la risposta API dell'ordine."""
    items: List[OrderItem]
    user: Optional[User] = None
