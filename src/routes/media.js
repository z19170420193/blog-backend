const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticate } = require('../middlewares/auth');
const { uploadSingle, handleUploadError, validateFileExists } = require('../middlewares/upload');
const { idValidation, paginationValidation, batchDeleteValidation } = require('../middlewares/validator');

/**
 * @route   POST /api/v1/media/upload
 * @desc    上传媒体文件
 * @access  Private
 */
router.post(
  '/upload',
  authenticate,
  uploadSingle,
  handleUploadError,
  validateFileExists,
  mediaController.uploadMedia
);

/**
 * @route   GET /api/v1/media
 * @desc    获取媒体文件列表
 * @access  Private
 */
router.get('/', authenticate, paginationValidation, mediaController.getMedia);

/**
 * @route   GET /api/v1/media/:id
 * @desc    获取媒体文件详情
 * @access  Private
 */
router.get('/:id', authenticate, idValidation, mediaController.getMediaById);

/**
 * @route   PUT /api/v1/media/:id
 * @desc    更新媒体文件信息
 * @access  Private（文件上传者或管理员）
 */
router.put('/:id', authenticate, idValidation, mediaController.updateMedia);

/**
 * @route   DELETE /api/v1/media/:id
 * @desc    删除媒体文件
 * @access  Private（文件上传者或管理员）
 */
router.delete('/:id', authenticate, idValidation, mediaController.deleteMedia);

/**
 * @route   POST /api/v1/media/batch-delete
 * @desc    批量删除媒体文件
 * @access  Private
 */
router.post('/batch-delete', authenticate, batchDeleteValidation, mediaController.batchDeleteMedia);

module.exports = router;
