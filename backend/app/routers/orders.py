from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import admin_required, customer_required
from app.models.cart import Cart
from app.models.order import Order, OrderItem, OrderStatus
from app.models.menu import MenuItem
from app.schemas.order import (
    OrderResponse,
    OrderStatusUpdate
)
from app.services.email_service import send_order_status_email


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED
)
def place_order(
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    cart = db.query(Cart).filter(
        Cart.user_id == current_user.id
    ).first()

    if cart is None or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )

    total_amount = 0

    for cart_item in cart.items:
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == cart_item.menu_item_id
        ).first()

        if menu_item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Food item {cart_item.menu_item_id} not found"
            )

        if not menu_item.is_available:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Food item '{menu_item.name}' is unavailable"
            )

        total_amount += (
            menu_item.price * cart_item.quantity
        )

    order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status=OrderStatus.ORDER_PLACED
    )

    db.add(order)
    db.flush()

    for cart_item in cart.items:
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == cart_item.menu_item_id
        ).first()

        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=menu_item.id,
            quantity=cart_item.quantity,
            unit_price=menu_item.price
        )

        db.add(order_item)

    for cart_item in cart.items:
        db.delete(cart_item)

    db.commit()
    db.refresh(order)

    return order


@router.get(
    "",
    response_model=list[OrderResponse]
)
def get_my_orders(
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(
        Order.user_id == current_user.id
    ).order_by(
        Order.created_at.desc()
    ).all()

    return orders


@router.get(
    "/{order_id}",
    response_model=OrderResponse
)
def get_order(
    order_id: int,
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id
    ).first()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this order"
        )

    return order


@router.get(
    "/admin/all",
    response_model=list[OrderResponse]
)
def get_all_orders(
    current_user=Depends(admin_required),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).order_by(
        Order.created_at.desc()
    ).all()

    return orders


@router.put(
    "/admin/{order_id}/status",
    response_model=OrderResponse
)
def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    current_user=Depends(admin_required),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id
    ).first()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    old_status = order.status

    if old_status == status_data.status:
        return order

    allowed_transitions = {
        OrderStatus.ORDER_PLACED: [
            OrderStatus.CONFIRMED,
            OrderStatus.CANCELLED
        ],
        OrderStatus.CONFIRMED: [
            OrderStatus.PREPARING,
            OrderStatus.CANCELLED
        ],
        OrderStatus.PREPARING: [
            OrderStatus.READY
        ],
        OrderStatus.READY: [
            OrderStatus.COMPLETED
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
                f"Cannot change order status from "
                f"{old_status.value} to "
                f"{status_data.status.value}"
            )
        )

    order.status = status_data.status

    db.commit()
    db.refresh(order)

    try:
        send_order_status_email(
            recipient=order.user.email,
            order_id=order.id,
            status=order.status.value
        )
    except Exception:
        pass

    return order