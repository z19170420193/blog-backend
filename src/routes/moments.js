const express = require('express');
const router = express.Router();
const momentController = require('../controllers/momentController');
const { authenticate, optionalAuthenticate } = require('../middlewares/auth');
const {
  momentValidation,
  momentTogglePinValidation,
  idValidation,
  paginationValidation,
  batchDeleteValidation
} = require('../middlewares/validator');

/**
 * @route   GET /api/v1/moments
 * @desc    获取说说列表（支持分页、筛选）
 * @access  Public（可选认证）
 */
router.get('/', optionalAuthenticate, paginationValidation, momentController.getMoments);

/**
 * @route   GET /api/v1/moments/:id
 * @desc    获取说说详情
 * @access  Public（可选认证）
 */
router.get('/:id', optionalAuthenticate, idValidation, momentController.getMomentById);

/**
 * @route   POST /api/v1/moments
 * @desc    发布说说
 * @access  Private
 */
router.post('/', authenticate, momentValidation, momentController.createMoment);

/**
 * @route   PUT /api/v1/moments/:id
 * @desc    更新说说
 * @access  Private（作者或管理员）
 */
router.put('/:id', authenticate, idValidation, momentValidation, momentController.updateMoment);

/**
 * @route   DELETE /api/v1/moments/:id
 * @desc    删除说说
 * @access  Private（作者或管理员）
 */
router.delete('/:id', authenticate, idValidation, momentController.deleteMoment);

/**
 * @route   PUT /api/v1/moments/:id/pin
 * @desc    置顶/取消置顶说说
 * @access  Private（作者或管理员）
 */
router.put('/:id/pin', authenticate, idValidation, momentTogglePinValidation, momentController.togglePin);

/**
 * @route   POST /api/v1/moments/batch-delete
 * @desc    批量删除说说
 * @access  Private
 */
router.post('/batch-delete', authenticate, batchDeleteValidation, momentController.batchDeleteMoments);

module.exports = router;
