const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { authenticate, authorize } = require('../middlewares/auth');
const { tagValidation, idValidation } = require('../middlewares/validator');

/**
 * @route   GET /api/v1/tags
 * @desc    获取标签列表
 * @access  Public
 */
router.get('/', tagController.getTags);

/**
 * @route   GET /api/v1/tags/:id
 * @desc    获取标签详情
 * @access  Public
 */
router.get('/:id', idValidation, tagController.getTagById);

/**
 * @route   POST /api/v1/tags
 * @desc    创建标签
 * @access  Private（仅管理员）
 */
router.post('/', authenticate, authorize('admin'), tagValidation, tagController.createTag);

/**
 * @route   PUT /api/v1/tags/:id
 * @desc    更新标签
 * @access  Private（仅管理员）
 */
router.put('/:id', authenticate, authorize('admin'), idValidation, tagValidation, tagController.updateTag);

/**
 * @route   DELETE /api/v1/tags/:id
 * @desc    删除标签
 * @access  Private（仅管理员）
 */
router.delete('/:id', authenticate, authorize('admin'), idValidation, tagController.deleteTag);

module.exports = router;
