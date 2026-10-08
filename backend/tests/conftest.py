import pytest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db


# =========================================================
# TEST DATABASE
# =========================================================

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "check_same_thread": False
    },
    poolclass=StaticPool
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# =========================================================
# DATABASE OVERRIDE
# =========================================================

def override_get_db():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# =========================================================
# TEST CLIENT
# =========================================================

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)

    with TestClient(app) as test_client:
        yield test_client

    Base.metadata.drop_all(bind=engine)


# =========================================================
# CUSTOMER TOKEN
# =========================================================

@pytest.fixture
def customer_token(client):

    register_response = client.post(
        "/auth/register",
        json={
            "name": "Test Customer",
            "email": "customer@test.com",
            "password": "Test@123",
            "role": "CUSTOMER"
        }
    )

    assert register_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        json={
            "email": "customer@test.com",
            "password": "Test@123"
        }
    )

    assert login_response.status_code == 200

    return login_response.json()["access_token"]


# =========================================================
# ADMIN TOKEN
# =========================================================

@pytest.fixture
def admin_token(client):

    register_response = client.post(
        "/auth/register",
        json={
            "name": "Test Admin",
            "email": "admin@test.com",
            "password": "Admin@123",
            "role": "ADMIN"
        }
    )

    assert register_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        json={
            "email": "admin@test.com",
            "password": "Admin@123"
        }
    )

    assert login_response.status_code == 200

    return login_response.json()["access_token"]


# =========================================================
# AUTH HEADERS
# =========================================================

@pytest.fixture
def customer_headers(customer_token):
    return {
        "Authorization": f"Bearer {customer_token}"
    }


@pytest.fixture
def admin_headers(admin_token):
    return {
        "Authorization": f"Bearer {admin_token}"
    }