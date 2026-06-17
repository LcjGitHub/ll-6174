"""初始化数据库并写入示例数据。"""

from datetime import date, timedelta

from database import Base, SessionLocal, engine
from models import EmergencyContact, Medicine

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


def _enforce_single_primary(db) -> None:
    """确保只有一个首要联系人。"""
    primary_contacts = (
        db.query(EmergencyContact)
        .filter(EmergencyContact.is_primary == True)
        .order_by(EmergencyContact.id)
        .all()
    )
    if len(primary_contacts) > 1:
        for contact in primary_contacts[1:]:
            contact.is_primary = False
        db.commit()


def seed_emergency_contacts() -> None:
    """若表为空则插入 5 条示例紧急联系人，并确保仅一人为首要联系人。"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(EmergencyContact).count() > 0:
            _enforce_single_primary(db)
            return

        contacts = [
            EmergencyContact(
                name="张伟",
                relationship="配偶",
                phone="13800138001",
                is_primary=True,
                note="24小时可联系",
            ),
            EmergencyContact(
                name="李芳",
                relationship="母亲",
                phone="13900139002",
                is_primary=False,
                note="家附近居住",
            ),
            EmergencyContact(
                name="王强",
                relationship="同事",
                phone="13700137003",
                is_primary=False,
                note="单位紧急联络人",
            ),
            EmergencyContact(
                name="赵敏",
                relationship="闺蜜",
                phone="13600136004",
                is_primary=False,
                note="有备用钥匙",
            ),
            EmergencyContact(
                name="刘强",
                relationship="邻居",
                phone="13500135005",
                is_primary=False,
                note="住对门",
            ),
        ]
        db.add_all(contacts)
        db.commit()
        _enforce_single_primary(db)
    finally:
        db.close()


if __name__ == "__main__":
    seed_medicines()
    seed_emergency_contacts()
    print("Seed completed.")
