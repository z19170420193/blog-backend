const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/response');
const { User } = require('../models');

/**
 * JWT 认证中间件
 * 验证请求头中的 token，并将用户信息附加到 req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // 从请求头获取 token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, '未提供认证令牌');
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查询用户信息
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return ApiResponse.unauthorized(res, '用户不存在');
    }

    // 将用户信息附加到请求对象
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, '无效的认证令牌');
    }
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, '认证令牌已过期');
    }
    return ApiResponse.serverError(res, '认证失败');
  }
};

/**
 * 可选认证中间件
 * 如果提供了 token 则验证，否则继续执行（不抛出错误）
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    req.user = user || null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * 角色权限验证中间件
 * @param {Array} allowedRoles - 允许的角色列表，如 ['admin']
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, '未登录');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, '没有权限执行此操作');
    }

    next();
  };
};

/**
 * 检查是否是资源所有者或管理员
 * @param {String} resourceUserIdField - 资源中用户ID字段名，默认 'author_id'
 */
const checkOwnership = (resourceUserIdField = 'author_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, '未登录');
    }

    // 管理员直接通过
    if (req.user.role === 'admin') {
      return next();
    }

    // 检查是否是资源所有者
    const resourceUserId = req.resource?.[resourceUserIdField];
    
    if (!resourceUserId) {
      return ApiResponse.badRequest(res, '无法验证资源所有权');
    }

    if (req.user.id !== resourceUserId) {
      return ApiResponse.forbidden(res, '只能操作自己的资源');
    }

    next();
  };
};

/**
 * 生成 JWT Token
 * @param {Object} user - 用户对象
 * @returns {String} - JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  checkOwnership,
  generateToken
};
