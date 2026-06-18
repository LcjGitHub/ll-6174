"""紧急联系人路由。"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import EmergencyContact
from schemas import (
    EmergencyContactCreate,
    EmergencyContactResponse,
    EmergencyContactUpdate,
)

router = APIRouter(prefix="/api", tags=["contacts"])


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


@router.get("/contacts", response_model=list[EmergencyContactResponse])
def list_contacts(db: Session = Depends(get_db)) -> list[EmergencyContactResponse]:
    """获取全部紧急联系人，首要联系人排最前。"""
    contacts = db.query(EmergencyContact).order_by(
        EmergencyContact.is_primary.desc(), EmergencyContact.id
    ).all()
    return contacts


@router.post("/contacts", response_model=EmergencyContactResponse, status_code=201)
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


@router.put("/contacts/{contact_id}", response_model=EmergencyContactResponse)
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


@router.delete("/contacts/{contact_id}", status_code=204)
def delete_contact(contact_id: int, db: Session = Depends(get_db)) -> None:
    """删除紧急联系人。"""
    contact = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="紧急联系人不存在")
    db.delete(contact)
    db.commit()
