"""存放位置路由。"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import StorageLocation
from schemas import (
    StorageLocationCreate,
    StorageLocationResponse,
    StorageLocationUpdate,
)

router = APIRouter(prefix="/api", tags=["locations"])


@router.get("/locations", response_model=list[StorageLocationResponse])
def list_locations(db: Session = Depends(get_db)) -> list[StorageLocationResponse]:
    """获取全部应急物品存放位置。"""
    locations = db.query(StorageLocation).order_by(StorageLocation.id).all()
    return locations


@router.post("/locations", response_model=StorageLocationResponse, status_code=201)
def create_location(
    payload: StorageLocationCreate, db: Session = Depends(get_db)
) -> StorageLocationResponse:
    """新增应急物品存放位置。"""
    location = StorageLocation(**payload.model_dump())
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


@router.get("/locations/{location_id}", response_model=StorageLocationResponse)
def get_location(
    location_id: int, db: Session = Depends(get_db)
) -> StorageLocationResponse:
    """获取单个存放位置详情。"""
    location = db.query(StorageLocation).filter(StorageLocation.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="存放位置不存在")
    return location


@router.put("/locations/{location_id}", response_model=StorageLocationResponse)
def update_location(
    location_id: int,
    payload: StorageLocationUpdate,
    db: Session = Depends(get_db),
) -> StorageLocationResponse:
    """更新存放位置。"""
    location = db.query(StorageLocation).filter(StorageLocation.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="存放位置不存在")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(location, key, value)
    db.commit()
    db.refresh(location)
    return location


@router.delete("/locations/{location_id}", status_code=204)
def delete_location(location_id: int, db: Session = Depends(get_db)) -> None:
    """删除存放位置。"""
    location = db.query(StorageLocation).filter(StorageLocation.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="存放位置不存在")
    db.delete(location)
    db.commit()
