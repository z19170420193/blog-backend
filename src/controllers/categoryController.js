const { Category, Article } = require('../models');
const ApiResponse = require('../utils/response');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * 获取分类列表
 * GET /api/v1/categories
 */
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    order: [['sort_order', 'ASC'], ['id', 'ASC']],
    attributes: {
      include: [
        // 统计每个分类下的文章数
        [
          require('sequelize').literal(`(
            SELECT COUNT(*)
            FROM articles
            WHERE articles.category_id = Category.id
            AND articles.status = 'published'
          )`),
          'article_count'
        ]
      ]
    }
  });

  return ApiResponse.success(res, categories);
});

/**
 * 获取分类详情
 * GET /api/v1/categories/:id
 */
exports.getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findByPk(id, {
    include: [
      {
        model: Article,
        as: 'articles',
        where: { status: 'published' },
        required: false,
        attributes: ['id', 'title', 'summary', 'cover_image', 'views', 'published_at'],
        limit: 10,
        order: [['published_at', 'DESC']]
      }
    ]
  });

  if (!category) {
    return ApiResponse.notFound(res, '分类不存在');
  }

  return ApiResponse.success(res, category);
});

/**
 * 创建分类
 * POST /api/v1/categories
 */
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description, sort_order } = req.body;

  // 检查分类名是否已存在
  const existing = await Category.findOne({ where: { name } });
  if (existing) {
    return ApiResponse.badRequest(res, '分类名称已存在');
  }

  const category = await Category.create({
    name,
    description,
    sort_order: sort_order || 0
  });

  return ApiResponse.created(res, category, '分类创建成功');
});

/**
 * 更新分类
 * PUT /api/v1/categories/:id
 */
exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, sort_order } = req.body;

  const category = await Category.findByPk(id);
  if (!category) {
    return ApiResponse.notFound(res, '分类不存在');
  }

  // 如果更新名称，检查是否重复
  if (name && name !== category.name) {
    const existing = await Category.findOne({ where: { name } });
    if (existing) {
      return ApiResponse.badRequest(res, '分类名称已存在');
    }
    category.name = name;
  }

  if (description !== undefined) category.description = description;
  if (sort_order !== undefined) category.sort_order = sort_order;

  await category.save();

  return ApiResponse.success(res, category, '分类更新成功');
});

/**
 * 删除分类
 * DELETE /api/v1/categories/:id
 */
exports.deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findByPk(id);
  if (!category) {
    return ApiResponse.notFound(res, '分类不存在');
  }

  // 检查是否有文章使用此分类
  const articleCount = await Article.count({ where: { category_id: id } });
  if (articleCount > 0) {
    return ApiResponse.badRequest(res, `该分类下还有 ${articleCount} 篇文章，无法删除`);
  }

  await category.destroy();

  return ApiResponse.success(res, null, '分类删除成功');
});

/**
 * 批量删除分类
 * POST /api/v1/categories/batch-delete
 */
exports.batchDeleteCategories = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return ApiResponse.badRequest(res, '请提供要删除的分类ID列表');
  }

  // 查询所有分类
  const categories = await Category.findAll({
    where: { id: ids }
  });

  if (categories.length === 0) {
    return ApiResponse.badRequest(res, '没有找到要删除的分类');
  }

  // 检查每个分类下是否有文章
  const deletableIds = [];
  const errors = [];

  for (const category of categories) {
    const articleCount = await Article.count({ where: { category_id: category.id } });
    
    if (articleCount > 0) {
      errors.push(`分类 "${category.name}": 下还有 ${articleCount} 篇文章，无法删除`);
      continue;
    }

    deletableIds.push(category.id);
  }

  if (deletableIds.length === 0) {
    return ApiResponse.badRequest(res, '所有分类都包含文章，无法删除', { errors });
  }

  // 使用事务批量删除
  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();

  try {
    const deletedCount = await Category.destroy({
      where: { id: deletableIds },
      transaction
    });

    await transaction.commit();

    return ApiResponse.success(res, {
      deleted_count: deletedCount,
      total_count: ids.length,
      errors: errors.length > 0 ? errors : null
    }, `成功删除 ${deletedCount} 个分类`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * 批量更新分类排序
 * POST /api/v1/categories/batch-update-order
 */
exports.batchUpdateOrder = asyncHandler(async (req, res) => {
  const { orders } = req.body;

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return ApiResponse.badRequest(res, '请提供排序数据');
  }

  // 提取所有ID
  const categoryIds = orders.map(item => item.id);

  // 验证所有分类是否存在
  const categories = await Category.findAll({
    where: { id: categoryIds }
  });

  if (categories.length !== categoryIds.length) {
    return ApiResponse.badRequest(res, '部分分类不存在');
  }

  // 使用事务批量更新
  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();

  try {
    // 逐个更新排序
    for (const orderItem of orders) {
      await Category.update(
        { sort_order: orderItem.sort_order },
        { 
          where: { id: orderItem.id },
          transaction 
        }
      );
    }

    await transaction.commit();

    // 重新查询返回更新后的列表
    const updatedCategories = await Category.findAll({
      where: { id: categoryIds },
      order: [['sort_order', 'ASC']]
    });

    return ApiResponse.success(res, {
      updated_count: orders.length,
      categories: updatedCategories
    }, `成功更新 ${orders.length} 个分类的排序`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * 批量合并分类
 * POST /api/v1/categories/batch-merge
 */
exports.batchMergeCategories = asyncHandler(async (req, res) => {
  const { source_ids, target_id } = req.body;

  if (!source_ids || !Array.isArray(source_ids) || source_ids.length === 0) {
    return ApiResponse.badRequest(res, '请提供源分类ID列表');
  }

  if (!target_id) {
    return ApiResponse.badRequest(res, '请提供目标分类ID');
  }

  // 防止将分类合并到自己
  if (source_ids.includes(target_id)) {
    return ApiResponse.badRequest(res, '不能将分类合并到自己');
  }

  // 验证目标分类存在
  const targetCategory = await Category.findByPk(target_id);
  if (!targetCategory) {
    return ApiResponse.notFound(res, '目标分类不存在');
  }

  // 验证源分类存在
  const sourceCategories = await Category.findAll({
    where: { id: source_ids }
  });

  if (sourceCategories.length === 0) {
    return ApiResponse.badRequest(res, '没有找到源分类');
  }

  // 使用事务执行合并操作
  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();

  try {
    // 统计迁移的文章数
    const articleCount = await Article.count({
      where: { category_id: source_ids },
      transaction
    });

    // 将源分类下的所有文章迁移到目标分类
    await Article.update(
      { category_id: target_id },
      { 
        where: { category_id: source_ids },
        transaction 
      }
    );

    // 删除源分类
    const deletedCount = await Category.destroy({
      where: { id: source_ids },
      transaction
    });

    await transaction.commit();

    // 查询目标分类的最新文章数
    const targetArticleCount = await Article.count({
      where: { category_id: target_id }
    });

    return ApiResponse.success(res, {
      merged_categories: deletedCount,
      migrated_articles: articleCount,
      target_category: {
        id: targetCategory.id,
        name: targetCategory.name,
        article_count: targetArticleCount
      }
    }, `成功合并 ${deletedCount} 个分类，迁移了 ${articleCount} 篇文章`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});
