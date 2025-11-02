# 个人博客系统 - 后端 API

基于 Node.js + Express + Sequelize + MySQL 构建的 RESTful API 服务。

## 📋 技术栈

- **Node.js** 18+
- **Express** 4.x - Web 框架
- **Sequelize** 6.x - ORM
- **MySQL** 8.0+ - 数据库
- **JWT** - 身份认证
- **Multer** - 文件上传
- **Sharp** - 图片处理
- **bcryptjs** - 密码加密

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

确保 `.env` 文件已正确配置：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=blog
DB_USER=blog
DB_PASSWORD=123456

# JWT 配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
SERVER_URL=http://localhost:3000
```

### 3. 创建数据库

**方式一：使用 SQL 脚本**
```bash
mysql -u root -p < database-setup.sql
```

**方式二：手动创建**
```sql
CREATE DATABASE blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'blog'@'localhost' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON blog.* TO 'blog'@'localhost';
FLUSH PRIVILEGES;
```

### 4. 初始化数据库

```bash
npm run init-db
```

这将自动：
- ✅ 创建所有数据表
- ✅ 创建管理员用户（admin@example.com / admin123）
- ✅ 创建示例分类和标签
- ✅ 创建欢迎文章

### 5. 启动服务器

```bash
# 开发模式（使用 nodemon 自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:3000` 启动。

## 📚 API 文档

### 基础信息

- **Base URL**: `http://localhost:3000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **请求格式**: JSON
- **响应格式**: JSON

### 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### API 端点列表

#### 🔐 认证 (`/api/v1/auth`)

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/register` | 用户注册 |
| POST | `/login` | 用户登录 |
| POST | `/logout` | 用户登出 |

#### 👤 用户 (`/api/v1/users`)

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/profile` | 获取个人信息 | Private |
| PUT | `/profile` | 更新个人信息 | Private |
| PUT | `/password` | 修改密码 | Private |

#### 📝 文章 (`/api/v1/articles`)

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/` | 获取文章列表 | Public |
| GET | `/:id` | 获取文章详情 | Public |
| POST | `/` | 创建文章 | Private |
| PUT | `/:id` | 更新文章 | Private |
| DELETE | `/:id` | 删除文章 | Private |

#### 📂 分类 (`/api/v1/categories`)

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/` | 获取分类列表 | Public |
| GET | `/:id` | 获取分类详情 | Public |
| POST | `/` | 创建分类 | Admin |
| PUT | `/:id` | 更新分类 | Admin |
| DELETE | `/:id` | 删除分类 | Admin |

#### 🏷️ 标签 (`/api/v1/tags`)

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/` | 获取标签列表 | Public |
| GET | `/:id` | 获取标签详情 | Public |
| POST | `/` | 创建标签 | Admin |
| PUT | `/:id` | 更新标签 | Admin |
| DELETE | `/:id` | 删除标签 | Admin |

#### 💬 评论 (`/api/v1`)

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/comments` | 获取所有评论列表（管理后台） | Admin |
| GET | `/articles/:articleId/comments` | 获取文章评论 | Public |
| POST | `/articles/:articleId/comments` | 发表评论 | Public |
| PUT | `/comments/:id` | 更新评论 | Private |
| DELETE | `/comments/:id` | 删除评论 | Private |
| PUT | `/comments/:id/approve` | 审核评论 | Admin |

#### 🖼️ 媒体 (`/api/v1/media`)

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| POST | `/upload` | 上传文件 | Private |
| GET | `/` | 获取媒体列表 | Private |
| GET | `/:id` | 获取媒体详情 | Private |
| PUT | `/:id` | 更新文件信息 | Private |
| DELETE | `/:id` | 删除文件 | Private |
| POST | `/batch-delete` | 批量删除 | Private |

## 🔑 认证示例

### 1. 注册

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "test123"
}
```

### 2. 登录

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

响应：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### 3. 使用 Token

```bash
GET /api/v1/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📁 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   │   └── database.js  # 数据库配置
│   ├── models/          # 数据模型
│   │   ├── index.js     # 模型入口
│   │   ├── User.js      # 用户模型
│   │   ├── Article.js   # 文章模型
│   │   ├── Category.js  # 分类模型
│   │   ├── Tag.js       # 标签模型
│   │   ├── Comment.js   # 评论模型
│   │   └── Media.js     # 媒体模型
│   ├── controllers/     # 控制器
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── articleController.js
│   │   ├── categoryController.js
│   │   ├── tagController.js
│   │   ├── commentController.js
│   │   └── mediaController.js
│   ├── routes/          # 路由
│   │   ├── index.js     # 路由入口
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── articles.js
│   │   ├── categories.js
│   │   ├── tags.js
│   │   ├── comments.js
│   │   └── media.js
│   ├── middlewares/     # 中间件
│   │   ├── auth.js      # 认证中间件
│   │   ├── upload.js    # 上传中间件
│   │   ├── validator.js # 验证中间件
│   │   └── errorHandler.js # 错误处理
│   └── utils/           # 工具函数
│       ├── response.js  # 响应工具
│       ├── pagination.js # 分页工具
│       ├── fileHelper.js # 文件工具
│       └── initDatabase.js # 数据库初始化
├── uploads/             # 上传文件目录
├── .env                 # 环境变量
├── package.json         # 项目配置
├── server.js            # 服务器入口
└── README.md            # 项目文档
```

## 🛠️ 开发指南

### 可用脚本

```bash
# 安装依赖
npm install

# 开发模式（自动重启）
npm run dev

# 生产模式
npm start

# 初始化数据库
npm run init-db
```

### 添加新功能

1. 在 `models/` 中创建模型
2. 在 `controllers/` 中创建控制器
3. 在 `routes/` 中创建路由
4. 在 `routes/index.js` 中注册路由

### 数据验证

使用 `express-validator` 进行数据验证，验证规则定义在 `middlewares/validator.js`。

### 错误处理

所有控制器方法使用 `asyncHandler` 包装，错误会被统一捕获和处理。

## 🔒 安全性

- ✅ 密码使用 bcrypt 加密存储
- ✅ JWT Token 认证
- ✅ SQL 注入防护（Sequelize ORM）
- ✅ XSS 防护
- ✅ CORS 配置
- ✅ 文件上传类型和大小限制
- ✅ 请求频率限制（可扩展）

## 📝 注意事项

1. **修改默认密码**：生产环境请立即修改管理员密码
2. **JWT Secret**：请修改 `.env` 中的 `JWT_SECRET` 为强密码
3. **CORS 配置**：生产环境请配置正确的前端域名
4. **文件上传**：默认限制 5MB，可在 `.env` 中调整
5. **数据库备份**：定期备份数据库

## 🐛 调试

开发环境下，所有 SQL 查询和请求日志会输出到控制台。

## 📄 许可证

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！
