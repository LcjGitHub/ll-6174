"""药品台账 ORM 模型。"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Medicine(Base):
    """药品。"""

    __tablename__ = "medicines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    specification: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_check_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_check_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    check_records: Mapped[list["InventoryRecord"]] = relationship(
        "InventoryRecord",
        back_populates="medicine",
        cascade="all, delete-orphan",
        order_by="InventoryRecord.check_date.desc()",
    )


class InventoryRecord(Base):
    """盘点记录。"""

    __tablename__ = "inventory_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    medicine_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False
    )
    check_date: Mapped[date] = mapped_column(Date, nullable=False)
    quantity_checked: Mapped[int | None] = mapped_column(Integer, nullable=True)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    next_check_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    medicine: Mapped["Medicine"] = relationship(
        "Medicine", back_populates="check_records"
    )
