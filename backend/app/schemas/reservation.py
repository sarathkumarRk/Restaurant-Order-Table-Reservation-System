from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.reservation import ReservationStatus


class ReservationCreate(BaseModel):
    table_id: int
    reservation_date: datetime
    guests: int = Field(gt=0)


class ReservationStatusUpdate(BaseModel):
    status: ReservationStatus


class ReservationResponse(BaseModel):
    id: int
    user_id: int
    table_id: int
    reservation_date: datetime
    guests: int
    status: ReservationStatus
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class AvailableTableResponse(BaseModel):
    id: int
    table_number: int
    capacity: int

    model_config = ConfigDict(
        from_attributes=True
    )