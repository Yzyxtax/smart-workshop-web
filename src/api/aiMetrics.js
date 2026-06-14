import request from '@/utils/request'

/**
 * AI 监控指标 API
 *
 * 对应后端接口：
 * - GET /ai/metrics  获取运行指标
 */

// 获取监控指标（GET /ai/metrics）
export const getMetricsApi = () =>
  request.get('/ai/metrics')
