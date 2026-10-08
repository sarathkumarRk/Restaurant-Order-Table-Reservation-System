from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import admin_required, get_current_user
from app.models.category import Category
from app.models.menu import MenuItem
from app.schemas.menu import (
    MenuItemCreate,
    MenuItemResponse,
    MenuItemUpdate,
    MenuPaginationResponse
)
from app.services.cloudinary_service import upload_food_image


router = APIRouter(
    prefix="/menu",
    tags=["Menu"]
)


@router.post(
    "",
    response_model=MenuItemResponse,
    status_code=status.HTTP_201_CREATED
)
def create_menu_item(
    menu_data: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user=Depends(admin_required)
):
    category = db.query(Category).filter(
        Category.id == menu_data.category_id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    menu_item = MenuItem(
        name=menu_data.name,
        description=menu_data.description,
        category_id=menu_data.category_id,
        price=menu_data.price,
        image_url=menu_data.image_url,
        is_available=menu_data.is_available
    )

    db.add(menu_item)
    db.commit()
    db.refresh(menu_item)

    return menu_item


@router.post(
    "/{menu_id}/image",
    response_model=MenuItemResponse
)
def upload_menu_image(
    menu_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(admin_required)
):
    menu_item = db.query(MenuItem).filter(
        MenuItem.id == menu_id
    ).first()

    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found"
        )

    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp"
    ]

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Invalid image format. "
                "Only JPG, JPEG, PNG and WEBP are allowed"
            )
        )

    try:
        image_url = upload_food_image(image.file)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Image upload failed"
        )

    menu_item.image_url = image_url

    db.commit()
    db.refresh(menu_item)

    return menu_item


@router.get(
    "",
    response_model=MenuPaginationResponse
)
def get_menu_items(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if (
        min_price is not None
        and max_price is not None
        and min_price > max_price
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_price cannot be greater than max_price"
        )

    query = db.query(MenuItem)

    if search:
        query = query.filter(
            MenuItem.name.ilike(f"%{search}%")
        )

    if category:
        query = query.join(
            Category,
            MenuItem.category_id == Category.id
        ).filter(
            Category.name.ilike(category)
        )

    if min_price is not None:
        query = query.filter(
            MenuItem.price >= min_price
        )

    if max_price is not None:
        query = query.filter(
            MenuItem.price <= max_price
        )

    total = query.count()

    total_pages = (
        (total + limit - 1) // limit
        if total > 0
        else 0
    )

    offset = (page - 1) * limit

    items = query.offset(offset).limit(limit).all()

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages
    }


@router.get(
    "/{menu_id}",
    response_model=MenuItemResponse
)
def get_menu_item(
    menu_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    menu_item = db.query(MenuItem).filter(
        MenuItem.id == menu_id
    ).first()

    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found"
        )

    return menu_item


@router.put(
    "/{menu_id}",
    response_model=MenuItemResponse
)
def update_menu_item(
    menu_id: int,
    menu_data: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(admin_required)
):
    menu_item = db.query(MenuItem).filter(
        MenuItem.id == menu_id
    ).first()

    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found"
        )

    if menu_data.category_id is not None:
        category = db.query(Category).filter(
            Category.id == menu_data.category_id
        ).first()

        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

    update_data = menu_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(menu_item, field, value)

    db.commit()
    db.refresh(menu_item)

    return menu_item


@router.delete(
    "/{menu_id}",
    status_code=status.HTTP_200_OK
)
def delete_menu_item(
    menu_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(admin_required)
):
    menu_item = db.query(MenuItem).filter(
        MenuItem.id == menu_id
    ).first()

    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found"
        )

    db.delete(menu_item)
    db.commit()

    return {
        "message": "Food item deleted successfully"
    }