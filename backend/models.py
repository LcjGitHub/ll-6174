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


class EmergencyContact(Base):
    """紧急联系人。"""

    __tablename__ = "emergency_contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    relationship: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    is_primary: Mapped[bool] = mapped_column(default=False, nullable=False)
    note: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )


class EmergencyDrill(Base):
    """应急演练记录。"""

    __tablename__ = "emergency_drills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    drill_date: Mapped[date] = mapped_column(Date, nullable=False)
    participant_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    location: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    summary: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
