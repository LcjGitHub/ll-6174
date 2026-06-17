# 家庭应急包清单

React + Ant Design 前端，FastAPI + SQLite 后端。

## 功能（MVP）

- 物品表格：名称、数量、保质期、上次/下次检查日
- 状态 Tag 高亮：**已过期**、**待检查**
- 检查记录表单：选中物品后提交检查，自动更新上次/下次检查日
- 启动时自动 seed **8 条**示例数据

## 启动

### 后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

数据库文件：`./data/emergency.db`

### 前端

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/items` | 物品列表（含 status_tags） |
| POST | `/api/items/{id}/checks` | 新增检查记录 |
| GET | `/api/items/{id}/checks` | 检查记录列表 |
