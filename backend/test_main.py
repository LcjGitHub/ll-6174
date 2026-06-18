"""后端单元测试（使用独立内存数据库，避免脏数据干扰）。"""

import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import database
import models
import schemas
from database import Base, get_db
from main import app

TEST_DATABASE_URL = "sqlite://"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        today = date.today()
        db.add_all(
            [
                models.Medicine(
                    name="布洛芬缓释胶囊",
                    specification="0.3g*20粒",
                    quantity=2,
                    category="医疗",
                    expiry_date=today + timedelta(days=365),
                ),
                models.Medicine(
                    name="创可贴",
                    specification="100片/盒",
                    quantity=1,
                    category="工具",
                ),
                models.EmergencyContact(
                    name="测试联系人",
                    relationship="朋友",
                    phone="13800138000",
                    is_primary=True,
                ),
                models.EmergencyDrill(
                    title="测试演练",
                    drill_date=today - timedelta(days=7),
                    participant_count=3,
                    location="家中",
                ),
                models.StorageLocation(
                    name="测试位置",
                    room="客厅",
                    capacity_desc="测试用存放位置",
                    current_count=5,
                ),
                models.PurchasePlan(
                    item_name="测试物资",
                    planned_quantity=10,
                    estimated_unit_price=5.0,
                    planned_purchase_date=today + timedelta(days=3),
                    is_completed=False,
                ),
            ]
        )
        db.commit()
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_medicines():
    response = client.get("/api/medicines")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    names = [m["name"] for m in data]
    assert "布洛芬缓释胶囊" in names


def test_list_medicines_with_category_filter():
    response = client.get("/api/medicines?category=医疗")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for item in data:
        assert item["category"] == "医疗"


def test_list_contacts():
    response = client.get("/api/contacts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_list_drills():
    response = client.get("/api/drills")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_list_locations():
    response = client.get("/api/locations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_list_purchase_plans():
    response = client.get("/api/purchase-plans")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_medicine():
    payload = {
        "name": "测试新增药品",
        "specification": "10mg*10片",
        "quantity": 5,
        "category": "医疗",
    }
    response = client.post("/api/medicines", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "测试新增药品"
    assert data["category"] == "医疗"
    assert data["quantity"] == 5
    assert "id" in data


def test_create_medicine_invalid_category():
    payload = {
        "name": "无效分类药品",
        "specification": "1g",
        "quantity": 1,
        "category": "日用品",
    }
    response = client.post("/api/medicines", json=payload)
    assert response.status_code == 422


def test_update_medicine():
    create_response = client.post(
        "/api/medicines",
        json={
            "name": "待更新药品",
            "specification": "5mg*20片",
            "quantity": 3,
            "category": "其他",
        },
    )
    medicine_id = create_response.json()["id"]

    update_response = client.put(
        f"/api/medicines/{medicine_id}",
        json={"quantity": 10, "category": "工具"},
    )
    assert update_response.status_code == 200
    data = update_response.json()
    assert data["quantity"] == 10
    assert data["category"] == "工具"
    assert data["name"] == "待更新药品"


def test_update_medicine_not_found():
    response = client.put(
        "/api/medicines/99999",
        json={"quantity": 5},
    )
    assert response.status_code == 404


def test_delete_medicine():
    create_response = client.post(
        "/api/medicines",
        json={
            "name": "待删除药品",
            "specification": "1g*1袋",
            "quantity": 1,
            "category": "食品",
        },
    )
    medicine_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/medicines/{medicine_id}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/medicines/{medicine_id}/records")
    assert get_response.status_code == 404


def test_delete_medicine_not_found():
    response = client.delete("/api/medicines/99999")
    assert response.status_code == 404


def test_create_and_list_records():
    medicines = client.get("/api/medicines").json()
    medicine_id = medicines[0]["id"]
    today = date.today().isoformat()

    create_response = client.post(
        f"/api/medicines/{medicine_id}/records",
        json={
            "check_date": today,
            "quantity_checked": 10,
            "note": "测试盘点",
        },
    )
    assert create_response.status_code == 201

    list_response = client.get(f"/api/medicines/{medicine_id}/records")
    assert list_response.status_code == 200
    records = list_response.json()
    assert len(records) >= 1
    assert records[0]["note"] == "测试盘点"


def test_status_tags_expired_medicine():
    from routers.medicines import compute_status_tags
    from datetime import timedelta

    medicine = models.Medicine(
        name="过期药品",
        specification="测试",
        quantity=1,
        category="医疗",
        expiry_date=date.today() - timedelta(days=10),
        next_check_date=date.today() + timedelta(days=30),
    )
    tags = compute_status_tags(medicine)
    assert "expired" in tags
    assert "check_due" not in tags


def test_status_tags_check_due_medicine():
    from routers.medicines import compute_status_tags
    from datetime import timedelta

    medicine = models.Medicine(
        name="待检查药品",
        specification="测试",
        quantity=1,
        category="医疗",
        expiry_date=date.today() + timedelta(days=365),
        next_check_date=date.today(),
    )
    tags = compute_status_tags(medicine)
    assert "expired" not in tags
    assert "check_due" in tags


def test_status_tags_both_expired_and_check_due():
    from routers.medicines import compute_status_tags
    from datetime import timedelta

    medicine = models.Medicine(
        name="过期且待检查药品",
        specification="测试",
        quantity=1,
        category="医疗",
        expiry_date=date.today() - timedelta(days=5),
        next_check_date=date.today() - timedelta(days=1),
    )
    tags = compute_status_tags(medicine)
    assert "expired" in tags
    assert "check_due" in tags


def test_status_tags_normal_medicine():
    from routers.medicines import compute_status_tags
    from datetime import timedelta

    medicine = models.Medicine(
        name="正常药品",
        specification="测试",
        quantity=1,
        category="医疗",
        expiry_date=date.today() + timedelta(days=365),
        next_check_date=date.today() + timedelta(days=30),
    )
    tags = compute_status_tags(medicine)
    assert tags == []


def test_status_tags_no_dates():
    from routers.medicines import compute_status_tags

    medicine = models.Medicine(
        name="无日期药品",
        specification="测试",
        quantity=1,
        category="工具",
        expiry_date=None,
        next_check_date=None,
    )
    tags = compute_status_tags(medicine)
    assert tags == []


def test_list_medicines_contains_status_tags():
    response = client.get("/api/medicines")
    assert response.status_code == 200
    data = response.json()
    for item in data:
        assert "status_tags" in item
        assert isinstance(item["status_tags"], list)


def test_create_record_updates_medicine_check_dates():
    from datetime import timedelta

    create_resp = client.post(
        "/api/medicines",
        json={
            "name": "盘点测试药品",
            "specification": "10mg*10片",
            "quantity": 5,
            "category": "医疗",
            "expiry_date": (date.today() + timedelta(days=365)).isoformat(),
        },
    )
    assert create_resp.status_code == 201
    medicine_id = create_resp.json()["id"]

    check_date = date.today() - timedelta(days=1)
    next_check_date = date.today() + timedelta(days=60)

    record_resp = client.post(
        f"/api/medicines/{medicine_id}/records",
        json={
            "check_date": check_date.isoformat(),
            "quantity_checked": 8,
            "note": "定期盘点",
            "next_check_date": next_check_date.isoformat(),
        },
    )
    assert record_resp.status_code == 201

    medicine_resp = client.get("/api/medicines")
    assert medicine_resp.status_code == 200
    medicines = medicine_resp.json()
    target = next(m for m in medicines if m["id"] == medicine_id)

    assert target["last_check_date"] == check_date.isoformat()
    assert target["next_check_date"] == next_check_date.isoformat()
    assert target["quantity"] == 8


def test_create_record_without_next_check_date_preserves_existing():
    from datetime import timedelta

    existing_next = date.today() + timedelta(days=90)
    create_resp = client.post(
        "/api/medicines",
        json={
            "name": "保留下次检查日药品",
            "specification": "5g",
            "quantity": 3,
            "category": "食品",
            "expiry_date": (date.today() + timedelta(days=180)).isoformat(),
            "next_check_date": existing_next.isoformat(),
        },
    )
    assert create_resp.status_code == 201
    medicine_id = create_resp.json()["id"]

    check_date = date.today()
    record_resp = client.post(
        f"/api/medicines/{medicine_id}/records",
        json={
            "check_date": check_date.isoformat(),
            "quantity_checked": 3,
            "note": "仅更新上次检查日",
        },
    )
    assert record_resp.status_code == 201

    medicine_resp = client.get("/api/medicines")
    medicines = medicine_resp.json()
    target = next(m for m in medicines if m["id"] == medicine_id)

    assert target["last_check_date"] == check_date.isoformat()
    assert target["next_check_date"] == existing_next.isoformat()


def test_create_record_for_nonexistent_medicine():
    response = client.post(
        "/api/medicines/99999/records",
        json={
            "check_date": date.today().isoformat(),
            "quantity_checked": 1,
        },
    )
    assert response.status_code == 404
