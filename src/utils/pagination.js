/**
 * 分页工具函数
 */

/**
 * 获取分页参数
 * @param {Object} query - 请求查询参数
 * @returns {Object} - { page, limit, offset }
 */
function getPagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * 格式化分页数据
 * @param {Array} items - 数据列表
 * @param {Number} total - 总数
 * @param {Number} page - 当前页
 * @param {Number} limit - 每页数量
 * @returns {Object} - 格式化后的分页数据
 */
function formatPaginationData(items, total, page, limit) {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  getPagination,
  formatPaginationData
};
