"""药品与盘点记录路由。"""

from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import InventoryRecord, Medicine
from schemas import (
    InventoryRecordCreate,
    InventoryRecordResponse,
    InventoryRecordWithNameResponse,
    MedicineCreate,
    MedicineResponse,
    MedicineUpdate,
)

router = APIRouter(prefix="/api", tags=["medicines"])


def compute_status_tags(medicine: Medicine) -> list[Literal["expired", "check_due"]]:
    """计算过期 / 待盘点标签。"""
    today = date.today()
    tags: list[Literal["expired", "check_due"]] = []
    if medicine.expiry_date and medicine.expiry_date < today:
        tags.append("expired")
    if medicine.next_check_date and medicine.next_check_date <= today:
        tags.append("check_due")
    return tags


def to_medicine_response(medicine: Medicine) -> MedicineResponse:
    """ORM 转响应模型。"""
    return MedicineResponse(
        id=medicine.id,
        name=medicine.name,
        specification=medicine.specification,
        quantity=medicine.quantity,
        category=medicine.category,
        expiry_date=medicine.expiry_date,
        last_check_date=medicine.last_check_date,
        next_check_date=medicine.next_check_date,
        created_at=medicine.created_at,
        status_tags=compute_status_tags(medicine),
    )


@router.get("/medicines", response_model=list[MedicineResponse])
def list_medicines(
    category: str | None = None,
    db: Session = Depends(get_db),
) -> list[MedicineResponse]:
    """获取全部药品，支持按分类筛选。"""
    query = db.query(Medicine)
    if category:
        query = query.filter(Medicine.category == category)
    medicines = query.order_by(Medicine.id).all()
    return [to_medicine_response(m) for m in medicines]


@router.post("/medicines", response_model=MedicineResponse, status_code=201)
def create_medicine(
    payload: MedicineCreate, db: Session = Depends(get_db)
) -> MedicineResponse:
    """新增药品。"""
    medicine = Medicine(**payload.model_dump())
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    return to_medicine_response(medicine)


@router.put("/medicines/{medicine_id}", response_model=MedicineResponse)
def update_medicine(
    medicine_id: int, payload: MedicineUpdate, db: Session = Depends(get_db)
) -> MedicineResponse:
    """更新药品。"""
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="药品不存在")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(medicine, key, value)
    db.commit()
    db.refresh(medicine)
    return to_medicine_response(medicine)


@router.delete("/medicines/{medicine_id}", status_code=204)
def delete_medicine(medicine_id: int, db: Session = Depends(get_db)) -> None:
    """删除药品。"""
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="药品不存在")
    db.delete(medicine)
    db.commit()


@router.get(
    "/medicines/{medicine_id}/records",
    response_model=list[InventoryRecordResponse],
)
def list_records(
    medicine_id: int, db: Session = Depends(get_db)
) -> list[InventoryRecordResponse]:
    """获取药品盘点记录。"""
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="药品不存在")
    return medicine.check_records


@router.post(
    "/medicines/{medicine_id}/records",
    response_model=InventoryRecordResponse,
    status_code=201,
)
def create_record(
    medicine_id: int,
    payload: InventoryRecordCreate,
    db: Session = Depends(get_db),
) -> InventoryRecordResponse:
    """提交盘点记录，并同步更新药品的上次/下次盘点日。"""
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="药品不存在")

    record = InventoryRecord(
        medicine_id=medicine_id,
        check_date=payload.check_date,
        quantity_checked=payload.quantity_checked,
        note=payload.note,
        next_check_date=payload.next_check_date,
    )
    medicine.last_check_date = payload.check_date
    if payload.next_check_date:
        medicine.next_check_date = payload.next_check_date
    if payload.quantity_checked is not None:
        medicine.quantity = payload.quantity_checked

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get(
    "/records",
    response_model=list[InventoryRecordWithNameResponse],
)
def list_all_records(
    medicine_id: int | None = None,
    limit: int = 20,
    db: Session = Depends(get_db),
) -> list[InventoryRecordWithNameResponse]:
    """获取全部盘点记录，支持按药品筛选，按检查日期倒序排列。"""
    query = db.query(
        InventoryRecord.id,
        InventoryRecord.medicine_id,
        InventoryRecord.check_date,
        InventoryRecord.quantity_checked,
        InventoryRecord.note,
        InventoryRecord.next_check_date,
        InventoryRecord.created_at,
        Medicine.name.label("medicine_name"),
    ).join(Medicine, InventoryRecord.medicine_id == Medicine.id)

    if medicine_id is not None:
        query = query.filter(InventoryRecord.medicine_id == medicine_id)

    records = query.order_by(
        InventoryRecord.check_date.desc(),
        InventoryRecord.id.desc(),
    ).limit(limit).all()

    return [
        InventoryRecordWithNameResponse(
            id=r.id,
            medicine_id=r.medicine_id,
            check_date=r.check_date,
            quantity_checked=r.quantity_checked,
            note=r.note,
            next_check_date=r.next_check_date,
            created_at=r.created_at,
            medicine_name=r.medicine_name,
        )
        for r in records
    ]
