const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate, optionalAuthenticate } = require('../middlewares/auth');
const { 
  projectValidation,
  projectUpdateValidation,
  projectBatchUpdateStatusValidation,
  projectBatchUpdateFeaturedValidation,
  projectQueryValidation,
  idValidation,
  batchDeleteValidation
} = require('../middlewares/validator');

/**
 * 项目路由
 * 基础路径: /api/v1/projects
 */

// ========== 公开接口（无需认证或可选认证） ==========

/**
 * @route   GET /api/v1/projects
 * @desc    获取项目列表（支持筛选和分页）
 * @access  Public（可选认证）
 */
router.get('/', optionalAuthenticate, projectQueryValidation, projectController.getProjects);

/**
 * @route   GET /api/v1/projects/stats/tech-stack
 * @desc    获取技术栈统计
 * @access  Public
 */
router.get('/stats/tech-stack', projectController.getTechStackStats);

/**
 * @route   GET /api/v1/projects/timeline
 * @desc    获取项目时间线
 * @access  Public
 */
router.get('/timeline', projectController.getProjectTimeline);

/**
 * @route   GET /api/v1/projects/:id
 * @desc    获取项目详情
 * @access  Public（可选认证）
 */
router.get('/:id', optionalAuthenticate, idValidation, projectController.getProjectById);

/**
 * @route   POST /api/v1/projects/:id/view
 * @desc    增加浏览量
 * @access  Public
 */
router.post('/:id/view', idValidation, projectController.incrementView);

// ========== 需要认证的接口 ==========

/**
 * @route   POST /api/v1/projects
 * @desc    创建项目
 * @access  Private
 */
router.post('/', authenticate, projectValidation, projectController.createProject);

/**
 * @route   PUT /api/v1/projects/:id
 * @desc    更新项目
 * @access  Private（作者或管理员）
 */
router.put('/:id', authenticate, idValidation, projectUpdateValidation, projectController.updateProject);

/**
 * @route   DELETE /api/v1/projects/:id
 * @desc    删除项目
 * @access  Private（作者或管理员）
 */
router.delete('/:id', authenticate, idValidation, projectController.deleteProject);

// ========== 批量操作（需要认证） ==========

/**
 * @route   POST /api/v1/projects/batch-delete
 * @desc    批量删除项目
 * @access  Private
 */
router.post('/batch-delete', authenticate, batchDeleteValidation, projectController.batchDeleteProjects);

/**
 * @route   POST /api/v1/projects/batch-update-status
 * @desc    批量更新项目状态
 * @access  Private
 */
router.post('/batch-update-status', authenticate, projectBatchUpdateStatusValidation, projectController.batchUpdateStatus);

/**
 * @route   POST /api/v1/projects/batch-update-featured
 * @desc    批量设置/取消精选
 * @access  Private（仅管理员）
 */
router.post('/batch-update-featured', authenticate, projectBatchUpdateFeaturedValidation, projectController.batchUpdateFeatured);

module.exports = router;
