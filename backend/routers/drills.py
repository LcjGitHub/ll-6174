"""应急演练路由。"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import EmergencyDrill
from schemas import (
    EmergencyDrillCreate,
    EmergencyDrillResponse,
)

router = APIRouter(prefix="/api", tags=["drills"])


@router.get("/drills", response_model=list[EmergencyDrillResponse])
def list_drills(db: Session = Depends(get_db)) -> list[EmergencyDrillResponse]:
    """获取全部应急演练记录，按日期倒序排列。"""
    drills = db.query(EmergencyDrill).order_by(EmergencyDrill.drill_date.desc()).all()
    return drills


@router.post("/drills", response_model=EmergencyDrillResponse, status_code=201)
def create_drill(
    payload: EmergencyDrillCreate, db: Session = Depends(get_db)
) -> EmergencyDrillResponse:
    """新增应急演练记录。"""
    drill = EmergencyDrill(**payload.model_dump())
    db.add(drill)
    db.commit()
    db.refresh(drill)
    return drill
