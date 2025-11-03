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
| POST | `/batch-delete` | **批量删除文章** | Private |
| POST | `/batch-update-status` | **批量更新状态** | Private |
| POST | `/batch-update-top` | **批量置顶/取消置顶** | Admin |

#### 📂 分类 (`/api/v1/categories`)

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/` | 获取分类列表 | Public |
| GET | `/:id` | 获取分类详情 | Public |
| POST | `/` | 创建分类 | Admin |
| PUT | `/:id` | 更新分类 | Admin |
| DELETE | `/:id` | 删除分类 | Admin |
| POST | `/batch-delete` | **批量删除分类** | Admin |
| POST | `/batch-update-order` | **批量更新排序** | Admin |
| POST | `/batch-merge` | **批量合并分类** | Admin |

#### 🏷️ 标签 (`/api/v1/tags`)

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/` | 获取标签列表 | Public |
| GET | `/:id` | 获取标签详情 | Public |
| POST | `/` | 创建标签 | Admin |
| PUT | `/:id` | 更新标签 | Admin |
| DELETE | `/:id` | 删除标签 | Admin |
| POST | `/batch-delete` | **批量删除标签** | Admin |
| POST | `/batch-merge` | **批量合并标签** | Admin |
| POST | `/batch-update-color` | **批量更新颜色** | Admin |

#### 💬 评论 (`/api/v1`)

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/comments` | 获取所有评论列表（管理后台） | Admin |
| GET | `/articles/:articleId/comments` | 获取文章评论 | Public |
| POST | `/articles/:articleId/comments` | 发表评论 | Public |
| PUT | `/comments/:id` | 更新评论 | Private |
| DELETE | `/comments/:id` | 删除评论 | Private |
| PUT | `/comments/:id/approve` | 审核评论 | Admin |
| POST | `/comments/batch/delete` | **批量删除评论** | Admin |
| POST | `/comments/batch/approve` | **批量审核评论** | Admin |

#### 🖼️ 媒体 (`/api/v1/media`)

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| POST | `/upload` | 上传文件 | Private |
| GET | `/` | 获取媒体列表 | Private |
| GET | `/:id` | 获取媒体详情 | Private |
| PUT | `/:id` | 更新文件信息 | Private |
| DELETE | `/:id` | 删除文件 | Private |
| POST | `/batch-delete` | 批量删除 | Private |

#### 💬 说说 (`/api/v1/moments`) 🆕

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|
| GET | `/` | 获取说说列表 | Public |
| GET | `/:id` | 获取说说详情 | Public |
| POST | `/` | 发布说说 | Private |
| PUT | `/:id` | 更新说说 | Private |
| DELETE | `/:id` | 删除说说 | Private |
| PUT | `/:id/pin` | **置顶/取消置顶** | Private |
| POST | `/batch-delete` | **批量删除说说** | Private |

#### 💻 项目 (`/api/v1/projects`) 🆕

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|
| GET | `/` | 获取项目列表 | Public |
| GET | `/featured` | 获取精选项目 | Public |
| GET | `/:id` | 获取项目详情 | Public |
| POST | `/` | 创建项目 | Private |
| PUT | `/:id` | 更新项目 | Private |
| DELETE | `/:id` | 删除项目 | Private |
| POST | `/:id/view` | **增加浏览量** | Public |
| POST | `/batch-delete` | **批量删除项目** | Private |

#### 💬 留言 (`/api/v1/messages`) 🆕

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|
| GET | `/` | 获取已审核留言列表 | Public |
| GET | `/admin` | 获取所有留言（管理后台） | Admin |
| POST | `/` | 发布留言 | Public |
| PUT | `/:id` | 更新留言 | Private |
| DELETE | `/:id` | 删除留言 | Private |
| PUT | `/:id/status` | **更新审核状态** | Admin |
| POST | `/:id/like` | **点赞留言** | Public |
| POST | `/batch-delete` | **批量删除留言** | Admin |
| POST | `/batch-approve` | **批量审核留言** | Admin |
| GET | `/stats` | **获取留言统计** | Admin |

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

## 🔄 批量操作示例

### 批量删除文章

```bash
POST /api/v1/articles/batch-delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [1, 2, 3, 4, 5]
}
```

响应：
```json
{
  "code": 200,
  "message": "成功删除 5 篇文章",
  "data": {
    "deleted_count": 5,
    "total_count": 5,
    "errors": null
  }
}
```

### 批量更新文章状态

```bash
POST /api/v1/articles/batch-update-status
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [1, 2, 3],
  "status": "published"  // 或 "draft"
}
```

响应：
```json
{
  "code": 200,
  "message": "成功更新 3 篇文章状态",
  "data": {
    "affected_count": 3,
    "total_count": 3,
    "errors": null
  }
}
```

### 批量置顶文章

```bash
POST /api/v1/articles/batch-update-top
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [1, 2],
  "is_top": true  // 或 false
}
```

响应：
```json
{
  "code": 200,
  "message": "成功置顶 2 篇文章",
  "data": {
    "affected_count": 2,
    "total_count": 2,
    "errors": null
  }
}
```

**注意**：
- 批量操作会自动进行权限检查
- 如果某些文章无权操作，会在 `errors` 字段返回详细信息
- 批量置顶仅管理员可用

### 批量删除分类

```bash
POST /api/v1/categories/batch-delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [1, 2, 3]
}
```

响应：
```json
{
  "code": 200,
  "message": "成功删除 2 个分类",
  "data": {
    "deleted_count": 2,
    "total_count": 3,
    "errors": [
      "分类 \"技术文章\": 下还有 15 篇文章，无法删除"
    ]
  }
}
```

### 批量更新分类排序

```bash
POST /api/v1/categories/batch-update-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "orders": [
    { "id": 1, "sort_order": 10 },
    { "id": 2, "sort_order": 20 },
    { "id": 3, "sort_order": 30 }
  ]
}
```

响应：
```json
{
  "code": 200,
  "message": "成功更新 3 个分类的排序",
  "data": {
    "updated_count": 3,
    "categories": [...]
  }
}
```

### 批量合并分类

```bash
POST /api/v1/categories/batch-merge
Authorization: Bearer <token>
Content-Type: application/json

{
  "source_ids": [2, 3],
  "target_id": 1
}
```

响应：
```json
{
  "code": 200,
  "message": "成功合并 2 个分类，迁移了 25 篇文章",
  "data": {
    "merged_categories": 2,
    "migrated_articles": 25,
    "target_category": {
      "id": 1,
      "name": "技术",
      "article_count": 45
    }
  }
}
```

**分类批量操作说明**：
- 批量删除：自动检查分类下是否有文章，有文章的分类会被跳过
- 批量排序：适用于拖拽排序后一次性提交
- 批量合并：将多个源分类的文章迁移到目标分类，然后删除源分类
- 所有批量操作均使用数据库事务，保证数据一致性

### 批量删除标签

```bash
POST /api/v1/tags/batch-delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "tagIds": [1, 2, 3]
}
```

响应：
```json
{
  "code": 200,
  "message": "成功删除 2 个标签",
  "data": {
    "successCount": 2,
    "totalCount": 3,
    "failures": [
      { "tagId": 1, "tagName": "Vue", "reason": "标签不存在" }
    ]
  }
}
```

### 批量合并标签

```bash
POST /api/v1/tags/batch-merge
Authorization: Bearer <token>
Content-Type: application/json

{
  "sourceTagIds": [2, 3],
  "targetTagId": 1
}
```

响应：
```json
{
  "code": 200,
  "message": "成功合并 2 个标签，迁移了 15 篇文章",
  "data": {
    "mergedCount": 2,
    "migratedArticles": 15,
    "targetTag": {
      "id": 1,
      "name": "Vue.js",
      "article_count": 25
    }
  }
}
```

### 批量更新标签颜色

```bash
POST /api/v1/tags/batch-update-color
Authorization: Bearer <token>
Content-Type: application/json

{
  "tagIds": [1, 2, 3],
  "color": "#409eff"
}
```

响应：
```json
{
  "code": 200,
  "message": "成功更新 3 个标签的颜色",
  "data": {
    "affectedCount": 3,
    "tags": [
      { "id": 1, "name": "Vue", "color": "#409eff" },
      { "id": 2, "name": "React", "color": "#409eff" },
      { "id": 3, "name": "Angular", "color": "#409eff" }
    ]
  }
}
```

**标签批量操作说明**：
- 批量删除：自动解除标签与文章的关联关系
- 批量合并：将多个源标签的文章关联迁移到目标标签，自动处理重复关联
- 批量更新颜色：为多个标签设置相同颜色，适用于分类标记
- 所有批量操作均使用数据库事务，保证数据一致性

### 批量删除评论

```bash
POST /api/v1/comments/batch/delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "commentIds": [1, 2, 3, 4, 5]
}
```

响应：
```json
{
  "code": 200,
  "message": "成功删除 4 条评论",
  "data": {
    "successCount": 4,
    "totalCount": 5,
    "failures": [
      {
        "commentId": 2,
        "reason": "评论不存在"
      }
    ]
  }
}
```

### 批量审核评论

```bash
POST /api/v1/comments/batch/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "commentIds": [1, 2, 3],
  "isApproved": true  // 或 false 取消审核
}
```

响应：
```json
{
  "code": 200,
  "message": "成功审核 3 条评论",
  "data": {
    "affectedCount": 3,
    "comments": [
      {
        "id": 1,
        "content": "评论内容 1",
        "is_approved": true
      },
      {
        "id": 2,
        "content": "评论内容 2",
        "is_approved": true
      },
      {
        "id": 3,
        "content": "评论内容 3",
        "is_approved": true
      }
    ]
  }
}
```

**评论批量操作说明**：
- 批量删除：支持部分成功，返回详细失败信息
- 批量审核：支持审核通过或取消审核，返回更新后的评论列表
- 所有批量操作均使用数据库事务，保证数据一致性
- 仅管理员可执行评论批量操作

### 发布说说 🆕

```bash
POST /api/v1/moments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "今天天气真好！",
  "images": ["url1", "url2", "url3"],  // 最多9张
  "location": "北京市朝阳区",
  "visibility": "public"  // public | private | friends
}
```

响应：
```json
{
  "code": 201,
  "message": "发布成功",
  "data": {
    "id": 1,
    "content": "今天天气真好！",
    "images": ["url1", "url2", "url3"],
    "location": "北京市朝阳区",
    "visibility": "public",
    "is_pinned": false,
    "user": {
      "id": 1,
      "username": "admin",
      "avatar": "..."
    },
    "published_at": "2025-11-02T14:30:00Z",
    "created_at": "2025-11-02T14:30:00Z"
  }
}
```

### 获取说说列表

```bash
GET /api/v1/moments?page=1&limit=10&user_id=1
```

响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "moments": [
      {
        "id": 1,
        "content": "今天天气真好！",
        "images": ["url1", "url2"],
        "location": "北京市",
        "visibility": "public",
        "is_pinned": false,
        "user": {
          "id": 1,
          "username": "admin",
          "avatar": "..."
        },
        "published_at": "2025-11-02T14:30:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### 批量删除说说

```bash
POST /api/v1/moments/batch-delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [1, 2, 3, 4, 5]
}
```

响应：
```json
{
  "code": 200,
  "message": "成功删除 5 条说说",
  "data": {
    "deleted_count": 5,
    "total_count": 5,
    "errors": null
  }
}
```

**说说模块特性**：
- ✅ 支持图片上传（最多9张）
- ✅ 可见性控制（公开/私密/好友）
- ✅ 位置信息可选
- ✅ 置顶功能
- ✅ 批量删除
- ✅ 权限控制（作者/管理员）
- ✅ 完整的数据验证

### 创建项目 🆕

```bash
POST /api/v1/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "个人博客系统",
  "subtitle": "基于 Vue3 + Node.js 的全栈项目",
  "description": "一个功能完善的个人博客系统，包括文章管理、评论系统、说说功能、项目展示等模块。",
  "content": "## 项目介绍\n\n...",
  "cover_image": "https://example.com/cover.jpg",
  "project_type": "fullstack",
  "category": "个人项目",
  "tags": ["Vue3", "Node.js", "全栈"],
  "tech_stack": ["Vue3", "TypeScript", "Express", "MySQL", "Element Plus"],
  "demo_url": "https://demo.example.com",
  "github_url": "https://github.com/user/blog",
  "documentation_url": "https://docs.example.com",
  "status": "completed",
  "start_date": "2024-01-01",
  "end_date": "2024-03-01",
  "team_size": 1,
  "images": [
    "https://example.com/screenshot1.jpg",
    "https://example.com/screenshot2.jpg"
  ],
  "is_featured": true,
  "is_open_source": true
}
```

响应：
```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": 1,
    "title": "个人博客系统",
    "subtitle": "基于 Vue3 + Node.js 的全栈项目",
    "project_type": "fullstack",
    "status": "completed",
    "is_featured": true,
    "is_open_source": true,
    "view_count": 0,
    "author": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com"
    },
    "created_at": "2025-11-03T02:30:00Z",
    "updated_at": "2025-11-03T02:30:00Z"
  }
}
```

### 获取项目列表

```bash
GET /api/v1/projects?page=1&limit=10&project_type=fullstack&status=completed&is_featured=true
```

响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "projects": [
      {
        "id": 1,
        "title": "个人博客系统",
        "subtitle": "基于 Vue3 + Node.js 的全栈项目",
        "description": "...",
        "cover_image": "https://example.com/cover.jpg",
        "project_type": "fullstack",
        "tech_stack": ["Vue3", "TypeScript", "Express"],
        "status": "completed",
        "is_featured": true,
        "is_open_source": true,
        "view_count": 150,
        "start_date": "2024-01-01",
        "end_date": "2024-03-01",
        "duration": 60,
        "team_size": 1,
        "author": {
          "id": 1,
          "username": "admin"
        },
        "created_at": "2025-11-03T02:30:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 10
  }
}
```

### 批量删除项目

```bash
POST /api/v1/projects/batch-delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [1, 2, 3]
}
```

响应：
```json
{
  "code": 200,
  "message": "成功删除 3 个项目",
  "data": {
    "deleted_count": 3,
    "total_count": 3,
    "errors": null
  }
}
```

**项目模块特性**：
- ✅ 完整的 CRUD 操作
- ✅ 项目类型（Web/移动/桌面/后端/全栈/其他）
- ✅ 项目状态（已完成/进行中/已归档/草稿）
- ✅ 精选项目标记
- ✅ 开源项目标记
- ✅ 技术栈管理
- ✅ 项目截图（多图）
- ✅ 多维度筛选（类型/状态/精选/开源）
- ✅ 项目链接（演示/GitHub/文档/视频）
- ✅ 浏览量统计
- ✅ 开发周期计算
- ✅ 批量删除
- ✅ 权限控制（作者/管理员）
- ✅ Markdown 详细介绍

### 发布留言 🆕

```bash
POST /api/v1/messages
Content-Type: application/json

{
  "nickname": "访客",           // 昵称（游客必填）
  "email": "guest@example.com",  // 邮箱（游客必填）
  "content": "这是一条留言！",    // 留言内容（必填，最多 500 字）
  "mood": "happy",               // 心情：happy | sad | angry | excited | thinking
  "reply_to_id": 1               // 回复的留言 ID（可选）
}
```

响应：
```json
{
  "code": 201,
  "message": "留言发布成功，等待审核",
  "data": {
    "id": 1,
    "nickname": "访客",
    "email": "guest@example.com",
    "content": "这是一条留言！",
    "mood": "happy",
    "avatar": null,
    "status": "pending",
    "color": "#FFE4E1",
    "likes": 0,
    "ip": "127.0.0.1",
    "location": null,
    "browser": "Chrome",
    "reply_to_id": null,
    "user_id": null,
    "user": null,
    "replies": [],
    "created_at": "2025-11-03T10:30:00Z"
  }
}
```

### 获取留言列表（公开）

```bash
GET /api/v1/messages?page=1&limit=10&mood=happy
```

响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "messages": [
      {
        "id": 1,
        "nickname": "访客",
        "content": "这是一条留言！",
        "mood": "happy",
        "avatar": null,
        "status": "approved",
        "color": "#FFE4E1",
        "likes": 5,
        "location": "北京市",
        "browser": "Chrome",
        "reply_to_id": null,
        "user": null,
        "replies": [
          {
            "id": 2,
            "nickname": "管理员",
            "content": "感谢留言！",
            "created_at": "2025-11-03T11:00:00Z"
          }
        ],
        "created_at": "2025-11-03T10:30:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### 获取留言列表（管理后台）

```bash
GET /api/v1/messages/admin?page=1&limit=10&status=pending&keyword=留言
Authorization: Bearer <token>
```

响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "messages": [...],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

### 更新留言审核状态

```bash
PUT /api/v1/messages/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved"  // approved | rejected | pending
}
```

响应：
```json
{
  "code": 200,
  "message": "留言已审核通过",
  "data": {
    "id": 1,
    "status": "approved",
    "updated_at": "2025-11-03T11:00:00Z"
  }
}
```

### 点赞留言

```bash
POST /api/v1/messages/:id/like
```

响应：
```json
{
  "code": 200,
  "message": "点赞成功",
  "data": {
    "id": 1,
    "likes": 6
  }
}
```

### 批量删除留言

```bash
POST /api/v1/messages/batch-delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [1, 2, 3, 4, 5]
}
```

响应：
```json
{
  "code": 200,
  "message": "成功删除 5 条留言",
  "data": {
    "deleted_count": 5,
    "total_count": 5,
    "errors": null
  }
}
```

### 批量审核留言

```bash
POST /api/v1/messages/batch-approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [1, 2, 3],
  "status": "approved"  // approved | rejected
}
```

响应：
```json
{
  "code": 200,
  "message": "成功审核 3 条留言",
  "data": {
    "affected_count": 3,
    "total_count": 3,
    "errors": null
  }
}
```

### 获取留言统计

```bash
GET /api/v1/messages/stats
Authorization: Bearer <token>
```

响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 150,
    "approved": 120,
    "pending": 25,
    "rejected": 5,
    "today": 10
  }
}
```

**留言模块特性**：
- ✅ 游客和登录用户均可留言
- ✅ 游客留言需要审核（pending），登录用户自动通过（approved）
- ✅ 支持回复功能（reply_to_id）
- ✅ 五种心情选择（happy/sad/angry/excited/thinking）
- ✅ 随机卡片背景颜色（10 种配色）
- ✅ 点赞功能（无限制）
- ✅ 记录 IP、位置、浏览器信息
- ✅ 三种审核状态（pending/approved/rejected）
- ✅ 批量删除和批量审核
- ✅ 统计数据（总数/已审核/待审核/已拒绝/今日新增）
- ✅ 多维度筛选（状态/心情/关键词）
- ✅ 权限控制（作者/管理员）
- ✅ 完整的数据验证

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
│   │   ├── Media.js     # 媒体模型
│   │   ├── Moment.js    # 说说模型 🆕
│   │   ├── Project.js   # 项目模型 🆕
│   │   └── Message.js   # 留言模型 🆕
│   ├── controllers/     # 控制器
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── articleController.js
│   │   ├── categoryController.js
│   │   ├── tagController.js
│   │   ├── commentController.js
│   │   ├── mediaController.js
│   │   ├── momentController.js  # 说说控制器 🆕
│   │   ├── projectController.js  # 项目控制器 🆕
│   │   └── messageController.js  # 留言控制器 🆕
│   ├── routes/          # 路由
│   │   ├── index.js     # 路由入口
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── articles.js
│   │   ├── categories.js
│   │   ├── tags.js
│   │   ├── comments.js
│   │   ├── media.js
│   │   ├── moments.js       # 说说路由 🆕
│   │   ├── projects.js      # 项目路由 🆕
│   │   └── messages.js      # 留言路由 🆕
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
