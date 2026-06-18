"""采购计划路由。"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import PurchasePlan
from schemas import (
    PurchasePlanCreate,
    PurchasePlanResponse,
)

router = APIRouter(prefix="/api", tags=["purchase-plans"])


@router.get("/purchase-plans", response_model=list[PurchasePlanResponse])
def list_purchase_plans(db: Session = Depends(get_db)) -> list[PurchasePlanResponse]:
    """获取全部采购计划，未完成排最前，按计划采购日期升序。"""
    plans = (
        db.query(PurchasePlan)
        .order_by(PurchasePlan.is_completed.asc(), PurchasePlan.planned_purchase_date.asc())
        .all()
    )
    return plans


@router.post("/purchase-plans", response_model=PurchasePlanResponse, status_code=201)
def create_purchase_plan(
    payload: PurchasePlanCreate, db: Session = Depends(get_db)
) -> PurchasePlanResponse:
    """新增采购计划。"""
    plan = PurchasePlan(**payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.put("/purchase-plans/{plan_id}/complete", response_model=PurchasePlanResponse)
def mark_purchase_plan_completed(
    plan_id: int, db: Session = Depends(get_db)
) -> PurchasePlanResponse:
    """标记采购计划为已完成。"""
    plan = db.query(PurchasePlan).filter(PurchasePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="采购计划不存在")
    plan.is_completed = True
    db.commit()
    db.refresh(plan)
    return plan
