const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate, optionalAuthenticate, authorize } = require('../middlewares/auth');
const { body } = require('express-validator');
const { 
  handleValidationErrors,
  idValidation,
  paginationValidation,
  messageValidation,
  batchDeleteMessagesValidation,
  batchApproveMessagesValidation
} = require('../middlewares/validator');

/**
 * 状态更新验证
 */
const statusValidation = [
  body('status')
    .isIn(['pending', 'approved', 'rejected']).withMessage('状态值不正确'),
  handleValidationErrors
];

/**
 * @route   GET /api/v1/messages/stats
 * @desc    获取留言统计
 * @access  Private（仅管理员）
 */
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  messageController.getMessageStats
);

/**
 * @route   GET /api/v1/messages/admin
 * @desc    获取所有留言列表（管理后台）
 * @access  Private（仅管理员）
 */
router.get(
  '/admin',
  authenticate,
  authorize('admin'),
  paginationValidation,
  messageController.getAdminMessages
);

/**
 * @route   POST /api/v1/messages/batch-delete
 * @desc    批量删除留言
 * @access  Private（仅管理员）
 */
router.post(
  '/batch-delete',
  authenticate,
  authorize('admin'),
  batchDeleteMessagesValidation,
  messageController.batchDeleteMessages
);

/**
 * @route   POST /api/v1/messages/batch-approve
 * @desc    批量审核留言
 * @access  Private（仅管理员）
 */
router.post(
  '/batch-approve',
  authenticate,
  authorize('admin'),
  batchApproveMessagesValidation,
  messageController.batchApproveMessages
);

/**
 * @route   GET /api/v1/messages
 * @desc    获取所有留言列表（公开）
 * @access  Public
 */
router.get(
  '/',
  paginationValidation,
  messageController.getAllMessages
);

/**
 * @route   POST /api/v1/messages
 * @desc    发表留言
 * @access  Public（可选认证）
 */
router.post(
  '/',
  optionalAuthenticate,
  messageValidation,
  messageController.createMessage
);

/**
 * @route   PUT /api/v1/messages/:id
 * @desc    更新留言
 * @access  Private（留言作者或管理员）
 */
router.put(
  '/:id',
  authenticate,
  idValidation,
  [
    body('content')
      .optional()
      .trim()
      .isLength({ min: 1, max: 500 }).withMessage('留言内容长度为1-500字符'),
    body('mood')
      .optional()
      .isIn(['happy', 'sad', 'angry', 'excited', 'thinking']).withMessage('心情类型不正确'),
    handleValidationErrors
  ],
  messageController.updateMessage
);

/**
 * @route   DELETE /api/v1/messages/:id
 * @desc    删除留言
 * @access  Private（留言作者或管理员）
 */
router.delete(
  '/:id',
  authenticate,
  idValidation,
  messageController.deleteMessage
);

/**
 * @route   PUT /api/v1/messages/:id/status
 * @desc    更新留言状态
 * @access  Private（仅管理员）
 */
router.put(
  '/:id/status',
  authenticate,
  authorize('admin'),
  idValidation,
  statusValidation,
  messageController.updateMessageStatus
);

/**
 * @route   POST /api/v1/messages/:id/like
 * @desc    点赞留言
 * @access  Public
 */
router.post(
  '/:id/like',
  idValidation,
  messageController.likeMessage
);

module.exports = router;
