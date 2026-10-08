from datetime import datetime

from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class RestaurantTable(Base):
    __tablename__ = "restaurant_tables"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    table_number = Column(
        Integer,
        unique=True,
        nullable=False,
        index=True
    )

    capacity = Column(
        Integer,
        nullable=False
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

    reservations = relationship(
        "Reservation",
        back_populates="table"
    )