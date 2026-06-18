# 家庭应急包清单

React + Ant Design 前端，FastAPI + SQLite 后端。

## 功能

- 物品表格：名称、数量、保质期、上次/下次检查日
- 状态 Tag 高亮：**已过期**、**待检查**
- 检查记录表单：选中物品后提交检查，自动更新上次/下次检查日
- 启动时自动 seed 示例数据
- 紧急联系人、应急演练记录、物品存放位置、采购计划管理

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Ant Design 5 + Vite 6 |
| 后端 | FastAPI + SQLAlchemy 2 + Pydantic v2 |
| 数据库 | SQLite |
| CI | GitHub Actions |

## 一键启动（推荐）

### Windows

在项目根目录打开 PowerShell，按顺序执行：

```powershell
# 1. 启动后端（新开一个终端窗口）
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. 启动前端（另开一个终端窗口）
cd frontend
copy .env.example .env
npm install
npm run dev
```

浏览器打开 http://localhost:5173

### macOS / Linux

在项目根目录打开终端，按顺序执行：

```bash
# 1. 启动后端（新开一个终端窗口）
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. 启动前端（另开一个终端窗口）
cd frontend
cp .env.example .env
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 分步启动

### 后端

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

后端运行地址：http://127.0.0.1:8000
API 文档：http://127.0.0.1:8000/docs
数据库文件：`./data/药品库.db`

### 前端

```bash
cd frontend

# 配置环境变量（可选，默认代理 8000 端口）
# Windows
copy .env.example .env
# macOS / Linux
# cp .env.example .env

npm install
npm run dev
```

浏览器打开 http://localhost:5173

#### 前端环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_PROXY_TARGET` | 开发服务器接口代理目标地址 | `http://127.0.0.1:8000` |

如需修改后端端口，请同步修改前端 `.env` 文件中的 `VITE_API_PROXY_TARGET`。

## 后端单元测试

```bash
cd backend
pip install -r requirements.txt
pytest test_main.py -v
```

## 前端生产构建

```bash
cd frontend
npm install
npm run build
```

构建产物位于 `frontend/dist` 目录。

## 持续集成（CI）

项目已配置 GitHub Actions 工作流，在代码推送或发起 Pull Request 时自动执行：

1. 安装后端依赖（Python 3.11）
2. 执行后端单元测试
3. 安装前端依赖（Node.js 20）
4. 构建前端生产包

配置文件：`.github/workflows/ci.yml`

## 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/medicines` | 药品列表（支持按分类筛选） |
| POST | `/api/medicines` | 新增药品 |
| PUT | `/api/medicines/{id}` | 更新药品 |
| DELETE | `/api/medicines/{id}` | 删除药品 |
| GET | `/api/medicines/{id}/records` | 药品盘点记录列表 |
| POST | `/api/medicines/{id}/records` | 提交盘点记录 |
| GET | `/api/records` | 全部盘点记录 |
| GET | `/api/contacts` | 紧急联系人列表 |
| GET | `/api/drills` | 应急演练记录列表 |
| GET | `/api/locations` | 存放位置列表 |
| GET | `/api/purchase-plans` | 采购计划列表 |
