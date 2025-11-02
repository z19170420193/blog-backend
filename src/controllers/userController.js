const { User } = require('../models');
const ApiResponse = require('../utils/response');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * 获取当前用户信息
 * GET /api/v1/users/profile
 */
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    return ApiResponse.notFound(res, '用户不存在');
  }

  return ApiResponse.success(res, user);
});

/**
 * 更新当前用户信息
 * PUT /api/v1/users/profile
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { username, avatar } = req.body;
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    return ApiResponse.notFound(res, '用户不存在');
  }

  // 如果更新用户名，检查是否重复
  if (username && username !== user.username) {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return ApiResponse.badRequest(res, '用户名已被使用');
    }
    user.username = username;
  }

  // 更新头像
  if (avatar !== undefined) {
    user.avatar = avatar;
  }

  await user.save();

  return ApiResponse.success(res, user.toSafeJSON(), '更新成功');
});

/**
 * 修改密码
 * PUT /api/v1/users/password
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    return ApiResponse.notFound(res, '用户不存在');
  }

  // 验证旧密码
  const isValidPassword = await user.validatePassword(oldPassword);
  if (!isValidPassword) {
    return ApiResponse.badRequest(res, '原密码错误');
  }

  // 更新密码（会在模型 hook 中自动加密）
  user.password = newPassword;
  await user.save();

  return ApiResponse.success(res, null, '密码修改成功');
});
