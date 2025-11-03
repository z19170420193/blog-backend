const { Message, User } = require('../models');
const ApiResponse = require('../utils/response');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPagination } = require('../utils/pagination');
const { Op } = require('sequelize');

// 随机颜色列表
const COLORS = [
  '#FFE4E1', '#E6E6FA', '#F0E68C', '#E0FFFF', '#FFE4B5',
  '#FFDAB9', '#E0E0E0', '#F5F5DC', '#FFF0F5', '#F0FFF0'
];

/**
 * 获取所有留言列表（公开）
 * GET /api/v1/messages
 */
exports.getAllMessages = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { keyword, mood } = req.query;

  // 构建查询条件
  const where = {
    status: 'approved', // 只显示已审核通过的留言
    reply_to_id: null // 只显示主留言，不包括回复
  };

  // 关键字搜索（留言内容或昵称）
  if (keyword) {
    where[Op.or] = [
      { content: { [Op.like]: `%${keyword}%` } },
      { nickname: { [Op.like]: `%${keyword}%` } }
    ];
  }

  // 心情筛选
  if (mood) {
    where.mood = mood;
  }

  const { count, rows } = await Message.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar', 'email']
      },
      {
        model: Message,
        as: 'replies',
        where: { status: 'approved' },
        required: false,
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

  return ApiResponse.successWithPagination(res, rows, { page, limit, total: count }, 'messages');
});

/**
 * 获取所有留言列表（管理后台）
 * GET /api/v1/messages/admin
 */
exports.getAdminMessages = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { keyword, status } = req.query;

  // 构建查询条件
  const where = {};

  // 关键字搜索
  if (keyword) {
    where[Op.or] = [
      { content: { [Op.like]: `%${keyword}%` } },
      { nickname: { [Op.like]: `%${keyword}%` } }
    ];
  }

  // 状态筛选
  if (status && status !== 'all') {
    where.status = status;
  }

  const { count, rows } = await Message.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar', 'email']
      },
      {
        model: Message,
        as: 'reply_to',
        attributes: ['id', 'content', 'nickname']
      }
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset
  });

  return ApiResponse.successWithPagination(res, rows, { page, limit, total: count }, 'messages');
});

/**
 * 创建留言
 * POST /api/v1/messages
 */
exports.createMessage = asyncHandler(async (req, res) => {
  const { content, nickname, email, mood, reply_to_id } = req.body;

  // 未登录用户必顾提供 nickname
  if (!req.user && !nickname) {
    return ApiResponse.badRequest(res, '请提供昵称');
  }

  // 如果有回复目标，检查是否存在
  if (reply_to_id) {
    const replyToMessage = await Message.findByPk(reply_to_id);
    if (!replyToMessage) {
      return ApiResponse.badRequest(res, '回复的留言不存在');
    }
  }

  // 获取IP和浏览器信息
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  const browser = req.headers['user-agent'];

  // 随机选择卡片颜色
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  const message = await Message.create({
    user_id: req.user?.id || null,
    nickname: nickname || req.user?.username || '匿名用户',
    email: email || req.user?.email || null,
    avatar: req.user?.avatar || null,
    content,
    mood: mood || 'happy',
    reply_to_id: reply_to_id || null,
    ip: ip ? ip.split(',')[0].trim() : null,
    browser,
    color,
    status: req.user ? 'approved' : 'pending' // 登录用户自动审核通过
  });

  // 重新查询返回完整数据
  const newMessage = await Message.findByPk(message.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar']
      }
    ]
  });

  return ApiResponse.created(res, newMessage, '留言发表成功');
});

/**
 * 更新留言（仅作者或管理员）
 * PUT /api/v1/messages/:id
 */
exports.updateMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, mood } = req.body;

  const message = await Message.findByPk(id);
  if (!message) {
    return ApiResponse.notFound(res, '留言不存在');
  }

  // 检查权限：只能修改自己的留言，或管理员可修改所有
  if (message.user_id !== req.user.id && req.user.role !== 'admin') {
    return ApiResponse.forbidden(res, '无权修改此留言');
  }

  if (content) message.content = content;
  if (mood) message.mood = mood;
  await message.save();

  return ApiResponse.success(res, message, '留言更新成功');
});

/**
 * 删除留言（仅作者或管理员）
 * DELETE /api/v1/messages/:id
 */
exports.deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const message = await Message.findByPk(id);
  if (!message) {
    return ApiResponse.notFound(res, '留言不存在');
  }

  // 检查权限
  if (message.user_id !== req.user.id && req.user.role !== 'admin') {
    return ApiResponse.forbidden(res, '无权删除此留言');
  }

  // 删除留言及其所有回复
  await Message.destroy({
    where: {
      [Op.or]: [
        { id: id },
        { reply_to_id: id }
      ]
    }
  });

  return ApiResponse.success(res, null, '留言删除成功');
});

/**
 * 审核留言（仅管理员）
 * PUT /api/v1/messages/:id/status
 */
exports.updateMessageStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const message = await Message.findByPk(id);
  if (!message) {
    return ApiResponse.notFound(res, '留言不存在');
  }

  message.status = status;
  await message.save();

  const statusText = {
    approved: '已通过',
    rejected: '已拒绝',
    pending: '待审核'
  }[status];

  return ApiResponse.success(res, message, `留言${statusText}`);
});

/**
 * 点赞留言
 * POST /api/v1/messages/:id/like
 */
exports.likeMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const message = await Message.findByPk(id);
  if (!message) {
    return ApiResponse.notFound(res, '留言不存在');
  }

  message.likes += 1;
  await message.save();

  return ApiResponse.success(res, { likes: message.likes }, '点赞成功');
});

/**
 * 批量删除留言（仅管理员）
 * POST /api/v1/messages/batch-delete
 */
exports.batchDeleteMessages = asyncHandler(async (req, res) => {
  const { messageIds } = req.body;
  const { sequelize } = require('../models');

  const transaction = await sequelize.transaction();

  try {
    let successCount = 0;
    const failures = [];

    for (const messageId of messageIds) {
      try {
        const message = await Message.findByPk(messageId, { transaction });
        
        if (!message) {
          failures.push({
            messageId,
            reason: '留言不存在'
          });
          continue;
        }

        // 删除留言及其回复
        await Message.destroy({
          where: {
            [Op.or]: [
              { id: messageId },
              { reply_to_id: messageId }
            ]
          },
          transaction
        });
        successCount++;
      } catch (error) {
        console.error(`删除留言 ${messageId} 失败:`, error.message);
        failures.push({
          messageId,
          reason: error.message || '删除失败'
        });
      }
    }

    await transaction.commit();

    return ApiResponse.success(
      res,
      {
        successCount,
        totalCount: messageIds.length,
        failures
      },
      `成功删除 ${successCount} 条留言`
    );
  } catch (error) {
    await transaction.rollback();
    console.error('批量删除留言失败:', error);
    return ApiResponse.error(res, '批量删除失败');
  }
});

/**
 * 批量审核留言（仅管理员）
 * POST /api/v1/messages/batch-approve
 */
exports.batchApproveMessages = asyncHandler(async (req, res) => {
  const { messageIds, status } = req.body;
  const { sequelize } = require('../models');

  const transaction = await sequelize.transaction();

  try {
    const [affectedCount] = await Message.update(
      { status },
      {
        where: {
          id: messageIds
        },
        transaction
      }
    );

    const updatedMessages = await Message.findAll({
      where: {
        id: messageIds
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ],
      transaction
    });

    await transaction.commit();

    const statusText = {
      approved: '审核通过',
      rejected: '拒绝',
      pending: '设为待审核'
    }[status];

    return ApiResponse.success(
      res,
      {
        affectedCount,
        messages: updatedMessages
      },
      `成功${statusText} ${affectedCount} 条留言`
    );
  } catch (error) {
    await transaction.rollback();
    console.error('批量审核留言失败:', error);
    return ApiResponse.error(res, '批量审核失败');
  }
});

/**
 * 获取留言统计（仅管理员）
 * GET /api/v1/messages/stats
 */
exports.getMessageStats = asyncHandler(async (req, res) => {
  const total = await Message.count();
  const pending = await Message.count({ where: { status: 'pending' } });
  const approved = await Message.count({ where: { status: 'approved' } });
  const rejected = await Message.count({ where: { status: 'rejected' } });

  return ApiResponse.success(res, {
    total,
    pending,
    approved,
    rejected
  }, '统计获取成功');
});
