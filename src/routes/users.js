const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validator');

/**
 * @route   GET /api/v1/users/profile
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    更新当前用户信息
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  [
    body('username').optional().trim().isLength({ min: 3, max: 50 }),
    body('avatar').optional().isURL(),
    handleValidationErrors
  ],
  userController.updateProfile
);

/**
 * @route   PUT /api/v1/users/password
 * @desc    修改密码
 * @access  Private
 */
router.put(
  '/password',
  authenticate,
  [
    body('oldPassword').notEmpty().withMessage('请输入原密码'),
    body('newPassword')
      .isLength({ min: 6, max: 50 })
      .withMessage('新密码长度必须在6-50个字符之间')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .withMessage('新密码必须包含字母和数字'),
    handleValidationErrors
  ],
  userController.changePassword
);

module.exports = router;
