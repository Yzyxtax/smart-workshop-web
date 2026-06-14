/**
 * SSE (Server-Sent Events) 客户端工具
 *
 * 使用 fetch + ReadableStream 解析 SSE 事件流，
 * 支持 onEvent / onError / onDone 回调 + AbortController 中断。
 *
 * 对应后端接口：POST /ai/chat/sessions/{id}/messages
 * 响应 Content-Type: text/event-stream
 *
 * SSE 事件类型（详见 §A.2）：
 *   thinking    — AI 开始思考（展示三点呼吸动画）
 *   text_delta  — 流式文本片段（打字机追加）
 *   tool_call   — 工具调用开始（插入 pending 工具卡片）
 *   tool_result — 工具调用结果（更新卡片为 success/failure）
 *   done        — 流结束（写入 token 用量，恢复输入区）
 *   error       — 异常终止（渲染错误卡片）
 */

/**
 * 发起 SSE 请求
 *
 * @param {string} url       - 请求 URL（完整路径，如 /api/ai/chat/sessions/1/messages）
 * @param {object} body      - POST 请求体（JSON）
 * @param {object} handlers  - 事件处理器
 * @param {function} handlers.onEvent    - (eventType: string, data: any) => void
 * @param {function} handlers.onError    - (error: Error) => void
 * @param {function} handlers.onDone     - () => void
 * @param {AbortSignal} handlers.signal  - 外部 AbortController 信号（用于中断）
 * @returns {Promise<void>}
 */
export function sseRequest(url, body, { onEvent, onError, onDone, signal } = {}) {
  // 从 localStorage 获取 token（与 request.js 保持一致）
  const user = JSON.parse(localStorage.getItem('user'))
  const token = user?.token ?? ''

  return new Promise((resolve, reject) => {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token
      },
      body: JSON.stringify(body),
      signal
    })
      .then(async (response) => {
        // 401 未授权 — 统一跳转登录页
        if (response.status === 401) {
          localStorage.removeItem('user')
          window.location.href = '/login'
          return
        }

        // 非 200 响应 — 尝试解析错误 JSON 后抛出错卡片
        if (!response.ok) {
          let errorMsg = `请求失败 (HTTP ${response.status})`
          try {
            const errBody = await response.json()
            errorMsg = errBody.message || errorMsg
          } catch (_) {
            // 忽略 JSON 解析失败，使用默认消息
          }
          if (onError) {
            onError(new Error(errorMsg))
          }
          resolve()
          return
        }

        // 读取 SSE 流
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              // 流正常结束
              if (buffer.trim()) {
                // 处理残留数据
                processBuffer(buffer, onEvent)
              }
              if (onDone) onDone()
              resolve()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            buffer = processBuffer(buffer, onEvent)
          }
        } catch (err) {
          if (err.name === 'AbortError') {
            // 用户主动中断 — 静默处理
            resolve()
            return
          }
          // 网络错误 / 读取中断
          if (onError) {
            onError(new Error('连接中断，请检查网络'))
          }
          resolve()
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          // fetch 层面的 AbortError — 静默处理
          resolve()
          return
        }
        // 网络层面的错误
        if (onError) {
          onError(new Error('连接中断，请检查网络'))
        }
        resolve()
      })
  })
}

/**
 * 处理 SSE 缓冲区，提取完整事件行
 *
 * SSE 协议格式：
 *   event: <type>\n
 *   data: <json>\n\n
 *
 * @param {string} buffer  - 当前缓冲区
 * @param {function} onEvent - 事件回调
 * @returns {string} 剩余未处理缓冲区
 */
function processBuffer(buffer, onEvent) {
  const lines = buffer.split('\n')
  let remaining = ''

  let currentEvent = ''
  let currentData = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 空行 = 事件结束标记
    if (line === '' || line === '\r') {
      if (currentEvent && currentData) {
        try {
          const parsed = JSON.parse(currentData)
          if (onEvent) {
            onEvent(currentEvent, parsed)
          }
        } catch (_) {
          // JSON 解析失败 — 跳过该事件
          console.warn('[SSE] JSON 解析失败:', currentData)
        }
      }
      currentEvent = ''
      currentData = ''
      continue
    }

    // 去掉行尾的 \r
    const cleanLine = line.endsWith('\r') ? line.slice(0, -1) : line

    if (cleanLine.startsWith('event:')) {
      currentEvent = cleanLine.slice(6).trim()
    } else if (cleanLine.startsWith('data:')) {
      currentData = cleanLine.slice(5).trim()
    } else {
      // 其他行：可能是 data 的续行，追加到 currentData
      if (currentData) {
        currentData += '\n' + cleanLine
      }
    }
  }

  // 最后一个事件可能不完整（没有空行结束），保留在缓冲区
  // 但 SSE 标准要求以空行结尾，这里简单处理
  if (currentEvent || currentData) {
    remaining = currentEvent ? `event:${currentEvent}\ndata:${currentData}\n` : ''
  }

  return remaining
}

export default sseRequest
