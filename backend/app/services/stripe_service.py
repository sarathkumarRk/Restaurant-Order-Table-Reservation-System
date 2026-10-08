import stripe

from app.config import settings


stripe.api_key = settings.STRIPE_SECRET_KEY


def create_checkout_session(
    resource_type: str,
    resource_id: int,
    amount: int,
    customer_email: str,
    success_url: str,
    cancel_url: str
):
    if resource_type == "order":
        product_name = f"Restaurant Order #{resource_id}"

    else:
        product_name = f"Table Reservation #{resource_id}"

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        customer_email=customer_email,
        line_items=[
            {
                "price_data": {
                    "currency": "inr",
                    "product_data": {
                        "name": product_name
                    },
                    "unit_amount": amount
                },
                "quantity": 1
            }
        ],
        metadata={
            "resource_type": resource_type,
            "resource_id": str(resource_id)
        },
        success_url=success_url,
        cancel_url=cancel_url
    )

    return session


def construct_webhook_event(
    payload: bytes,
    signature: str
):
    event = stripe.Webhook.construct_event(
        payload,
        signature,
        settings.STRIPE_WEBHOOK_SECRET
    )

    return event