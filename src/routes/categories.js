const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middlewares/auth');
const { 
  categoryValidation, 
  idValidation,
  batchDeleteValidation,
  batchUpdateOrderValidation,
  batchMergeCategoriesValidation
} = require('../middlewares/validator');

/**
 * @route   GET /api/v1/categories
 * @desc    获取分类列表
 * @access  Public
 */
router.get('/', categoryController.getCategories);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    获取分类详情
 * @access  Public
 */
router.get('/:id', idValidation, categoryController.getCategoryById);

/**
 * @route   POST /api/v1/categories
 * @desc    创建分类
 * @access  Private（仅管理员）
 */
router.post('/', authenticate, authorize('admin'), categoryValidation, categoryController.createCategory);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    更新分类
 * @access  Private（仅管理员）
 */
router.put('/:id', authenticate, authorize('admin'), idValidation, categoryValidation, categoryController.updateCategory);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    删除分类
 * @access  Private（仅管理员）
 */
router.delete('/:id', authenticate, authorize('admin'), idValidation, categoryController.deleteCategory);

/**
 * @route   POST /api/v1/categories/batch-delete
 * @desc    批量删除分类
 * @access  Private（仅管理员）
 */
router.post('/batch-delete', authenticate, authorize('admin'), batchDeleteValidation, categoryController.batchDeleteCategories);

/**
 * @route   POST /api/v1/categories/batch-update-order
 * @desc    批量更新分类排序
 * @access  Private（仅管理员）
 */
router.post('/batch-update-order', authenticate, authorize('admin'), batchUpdateOrderValidation, categoryController.batchUpdateOrder);

/**
 * @route   POST /api/v1/categories/batch-merge
 * @desc    批量合并分类
 * @access  Private（仅管理员）
 */
router.post('/batch-merge', authenticate, authorize('admin'), batchMergeCategoriesValidation, categoryController.batchMergeCategories);

module.exports = router;
