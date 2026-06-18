"""SQLite 数据库连接与初始化。"""

from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_URL = f"sqlite:///{DATA_DIR / '药品库.db'}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


_SEED_CATEGORY_MAP = {
    "布洛芬缓释胶囊": "医疗",
    "阿莫西林胶囊": "医疗",
    "感冒灵颗粒": "医疗",
    "碘伏消毒液": "医疗",
    "创可贴": "工具",
    "健胃消食片": "食品",
    "氯雷他定片": "医疗",
    "维生素C片": "其他",
}


def migrate_medicines_category_column() -> None:
    """为已有数据库的 medicines 表添加 category 列，并按名称回填示例数据的分类。"""
    inspector = inspect(engine)
    if "medicines" not in inspector.get_table_names():
        return
    columns = [col["name"] for col in inspector.get_columns("medicines")]
    with engine.connect() as conn:
        if "category" not in columns:
            conn.execute(
                text("ALTER TABLE medicines ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT '其他'")
            )
            conn.commit()
        for name, category in _SEED_CATEGORY_MAP.items():
            conn.execute(
                text("UPDATE medicines SET category = :category WHERE name = :name AND category = '其他'"),
                {"category": category, "name": name},
            )
        conn.commit()


def get_db():
    """FastAPI 依赖：提供数据库会话。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
