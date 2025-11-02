const { Article, User, Category, Tag, Comment } = require('../models');
const ApiResponse = require('../utils/response');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPagination } = require('../utils/pagination');
const { Op } = require('sequelize');

/**
 * 获取文章列表（支持筛选和分页）
 * GET /api/v1/articles
 */
exports.getArticles = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { category_id, tag_id, keyword, status } = req.query;

  // 构建查询条件
  const where = {};
  
  // 分类筛选
  if (category_id) {
    where.category_id = category_id;
  }
  
  // 状态筛选（仅管理员可以查看草稿）
  if (status && req.user?.role === 'admin') {
    where.status = status;
  } else {
    where.status = 'published';
  }
  
  // 关键词搜索
  if (keyword) {
    where[Op.or] = [
      { title: { [Op.like]: `%${keyword}%` } },
      { summary: { [Op.like]: `%${keyword}%` } }
    ];
  }

  // 标签筛选（需要 include）
  const include = [
    {
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'avatar']
    },
    {
      model: Category,
      as: 'category',
      attributes: ['id', 'name']
    },
    {
      model: Tag,
      as: 'tags',
      attributes: ['id', 'name', 'color'],
      through: { attributes: [] } // 不返回中间表数据
    }
  ];

  // 如果有标签筛选
  if (tag_id) {
    include[2].where = { id: tag_id };
    include[2].required = true; // INNER JOIN
  }

  const { count, rows } = await Article.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order: [
      ['is_top', 'DESC'],
      ['published_at', 'DESC']
    ],
    distinct: true // 使用 DISTINCT 正确计数（多对多关系）
  });

  return ApiResponse.successWithPagination(res, rows, { page, limit, total: count }, 'articles');
});

/**
 * 获取文章详情
 * GET /api/v1/articles/:id
 */
exports.getArticleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const article = await Article.findByPk(id, {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      },
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      },
      {
        model: Tag,
        as: 'tags',
        attributes: ['id', 'name', 'color'],
        through: { attributes: [] }
      },
      {
        model: Comment,
        as: 'comments',
        where: { is_approved: true },
        required: false,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatar']
          }
        ]
      }
    ]
  });

  if (!article) {
    return ApiResponse.notFound(res, '文章不存在');
  }

  // 非管理员不能查看草稿
  if (article.status === 'draft' && req.user?.id !== article.author_id && req.user?.role !== 'admin') {
    return ApiResponse.forbidden(res, '无权查看此文章');
  }

  // 增加浏览次数
  await article.increment('views');

  return ApiResponse.success(res, article);
});

/**
 * 创建文章
 * POST /api/v1/articles
 */
exports.createArticle = asyncHandler(async (req, res) => {
  const { title, summary, content, cover_image, category_id, tag_ids, status, is_top } = req.body;

  const article = await Article.create({
    title,
    summary,
    content,
    cover_image,
    category_id,
    author_id: req.user.id,
    status: status || 'draft',
    is_top: is_top || false,
    published_at: status === 'published' ? new Date() : null
  });

  // 关联标签
  if (tag_ids && tag_ids.length > 0) {
    await article.setTags(tag_ids);
  }

  // 重新查询以返回完整数据
  const newArticle = await Article.findByPk(article.id, {
    include: [
      { model: User, as: 'author', attributes: ['id', 'username'] },
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'], through: { attributes: [] } }
    ]
  });

  return ApiResponse.created(res, newArticle, '文章创建成功');
});

/**
 * 更新文章
 * PUT /api/v1/articles/:id
 */
exports.updateArticle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, summary, content, cover_image, category_id, tag_ids, status, is_top } = req.body;

  const article = await Article.findByPk(id);
  if (!article) {
    return ApiResponse.notFound(res, '文章不存在');
  }

  // 检查权限（只能修改自己的文章，或管理员可修改所有）
  if (article.author_id !== req.user.id && req.user.role !== 'admin') {
    return ApiResponse.forbidden(res, '无权修改此文章');
  }

  // 更新字段
  if (title) article.title = title;
  if (summary !== undefined) article.summary = summary;
  if (content) article.content = content;
  if (cover_image !== undefined) article.cover_image = cover_image;
  if (category_id !== undefined) article.category_id = category_id;
  if (is_top !== undefined) article.is_top = is_top;
  
  // 状态变更处理
  if (status) {
    const oldStatus = article.status;
    article.status = status;
    
    // 从草稿变为发布时，设置发布时间
    if (oldStatus === 'draft' && status === 'published' && !article.published_at) {
      article.published_at = new Date();
    }
  }

  await article.save();

  // 更新标签
  if (tag_ids !== undefined) {
    await article.setTags(tag_ids);
  }

  // 重新查询返回完整数据
  const updatedArticle = await Article.findByPk(id, {
    include: [
      { model: User, as: 'author', attributes: ['id', 'username'] },
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'], through: { attributes: [] } }
    ]
  });

  return ApiResponse.success(res, updatedArticle, '文章更新成功');
});

/**
 * 删除文章
 * DELETE /api/v1/articles/:id
 */
exports.deleteArticle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const article = await Article.findByPk(id);
  if (!article) {
    return ApiResponse.notFound(res, '文章不存在');
  }

  // 检查权限
  if (article.author_id !== req.user.id && req.user.role !== 'admin') {
    return ApiResponse.forbidden(res, '无权删除此文章');
  }

  await article.destroy();

  return ApiResponse.success(res, null, '文章删除成功');
});

/**
 * 批量删除文章
 * POST /api/v1/articles/batch-delete
 */
exports.batchDeleteArticles = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return ApiResponse.badRequest(res, '请提供要删除的文章ID列表');
  }

  // 查询所有文章
  const articles = await Article.findAll({
    where: { id: ids }
  });

  if (articles.length === 0) {
    return ApiResponse.badRequest(res, '没有找到要删除的文章');
  }

  // 检查权限
  const deletableIds = [];
  const errors = [];

  for (const article of articles) {
    // 权限检查：只能删除自己的文章，或管理员可删除所有
    if (article.author_id !== req.user.id && req.user.role !== 'admin') {
      errors.push(`文章 "${article.title}": 无权删除`);
      continue;
    }

    deletableIds.push(article.id);
  }

  // 使用事务批量删除
  const { sequelize } = require('../config/database');
  const transaction = await sequelize.transaction();

  try {
    const deletedCount = await Article.destroy({
      where: { id: deletableIds },
      transaction
    });

    await transaction.commit();

    return ApiResponse.success(res, {
      deleted_count: deletedCount,
      total_count: ids.length,
      errors: errors.length > 0 ? errors : null
    }, `成功删除 ${deletedCount} 篇文章`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * 批量更新文章状态
 * POST /api/v1/articles/batch-update-status
 */
exports.batchUpdateStatus = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return ApiResponse.badRequest(res, '请提供要更新的文章ID列表');
  }

  if (!status || !['draft', 'published'].includes(status)) {
    return ApiResponse.badRequest(res, '状态必须是 draft 或 published');
  }

  // 查询所有文章
  const articles = await Article.findAll({
    where: { id: ids }
  });

  if (articles.length === 0) {
    return ApiResponse.badRequest(res, '没有找到要更新的文章');
  }

  // 检查权限
  const updatableIds = [];
  const errors = [];

  for (const article of articles) {
    // 权限检查：只能修改自己的文章，或管理员可修改所有
    if (article.author_id !== req.user.id && req.user.role !== 'admin') {
      errors.push(`文章 "${article.title}": 无权修改`);
      continue;
    }

    updatableIds.push(article.id);
  }

  // 使用事务批量更新
  const { sequelize } = require('../config/database');
  const transaction = await sequelize.transaction();

  try {
    const updateData = { status };
    
    // 如果是发布状态，需要设置发布时间
    if (status === 'published') {
      // 只为之前未发布过的文章设置发布时间
      const articlesToUpdate = articles.filter(a => updatableIds.includes(a.id));
      for (const article of articlesToUpdate) {
        if (!article.published_at) {
          await article.update(
            { status, published_at: new Date() },
            { transaction }
          );
        } else {
          await article.update({ status }, { transaction });
        }
      }
    } else {
      // 批量更新为草稿状态
      await Article.update(
        updateData,
        { where: { id: updatableIds }, transaction }
      );
    }

    await transaction.commit();

    return ApiResponse.success(res, {
      affected_count: updatableIds.length,
      total_count: ids.length,
      errors: errors.length > 0 ? errors : null
    }, `成功更新 ${updatableIds.length} 篇文章状态`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * 批量更新文章置顶状态
 * POST /api/v1/articles/batch-update-top
 */
exports.batchUpdateTop = asyncHandler(async (req, res) => {
  const { ids, is_top } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return ApiResponse.badRequest(res, '请提供要更新的文章ID列表');
  }

  if (typeof is_top !== 'boolean') {
    return ApiResponse.badRequest(res, 'is_top 必须是布尔值');
  }

  // 查询所有文章
  const articles = await Article.findAll({
    where: { id: ids }
  });

  if (articles.length === 0) {
    return ApiResponse.badRequest(res, '没有找到要更新的文章');
  }

  // 检查权限（只有管理员可以置顶）
  const updatableIds = [];
  const errors = [];

  for (const article of articles) {
    // 权限检查：只有管理员可以置顶文章
    if (req.user.role !== 'admin') {
      errors.push(`文章 "${article.title}": 需要管理员权限`);
      continue;
    }

    updatableIds.push(article.id);
  }

  if (updatableIds.length === 0) {
    return ApiResponse.forbidden(res, '需要管理员权限才能置顶文章');
  }

  // 使用事务批量更新
  const { sequelize } = require('../config/database');
  const transaction = await sequelize.transaction();

  try {
    const [affectedCount] = await Article.update(
      { is_top },
      { where: { id: updatableIds }, transaction }
    );

    await transaction.commit();

    return ApiResponse.success(res, {
      affected_count: affectedCount,
      total_count: ids.length,
      errors: errors.length > 0 ? errors : null
    }, `成功${is_top ? '置顶' : '取消置顶'} ${affectedCount} 篇文章`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});
