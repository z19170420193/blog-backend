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

/**
 * 批量删除标签
 * POST /api/v1/tags/batch-delete
 */
exports.batchDeleteTags = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return ApiResponse.badRequest(res, '请提供要删除的标签ID列表');
  }

  // 查询所有标签
  const tags = await Tag.findAll({
    where: { id: ids }
  });

  if (tags.length === 0) {
    return ApiResponse.badRequest(res, '没有找到要删除的标签');
  }

  // 使用事务批量删除
  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();

  try {
    // 删除标签（Sequelize 会自动删除 article_tags 中的关联记录）
    const deletedCount = await Tag.destroy({
      where: { id: ids },
      transaction
    });

    await transaction.commit();

    return ApiResponse.success(res, {
      deleted_count: deletedCount,
      total_count: ids.length
    }, `成功删除 ${deletedCount} 个标签`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * 批量合并标签
 * POST /api/v1/tags/batch-merge
 */
exports.batchMergeTags = asyncHandler(async (req, res) => {
  const { source_ids, target_id } = req.body;

  if (!source_ids || !Array.isArray(source_ids) || source_ids.length === 0) {
    return ApiResponse.badRequest(res, '请提供源标签ID列表');
  }

  if (!target_id) {
    return ApiResponse.badRequest(res, '请提供目标标签ID');
  }

  // 防止将标签合并到自己
  if (source_ids.includes(target_id)) {
    return ApiResponse.badRequest(res, '不能将标签合并到自己');
  }

  // 验证目标标签存在
  const targetTag = await Tag.findByPk(target_id);
  if (!targetTag) {
    return ApiResponse.notFound(res, '目标标签不存在');
  }

  // 验证源标签存在
  const sourceTags = await Tag.findAll({
    where: { id: source_ids }
  });

  if (sourceTags.length === 0) {
    return ApiResponse.badRequest(res, '没有找到源标签');
  }

  // 使用事务执行合并操作
  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();

  try {
    // 统计当前关联的文章数
    const [sourceResult] = await sequelize.query(
      'SELECT COUNT(DISTINCT article_id) as count FROM article_tags WHERE tag_id IN (:sourceIds)',
      {
        replacements: { sourceIds: source_ids },
        type: require('sequelize').QueryTypes.SELECT,
        transaction
      }
    );

    // 更新关联记录：将源标签的文章关联更新为目标标签
    // 使用 INSERT IGNORE 避免重复（如果文章已经有目标标签）
    await sequelize.query(
      `INSERT IGNORE INTO article_tags (article_id, tag_id, created_at)
       SELECT article_id, :targetId, NOW()
       FROM article_tags
       WHERE tag_id IN (:sourceIds)`,
      {
        replacements: { targetId: target_id, sourceIds: source_ids },
        transaction
      }
    );

    // 删除源标签的关联记录
    await sequelize.query(
      'DELETE FROM article_tags WHERE tag_id IN (:sourceIds)',
      {
        replacements: { sourceIds: source_ids },
        transaction
      }
    );

    // 删除源标签
    const deletedCount = await Tag.destroy({
      where: { id: source_ids },
      transaction
    });

    await transaction.commit();

    // 查询目标标签的最新文章数
    const [targetResult] = await sequelize.query(
      'SELECT COUNT(DISTINCT article_id) as count FROM article_tags WHERE tag_id = :targetId',
      {
        replacements: { targetId: target_id },
        type: require('sequelize').QueryTypes.SELECT
      }
    );

    return ApiResponse.success(res, {
      merged_tags: deletedCount,
      affected_articles: sourceResult.count,
      target_tag: {
        id: targetTag.id,
        name: targetTag.name,
        article_count: targetResult.count
      }
    }, `成功合并 ${deletedCount} 个标签`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * 批量更新标签颜色
 * POST /api/v1/tags/batch-update-color
 */
exports.batchUpdateTagColor = asyncHandler(async (req, res) => {
  const { ids, color } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return ApiResponse.badRequest(res, '请提供要更新的标签ID列表');
  }

  if (!color) {
    return ApiResponse.badRequest(res, '请提供颜色值');
  }

  // 验证所有标签是否存在
  const tags = await Tag.findAll({
    where: { id: ids }
  });

  if (tags.length !== ids.length) {
    return ApiResponse.badRequest(res, '部分标签不存在');
  }

  // 使用事务批量更新
  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();

  try {
    const [updatedCount] = await Tag.update(
      { color },
      { 
        where: { id: ids },
        transaction 
      }
    );

    await transaction.commit();

    // 重新查询返回更新后的标签
    const updatedTags = await Tag.findAll({
      where: { id: ids }
    });

    return ApiResponse.success(res, {
      updated_count: updatedCount,
      tags: updatedTags
    }, `成功更新 ${updatedCount} 个标签的颜色`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});
