const { body, param, query, validationResult } = require('express-validator');
const ApiResponse = require('../utils/response');

/**
 * 验证结果处理中间件
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return ApiResponse.badRequest(res, '请求参数验证失败', formattedErrors);
  }
  
  next();
};

/**
 * 用户注册验证规则
 */
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6, max: 50 })
    .withMessage('密码长度必须在6-50个字符之间')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('密码必须包含字母和数字'),
  
  handleValidationErrors
];

/**
 * 用户登录验证规则
 */
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
  
  handleValidationErrors
];

/**
 * 文章创建/更新验证规则
 */
const articleValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('标题长度必须在1-200个字符之间'),
  
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('内容不能为空'),
  
  body('summary')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('摘要不能超过500个字符'),
  
  body('cover_image')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      // 允许空值、空字符串或有效的 URL
      if (!value || value === '') {
        return true;
      }
      // 简单的 URL 验证
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    })
    .withMessage('封面图必须是有效的URL'),
  
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('分类ID必须是正整数'),
  
  body('tag_ids')
    .optional()
    .isArray()
    .withMessage('标签ID必须是数组')
    .custom((value) => {
      if (value && value.length > 0) {
        return value.every(id => Number.isInteger(id) && id > 0);
      }
      return true;
    })
    .withMessage('标签ID必须是正整数数组'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('状态必须是 draft 或 published'),
  
  body('is_top')
    .optional()
    .isBoolean()
    .withMessage('置顶标识必须是布尔值'),
  
  handleValidationErrors
];

/**
 * 分类创建/更新验证规则
 */
const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('分类名称长度必须在1-50个字符之间'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('描述不能超过500个字符'),
  
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('排序值必须是非负整数'),
  
  handleValidationErrors
];

/**
 * 标签创建/更新验证规则
 */
const tagValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('标签名称长度必须在1-50个字符之间'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('颜色必须是有效的十六进制颜色码'),
  
  handleValidationErrors
];

/**
 * 评论创建验证规则
 */
const commentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('评论内容长度必须在1-1000个字符之间'),
  
  body('nickname')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('昵称长度必须在1-50个字符之间'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),
  
  body('parent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('父评论ID必须是正整数'),
  
  handleValidationErrors
];

/**
 * ID 参数验证
 */
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID必须是正整数'),
  
  handleValidationErrors
];

/**
 * 分页查询验证
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  
  handleValidationErrors
];

/**
 * 批量删除验证
 */
const batchDeleteValidation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('IDs必须是非空数组')
    .custom((value) => {
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('IDs必须是正整数数组'),
  
  handleValidationErrors
];

/**
 * 批量更新状态验证
 */
const batchUpdateStatusValidation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('IDs必须是非空数组')
    .custom((value) => {
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('IDs必须是正整数数组'),
  
  body('status')
    .isIn(['draft', 'published'])
    .withMessage('状态必须是 draft 或 published'),
  
  handleValidationErrors
];

/**
 * 批量更新置顶验证
 */
const batchUpdateTopValidation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('IDs必须是非空数组')
    .custom((value) => {
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('IDs必须是正整数数组'),
  
  body('is_top')
    .isBoolean()
    .withMessage('is_top 必须是布尔值'),
  
  handleValidationErrors
];

/**
 * 批量更新排序验证（分类模块）
 */
const batchUpdateOrderValidation = [
  body('orders')
    .isArray({ min: 1 })
    .withMessage('orders必须是非空数组'),
  
  body('orders.*.id')
    .isInt({ min: 1 })
    .withMessage('分类ID必须是正整数'),
  
  body('orders.*.sort_order')
    .isInt({ min: 0 })
    .withMessage('排序值必须是非负整数'),
  
  handleValidationErrors
];

/**
 * 批量合并分类验证
 */
const batchMergeCategoriesValidation = [
  body('source_ids')
    .isArray({ min: 1 })
    .withMessage('source_ids必须是非空数组')
    .custom((value) => {
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('source_ids必须是正整数数组'),
  
  body('target_id')
    .isInt({ min: 1 })
    .withMessage('target_id必须是正整数'),
  
  handleValidationErrors
];

/**
 * 批量合并标签验证
 */
const batchMergeTagsValidation = [
  body('source_ids')
    .isArray({ min: 1 })
    .withMessage('source_ids必须是非空数组')
    .custom((value) => {
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('source_ids必须是正整数数组'),
  
  body('target_id')
    .isInt({ min: 1 })
    .withMessage('target_id必须是正整数'),
  
  handleValidationErrors
];

/**
 * 批量更新标签颜色验证
 */
const batchUpdateTagColorValidation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('ids必须是非空数组')
    .custom((value) => {
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('ids必须是正整数数组'),
  
  body('color')
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('颜色必须是有效的十六进制颜色码'),
  
  handleValidationErrors
];

/**
 * 批量删除评论验证
 */
const batchDeleteCommentsValidation = [
  body('commentIds')
    .isArray({ min: 1 })
    .withMessage('commentIds必须是非空数组')
    .custom((value) => {
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('commentIds必须是正整数数组'),
  
  handleValidationErrors
];

/**
 * 批量审核评论验证
 */
const batchApproveCommentsValidation = [
  body('commentIds')
    .isArray({ min: 1 })
    .withMessage('commentIds必须是非空数组')
    .custom((value) => {
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('commentIds必须是正整数数组'),
  
  body('isApproved')
    .isBoolean()
    .withMessage('isApproved 必须是布尔值'),
  
  handleValidationErrors
];

/**
 * 说说创建/更新验证规则
 */
const momentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('说说内容长度必须在1-1000个字符之间'),
  
  body('images')
    .optional()
    .isArray({ max: 9 })
    .withMessage('图片必须是数组，且最多9张')
    .custom((value) => {
      if (value && value.length > 0) {
        return value.every(url => typeof url === 'string' && url.length > 0);
      }
      return true;
    })
    .withMessage('图片URL必须是非空字符串数组'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('位置信息不能超过200个字符'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'friends'])
    .withMessage('可见性必须是 public, private 或 friends'),
  
  handleValidationErrors
];

/**
 * 说说置顶验证
 */
const momentTogglePinValidation = [
  body('is_pinned')
    .isBoolean()
    .withMessage('is_pinned 必须是布尔值'),
  
  handleValidationErrors
];

/**
 * 项目创建/更新验证规则
 */
const projectValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('项目名称不能为空')
    .isLength({ min: 1, max: 200 }).withMessage('项目名称长度应在1-200字符之间'),
  
  body('subtitle')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('副标题不能超过300字符'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('项目简介不能为空'),
  
  body('content')
    .optional()
    .trim(),
  
  body('cover_image')
    .optional()
    .custom((value) => !value || /^https?:\/\/.+/.test(value)).withMessage('封面图必须是有效的URL'),
  
  body('images')
    .optional()
    .isArray().withMessage('项目截图必须是数组')
    .custom((value) => !value || value.length <= 10).withMessage('最多只能上传10张截图'),
  
  body('demo_video')
    .optional()
    .custom((value) => !value || /^https?:\/\/.+/.test(value)).withMessage('演示视频必须是有效的URL'),
  
  body('tech_stack')
    .isArray({ min: 1 }).withMessage('至少需要一个技术栈')
    .custom((value) => value.every(item => typeof item === 'string')).withMessage('技术栈必须是字符串数组'),
  
  body('project_type')
    .optional()
    .isIn(['web', 'mobile', 'desktop', 'backend', 'fullstack', 'other']).withMessage('无效的项目类型'),
  
  body('status')
    .optional()
    .isIn(['completed', 'in_progress', 'archived', 'draft']).withMessage('无效的状态值'),
  
  body('github_url')
    .optional()
    .custom((value) => !value || /^https?:\/\/.+/.test(value)).withMessage('GitHub地址必须是有效的URL'),
  
  body('demo_url')
    .optional()
    .custom((value) => !value || /^https?:\/\/.+/.test(value)).withMessage('演示地址必须是有效的URL'),
  
  body('documentation_url')
    .optional()
    .custom((value) => !value || /^https?:\/\/.+/.test(value)).withMessage('文档地址必须是有效的URL'),
  
  body('start_date')
    .notEmpty().withMessage('开始日期不能为空')
    .isISO8601().withMessage('开始日期格式不正确'),
  
  body('end_date')
    .notEmpty().withMessage('结束日期不能为空')
    .isISO8601().withMessage('结束日期格式不正确'),
  
  body('duration')
    .optional()
    .isInt({ min: 0 }).withMessage('开发周期必须大于等于0'),
  
  body('team_size')
    .optional()
    .isInt({ min: 1 }).withMessage('团队规模必须大于等于1'),
  
  body('is_featured')
    .optional()
    .isBoolean().withMessage('精选标记必须是布尔值'),
  
  body('is_open_source')
    .optional()
    .isBoolean().withMessage('开源标记必须是布尔值'),
  
  body('display_order')
    .optional()
    .isInt().withMessage('显示顺序必须是整数'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('项目分类不能超过50字符'),
  
  body('tags')
    .optional()
    .isArray().withMessage('标签必须是数组'),
  
  handleValidationErrors
];

/**
 * 项目更新验证规则（简化版）
 */
const projectUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('项目名称不能为空')
    .isLength({ min: 1, max: 200 }).withMessage('项目名称长度应在1-200字符之间'),
  
  body('tech_stack')
    .optional()
    .isArray({ min: 1 }).withMessage('至少需要一个技术栈'),
  
  handleValidationErrors
];

/**
 * 项目批量更新状态验证
 */
const projectBatchUpdateStatusValidation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('ids必须是非空数组')
    .custom((value) => {
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('ids必须是正整数数组'),
  
  body('status')
    .isIn(['completed', 'in_progress', 'archived', 'draft'])
    .withMessage('状态必须是 completed, in_progress, archived 或 draft'),
  
  handleValidationErrors
];

/**
 * 项目批量设置精选验证
 */
const projectBatchUpdateFeaturedValidation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('ids必须是非空数组')
    .custom((value) => {
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('ids必须是正整数数组'),
  
  body('is_featured')
    .isBoolean()
    .withMessage('is_featured 必须是布尔值'),
  
  handleValidationErrors
];

/**
 * 项目查询验证
 */
const projectQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量应在1-50之间'),
  query('status').optional().isIn(['completed', 'in_progress', 'archived', 'draft', 'all']),
  query('type').optional().isIn(['web', 'mobile', 'desktop', 'backend', 'fullstack', 'other']),
  query('featured').optional().isBoolean(),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  articleValidation,
  categoryValidation,
  tagValidation,
  commentValidation,
  idValidation,
  paginationValidation,
  batchDeleteValidation,
  batchUpdateStatusValidation,
  batchUpdateTopValidation,
  batchUpdateOrderValidation,
  batchMergeCategoriesValidation,
  batchMergeTagsValidation,
  batchUpdateTagColorValidation,
  batchDeleteCommentsValidation,
  batchApproveCommentsValidation,
  momentValidation,
  momentTogglePinValidation,
  projectValidation,
  projectUpdateValidation,
  projectBatchUpdateStatusValidation,
  projectBatchUpdateFeaturedValidation,
  projectQueryValidation
};
