import smtplib

from email.message import EmailMessage

from app.config import settings


def send_email(
    recipient: str,
    subject: str,
    body: str
):
    message = EmailMessage()

    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = recipient
    message["Subject"] = subject

    message.set_content(body)

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT
    ) as server:

        server.starttls()

        server.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD
        )

        server.send_message(message)


def send_payment_success_email(
    recipient: str,
    order_id: int
):
    send_email(
        recipient=recipient,
        subject="Payment Successful",
        body=f"""
Hello,

Your payment for Order #{order_id} was successful.

Your order has been confirmed.

Thank you for ordering with us.
"""
    )


def send_order_status_email(
    recipient: str,
    order_id: int,
    status: str
):
    send_email(
        recipient=recipient,
        subject=f"Order #{order_id} Status Updated",
        body=f"""
Hello,

Your Order #{order_id} status has been updated.

Current Order Status: {status}

Thank you for ordering with us.
"""
    )


def send_reservation_confirmation_email(
    recipient: str,
    reservation_id: int
):
    send_email(
        recipient=recipient,
        subject="Table Reservation Confirmed",
        body=f"""
Hello,

Your table reservation #{reservation_id} has been confirmed.

We look forward to serving you.

Thank you for choosing our restaurant.
"""
    )


def send_reservation_cancelled_email(
    recipient: str,
    reservation_id: int
):
    send_email(
        recipient=recipient,
        subject="Table Reservation Cancelled",
        body=f"""
Hello,

Your table reservation #{reservation_id} has been cancelled.

If you have any questions, please contact the restaurant.

Thank you.
"""
    )