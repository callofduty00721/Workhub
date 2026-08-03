export function parsePagination(query, { defaultLimit = 12, maxLimit = 50 } = {}) {
  const pageNum = Math.max(1, parseInt(query.page, 10) || 1);
  const limitNum = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
}

export function paginationMeta(pageNum, limitNum, total) {
  return { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) };
}
