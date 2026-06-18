"""初始化数据库并写入示例数据。"""

from datetime import date, timedelta

from database import Base, SessionLocal, engine
from models import EmergencyContact, EmergencyDrill, Medicine, PurchasePlan, StorageLocation

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
                category="医疗",
                expiry_date=TODAY + timedelta(days=365),
                last_check_date=TODAY - timedelta(days=60),
                next_check_date=TODAY + timedelta(days=30),
            ),
            Medicine(
                name="阿莫西林胶囊",
                specification="0.25g*24粒",
                quantity=1,
                category="医疗",
                expiry_date=TODAY - timedelta(days=10),
                last_check_date=TODAY - timedelta(days=120),
                next_check_date=TODAY - timedelta(days=5),
            ),
            Medicine(
                name="感冒灵颗粒",
                specification="10g*9袋",
                quantity=3,
                category="医疗",
                expiry_date=TODAY + timedelta(days=180),
                last_check_date=TODAY - timedelta(days=30),
                next_check_date=TODAY + timedelta(days=60),
            ),
            Medicine(
                name="碘伏消毒液",
                specification="100ml",
                quantity=2,
                category="医疗",
                expiry_date=TODAY + timedelta(days=720),
                last_check_date=TODAY - timedelta(days=90),
                next_check_date=TODAY + timedelta(days=90),
            ),
            Medicine(
                name="创可贴",
                specification="100片/盒",
                quantity=1,
                category="工具",
                expiry_date=None,
                last_check_date=TODAY - timedelta(days=45),
                next_check_date=TODAY - timedelta(days=1),
            ),
            Medicine(
                name="健胃消食片",
                specification="0.5g*36片",
                quantity=2,
                category="食品",
                expiry_date=TODAY + timedelta(days=90),
                last_check_date=TODAY - timedelta(days=15),
                next_check_date=TODAY + timedelta(days=75),
            ),
            Medicine(
                name="氯雷他定片",
                specification="10mg*6片",
                quantity=1,
                category="医疗",
                expiry_date=TODAY - timedelta(days=30),
                last_check_date=TODAY - timedelta(days=100),
                next_check_date=TODAY + timedelta(days=20),
            ),
            Medicine(
                name="维生素C片",
                specification="100mg*100片",
                quantity=1,
                category="其他",
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


def seed_emergency_drills() -> None:
    """若表为空则插入 4 条示例应急演练记录。"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(EmergencyDrill).count() > 0:
            return

        drills = [
            EmergencyDrill(
                title="家庭火灾逃生演练",
                drill_date=TODAY - timedelta(days=90),
                participant_count=4,
                location="家中",
                summary="全体成员按照逃生路线成功撤离到指定安全区域，总耗时2分30秒。需优化老人撤离速度。",
            ),
            EmergencyDrill(
                title="地震避险演练",
                drill_date=TODAY - timedelta(days=60),
                participant_count=3,
                location="家中",
                summary="演练了地震发生时的伏地、遮挡、手抓牢三个步骤，成员对避险位置选择存在分歧，已统一标准。",
            ),
            EmergencyDrill(
                title="心肺复苏急救演练",
                drill_date=TODAY - timedelta(days=30),
                participant_count=5,
                location="社区活动室",
                summary="邀请社区医生指导，全体成员完成胸外按压和人工呼吸实操训练，考核通过率80%。",
            ),
            EmergencyDrill(
                title="燃气泄漏应急处置演练",
                drill_date=TODAY - timedelta(days=7),
                participant_count=4,
                location="家中厨房",
                summary="演练了关闭阀门、开窗通风、禁止明火、撤离报警等流程，操作规范，总耗时1分45秒。",
            ),
        ]
        db.add_all(drills)
        db.commit()
    finally:
        db.close()


def seed_storage_locations() -> None:
    """若表为空则插入 4 条示例应急物品存放位置。"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(StorageLocation).count() > 0:
            return

        locations = [
            StorageLocation(
                name="客厅应急柜",
                room="客厅",
                capacity_desc="三层储物柜，可存放手电筒、灭火器、逃生绳等物品",
                current_count=8,
            ),
            StorageLocation(
                name="主卧床头柜",
                room="主卧",
                capacity_desc="抽屉式收纳，可放置小型急救包、口哨等随身物品",
                current_count=5,
            ),
            StorageLocation(
                name="厨房壁柜",
                room="厨房",
                capacity_desc="防火密封柜，存放燃气泄漏报警器、灭火毯等",
                current_count=6,
            ),
            StorageLocation(
                name="玄关鞋柜",
                room="玄关",
                capacity_desc="下层储物格，存放应急逃生鞋套、反光背心、家门备用钥匙",
                current_count=4,
            ),
        ]
        db.add_all(locations)
        db.commit()
    finally:
        db.close()


def seed_purchase_plans() -> None:
    """若表为空则插入 5 条待办采购计划。"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(PurchasePlan).count() > 0:
            return

        plans = [
            PurchasePlan(
                item_name="N95口罩",
                planned_quantity=50,
                estimated_unit_price=2.5,
                planned_purchase_date=TODAY + timedelta(days=3),
                is_completed=False,
            ),
            PurchasePlan(
                item_name="家用灭火器",
                planned_quantity=2,
                estimated_unit_price=89.0,
                planned_purchase_date=TODAY + timedelta(days=7),
                is_completed=False,
            ),
            PurchasePlan(
                item_name="应急饮用水（箱）",
                planned_quantity=5,
                estimated_unit_price=45.0,
                planned_purchase_date=TODAY + timedelta(days=5),
                is_completed=False,
            ),
            PurchasePlan(
                item_name="压缩饼干（箱）",
                planned_quantity=3,
                estimated_unit_price=68.0,
                planned_purchase_date=TODAY + timedelta(days=10),
                is_completed=False,
            ),
            PurchasePlan(
                item_name="强光手电筒",
                planned_quantity=4,
                estimated_unit_price=35.0,
                planned_purchase_date=TODAY + timedelta(days=2),
                is_completed=False,
            ),
        ]
        db.add_all(plans)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_medicines()
    seed_emergency_contacts()
    seed_emergency_drills()
    seed_storage_locations()
    seed_purchase_plans()
    print("Seed completed.")
