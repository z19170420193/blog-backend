const express = require('express');
const router = express.Router();

// 导入所有路由模块
const authRoutes = require('./auth');
const userRoutes = require('./users');
const articleRoutes = require('./articles');
const categoryRoutes = require('./categories');
const tagRoutes = require('./tags');
const commentRoutes = require('./comments');
const mediaRoutes = require('./media');
const momentRoutes = require('./moments');
const projectRoutes = require('./projects');

/**
 * API 路由配置
 * 基础路径: /api/v1
 */

// 认证相关路由
router.use('/auth', authRoutes);

// 用户相关路由
router.use('/users', userRoutes);

// 文章相关路由
router.use('/articles', articleRoutes);

// 分类相关路由
router.use('/categories', categoryRoutes);

// 标签相关路由
router.use('/tags', tagRoutes);

// 评论相关路由
// 挂载到 /comments 用于管理后台独立访问
router.use('/comments', commentRoutes);
// 挂载到根路径用于嵌套路由 /articles/:articleId/comments
router.use('/', commentRoutes);

// 媒体文件相关路由
router.use('/media', mediaRoutes);

// 说说相关路由
router.use('/moments', momentRoutes);

// 项目相关路由
router.use('/projects', projectRoutes);

// API 根路径 - 健康检查
router.get('/', (req, res) => {
  res.json({
    code: 200,
    message: 'Blog API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      articles: '/api/v1/articles',
      categories: '/api/v1/categories',
      tags: '/api/v1/tags',
      comments: '/api/v1/comments',
      media: '/api/v1/media',
      moments: '/api/v1/moments',
      projects: '/api/v1/projects'
    }
  });
});

module.exports = router;
