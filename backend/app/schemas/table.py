from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TableCreate(BaseModel):
    table_number: int = Field(gt=0)
    capacity: int = Field(gt=0)


class TableUpdate(BaseModel):
    table_number: int | None = Field(default=None, gt=0)
    capacity: int | None = Field(default=None, gt=0)


class TableResponse(BaseModel):
    id: int
    table_number: int
    capacity: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )