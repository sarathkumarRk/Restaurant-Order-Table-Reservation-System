from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import admin_required
from app.models.menu import MenuItem
from app.models.order import Order, OrderItem
from app.models.reservation import Reservation
from app.models.user import User


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/dashboard")
def get_dashboard(
    current_user=Depends(admin_required),
    db: Session = Depends(get_db)
):
    today = datetime.utcnow().date()

    start_of_day = datetime.combine(
        today,
        datetime.min.time()
    )

    end_of_day = start_of_day + timedelta(days=1)

    total_orders = db.query(
        func.count(Order.id)
    ).scalar()

    today_orders = db.query(
        func.count(Order.id)
    ).filter(
        Order.created_at >= start_of_day,
        Order.created_at < end_of_day
    ).scalar()

    total_revenue = db.query(
        func.coalesce(
            func.sum(Order.total_amount),
            0
        )
    ).filter(
        Order.status != "CANCELLED"
    ).scalar()

    today_revenue = db.query(
        func.coalesce(
            func.sum(Order.total_amount),
            0
        )
    ).filter(
        Order.created_at >= start_of_day,
        Order.created_at < end_of_day,
        Order.status != "CANCELLED"
    ).scalar()

    pending_orders = db.query(
        func.count(Order.id)
    ).filter(
        Order.status.in_([
            "ORDER_PLACED",
            "CONFIRMED",
            "PREPARING",
            "READY"
        ])
    ).scalar()

    today_reservations = db.query(
        func.count(Reservation.id)
    ).filter(
        Reservation.reservation_date >= start_of_day,
        Reservation.reservation_date < end_of_day
    ).scalar()

    return {
        "total_orders": total_orders,
        "todays_orders": today_orders,
        "total_revenue": float(total_revenue),
        "todays_revenue": float(today_revenue),
        "pending_orders": pending_orders,
        "todays_reservations": today_reservations
    }


@router.get("/most-ordered-foods")
def most_ordered_foods(
    current_user=Depends(admin_required),
    db: Session = Depends(get_db)
):
    results = db.query(
        MenuItem.id,
        MenuItem.name,
        func.sum(OrderItem.quantity).label(
            "total_quantity"
        )
    ).join(
        OrderItem,
        OrderItem.menu_item_id == MenuItem.id
    ).join(
        Order,
        Order.id == OrderItem.order_id
    ).filter(
        Order.status != "CANCELLED"
    ).group_by(
        MenuItem.id,
        MenuItem.name
    ).order_by(
        func.sum(OrderItem.quantity).desc()
    ).all()

    return [
        {
            "food_id": item.id,
            "food_name": item.name,
            "total_quantity": item.total_quantity
        }
        for item in results
    ]


@router.get("/total-revenue")
def total_revenue(
    current_user=Depends(admin_required),
    db: Session = Depends(get_db)
):
    revenue = db.query(
        func.coalesce(
            func.sum(Order.total_amount),
            0
        )
    ).filter(
        Order.status != "CANCELLED"
    ).scalar()

    return {
        "total_revenue": float(revenue)
    }


@router.get("/daily-revenue")
def daily_revenue(
    current_user=Depends(admin_required),
    db: Session = Depends(get_db)
):
    results = db.query(
        func.date(Order.created_at).label("date"),
        func.sum(Order.total_amount).label("revenue")
    ).filter(
        Order.status != "CANCELLED"
    ).group_by(
        func.date(Order.created_at)
    ).order_by(
        func.date(Order.created_at)
    ).all()

    return [
        {
            "date": str(item.date),
            "revenue": float(item.revenue)
        }
        for item in results
    ]


@router.get("/reservations-per-day")
def reservations_per_day(
    current_user=Depends(admin_required),
    db: Session = Depends(get_db)
):
    results = db.query(
        func.date(
            Reservation.reservation_date
        ).label("date"),
        func.count(
            Reservation.id
        ).label("reservation_count")
    ).filter(
        Reservation.status != "CANCELLED"
    ).group_by(
        func.date(
            Reservation.reservation_date
        )
    ).order_by(
        func.date(
            Reservation.reservation_date
        )
    ).all()

    return [
        {
            "date": str(item.date),
            "reservation_count": item.reservation_count
        }
        for item in results
    ]


@router.get("/top-customers")
def top_customers(
    current_user=Depends(admin_required),
    db: Session = Depends(get_db)
):
    results = db.query(
        User.id,
        User.name,
        User.email,
        func.sum(Order.total_amount).label(
            "total_spending"
        )
    ).join(
        Order,
        Order.user_id == User.id
    ).filter(
        Order.status != "CANCELLED"
    ).group_by(
        User.id,
        User.name,
        User.email
    ).order_by(
        func.sum(Order.total_amount).desc()
    ).all()

    return [
        {
            "customer_id": item.id,
            "name": item.name,
            "email": item.email,
            "total_spending": float(item.total_spending)
        }
        for item in results
    ]