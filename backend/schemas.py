"""Pydantic 请求/响应模型。"""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


CATEGORY_CHOICES = ("食品", "医疗", "工具", "其他")


class MedicineBase(BaseModel):
    """药品公共字段。"""

    name: str = Field(..., min_length=1, max_length=100)
    specification: str = Field("", max_length=100)
    quantity: int = Field(..., ge=0)
    category: str = Field("其他", max_length=20)
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
    category: str | None = Field(None, max_length=20)
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


class InventoryRecordWithNameResponse(InventoryRecordResponse):
    """盘点记录响应（含药品名称）。"""

    medicine_name: str


PHONE_PATTERN = r"^1[3-9]\d{9}$"


class EmergencyContactBase(BaseModel):
    """紧急联系人公共字段。"""

    name: str = Field(..., min_length=1, max_length=50)
    relationship: str = Field(..., min_length=1, max_length=50)
    phone: str = Field(..., pattern=PHONE_PATTERN)
    is_primary: bool = False
    note: str | None = Field(None, max_length=200)


class EmergencyContactCreate(EmergencyContactBase):
    """创建紧急联系人。"""


class EmergencyContactUpdate(BaseModel):
    """更新紧急联系人（部分字段）。"""

    name: str | None = Field(None, min_length=1, max_length=50)
    relationship: str | None = Field(None, min_length=1, max_length=50)
    phone: str | None = Field(None, pattern=PHONE_PATTERN)
    is_primary: bool | None = None
    note: str | None = Field(None, max_length=200)


class EmergencyContactResponse(EmergencyContactBase):
    """紧急联系人响应。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class EmergencyDrillBase(BaseModel):
    """应急演练记录公共字段。"""

    title: str = Field(..., min_length=1, max_length=200)
    drill_date: date
    participant_count: int = Field(..., ge=0)
    location: str = Field("", max_length=100)
    summary: str | None = Field(None, max_length=500)


class EmergencyDrillCreate(EmergencyDrillBase):
    """创建应急演练记录。"""


class EmergencyDrillResponse(EmergencyDrillBase):
    """应急演练记录响应。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class StorageLocationBase(BaseModel):
    """应急物品存放位置公共字段。"""

    name: str = Field(..., min_length=1, max_length=100)
    room: str = Field(..., min_length=1, max_length=100)
    capacity_desc: str = Field("", max_length=200)
    current_count: int = Field(0, ge=0)


class StorageLocationCreate(StorageLocationBase):
    """创建存放位置。"""


class StorageLocationUpdate(BaseModel):
    """更新存放位置（部分字段）。"""

    name: str | None = Field(None, min_length=1, max_length=100)
    room: str | None = Field(None, min_length=1, max_length=100)
    capacity_desc: str | None = Field(None, max_length=200)
    current_count: int | None = Field(None, ge=0)


class StorageLocationResponse(StorageLocationBase):
    """存放位置响应。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class PurchasePlanBase(BaseModel):
    """采购计划公共字段。"""

    item_name: str = Field(..., min_length=1, max_length=200)
    planned_quantity: int = Field(..., ge=1)
    estimated_unit_price: float = Field(..., ge=0)
    planned_purchase_date: date
    is_completed: bool = False


class PurchasePlanCreate(BaseModel):
    """创建采购计划。"""

    item_name: str = Field(..., min_length=1, max_length=200)
    planned_quantity: int = Field(..., ge=1)
    estimated_unit_price: float = Field(..., ge=0)
    planned_purchase_date: date


class PurchasePlanResponse(PurchasePlanBase):
    """采购计划响应。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
