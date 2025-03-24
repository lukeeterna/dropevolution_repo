# 🛠 Copilot: per favore analizza il seguente codice.
# ✅ Controlla eventuali bug logici, problemi di sicurezza e vulnerabilità.
# ✅ Suggerisci ottimizzazioni per performance e leggibilità.
# ✅ Verifica che il codice sia conforme alle best practice Python 3.
# ✅ Se opportuno, proponi funzioni più pulite, nomi di variabili migliori e gestione degli errori.
# ✅ Evidenzia parti del codice che potrebbero creare conflitti o essere migliorate.

# tests/conftest.py
import asyncio
import os
import pytest
from typing import Dict, Generator, Any
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import get_db
from app.db.base import Base
from app.core.config import settings
from app.core.auth import create_token
from app.schemas.user import UserCreate
from app.services.user_service import create_user

# Utilizza un database SQLite in memoria per i test
TEST_SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)

# Test user data
test_user = {
    "email": "test@example.com",
    "password": "Test@123",
    "first_name": "Test",
    "last_name": "User",
}

test_admin = {
    "email": "admin@example.com",
    "password": "Admin@123",
    "first_name": "Admin",
    "last_name": "User",
    "is_admin": True,
}

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(autouse=True)
async def db():
    """
    Crea/elimina tutte le tabelle prima/dopo ogni test.
    Questo garantisce un database pulito per ogni test.
    """
    # Crea tutte le tabelle
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Esegue il test
    yield
    
    # Elimina tutte le tabelle
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session():
    """
    Fixture che fornisce una sessione di database asincrona per i test.
    Garantisce il rollback delle transazioni dopo ogni test.
    """
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()

@pytest.fixture
def client(db_session):
    """
    Fixture che fornisce un client di test per l'API FastAPI.
    Sostituisce la dependency di db con la sessione di test.
    """
    # Override della dependency di db
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Crea il client di test
    with TestClient(app) as test_client:
        yield test_client
    
    # Rimuove l'override dopo il test
    app.dependency_overrides.clear()

@pytest.fixture
async def test_user_db(db_session):
    """
    Fixture che crea un utente di test nel database.
    """
    user_in = UserCreate(**test_user)
    user = await create_user(db_session, user_in)
    return user

@pytest.fixture
async def test_admin_db(db_session):
    """
    Fixture che crea un utente admin di test nel database.
    """
    user_in = UserCreate(**test_admin)
    user = await create_user(db_session, user_in, is_admin=True)
    return user

@pytest.fixture
def user_token(test_user_db):
    """
    Fixture che genera un token JWT per un utente normale.
    """
    return create_token(test_user_db.id)

@pytest.fixture
def admin_token(test_admin_db):
    """
    Fixture che genera un token JWT per un utente admin.
    """
    return create_token(test_admin_db.id)

@pytest.fixture
def user_headers(user_token):
    """
    Fixture che fornisce gli header di autenticazione per un utente normale.
    """
    return {"Authorization": f"Bearer {user_token}"}

@pytest.fixture
def admin_headers(admin_token):
    """
    Fixture che fornisce gli header di autenticazione per un utente admin.
    """
    return {"Authorization": f"Bearer {admin_token}"}


# tests/api/test_auth.py
import pytest
from fastapi import status

class TestAuth:
    """
    Test suite per le API di autenticazione.
    """
    
    def test_login(self, client, test_user_db):
        """Test per il login con credenziali valide."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"],
            },
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client):
        """Test per il login con credenziali non valide."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "wrong@example.com",
                "password": "WrongPass123!",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_refresh_token(self, client, user_token):
        """Test per il refresh del token."""
        # Implementazione da completare
        pass
    
    def test_me(self, client, user_headers, test_user_db):
        """Test per ottenere info sull'utente corrente."""
        response = client.get("/api/v1/users/me", headers=user_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == test_user["email"]
        assert data["first_name"] == test_user["first_name"]
        assert data["last_name"] == test_user["last_name"]


# tests/api/test_products.py
import pytest
from fastapi import status

class TestProducts:
    """
    Test suite per le API dei prodotti.
    """
    
    def test_create_product(self, client, admin_headers):
        """Test per la creazione di un prodotto (solo admin)."""
        response = client.post(
            "/api/v1/products",
            headers=admin_headers,
            json={
                "name": "Test Product",
                "description": "A test product",
                "price": 29.99,
                "stock": 10
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Test Product"
        assert data["price"] == 29.99
        assert data["stock"] == 10
    
    def test_create_product_unauthorized(self, client, user_headers):
        """Test per la creazione di un prodotto senza permessi admin."""
        response = client.post(
            "/api/v1/products",
            headers=user_headers,
            json={
                "name": "Test Product",
                "description": "A test product",
                "price": 29.99,
                "stock": 10
            },
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_products(self, client):
        """Test per ottenere la lista dei prodotti (pubblico)."""
        response = client.get("/api/v1/products")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "items" in data
        assert "total" in data
    
    def test_get_product(self, client, admin_headers):
        """Test per ottenere un singolo prodotto."""
        # Prima crea un prodotto
        create_response = client.post(
            "/api/v1/products",
            headers=admin_headers,
            json={
                "name": "Test Product",
                "description": "A test product",
                "price": 29.99,
                "stock": 10
            },
        )
        product_id = create_response.json()["id"]
        
        # Poi ottiene il prodotto
        response = client.get(f"/api/v1/products/{product_id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == product_id
        assert data["name"] == "Test Product"
    
    def test_update_product(self, client, admin_headers):
        """Test per aggiornare un prodotto."""
        # Prima crea un prodotto
        create_response = client.post(
            "/api/v1/products",
            headers=admin_headers,
            json={
                "name": "Test Product",
                "description": "A test product",
                "price": 29.99,
                "stock": 10
            },
        )
        product_id = create_response.json()["id"]
        
        # Poi aggiorna il prodotto
        response = client.put(
            f"/api/v1/products/{product_id}",
            headers=admin_headers,
            json={
                "name": "Updated Product",
                "price": 39.99
            },
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Updated Product"
        assert data["price"] == 39.99
        assert data["stock"] == 10  # Non modificato
    
    def test_delete_product(self, client, admin_headers):
        """Test per eliminare un prodotto."""
        # Prima crea un prodotto
        create_response = client.post(
            "/api/v1/products",
            headers=admin_headers,
            json={
                "name": "Test Product",
                "description": "A test product",
                "price": 29.99,
                "stock": 10
            },
        )
        product_id = create_response.json()["id"]
        
        # Poi elimina il prodotto
        response = client.delete(
            f"/api/v1/products/{product_id}",
            headers=admin_headers,
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verifica che il prodotto sia stato eliminato
        get_response = client.get(f"/api/v1/products/{product_id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND


# tests/services/test_user_service.py
import pytest
from app.schemas.user import UserCreate, UserUpdate
from app.services.user_service import (
    create_user,
    get_user_by_email,
    update_user,
    authenticate_user,
)
from app.core.errors import EntityAlreadyExistsError, InvalidCredentialsError

class TestUserService:
    """
    Test suite per i servizi utente.
    """
    
    @pytest.mark.asyncio
    async def test_create_user(self, db_session):
        """Test per la creazione di un utente."""
        user_in = UserCreate(
            email="new@example.com",
            password="Password123!",
            first_name="New",
            last_name="User"
        )
        user = await create_user(db_session, user_in)
        
        assert user.email == user_in.email
        assert user.first_name == user_in.first_name
        assert user.last_name == user_in.last_name
        assert user.is_active is True
        assert user.is_admin is False
    
    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self, db_session, test_user_db):
        """Test per la creazione di un utente con email duplicata."""
        user_in = UserCreate(
            email=test_user["email"],  # Email già in uso
            password="Password123!",
            first_name="New",
            last_name="User"
        )
        
        with pytest.raises(EntityAlreadyExistsError):
            await create_user(db_session, user_in)
    
    @pytest.mark.asyncio
    async def test_get_user_by_email(self, db_session, test_user_db):
        """Test per ottenere un utente tramite email."""
        user = await get_user_by_email(db_session, test_user["email"])
        assert user is not None
        assert user.email == test_user["email"]
    
    @pytest.mark.asyncio
    async def test_authenticate_user(self, db_session, test_user_db):
        """Test per l'autenticazione di un utente."""
        user = await authenticate_user(
            db_session, 
            test_user["email"], 
            test_user["password"]
        )
        assert user is not None
        assert user.email == test_user["email"]
    
    @pytest.mark.asyncio
    async def test_authenticate_user_wrong_password(self, db_session, test_user_db):
        """Test per l'autenticazione con password errata."""
        with pytest.raises(InvalidCredentialsError):
            await authenticate_user(
                db_session, 
                test_user["email"], 
                "WrongPassword123!"
            )
    
    @pytest.mark.asyncio
    async def test_update_user(self, db_session, test_user_db):
        """Test per l'aggiornamento di un utente."""
        user_update = UserUpdate(
            first_name="Updated",
            last_name="Name"
        )
        updated_user = await update_user(db_session, test_user_db.id, user_update)
        
        assert updated_user.first_name == "Updated"
        assert updated_user.last_name == "Name"
        assert updated_user.email == test_user["email"]  # Non modificato
