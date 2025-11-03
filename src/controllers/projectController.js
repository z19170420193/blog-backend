const { Project, User, sequelize } = require('../models');
const ApiResponse = require('../utils/response');
const { getPagination } = require('../utils/pagination');
const { Op } = require('sequelize');

/**
 * 项目控制器
 */

/**
 * 获取项目列表（支持筛选和分页）
 */
exports.getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, status, type, featured, tech, keyword } = req.query;
    const { offset, limit: pageLimit } = getPagination(page, limit);

    // 构建查询条件
    const where = {};
    
    // 前台只显示已完成的项目（除非是管理员）
    if (!req.user || req.user.role !== 'admin') {
      where.status = 'completed';
    } else if (status && status !== 'all') {
      where.status = status;
    }

    // 项目类型筛选
    if (type) {
      where.project_type = type;
    }

    // 精选筛选
    if (featured === 'true') {
      where.is_featured = true;
    }

    // 技术栈筛选（JSON 数组查询）
    if (tech) {
      where.tech_stack = {
        [Op.like]: `%"${tech}"%`
      };
    }

    // 关键词搜索
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
        { subtitle: { [Op.like]: `%${keyword}%` } }
      ];
    }

    // 查询项目
    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      limit: pageLimit,
      offset,
      order: [
        ['is_featured', 'DESC'],
        ['display_order', 'DESC'],
        ['created_at', 'DESC']
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar', 'email']
        }
      ],
      distinct: true
    });

    return ApiResponse.successWithPagination(res, projects, { page, limit: pageLimit, total: count }, 'projects');
  } catch (error) {
    next(error);
  }
};

/**
 * 获取项目详情
 */
exports.getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar', 'email']
        }
      ]
    });

    if (!project) {
      return ApiResponse.notFound(res, '项目不存在');
    }

    // 前台只能查看已完成的项目（除非是作者或管理员）
    if (project.status !== 'completed') {
      if (!req.user || (req.user.id !== project.author_id && req.user.role !== 'admin')) {
        return ApiResponse.forbidden(res, '无权访问该项目');
      }
    }

    return ApiResponse.success(res, project, '获取成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 创建项目
 */
exports.createProject = async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      description,
      content,
      cover_image,
      images,
      demo_video,
      tech_stack,
      project_type,
      status,
      github_url,
      demo_url,
      documentation_url,
      start_date,
      end_date,
      duration,
      team_size,
      is_featured,
      is_open_source,
      display_order,
      category,
      tags
    } = req.body;

    // 创建项目
    const project = await Project.create({
      title,
      subtitle,
      description,
      content,
      cover_image,
      images: images || [],
      demo_video,
      tech_stack,
      project_type: project_type || 'web',
      status: status || 'draft',
      github_url,
      demo_url,
      documentation_url,
      start_date,
      end_date,
      duration,
      team_size: team_size || 1,
      is_featured: is_featured || false,
      is_open_source: is_open_source || false,
      display_order: display_order || 0,
      category,
      tags: tags || [],
      author_id: req.user.id
    });

    return ApiResponse.created(res, project, '项目创建成功');
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return ApiResponse.badRequest(res, error.errors[0].message);
    }
    next(error);
  }
};

/**
 * 更新项目
 */
exports.updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);

    if (!project) {
      return ApiResponse.notFound(res, '项目不存在');
    }

    // 检查权限（只有作者或管理员可以编辑）
    if (req.user.id !== project.author_id && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, '无权编辑该项目');
    }

    // 更新字段
    const updateData = { ...req.body };
    delete updateData.author_id; // 防止修改作者
    delete updateData.view_count; // 防止修改浏览量

    await project.update(updateData);

    return ApiResponse.success(res, project, '项目更新成功');
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return ApiResponse.badRequest(res, error.errors[0].message);
    }
    next(error);
  }
};

/**
 * 删除项目
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);

    if (!project) {
      return ApiResponse.notFound(res, '项目不存在');
    }

    // 检查权限
    if (req.user.id !== project.author_id && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, '无权删除该项目');
    }

    await project.destroy();

    return ApiResponse.success(res, null, '项目删除成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 批量删除项目
 */
exports.batchDeleteProjects = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return ApiResponse.badRequest(res, '请提供要删除的项目ID数组');
    }

    // 查询所有项目
    const projects = await Project.findAll({
      where: { id: ids },
      attributes: ['id', 'title', 'author_id']
    });

    // 检查权限
    const canDelete = projects.filter(project => 
      req.user.id === project.author_id || req.user.role === 'admin'
    );

    if (canDelete.length === 0) {
      await t.rollback();
      return ApiResponse.forbidden(res, '无权删除任何项目');
    }

    // 删除项目
    const deletedCount = await Project.destroy({
      where: {
        id: canDelete.map(p => p.id)
      },
      transaction: t
    });

    await t.commit();

    return ApiResponse.success(res, {
      deleted_count: deletedCount,
      total_count: ids.length,
      errors: ids.length > canDelete.length ? '部分项目无权删除已跳过' : null
    }, `成功删除 ${deletedCount} 个项目`);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * 批量更新项目状态
 */
exports.batchUpdateStatus = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return ApiResponse.badRequest(res, '请提供要更新的项目ID数组');
    }

    if (!['completed', 'in_progress', 'archived', 'draft'].includes(status)) {
      return ApiResponse.badRequest(res, '无效的状态值');
    }

    // 查询所有项目
    const projects = await Project.findAll({
      where: { id: ids },
      attributes: ['id', 'author_id']
    });

    // 检查权限
    const canUpdate = projects.filter(project => 
      req.user.id === project.author_id || req.user.role === 'admin'
    );

    if (canUpdate.length === 0) {
      await t.rollback();
      return ApiResponse.forbidden(res, '无权更新任何项目');
    }

    // 更新状态
    const [affectedCount] = await Project.update(
      { status },
      {
        where: {
          id: canUpdate.map(p => p.id)
        },
        transaction: t
      }
    );

    await t.commit();

    return ApiResponse.success(res, {
      affected_count: affectedCount,
      total_count: ids.length
    }, `成功更新 ${affectedCount} 个项目状态`);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * 批量设置精选
 */
exports.batchUpdateFeatured = async (req, res, next) => {
  try {
    const { ids, is_featured } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return ApiResponse.badRequest(res, '请提供要更新的项目ID数组');
    }

    // 仅管理员可以设置精选
    if (req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, '仅管理员可以设置精选项目');
    }

    const [affectedCount] = await Project.update(
      { is_featured: is_featured === true },
      { where: { id: ids } }
    );

    return ApiResponse.success(res, {
      affected_count: affectedCount
    }, `成功${is_featured ? '设置' : '取消'}精选 ${affectedCount} 个项目`);
  } catch (error) {
    next(error);
  }
};

/**
 * 增加浏览量
 */
exports.incrementView = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return ApiResponse.notFound(res, '项目不存在');
    }

    await project.increment('view_count', { by: 1 });

    return ApiResponse.success(res, { view_count: project.view_count + 1 }, '浏览量已增加');
  } catch (error) {
    next(error);
  }
};

/**
 * 获取技术栈统计
 */
exports.getTechStackStats = async (req, res, next) => {
  try {
    const projects = await Project.findAll({
      where: { status: 'completed' },
      attributes: ['tech_stack']
    });

    // 统计技术栈出现频率
    const techStats = {};
    projects.forEach(project => {
      if (Array.isArray(project.tech_stack)) {
        project.tech_stack.forEach(tech => {
          techStats[tech] = (techStats[tech] || 0) + 1;
        });
      }
    });

    // 转换为数组并排序
    const stats = Object.entries(techStats)
      .map(([tech, count]) => ({ tech, count }))
      .sort((a, b) => b.count - a.count);

    return ApiResponse.success(res, stats, '获取技术栈统计成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 获取项目时间线（按年份分组）
 */
exports.getProjectTimeline = async (req, res, next) => {
  try {
    const projects = await Project.findAll({
      where: { status: 'completed' },
      order: [['start_date', 'DESC']],
      attributes: ['id', 'title', 'subtitle', 'start_date', 'end_date', 'cover_image', 'tech_stack', 'project_type']
    });

    // 按年份分组
    const timeline = {};
    projects.forEach(project => {
      if (project.start_date) {
        const year = new Date(project.start_date).getFullYear();
        if (!timeline[year]) {
          timeline[year] = [];
        }
        timeline[year].push(project);
      }
    });

    // 转换为数组格式
    const result = Object.entries(timeline)
      .map(([year, projects]) => ({ year: parseInt(year), projects }))
      .sort((a, b) => b.year - a.year);

    return ApiResponse.success(res, result, '获取项目时间线成功');
  } catch (error) {
    next(error);
  }
};
