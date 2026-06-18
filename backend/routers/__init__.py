"""路由模块。"""

from routers.contacts import router as contacts_router
from routers.drills import router as drills_router
from routers.locations import router as locations_router
from routers.medicines import router as medicines_router
from routers.purchase_plans import router as purchase_plans_router

__all__ = [
    "contacts_router",
    "drills_router",
    "locations_router",
    "medicines_router",
    "purchase_plans_router",
]
