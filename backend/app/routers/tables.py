from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import admin_required, get_current_user
from app.models.table import RestaurantTable
from app.schemas.table import (
    TableCreate,
    TableResponse,
    TableUpdate
)


router = APIRouter(
    prefix="/tables",
    tags=["Tables"]
)


@router.post(
    "",
    response_model=TableResponse,
    status_code=status.HTTP_201_CREATED
)
def create_table(
    table_data: TableCreate,
    current_user=Depends(admin_required),
    db: Session = Depends(get_db)
):
    existing_table = db.query(RestaurantTable).filter(
        RestaurantTable.table_number == table_data.table_number
    ).first()

    if existing_table:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Table number already exists"
        )

    table = RestaurantTable(
        table_number=table_data.table_number,
        capacity=table_data.capacity
    )

    db.add(table)
    db.commit()
    db.refresh(table)

    return table


@router.get(
    "",
    response_model=list[TableResponse]
)
def get_tables(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tables = db.query(RestaurantTable).order_by(
        RestaurantTable.table_number
    ).all()

    return tables


@router.get(
    "/{table_id}",
    response_model=TableResponse
)
def get_table(
    table_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    table = db.query(RestaurantTable).filter(
        RestaurantTable.id == table_id
    ).first()

    if table is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )

    return table


@router.put(
    "/{table_id}",
    response_model=TableResponse
)
def update_table(
    table_id: int,
    table_data: TableUpdate,
    current_user=Depends(admin_required),
    db: Session = Depends(get_db)
):
    table = db.query(RestaurantTable).filter(
        RestaurantTable.id == table_id
    ).first()

    if table is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )

    if table_data.table_number is not None:
        existing_table = db.query(RestaurantTable).filter(
            RestaurantTable.table_number == table_data.table_number,
            RestaurantTable.id != table_id
        ).first()

        if existing_table:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Table number already exists"
            )

    update_data = table_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(table, field, value)

    db.commit()
    db.refresh(table)

    return table


@router.delete(
    "/{table_id}",
    status_code=status.HTTP_200_OK
)
def delete_table(
    table_id: int,
    current_user=Depends(admin_required),
    db: Session = Depends(get_db)
):
    table = db.query(RestaurantTable).filter(
        RestaurantTable.id == table_id
    ).first()

    if table is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )

    db.delete(table)
    db.commit()

    return {
        "message": "Table deleted successfully"
    }