"""应急包 ORM 模型。"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class EmergencyItem(Base):
    """应急包物品。"""

    __tablename__ = "emergency_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_check_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_check_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    check_records: Mapped[list["CheckRecord"]] = relationship(
        "CheckRecord",
        back_populates="item",
        cascade="all, delete-orphan",
        order_by="CheckRecord.check_date.desc()",
    )


class CheckRecord(Base):
    """物品检查记录。"""

    __tablename__ = "check_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    item_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("emergency_items.id", ondelete="CASCADE"), nullable=False
    )
    check_date: Mapped[date] = mapped_column(Date, nullable=False)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    next_check_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    item: Mapped["EmergencyItem"] = relationship(
        "EmergencyItem", back_populates="check_records"
    )
