import request from '@/utils/request'

/**
 * AI 审计日志 API
 *
 * 对应后端接口：
 * - GET /ai/audit      查询审计日志列表（支持筛选 + 分页）
 * - GET /ai/audit/{id} 查询审计日志详情
 */

// 查询审计日志列表（GET /ai/audit?userId=&toolName=&startTime=&endTime=&success=&page=&pageSize=）
export const queryAuditApi = (params = {}) =>
  request.get('/ai/audit', { params })

// 查询审计日志详情（GET /ai/audit/{id}）
export const getAuditDetailApi = (id) =>
  request.get(`/ai/audit/${id}`)
