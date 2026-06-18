"""家庭药品台账 API。"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import migrate_medicines_category_column
from routers import (
    contacts_router,
    drills_router,
    locations_router,
    medicines_router,
    purchase_plans_router,
)
from seed import (
    seed_emergency_contacts,
    seed_emergency_drills,
    seed_medicines,
    seed_purchase_plans,
    seed_storage_locations,
)

app = FastAPI(title="家庭药品台账", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """启动时迁移、建表并 seed。"""
    migrate_medicines_category_column()
    seed_medicines()
    seed_emergency_contacts()
    seed_emergency_drills()
    seed_storage_locations()
    seed_purchase_plans()


app.include_router(medicines_router)
app.include_router(contacts_router)
app.include_router(drills_router)
app.include_router(locations_router)
app.include_router(purchase_plans_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    """健康检查。"""
    return {"status": "ok"}
