"""家庭应急包清单 API。"""

from datetime import date
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db
from models import CheckRecord, EmergencyItem
from schemas import (
    CheckRecordCreate,
    CheckRecordResponse,
    ItemCreate,
    ItemResponse,
    ItemUpdate,
)
from seed import seed_items

app = FastAPI(title="家庭应急包清单", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """启动时建表并 seed。"""
    seed_items()


def compute_status_tags(item: EmergencyItem) -> list[Literal["expired", "check_due"]]:
    """计算过期 / 待检查标签。"""
    today = date.today()
    tags: list[Literal["expired", "check_due"]] = []
    if item.expiry_date and item.expiry_date < today:
        tags.append("expired")
    if item.next_check_date and item.next_check_date <= today:
        tags.append("check_due")
    return tags


def to_item_response(item: EmergencyItem) -> ItemResponse:
    """ORM 转响应模型。"""
    return ItemResponse(
        id=item.id,
        name=item.name,
        quantity=item.quantity,
        expiry_date=item.expiry_date,
        last_check_date=item.last_check_date,
        next_check_date=item.next_check_date,
        created_at=item.created_at,
        status_tags=compute_status_tags(item),
    )


@app.get("/api/items", response_model=list[ItemResponse])
def list_items(db: Session = Depends(get_db)) -> list[ItemResponse]:
    """获取全部物品。"""
    items = db.query(EmergencyItem).order_by(EmergencyItem.id).all()
    return [to_item_response(item) for item in items]


@app.post("/api/items", response_model=ItemResponse, status_code=201)
def create_item(payload: ItemCreate, db: Session = Depends(get_db)) -> ItemResponse:
    """新增物品。"""
    item = EmergencyItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return to_item_response(item)


@app.put("/api/items/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: int, payload: ItemUpdate, db: Session = Depends(get_db)
) -> ItemResponse:
    """更新物品。"""
    item = db.query(EmergencyItem).filter(EmergencyItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="物品不存在")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return to_item_response(item)


@app.delete("/api/items/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)) -> None:
    """删除物品。"""
    item = db.query(EmergencyItem).filter(EmergencyItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="物品不存在")
    db.delete(item)
    db.commit()


@app.get("/api/items/{item_id}/checks", response_model=list[CheckRecordResponse])
def list_checks(item_id: int, db: Session = Depends(get_db)) -> list[CheckRecordResponse]:
    """获取物品检查记录。"""
    item = db.query(EmergencyItem).filter(EmergencyItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="物品不存在")
    return item.check_records


@app.post(
    "/api/items/{item_id}/checks",
    response_model=CheckRecordResponse,
    status_code=201,
)
def create_check(
    item_id: int, payload: CheckRecordCreate, db: Session = Depends(get_db)
) -> CheckRecordResponse:
    """提交检查记录，并同步更新物品的上次/下次检查日。"""
    item = db.query(EmergencyItem).filter(EmergencyItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="物品不存在")

    record = CheckRecord(
        item_id=item_id,
        check_date=payload.check_date,
        note=payload.note,
        next_check_date=payload.next_check_date,
    )
    item.last_check_date = payload.check_date
    if payload.next_check_date:
        item.next_check_date = payload.next_check_date

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.get("/api/health")
def health() -> dict[str, str]:
    """健康检查。"""
    return {"status": "ok"}
