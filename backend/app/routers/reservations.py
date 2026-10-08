from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import admin_required, customer_required
from app.models.reservation import (
    Reservation,
    ReservationStatus
)
from app.models.table import RestaurantTable
from app.schemas.reservation import (
    AvailableTableResponse,
    ReservationCreate,
    ReservationResponse,
    ReservationStatusUpdate
)
from app.services.email_service import (
    send_reservation_confirmation_email,
    send_reservation_cancelled_email
)


router = APIRouter(
    prefix="/reservations",
    tags=["Reservations"]
)


# =========================================================
# GET AVAILABLE TABLES
# =========================================================

@router.get(
    "/available-tables",
    response_model=list[AvailableTableResponse]
)
def get_available_tables(
    reservation_date: datetime,
    guests: int,
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    if guests <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Guests must be greater than 0"
        )

    # Check reservation date is in the future
    if reservation_date <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation date must be in the future"
        )

    # Get tables that can accommodate the number of guests
    tables = db.query(RestaurantTable).filter(
        RestaurantTable.capacity >= guests
    ).all()

    available_tables = []

    for table in tables:

        # Check whether the table is already booked
        existing_reservation = db.query(Reservation).filter(
            Reservation.table_id == table.id,
            Reservation.reservation_date == reservation_date,
            Reservation.status.in_([
                ReservationStatus.PENDING,
                ReservationStatus.CONFIRMED
            ])
        ).first()

        if existing_reservation is None:
            available_tables.append(table)

    return available_tables


# =========================================================
# CREATE RESERVATION
# =========================================================

@router.post(
    "",
    response_model=ReservationResponse,
    status_code=status.HTTP_201_CREATED
)
def create_reservation(
    reservation_data: ReservationCreate,
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    # Check reservation date is in the future
    if reservation_data.reservation_date <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation date must be in the future"
        )

    # Check table exists
    table = db.query(RestaurantTable).filter(
        RestaurantTable.id == reservation_data.table_id
    ).first()

    if table is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )

    # Check guest count against table capacity
    if reservation_data.guests > table.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of guests exceeds table capacity"
        )

    # Check whether table is already booked
    existing_reservation = db.query(Reservation).filter(
        Reservation.table_id == reservation_data.table_id,
        Reservation.reservation_date == reservation_data.reservation_date,
        Reservation.status.in_([
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED
        ])
    ).first()

    if existing_reservation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Table is already booked for this time"
        )

    # Check duplicate reservation by same customer
    duplicate_reservation = db.query(Reservation).filter(
        Reservation.user_id == current_user.id,
        Reservation.table_id == reservation_data.table_id,
        Reservation.reservation_date == reservation_data.reservation_date,
        Reservation.status.in_([
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED
        ])
    ).first()

    if duplicate_reservation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a reservation for this table and time"
        )

    # Create reservation
    reservation = Reservation(
        user_id=current_user.id,
        table_id=reservation_data.table_id,
        reservation_date=reservation_data.reservation_date,
        guests=reservation_data.guests,
        status=ReservationStatus.PENDING
    )

    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    return reservation


# =========================================================
# GET MY RESERVATIONS
# =========================================================

@router.get(
    "",
    response_model=list[ReservationResponse]
)
def get_my_reservations(
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    reservations = db.query(Reservation).filter(
        Reservation.user_id == current_user.id
    ).order_by(
        Reservation.reservation_date.desc()
    ).all()

    return reservations


# =========================================================
# GET SINGLE RESERVATION
# =========================================================

@router.get(
    "/{reservation_id}",
    response_model=ReservationResponse
)
def get_reservation(
    reservation_id: int,
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id
    ).first()

    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )

    if reservation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this reservation"
        )

    return reservation


# =========================================================
# CANCEL RESERVATION
# =========================================================

@router.put(
    "/{reservation_id}/cancel",
    response_model=ReservationResponse
)
def cancel_reservation(
    reservation_id: int,
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id
    ).first()

    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )

    if reservation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to cancel this reservation"
        )

    if reservation.status == ReservationStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation is already cancelled"
        )

    reservation.status = ReservationStatus.CANCELLED

    db.commit()
    db.refresh(reservation)

    # Send cancellation email
    try:
        send_reservation_cancelled_email(
            recipient=current_user.email,
            reservation_id=reservation.id
        )
    except Exception:
        pass

    return reservation


# =========================================================
# ADMIN - GET ALL RESERVATIONS
# =========================================================

@router.get(
    "/admin/all",
    response_model=list[ReservationResponse]
)
def get_all_reservations(
    current_user=Depends(admin_required),
    db: Session = Depends(get_db)
):
    reservations = db.query(Reservation).order_by(
        Reservation.reservation_date.desc()
    ).all()

    return reservations


# =========================================================
# ADMIN - UPDATE RESERVATION STATUS
# =========================================================

@router.put(
    "/admin/{reservation_id}/status",
    response_model=ReservationResponse
)
def update_reservation_status(
    reservation_id: int,
    status_data: ReservationStatusUpdate,
    current_user=Depends(admin_required),
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id
    ).first()

    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )

    old_status = reservation.status

    # Same status
    if old_status == status_data.status:
        return reservation

    # Allowed status transitions
    allowed_transitions = {
        ReservationStatus.PENDING: [
            ReservationStatus.CONFIRMED,
            ReservationStatus.CANCELLED
        ],
        ReservationStatus.CONFIRMED: [
            ReservationStatus.COMPLETED,
            ReservationStatus.CANCELLED
        ]
    }

    allowed_statuses = allowed_transitions.get(
        old_status,
        []
    )

    if status_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot change reservation status from "
                f"{old_status.value} to "
                f"{status_data.status.value}"
            )
        )

    reservation.status = status_data.status

    db.commit()
    db.refresh(reservation)

    # Confirmation email
    if reservation.status == ReservationStatus.CONFIRMED:
        try:
            send_reservation_confirmation_email(
                recipient=reservation.user.email,
                reservation_id=reservation.id
            )
        except Exception:
            pass

    # Cancellation email
    if reservation.status == ReservationStatus.CANCELLED:
        try:
            send_reservation_cancelled_email(
                recipient=reservation.user.email,
                reservation_id=reservation.id
            )
        except Exception:
            pass

    return reservation