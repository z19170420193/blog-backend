const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { authenticate, optionalAuthenticate } = require('../middlewares/auth');
const { articleValidation, idValidation, paginationValidation } = require('../middlewares/validator');

/**
 * @route   GET /api/v1/articles
 * @desc    获取文章列表（支持筛选、搜索、分页）
 * @access  Public（可选认证）
 */
router.get('/', optionalAuthenticate, paginationValidation, articleController.getArticles);

/**
 * @route   GET /api/v1/articles/:id
 * @desc    获取文章详情
 * @access  Public（可选认证）
 */
router.get('/:id', optionalAuthenticate, idValidation, articleController.getArticleById);

/**
 * @route   POST /api/v1/articles
 * @desc    创建文章
 * @access  Private
 */
router.post('/', authenticate, articleValidation, articleController.createArticle);

/**
 * @route   PUT /api/v1/articles/:id
 * @desc    更新文章
 * @access  Private（作者或管理员）
 */
router.put('/:id', authenticate, idValidation, articleValidation, articleController.updateArticle);

/**
 * @route   DELETE /api/v1/articles/:id
 * @desc    删除文章
 * @access  Private（作者或管理员）
 */
router.delete('/:id', authenticate, idValidation, articleController.deleteArticle);

module.exports = router;
