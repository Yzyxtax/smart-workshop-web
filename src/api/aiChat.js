import request from '@/utils/request'
import { sseRequest } from '@/utils/sse'

/**
 * AI 聊天 API
 *
 * 对应后端接口：
 * - POST   /ai/chat/sessions             创建新会话
 * - GET    /ai/chat/sessions             获取会话列表
 * - GET    /ai/chat/sessions/{id}        获取会话详情（含消息历史）
 * - DELETE /ai/chat/sessions/{id}        删除会话
 * - POST   /ai/chat/sessions/{id}/messages  发送消息（SSE 流式响应）
 */

// 创建新会话（POST /ai/chat/sessions）
export const createSessionApi = (body = {}) =>
  request.post('/ai/chat/sessions', body)

// 获取会话列表（GET /ai/chat/sessions）
export const listSessionsApi = () =>
  request.get('/ai/chat/sessions')

// 获取会话详情（GET /ai/chat/sessions/{id}）
export const getSessionApi = (id) =>
  request.get(`/ai/chat/sessions/${id}`)

// 删除会话（DELETE /ai/chat/sessions/{id}）
export const deleteSessionApi = (id) =>
  request.delete(`/ai/chat/sessions/${id}`)

/**
 * 发送消息（SSE 流式响应）
 *
 * @param {number|string} id       - 会话 ID
 * @param {object} body            - 请求体，如 { content: "用户输入内容" }
 * @param {object} handlers        - SSE 事件处理器
 * @param {function} handlers.onEvent  - (eventType, data) => void
 * @param {function} handlers.onError  - (error) => void
 * @param {function} handlers.onDone   - () => void
 * @param {AbortSignal} handlers.signal - 中断信号
 * @returns {Promise<void>}
 */
export const sendMessageSse = (id, body, handlers) =>
  sseRequest(`/api/ai/chat/sessions/${id}/messages`, body, handlers)
