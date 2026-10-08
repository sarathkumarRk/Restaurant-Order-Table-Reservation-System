from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# Import all models through models/__init__.py
from app import models

from app.routers.auth import router as auth_router
from app.routers.menu import router as menu_router
from app.routers.cart import router as cart_router
from app.routers.orders import router as orders_router
from app.routers.tables import router as tables_router
from app.routers.reservations import router as reservations_router
from app.routers.payments import router as payments_router
from app.routers.admin import router as admin_router
from app.routers.categories import router as categories_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Restaurant Order & Table Reservation System",
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Routers
app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(menu_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(tables_router)
app.include_router(reservations_router)
app.include_router(payments_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "message": "Restaurant Order & Table Reservation System API"
    }