const { Moment, User, sequelize } = require('../models');
const ApiResponse = require('../utils/response');
const { getPagination } = require('../utils/pagination');
const { Op } = require('sequelize');

// 获取说说列表
exports.getMoments = async (req, res) => {
  try {
    const { user_id, visibility } = req.query;
    const { page: pageNum, limit: pageLimit, offset } = getPagination(req.query);

    // 构建查询条件
    const where = {};
    
    // 按用户筛选
    if (user_id) {
      where.user_id = user_id;
    }
    
    // 按可见性筛选（仅管理员可查看所有）
    if (visibility) {
      where.visibility = visibility;
    } else if (!req.user || req.user.role !== 'admin') {
      // 非管理员只能看公开的说说
      where.visibility = 'public';
    }

    const { count, rows } = await Moment.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar', 'email']
        }
      ],
      order: [
        ['is_pinned', 'DESC'],
        ['published_at', 'DESC']
      ],
      limit: pageLimit,
      offset
    });

    return ApiResponse.successWithPagination(
      res,
      rows,
      { page: pageNum, limit: pageLimit, total: count },
      'moments'
    );
  } catch (error) {
    console.error('获取说说列表失败:', error);
    return ApiResponse.serverError(res, '获取说说列表失败');
  }
};

// 获取说说详情
exports.getMomentById = async (req, res) => {
  try {
    const { id } = req.params;

    const moment = await Moment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar', 'email']
        }
      ]
    });

    if (!moment) {
      return ApiResponse.notFound(res, '说说不存在');
    }

    // 检查可见性权限
    if (moment.visibility === 'private' && 
        (!req.user || (req.user.id !== moment.user_id && req.user.role !== 'admin'))) {
      return ApiResponse.forbidden(res, '无权查看此说说');
    }

    return ApiResponse.success(res, moment);
  } catch (error) {
    console.error('获取说说详情失败:', error);
    return ApiResponse.serverError(res, '获取说说详情失败');
  }
};

// 发布说说
exports.createMoment = async (req, res) => {
  try {
    const { content, images, location, visibility } = req.body;

    // 验证必填字段
    if (!content || !content.trim()) {
      return ApiResponse.badRequest(res, '说说内容不能为空');
    }

    // 验证图片数量
    if (images && images.length > 9) {
      return ApiResponse.badRequest(res, '最多只能上传9张图片');
    }

    const moment = await Moment.create({
      user_id: req.user.id,
      content: content.trim(),
      images: images || [],
      location: location || null,
      visibility: visibility || 'public'
    });

    // 查询完整信息（包含用户）
    const momentWithUser = await Moment.findByPk(moment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar', 'email']
        }
      ]
    });

    return ApiResponse.created(res, momentWithUser, '发布成功');
  } catch (error) {
    console.error('发布说说失败:', error);
    return ApiResponse.serverError(res, '发布说说失败');
  }
};

// 更新说说
exports.updateMoment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, images, location, visibility } = req.body;

    const moment = await Moment.findByPk(id);

    if (!moment) {
      return ApiResponse.notFound(res, '说说不存在');
    }

    // 权限检查：只有作者或管理员可以编辑
    if (req.user.id !== moment.user_id && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, '无权编辑此说说');
    }

    // 更新字段
    if (content !== undefined) {
      if (!content.trim()) {
        return ApiResponse.badRequest(res, '说说内容不能为空');
      }
      moment.content = content.trim();
    }

    if (images !== undefined) {
      if (images.length > 9) {
        return ApiResponse.badRequest(res, '最多只能上传9张图片');
      }
      moment.images = images;
    }

    if (location !== undefined) {
      moment.location = location;
    }

    if (visibility !== undefined) {
      moment.visibility = visibility;
    }

    await moment.save();

    // 查询完整信息
    const updatedMoment = await Moment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar', 'email']
        }
      ]
    });

    return ApiResponse.success(res, updatedMoment, '更新成功');
  } catch (error) {
    console.error('更新说说失败:', error);
    return ApiResponse.serverError(res, '更新说说失败');
  }
};

// 删除说说
exports.deleteMoment = async (req, res) => {
  try {
    const { id } = req.params;

    const moment = await Moment.findByPk(id);

    if (!moment) {
      return ApiResponse.notFound(res, '说说不存在');
    }

    // 权限检查：只有作者或管理员可以删除
    if (req.user.id !== moment.user_id && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, '无权删除此说说');
    }

    await moment.destroy();

    return ApiResponse.success(res, null, '删除成功');
  } catch (error) {
    console.error('删除说说失败:', error);
    return ApiResponse.serverError(res, '删除说说失败');
  }
};

// 批量删除说说
exports.batchDeleteMoments = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return ApiResponse.badRequest(res, '请选择要删除的说说');
    }

    // 查询所有说说
    const moments = await Moment.findAll({
      where: { id: ids },
      transaction
    });

    // 权限检查
    const errors = [];
    const validIds = [];

    for (const moment of moments) {
      if (req.user.id !== moment.user_id && req.user.role !== 'admin') {
        errors.push(`说说 ID ${moment.id}: 无权删除`);
      } else {
        validIds.push(moment.id);
      }
    }

    // 删除有权限的说说
    const deletedCount = await Moment.destroy({
      where: { id: validIds },
      transaction
    });

    await transaction.commit();

    return ApiResponse.success(res, {
      deleted_count: deletedCount,
      total_count: ids.length,
      errors: errors.length > 0 ? errors : null
    }, `成功删除 ${deletedCount} 条说说`);
  } catch (error) {
    await transaction.rollback();
    console.error('批量删除说说失败:', error);
    return ApiResponse.serverError(res, '批量删除说说失败');
  }
};

// 置顶/取消置顶说说
exports.togglePin = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_pinned } = req.body;

    const moment = await Moment.findByPk(id);

    if (!moment) {
      return ApiResponse.notFound(res, '说说不存在');
    }

    // 权限检查：只有作者或管理员可以置顶
    if (req.user.id !== moment.user_id && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, '无权操作此说说');
    }

    moment.is_pinned = is_pinned;
    await moment.save();

    return ApiResponse.success(res, moment, is_pinned ? '已置顶' : '已取消置顶');
  } catch (error) {
    console.error('置顶操作失败:', error);
    return ApiResponse.serverError(res, '操作失败');
  }
};
