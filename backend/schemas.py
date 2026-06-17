"""Pydantic 请求/响应模型。"""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ItemBase(BaseModel):
    """物品公共字段。"""

    name: str = Field(..., min_length=1, max_length=100)
    quantity: int = Field(..., ge=0)
    expiry_date: date | None = None
    last_check_date: date | None = None
    next_check_date: date | None = None


class ItemCreate(ItemBase):
    """创建物品。"""


class ItemUpdate(BaseModel):
    """更新物品（部分字段）。"""

    name: str | None = Field(None, min_length=1, max_length=100)
    quantity: int | None = Field(None, ge=0)
    expiry_date: date | None = None
    last_check_date: date | None = None
    next_check_date: date | None = None


class ItemResponse(ItemBase):
    """物品响应，含状态标签。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    status_tags: list[Literal["expired", "check_due"]] = []


class CheckRecordCreate(BaseModel):
    """创建检查记录。"""

    check_date: date
    note: str | None = Field(None, max_length=500)
    next_check_date: date | None = None


class CheckRecordResponse(BaseModel):
    """检查记录响应。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    check_date: date
    note: str | None
    next_check_date: date | None
    created_at: datetime
