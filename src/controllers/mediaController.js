const { Media, User } = require('../models');
const ApiResponse = require('../utils/response');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPagination } = require('../utils/pagination');
const { getImageSize, deleteFile } = require('../utils/fileHelper');
const path = require('path');

/**
 * 上传媒体文件
 * POST /api/v1/media/upload
 */
exports.uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.badRequest(res, '请选择要上传的文件');
  }

  const file = req.file;
  
  // 正确处理中文文件名：使用 Buffer 转换编码
  let originalFilename;
  try {
    // 尝试从 latin1 转换为 utf8（修复 multer 编码问题）
    originalFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
  } catch (error) {
    // 如果转换失败，使用原始文件名
    originalFilename = file.originalname;
  }
  
  // 获取图片尺寸
  const { width, height } = await getImageSize(file.path);

  // 生成访问 URL（修正路径生成逻辑）
  const relativePath = path.relative(
    path.join(process.cwd(), process.env.UPLOAD_PATH || 'uploads'),
    file.path
  ).replace(/\\/g, '/');
  const fileUrl = `${process.env.SERVER_URL}/uploads/${relativePath}`;

  // 保存到数据库
  const media = await Media.create({
    filename: originalFilename,  // 使用修复后的中文文件名
    stored_name: file.filename,
    file_path: file.path,
    file_url: fileUrl,
    file_size: file.size,
    mime_type: file.mimetype,
    width,
    height,
    uploader_id: req.user.id,
    storage_type: 'local'
  });

  return ApiResponse.created(res, media, '文件上传成功');
});

/**
 * 获取媒体文件列表
 * GET /api/v1/media
 */
exports.getMedia = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { mime_type, keyword } = req.query;

  // 构建查询条件
  const where = {};
  
  // MIME 类型筛选
  if (mime_type) {
    where.mime_type = mime_type;
  }

  // 关键词搜索
  if (keyword) {
    where.filename = { [require('sequelize').Op.like]: `%${keyword}%` };
  }

  // 非管理员只能看自己的文件
  if (req.user.role !== 'admin') {
    where.uploader_id = req.user.id;
  }

  const { count, rows } = await Media.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'uploader',
        attributes: ['id', 'username']
      }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return ApiResponse.successWithPagination(res, rows, { page, limit, total: count }, 'media');
});

/**
 * 获取媒体文件详情
 * GET /api/v1/media/:id
 */
exports.getMediaById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const media = await Media.findByPk(id, {
    include: [
      {
        model: User,
        as: 'uploader',
        attributes: ['id', 'username', 'avatar']
      }
    ]
  });

  if (!media) {
    return ApiResponse.notFound(res, '媒体文件不存在');
  }

  // 非管理员只能查看自己的文件
  if (req.user.role !== 'admin' && media.uploader_id !== req.user.id) {
    return ApiResponse.forbidden(res, '无权查看此文件');
  }

  return ApiResponse.success(res, media);
});

/**
 * 更新媒体文件信息
 * PUT /api/v1/media/:id
 */
exports.updateMedia = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { filename } = req.body;

  const media = await Media.findByPk(id);
  if (!media) {
    return ApiResponse.notFound(res, '媒体文件不存在');
  }

  // 检查权限
  if (req.user.role !== 'admin' && media.uploader_id !== req.user.id) {
    return ApiResponse.forbidden(res, '无权修改此文件');
  }

  if (filename) {
    media.filename = filename;
    await media.save();
  }

  return ApiResponse.success(res, media, '文件信息更新成功');
});

/**
 * 删除媒体文件
 * DELETE /api/v1/media/:id
 */
exports.deleteMedia = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const media = await Media.findByPk(id);
  if (!media) {
    return ApiResponse.notFound(res, '媒体文件不存在');
  }

  // 检查权限
  if (req.user.role !== 'admin' && media.uploader_id !== req.user.id) {
    return ApiResponse.forbidden(res, '无权删除此文件');
  }

  // 检查是否被引用
  if (media.usage_count > 0) {
    return ApiResponse.badRequest(res, `文件正在被 ${media.usage_count} 处引用，无法删除`);
  }

  // 删除物理文件
  await deleteFile(media.file_path);

  // 删除数据库记录
  await media.destroy();

  return ApiResponse.success(res, null, '文件删除成功');
});

/**
 * 批量删除媒体文件
 * POST /api/v1/media/batch-delete
 */
exports.batchDeleteMedia = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return ApiResponse.badRequest(res, '请提供要删除的文件ID列表');
  }

  // 查询所有文件
  const mediaList = await Media.findAll({
    where: { id: ids }
  });

  if (mediaList.length === 0) {
    return ApiResponse.badRequest(res, '没有找到要删除的文件');
  }

  // 检查权限和引用
  const deletableIds = [];
  const errors = [];

  for (const media of mediaList) {
    // 权限检查
    if (req.user.role !== 'admin' && media.uploader_id !== req.user.id) {
      errors.push(`文件 ${media.filename}: 无权删除`);
      continue;
    }

    // 引用检查
    if (media.usage_count > 0) {
      errors.push(`文件 ${media.filename}: 正在被引用，无法删除`);
      continue;
    }

    deletableIds.push(media.id);
  }

  // 删除可删除的文件
  let deletedCount = 0;
  for (const media of mediaList) {
    if (deletableIds.includes(media.id)) {
      await deleteFile(media.file_path);
      await media.destroy();
      deletedCount++;
    }
  }

  return ApiResponse.success(res, {
    deleted_count: deletedCount,
    total_count: ids.length,
    errors: errors.length > 0 ? errors : null
  }, `成功删除 ${deletedCount} 个文件`);
});
