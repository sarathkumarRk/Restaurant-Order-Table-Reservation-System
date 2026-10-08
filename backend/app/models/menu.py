from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text
)
from sqlalchemy.orm import relationship

from app.database import Base


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String(150),
        nullable=False,
        index=True
    )

    description = Column(
        Text,
        nullable=True
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False,
        index=True
    )

    price = Column(
        Numeric(10, 2),
        nullable=False
    )

    image_url = Column(
        String(500),
        nullable=True
    )

    is_available = Column(
        Boolean,
        default=True,
        nullable=False,
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

    category = relationship(
        "Category",
        back_populates="menu_items"
    )

    cart_items = relationship(
        "CartItem",
        back_populates="menu_item"
    )

    order_items = relationship(
        "OrderItem",
        back_populates="menu_item"
    )