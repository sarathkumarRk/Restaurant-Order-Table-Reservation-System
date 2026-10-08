from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MenuItemCreate(BaseModel):
    name: str
    description: str | None = None
    category_id: int
    price: Decimal = Field(gt=0)
    image_url: str | None = None
    is_available: bool = True


class MenuItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category_id: int | None = None
    price: Decimal | None = Field(default=None, gt=0)
    image_url: str | None = None
    is_available: bool | None = None


class MenuItemResponse(BaseModel):
    id: int
    name: str
    description: str | None
    category_id: int
    price: Decimal
    image_url: str | None
    is_available: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class MenuPaginationResponse(BaseModel):
    items: list[MenuItemResponse]
    page: int
    limit: int
    total: int
    total_pages: int