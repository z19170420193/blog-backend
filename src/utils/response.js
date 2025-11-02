/**
 * 统一响应格式工具
 */

class ApiResponse {
  // 成功响应
  static success(res, data = null, message = 'success', code = 200) {
    return res.status(code).json({
      code,
      message,
      data
    });
  }

  // 失败响应
  static error(res, message = 'error', code = 500, data = null) {
    return res.status(code).json({
      code,
      message,
      data
    });
  }

  // 分页成功响应
  static successWithPagination(res, data, pagination, resourceName = 'items') {
    return res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        [resourceName]: data,        // 语义化的资源名称（articles, comments等）
        items: data,                  // 保留通用字段，向后兼容
        page: pagination.page,        // 扁平化分页信息
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit)
      }
    });
  }

  // 创建成功
  static created(res, data, message = '创建成功') {
    return this.success(res, data, message, 201);
  }

  // 未授权
  static unauthorized(res, message = '未授权，请先登录') {
    return this.error(res, message, 401);
  }

  // 禁止访问
  static forbidden(res, message = '没有权限访问') {
    return this.error(res, message, 403);
  }

  // 未找到
  static notFound(res, message = '资源不存在') {
    return this.error(res, message, 404);
  }

  // 请求参数错误
  static badRequest(res, message = '请求参数错误', errors = null) {
    return this.error(res, message, 400, errors);
  }

  // 服务器内部错误
  static serverError(res, message = '服务器内部错误') {
    return this.error(res, message, 500);
  }
}

module.exports = ApiResponse;
