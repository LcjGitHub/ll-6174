"""初始化数据库并写入 8 条示例药品数据。"""

from datetime import date, timedelta

from database import Base, SessionLocal, engine
from models import Medicine

TODAY = date.today()


def seed_medicines() -> None:
    """若表为空则插入 8 条示例药品。"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Medicine).count() > 0:
            return

        medicines = [
            Medicine(
                name="布洛芬缓释胶囊",
                specification="0.3g*20粒",
                quantity=2,
                expiry_date=TODAY + timedelta(days=365),
                last_check_date=TODAY - timedelta(days=60),
                next_check_date=TODAY + timedelta(days=30),
            ),
            Medicine(
                name="阿莫西林胶囊",
                specification="0.25g*24粒",
                quantity=1,
                expiry_date=TODAY - timedelta(days=10),
                last_check_date=TODAY - timedelta(days=120),
                next_check_date=TODAY - timedelta(days=5),
            ),
            Medicine(
                name="感冒灵颗粒",
                specification="10g*9袋",
                quantity=3,
                expiry_date=TODAY + timedelta(days=180),
                last_check_date=TODAY - timedelta(days=30),
                next_check_date=TODAY + timedelta(days=60),
            ),
            Medicine(
                name="碘伏消毒液",
                specification="100ml",
                quantity=2,
                expiry_date=TODAY + timedelta(days=720),
                last_check_date=TODAY - timedelta(days=90),
                next_check_date=TODAY + timedelta(days=90),
            ),
            Medicine(
                name="创可贴",
                specification="100片/盒",
                quantity=1,
                expiry_date=None,
                last_check_date=TODAY - timedelta(days=45),
                next_check_date=TODAY - timedelta(days=1),
            ),
            Medicine(
                name="健胃消食片",
                specification="0.5g*36片",
                quantity=2,
                expiry_date=TODAY + timedelta(days=90),
                last_check_date=TODAY - timedelta(days=15),
                next_check_date=TODAY + timedelta(days=75),
            ),
            Medicine(
                name="氯雷他定片",
                specification="10mg*6片",
                quantity=1,
                expiry_date=TODAY - timedelta(days=30),
                last_check_date=TODAY - timedelta(days=100),
                next_check_date=TODAY + timedelta(days=20),
            ),
            Medicine(
                name="维生素C片",
                specification="100mg*100片",
                quantity=1,
                expiry_date=TODAY + timedelta(days=540),
                last_check_date=TODAY - timedelta(days=200),
                next_check_date=TODAY + timedelta(days=10),
            ),
        ]
        db.add_all(medicines)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_medicines()
    print("Seed completed: 8 medicines inserted.")
