from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer
)
from sqlalchemy.orm import relationship

from app.database import Base


class ReservationStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    table_id = Column(
        Integer,
        ForeignKey("restaurant_tables.id"),
        nullable=False,
        index=True
    )

    reservation_date = Column(
        DateTime,
        nullable=False,
        index=True
    )

    guests = Column(
        Integer,
        nullable=False
    )

    status = Column(
        SQLEnum(ReservationStatus),
        nullable=False,
        default=ReservationStatus.PENDING,
        index=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="reservations"
    )

    table = relationship(
        "RestaurantTable",
        back_populates="reservations"
    )

    payment = relationship(
        "Payment",
        back_populates="reservation",
        uselist=False
    )