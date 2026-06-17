"""初始化数据库并写入 8 条示例数据。"""

from datetime import date, timedelta

from database import Base, SessionLocal, engine
from models import EmergencyItem

TODAY = date.today()


def seed_items() -> None:
    """若表为空则插入 8 条应急包物品。"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(EmergencyItem).count() > 0:
            return

        items = [
            EmergencyItem(
                name="饮用水",
                quantity=12,
                expiry_date=TODAY + timedelta(days=180),
                last_check_date=TODAY - timedelta(days=30),
                next_check_date=TODAY + timedelta(days=60),
            ),
            EmergencyItem(
                name="压缩饼干",
                quantity=6,
                expiry_date=TODAY - timedelta(days=5),
                last_check_date=TODAY - timedelta(days=90),
                next_check_date=TODAY - timedelta(days=1),
            ),
            EmergencyItem(
                name="急救包",
                quantity=1,
                expiry_date=TODAY + timedelta(days=365),
                last_check_date=TODAY - timedelta(days=120),
                next_check_date=TODAY,
            ),
            EmergencyItem(
                name="手电筒",
                quantity=2,
                expiry_date=None,
                last_check_date=TODAY - timedelta(days=45),
                next_check_date=TODAY + timedelta(days=45),
            ),
            EmergencyItem(
                name="备用电池",
                quantity=8,
                expiry_date=TODAY + timedelta(days=730),
                last_check_date=TODAY - timedelta(days=60),
                next_check_date=TODAY - timedelta(days=3),
            ),
            EmergencyItem(
                name="口罩",
                quantity=20,
                expiry_date=TODAY + timedelta(days=90),
                last_check_date=TODAY - timedelta(days=15),
                next_check_date=TODAY + timedelta(days=75),
            ),
            EmergencyItem(
                name="多功能刀具",
                quantity=1,
                expiry_date=None,
                last_check_date=TODAY - timedelta(days=200),
                next_check_date=TODAY + timedelta(days=10),
            ),
            EmergencyItem(
                name="应急毯",
                quantity=3,
                expiry_date=TODAY - timedelta(days=30),
                last_check_date=TODAY - timedelta(days=30),
                next_check_date=TODAY + timedelta(days=30),
            ),
        ]
        db.add_all(items)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_items()
    print("Seed completed: 8 emergency items inserted.")
