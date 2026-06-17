"""家庭药品台账 API。"""

from datetime import date
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db
from models import EmergencyContact, EmergencyDrill, InventoryRecord, Medicine
from schemas import (
    EmergencyContactCreate,
    EmergencyContactResponse,
    EmergencyContactUpdate,
    EmergencyDrillCreate,
    EmergencyDrillResponse,
    InventoryRecordCreate,
    InventoryRecordResponse,
    MedicineCreate,
    MedicineResponse,
    MedicineUpdate,
)
from seed import seed_emergency_contacts, seed_emergency_drills, seed_medicines

app = FastAPI(title="家庭药品台账", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """启动时建表并 seed。"""
    seed_medicines()
    seed_emergency_contacts()
    seed_emergency_drills()


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
        expiry_date=medicine.expiry_date,
        last_check_date=medicine.last_check_date,
        next_check_date=medicine.next_check_date,
        created_at=medicine.created_at,
        status_tags=compute_status_tags(medicine),
    )


@app.get("/api/medicines", response_model=list[MedicineResponse])
def list_medicines(db: Session = Depends(get_db)) -> list[MedicineResponse]:
    """获取全部药品。"""
    medicines = db.query(Medicine).order_by(Medicine.id).all()
    return [to_medicine_response(m) for m in medicines]


@app.post("/api/medicines", response_model=MedicineResponse, status_code=201)
def create_medicine(
    payload: MedicineCreate, db: Session = Depends(get_db)
) -> MedicineResponse:
    """新增药品。"""
    medicine = Medicine(**payload.model_dump())
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    return to_medicine_response(medicine)


@app.put("/api/medicines/{medicine_id}", response_model=MedicineResponse)
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


@app.delete("/api/medicines/{medicine_id}", status_code=204)
def delete_medicine(medicine_id: int, db: Session = Depends(get_db)) -> None:
    """删除药品。"""
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="药品不存在")
    db.delete(medicine)
    db.commit()


@app.get(
    "/api/medicines/{medicine_id}/records",
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


@app.post(
    "/api/medicines/{medicine_id}/records",
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


@app.get("/api/health")
def health() -> dict[str, str]:
    """健康检查。"""
    return {"status": "ok"}


def enforce_single_primary(db: Session, contact_id: int | None = None) -> None:
    """确保只有一个首要联系人。"""
    primary_contacts = db.query(EmergencyContact).filter(
        EmergencyContact.is_primary == True
    ).all()
    if len(primary_contacts) > 1:
        for contact in primary_contacts:
            if contact.id != contact_id:
                contact.is_primary = False
        db.commit()


@app.get("/api/contacts", response_model=list[EmergencyContactResponse])
def list_contacts(db: Session = Depends(get_db)) -> list[EmergencyContactResponse]:
    """获取全部紧急联系人，首要联系人排最前。"""
    contacts = db.query(EmergencyContact).order_by(
        EmergencyContact.is_primary.desc(), EmergencyContact.id
    ).all()
    return contacts


@app.post("/api/contacts", response_model=EmergencyContactResponse, status_code=201)
def create_contact(
    payload: EmergencyContactCreate, db: Session = Depends(get_db)
) -> EmergencyContactResponse:
    """新增紧急联系人。"""
    contact = EmergencyContact(**payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    if contact.is_primary:
        enforce_single_primary(db, contact.id)
        db.refresh(contact)
    return contact


@app.put("/api/contacts/{contact_id}", response_model=EmergencyContactResponse)
def update_contact(
    contact_id: int, payload: EmergencyContactUpdate, db: Session = Depends(get_db)
) -> EmergencyContactResponse:
    """更新紧急联系人。"""
    contact = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="紧急联系人不存在")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(contact, key, value)
    db.commit()
    db.refresh(contact)
    if contact.is_primary:
        enforce_single_primary(db, contact.id)
        db.refresh(contact)
    return contact


@app.delete("/api/contacts/{contact_id}", status_code=204)
def delete_contact(contact_id: int, db: Session = Depends(get_db)) -> None:
    """删除紧急联系人。"""
    contact = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="紧急联系人不存在")
    db.delete(contact)
    db.commit()


@app.get("/api/drills", response_model=list[EmergencyDrillResponse])
def list_drills(db: Session = Depends(get_db)) -> list[EmergencyDrillResponse]:
    """获取全部应急演练记录，按日期倒序排列。"""
    drills = db.query(EmergencyDrill).order_by(EmergencyDrill.drill_date.desc()).all()
    return drills


@app.post("/api/drills", response_model=EmergencyDrillResponse, status_code=201)
def create_drill(
    payload: EmergencyDrillCreate, db: Session = Depends(get_db)
) -> EmergencyDrillResponse:
    """新增应急演练记录。"""
    drill = EmergencyDrill(**payload.model_dump())
    db.add(drill)
    db.commit()
    db.refresh(drill)
    return drill
