const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate, optionalAuthenticate, authorize } = require('../middlewares/auth');
const { commentValidation, idValidation, paginationValidation } = require('../middlewares/validator');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validator');

/**
 * @route   GET /api/v1/comments
 * @desc    获取所有评论列表（管理后台）
 * @access  Private（仅管理员）
 */
router.get(
  '/',
  authenticate,
  authorize('admin'),
  paginationValidation,
  commentController.getAllComments
);

/**
 * @route   GET /api/v1/articles/:articleId/comments
 * @desc    获取文章的评论列表
 * @access  Public（可选认证）
 */
router.get(
  '/articles/:articleId/comments',
  optionalAuthenticate,
  paginationValidation,
  commentController.getCommentsByArticle
);

/**
 * @route   POST /api/v1/articles/:articleId/comments
 * @desc    发表评论
 * @access  Public（可选认证，未登录用户需提供昵称）
 */
router.post(
  '/articles/:articleId/comments',
  optionalAuthenticate,
  commentValidation,
  commentController.createComment
);

/**
 * @route   PUT /api/v1/comments/:id
 * @desc    更新评论
 * @access  Private（评论作者或管理员）
 */
router.put('/:id', authenticate, idValidation, commentController.updateComment);

/**
 * @route   DELETE /api/v1/comments/:id
 * @desc    删除评论
 * @access  Private（评论作者或管理员）
 */
router.delete('/:id', authenticate, idValidation, commentController.deleteComment);

/**
 * @route   PUT /api/v1/comments/:id/approve
 * @desc    审核评论
 * @access  Private（仅管理员）
 */
router.put(
  '/:id/approve',
  authenticate,
  authorize('admin'),
  idValidation,
  [
    body('is_approved').isBoolean().withMessage('is_approved 必须是布尔值'),
    handleValidationErrors
  ],
  commentController.approveComment
);

/**
 * @route   POST /api/v1/comments/batch-delete
 * @desc    批量删除评论
 * @access  Private（仅管理员）
 */
const { batchDeleteCommentsValidation, batchApproveCommentsValidation } = require('../middlewares/validator');
router.post(
  '/batch-delete',
  authenticate,
  authorize('admin'),
  batchDeleteCommentsValidation,
  commentController.batchDeleteComments
);

/**
 * @route   POST /api/v1/comments/batch-approve
 * @desc    批量审核评论
 * @access  Private（仅管理员）
 */
router.post(
  '/batch-approve',
  authenticate,
  authorize('admin'),
  batchApproveCommentsValidation,
  commentController.batchApproveComments
);

module.exports = router;
