const { Tag, Article } = require('../models');
const ApiResponse = require('../utils/response');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * 获取标签列表
 * GET /api/v1/tags
 */
exports.getTags = asyncHandler(async (req, res) => {
  const tags = await Tag.findAll({
    order: [['id', 'ASC']],
    attributes: {
      include: [
        // 统计每个标签关联的文章数
        [
          require('sequelize').literal(`(
            SELECT COUNT(*)
            FROM article_tags
            INNER JOIN articles ON articles.id = article_tags.article_id
            WHERE article_tags.tag_id = Tag.id
            AND articles.status = 'published'
          )`),
          'article_count'
        ]
      ]
    }
  });

  return ApiResponse.success(res, tags);
});

/**
 * 获取标签详情
 * GET /api/v1/tags/:id
 */
exports.getTagById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tag = await Tag.findByPk(id, {
    include: [
      {
        model: Article,
        as: 'articles',
        where: { status: 'published' },
        required: false,
        attributes: ['id', 'title', 'summary', 'cover_image', 'views', 'published_at'],
        through: { attributes: [] }
      }
    ]
  });

  if (!tag) {
    return ApiResponse.notFound(res, '标签不存在');
  }

  return ApiResponse.success(res, tag);
});

/**
 * 创建标签
 * POST /api/v1/tags
 */
exports.createTag = asyncHandler(async (req, res) => {
  const { name, color } = req.body;

  // 检查标签名是否已存在
  const existing = await Tag.findOne({ where: { name } });
  if (existing) {
    return ApiResponse.badRequest(res, '标签名称已存在');
  }

  const tag = await Tag.create({
    name,
    color: color || '#409EFF'
  });

  return ApiResponse.created(res, tag, '标签创建成功');
});

/**
 * 更新标签
 * PUT /api/v1/tags/:id
 */
exports.updateTag = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;

  const tag = await Tag.findByPk(id);
  if (!tag) {
    return ApiResponse.notFound(res, '标签不存在');
  }

  // 如果更新名称，检查是否重复
  if (name && name !== tag.name) {
    const existing = await Tag.findOne({ where: { name } });
    if (existing) {
      return ApiResponse.badRequest(res, '标签名称已存在');
    }
    tag.name = name;
  }

  if (color) tag.color = color;

  await tag.save();

  return ApiResponse.success(res, tag, '标签更新成功');
});

/**
 * 删除标签
 * DELETE /api/v1/tags/:id
 */
exports.deleteTag = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tag = await Tag.findByPk(id);
  if (!tag) {
    return ApiResponse.notFound(res, '标签不存在');
  }

  // 删除标签时会自动删除关联关系（article_tags表）
  await tag.destroy();

  return ApiResponse.success(res, null, '标签删除成功');
});
