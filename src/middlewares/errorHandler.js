/**
 * 统一错误处理中间件
 */

/**
 * 404 Not Found 处理
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    code: 404,
    message: `未找到请求的资源: ${req.method} ${req.originalUrl}`,
    data: null
  });
};

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  console.error('错误详情:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Sequelize 数据库错误
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    
    return res.status(400).json({
      code: 400,
      message: '数据验证失败',
      data: errors
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return res.status(400).json({
      code: 400,
      message: `${field} 已存在`,
      data: null
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      code: 400,
      message: '关联的资源不存在',
      data: null
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      code: 500,
      message: '数据库操作失败',
      data: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: '无效的认证令牌',
      data: null
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: '认证令牌已过期',
      data: null
    });
  }

  // Multer 文件上传错误
  if (err.name === 'MulterError') {
    let message = '文件上传失败';
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = '文件大小超过限制';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = '文件数量超过限制';
    }
    
    return res.status(400).json({
      code: 400,
      message,
      data: null
    });
  }

  // 自定义错误（带有 statusCode 属性）
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message,
      data: err.data || null
    });
  }

  // 语法错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      code: 400,
      message: '请求体格式错误，请检查 JSON 格式',
      data: null
    });
  }

  // 默认服务器错误
  const statusCode = err.status || 500;
  const message = err.message || '服务器内部错误';
  
  res.status(statusCode).json({
    code: statusCode,
    message,
    data: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      error: err.toString()
    } : null
  });
};

/**
 * 异步路由错误捕获包装器
 * 用于捕获 async/await 路由中的错误
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 创建自定义错误
 */
class AppError extends Error {
  constructor(message, statusCode = 500, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler,
  AppError
};
