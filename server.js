/**
 * 个人博客系统 - 服务器入口文件
 * Express + Sequelize + MySQL
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { testConnection } = require('./src/config/database');
const routes = require('./src/routes');
const { notFoundHandler, errorHandler } = require('./src/middlewares/errorHandler');

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * 中间件配置
 */

// CORS 跨域配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : '*',
  credentials: true
}));

// Body 解析中间件
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务（用于访问上传的媒体文件）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 请求日志（开发环境）
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

/**
 * API 路由
 */
app.use('/api/v1', routes);

/**
 * 根路径
 */
app.get('/', (req, res) => {
  res.json({
    message: '欢迎使用个人博客系统 API',
    version: '1.0.0',
    documentation: '/api/v1',
    status: 'running'
  });
});

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * 错误处理中间件（必须放在最后）
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * 启动服务器
 */
const startServer = async () => {
  try {
    // 测试数据库连接
    console.log('🔌 正在连接数据库...');
    await testConnection();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log('\n✨ 服务器启动成功！');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 服务器地址: http://localhost:${PORT}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API 文档: http://localhost:${PORT}/api/v1`);
      console.log(`💚 健康检查: http://localhost:${PORT}/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error.message);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n⚠️  收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

// 启动服务器
startServer();

module.exports = app;
