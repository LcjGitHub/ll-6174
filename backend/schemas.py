"""Pydantic 请求/响应模型。"""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class MedicineBase(BaseModel):
    """药品公共字段。"""

    name: str = Field(..., min_length=1, max_length=100)
    specification: str = Field("", max_length=100)
    quantity: int = Field(..., ge=0)
    expiry_date: date | None = None
    last_check_date: date | None = None
    next_check_date: date | None = None


class MedicineCreate(MedicineBase):
    """创建药品。"""


class MedicineUpdate(BaseModel):
    """更新药品（部分字段）。"""

    name: str | None = Field(None, min_length=1, max_length=100)
    specification: str | None = Field(None, max_length=100)
    quantity: int | None = Field(None, ge=0)
    expiry_date: date | None = None
    last_check_date: date | None = None
    next_check_date: date | None = None


class MedicineResponse(MedicineBase):
    """药品响应，含状态标签。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    status_tags: list[Literal["expired", "check_due"]] = []


class InventoryRecordCreate(BaseModel):
    """创建盘点记录。"""

    check_date: date
    quantity_checked: int | None = None
    note: str | None = Field(None, max_length=500)
    next_check_date: date | None = None


class InventoryRecordResponse(BaseModel):
    """盘点记录响应。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    medicine_id: int
    check_date: date
    quantity_checked: int | None
    note: str | None
    next_check_date: date | None
    created_at: datetime
