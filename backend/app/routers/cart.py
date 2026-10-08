from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import customer_required
from app.models.cart import Cart, CartItem
from app.models.menu import MenuItem
from app.schemas.cart import (
    CartItemCreate,
    CartItemUpdate,
    CartResponse
)


router = APIRouter(
    prefix="/cart",
    tags=["Cart"]
)


def get_or_create_cart(
    user_id: int,
    db: Session
):
    cart = db.query(Cart).filter(
        Cart.user_id == user_id
    ).first()

    if cart is None:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    return cart


def build_cart_response(cart: Cart):
    items = []
    total_quantity = 0
    total_amount = 0

    for item in cart.items:
        subtotal = item.quantity * item.menu_item.price

        items.append({
            "id": item.id,
            "menu_item_id": item.menu_item_id,
            "quantity": item.quantity,
            "unit_price": item.menu_item.price,
            "subtotal": subtotal
        })

        total_quantity += item.quantity
        total_amount += subtotal

    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "items": items,
        "total_quantity": total_quantity,
        "total_amount": total_amount
    }


@router.get(
    "",
    response_model=CartResponse
)
def get_cart(
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    cart = get_or_create_cart(
        current_user.id,
        db
    )

    return build_cart_response(cart)


@router.post(
    "/items",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED
)
def add_cart_item(
    item_data: CartItemCreate,
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    menu_item = db.query(MenuItem).filter(
        MenuItem.id == item_data.menu_item_id
    ).first()

    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found"
        )

    if not menu_item.is_available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Food item is currently unavailable"
        )

    cart = get_or_create_cart(
        current_user.id,
        db
    )

    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.menu_item_id == item_data.menu_item_id
    ).first()

    if existing_item:
        existing_item.quantity += item_data.quantity
    else:
        cart_item = CartItem(
            cart_id=cart.id,
            menu_item_id=item_data.menu_item_id,
            quantity=item_data.quantity
        )

        db.add(cart_item)

    db.commit()
    db.refresh(cart)

    return build_cart_response(cart)


@router.put(
    "/items/{item_id}",
    response_model=CartResponse
)
def update_cart_item(
    item_id: int,
    item_data: CartItemUpdate,
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    cart = get_or_create_cart(
        current_user.id,
        db
    )

    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()

    if cart_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    if not cart_item.menu_item.is_available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Food item is currently unavailable"
        )

    cart_item.quantity = item_data.quantity

    db.commit()
    db.refresh(cart)

    return build_cart_response(cart)


@router.delete(
    "/items/{item_id}",
    response_model=CartResponse
)
def remove_cart_item(
    item_id: int,
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    cart = get_or_create_cart(
        current_user.id,
        db
    )

    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()

    if cart_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    db.delete(cart_item)
    db.commit()
    db.refresh(cart)

    return build_cart_response(cart)


@router.delete(
    "",
    status_code=status.HTTP_200_OK
)
def clear_cart(
    current_user=Depends(customer_required),
    db: Session = Depends(get_db)
):
    cart = get_or_create_cart(
        current_user.id,
        db
    )

    if not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is already empty"
        )

    for item in cart.items:
        db.delete(item)

    db.commit()

    return {
        "message": "Cart cleared successfully"
    }