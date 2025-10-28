const { Comment, User, Article } = require('../models');
const ApiResponse = require('../utils/response');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPagination } = require('../utils/pagination');
const { Op } = require('sequelize');

/**
 * 获取所有评论列表（管理后台）
 * GET /api/v1/comments
 */
exports.getAllComments = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { keyword, status, article_id } = req.query;

  // 构建查询条件
  const where = {};

  // 关键字搜索（评论内容或昵称）
  if (keyword) {
    where[Op.or] = [
      { content: { [Op.like]: `%${keyword}%` } },
      { nickname: { [Op.like]: `%${keyword}%` } }
    ];
  }

  // 审核状态筛选
  if (status === 'approved') {
    where.is_approved = true;
  } else if (status === 'pending') {
    where.is_approved = false;
  }
  // status === 'all' 或未提供，不添加筛选条件

  // 按文章ID筛选
  if (article_id) {
    where.article_id = article_id;
  }

  const { count, rows } = await Comment.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar', 'email']
      },
      {
        model: Article,
        as: 'article',
        attributes: ['id', 'title']
      },
      {
        model: Comment,
        as: 'parent',
        attributes: ['id', 'content', 'nickname'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          }
        ]
      }
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset
  });

  return ApiResponse.successWithPagination(res, rows, { page, limit, total: count }, 'comments');
});

/**
 * 获取文章的评论列表
 * GET /api/v1/articles/:articleId/comments
 */
exports.getCommentsByArticle = asyncHandler(async (req, res) => {
  const { articleId } = req.params;
  const { page, limit, offset } = getPagination(req.query);

  // 检查文章是否存在
  const article = await Article.findByPk(articleId);
  if (!article) {
    return ApiResponse.notFound(res, '文章不存在');
  }

  // 查询条件：仅显示已审核的评论（管理员可以看所有）
  const where = { article_id: articleId };
  if (req.user?.role !== 'admin') {
    where.is_approved = true;
  }

  const { count, rows } = await Comment.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar']
      },
      {
        model: Comment,
        as: 'replies',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatar']
          }
        ]
      }
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset
  });

  return ApiResponse.successWithPagination(res, rows, { page, limit, total: count }, 'comments');
});

/**
 * 创建评论
 * POST /api/v1/articles/:articleId/comments
 */
exports.createComment = asyncHandler(async (req, res) => {
  const { articleId } = req.params;
  const { content, nickname, email, parent_id } = req.body;

  // 检查文章是否存在
  const article = await Article.findByPk(articleId);
  if (!article) {
    return ApiResponse.notFound(res, '文章不存在');
  }

  // 如果有父评论，检查是否存在
  if (parent_id) {
    const parentComment = await Comment.findByPk(parent_id);
    if (!parentComment) {
      return ApiResponse.badRequest(res, '父评论不存在');
    }
    if (parentComment.article_id !== parseInt(articleId)) {
      return ApiResponse.badRequest(res, '父评论不属于该文章');
    }
  }

  const comment = await Comment.create({
    article_id: articleId,
    user_id: req.user?.id || null,
    parent_id: parent_id || null,
    nickname: nickname || req.user?.username || '匿名用户',
    email: email || req.user?.email || null,
    content,
    is_approved: req.user ? true : false // 登录用户的评论自动审核通过
  });

  // 重新查询返回完整数据
  const newComment = await Comment.findByPk(comment.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar']
      }
    ]
  });

  return ApiResponse.created(res, newComment, '评论发表成功');
});

/**
 * 更新评论（仅评论作者或管理员）
 * PUT /api/v1/comments/:id
 */
exports.updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const comment = await Comment.findByPk(id);
  if (!comment) {
    return ApiResponse.notFound(res, '评论不存在');
  }

  // 检查权限：只能修改自己的评论，或管理员可修改所有
  if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
    return ApiResponse.forbidden(res, '无权修改此评论');
  }

  if (content) {
    comment.content = content;
    await comment.save();
  }

  return ApiResponse.success(res, comment, '评论更新成功');
});

/**
 * 删除评论（仅评论作者或管理员）
 * DELETE /api/v1/comments/:id
 */
exports.deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comment = await Comment.findByPk(id);
  if (!comment) {
    return ApiResponse.notFound(res, '评论不存在');
  }

  // 检查权限
  if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
    return ApiResponse.forbidden(res, '无权删除此评论');
  }

  await comment.destroy();

  return ApiResponse.success(res, null, '评论删除成功');
});

/**
 * 审核评论（仅管理员）
 * PUT /api/v1/comments/:id/approve
 */
exports.approveComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_approved } = req.body;

  const comment = await Comment.findByPk(id);
  if (!comment) {
    return ApiResponse.notFound(res, '评论不存在');
  }

  comment.is_approved = is_approved;
  await comment.save();

  return ApiResponse.success(res, comment, is_approved ? '评论已审核通过' : '评论已取消审核');
});
