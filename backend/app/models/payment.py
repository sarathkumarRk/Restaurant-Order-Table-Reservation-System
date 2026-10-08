from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    String
)
from sqlalchemy.orm import relationship

from app.database import Base


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=True,
        index=True
    )

    reservation_id = Column(
        Integer,
        ForeignKey("reservations.id"),
        nullable=True,
        index=True
    )

    stripe_session_id = Column(
        String(255),
        unique=True,
        nullable=True,
        index=True
    )

    stripe_payment_intent_id = Column(
        String(255),
        unique=True,
        nullable=True,
        index=True
    )

    amount = Column(
        Numeric(10, 2),
        nullable=False
    )

    status = Column(
        SQLEnum(PaymentStatus),
        nullable=False,
        default=PaymentStatus.PENDING,
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

    order = relationship(
        "Order",
        back_populates="payment"
    )

    reservation = relationship(
        "Reservation",
        back_populates="payment"
    )