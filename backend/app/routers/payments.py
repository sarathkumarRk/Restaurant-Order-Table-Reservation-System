from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import customer_required
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.models.reservation import Reservation, ReservationStatus
from app.schemas.payment import PaymentResponse
from app.services.email_service import send_payment_success_email
from app.services.stripe_service import (
    create_checkout_session,
    construct_webhook_event
)


router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)


@router.post(
    "/create-checkout-session",
    status_code=status.HTTP_201_CREATED
)
def create_payment_checkout(
    order_id: int | None = None,
    reservation_id: int | None = None,
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    if order_id is None and reservation_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order ID or Reservation ID is required"
        )

    if order_id is not None and reservation_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either order ID or reservation ID, not both"
        )

    if order_id is not None:

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
                detail="You are not authorized to pay for this order"
            )

        if order.status == OrderStatus.CART:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order has not been placed"
            )

        if order.status == OrderStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancelled order cannot be paid"
            )

        if (
            order.payment
            and order.payment.status == PaymentStatus.SUCCESS
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order is already paid"
            )

        amount = int(order.total_amount * 100)

        try:
            session = create_checkout_session(
                resource_type="order",
                resource_id=order.id,
                amount=amount,
                customer_email=current_user.email,
                success_url="http://localhost:5173/payment/success",
                cancel_url="http://localhost:5173/payment/cancel"
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create Stripe checkout session"
            )

        payment = order.payment

        if payment is None:
            payment = Payment(
                order_id=order.id,
                amount=order.total_amount,
                status=PaymentStatus.PENDING
            )
            db.add(payment)
        else:
            payment.amount = order.total_amount
            payment.status = PaymentStatus.PENDING

        payment.stripe_session_id = session.id

        db.commit()

        return {
            "checkout_url": session.url,
            "session_id": session.id
        }

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
            detail="You are not authorized to pay for this reservation"
        )

    if reservation.status == ReservationStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled reservation cannot be paid"
        )

    if (
        reservation.payment
        and reservation.payment.status == PaymentStatus.SUCCESS
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Reservation is already paid"
        )

    amount = 10000

    try:
        session = create_checkout_session(
            resource_type="reservation",
            resource_id=reservation.id,
            amount=amount,
            customer_email=current_user.email,
            success_url="http://localhost:5173/payment/success",
            cancel_url="http://localhost:5173/payment/cancel"
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create Stripe checkout session"
        )

    payment = reservation.payment

    if payment is None:
        payment = Payment(
            reservation_id=reservation.id,
            amount=amount / 100,
            status=PaymentStatus.PENDING
        )
        db.add(payment)
    else:
        payment.amount = amount / 100
        payment.status = PaymentStatus.PENDING

    payment.stripe_session_id = session.id

    db.commit()

    return {
        "checkout_url": session.url,
        "session_id": session.id
    }


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    payload = await request.body()

    signature = request.headers.get("stripe-signature")

    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature"
        )

    try:
        event = construct_webhook_event(
            payload,
            signature
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook"
        )

    if event["type"] == "checkout.session.completed":

        session = event["data"]["object"]

        if session.get("payment_status") != "paid":
            return {
                "message": "Payment is not completed"
            }

        metadata = session.get("metadata", {})

        resource_type = metadata.get("resource_type")
        resource_id = metadata.get("resource_id")

        if not resource_type or not resource_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment metadata"
            )

        try:
            resource_id = int(resource_id)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid resource ID"
            )

        payment = None

        if resource_type == "order":
            payment = db.query(Payment).filter(
                Payment.order_id == resource_id,
                Payment.stripe_session_id == session["id"]
            ).first()

        elif resource_type == "reservation":
            payment = db.query(Payment).filter(
                Payment.reservation_id == resource_id,
                Payment.stripe_session_id == session["id"]
            ).first()

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment resource"
            )

        if payment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found"
            )

        if payment.status == PaymentStatus.SUCCESS:
            return {
                "message": "Payment already processed"
            }

        payment.status = PaymentStatus.SUCCESS

        payment_intent = session.get("payment_intent")

        if payment_intent:
            payment.stripe_payment_intent_id = payment_intent

        if resource_type == "order":

            order = db.query(Order).filter(
                Order.id == resource_id
            ).first()

            if order is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found"
                )

            if order.status == OrderStatus.ORDER_PLACED:
                order.status = OrderStatus.CONFIRMED

            db.commit()

            try:
                send_payment_success_email(
                    recipient=order.user.email,
                    order_id=order.id
                )
            except Exception:
                pass

        elif resource_type == "reservation":

            reservation = db.query(Reservation).filter(
                Reservation.id == resource_id
            ).first()

            if reservation is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Reservation not found"
                )

            if reservation.status == ReservationStatus.PENDING:
                reservation.status = ReservationStatus.CONFIRMED

            db.commit()

            try:
                send_payment_success_email(
                    recipient=reservation.user.email,
                    order_id=reservation.id
                )
            except Exception:
                pass

    elif event["type"] == "checkout.session.expired":

        session = event["data"]["object"]

        payment = db.query(Payment).filter(
            Payment.stripe_session_id == session["id"]
        ).first()

        if payment and payment.status == PaymentStatus.PENDING:
            payment.status = PaymentStatus.FAILED
            db.commit()

    return {
        "message": "Webhook received"
    }


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse
)
def get_payment(
    payment_id: int,
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(
        Payment.id == payment_id
    ).first()

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )

    if payment.order:
        if payment.order.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to access this payment"
            )

    if payment.reservation:
        if payment.reservation.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to access this payment"
            )

    return payment