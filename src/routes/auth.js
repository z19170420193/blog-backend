const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middlewares/validator');

/**
 * @route   POST /api/v1/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', authController.logout);

module.exports = router;
