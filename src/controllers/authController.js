const { User } = require('../models');
const { generateToken } = require('../middlewares/auth');
const ApiResponse = require('../utils/response');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * 用户注册
 * POST /api/v1/auth/register
 */
exports.register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // 检查用户名是否已存在
  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    return ApiResponse.badRequest(res, '用户名已被使用');
  }

  // 检查邮箱是否已存在
  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    return ApiResponse.badRequest(res, '邮箱已被注册');
  }

  // 创建用户
  const user = await User.create({
    username,
    email,
    password, // 密码会在模型的 hook 中自动加密
    role: 'user'
  });

  // 生成 token
  const token = generateToken(user);

  return ApiResponse.created(res, {
    token,
    user: user.toSafeJSON()
  }, '注册成功');
});

/**
 * 用户登录
 * POST /api/v1/auth/login
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 查找用户
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return ApiResponse.unauthorized(res, '邮箱或密码错误');
  }

  // 验证密码
  const isValidPassword = await user.validatePassword(password);
  if (!isValidPassword) {
    return ApiResponse.unauthorized(res, '邮箱或密码错误');
  }

  // 生成 token
  const token = generateToken(user);

  return ApiResponse.success(res, {
    token,
    user: user.toSafeJSON()
  }, '登录成功');
});

/**
 * 用户登出
 * POST /api/v1/auth/logout
 * 
 * 注意: JWT 是无状态的，实际登出由客户端处理（删除本地存储的 token）
 * 此接口主要用于：
 * 1. 记录登出日志（可选）
 * 2. 提供统一的登出响应
 * 3. 未来可扩展为 token 黑名单机制
 */
exports.logout = asyncHandler(async (req, res) => {
  // 这里可以添加登出日志记录
  // 例如: await LogService.log('user_logout', req.user.id);
  
  return ApiResponse.success(res, null, '登出成功');
});
