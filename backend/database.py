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


def migrate_medicines_category_column() -> None:
    """为已有数据库的 medicines 表添加 category 列（若不存在）。"""
    inspector = inspect(engine)
    if "medicines" not in inspector.get_table_names():
        return
    columns = [col["name"] for col in inspector.get_columns("medicines")]
    if "category" not in columns:
        with engine.connect() as conn:
            conn.execute(
                text("ALTER TABLE medicines ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT '其他'")
            )
            conn.commit()


def get_db():
    """FastAPI 依赖：提供数据库会话。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
