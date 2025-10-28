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
