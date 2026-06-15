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
 *
 * 解析协议遵循 W3C SSE 规范：
 *   - 事件之间以空行（\n\n 或 \r\n\r\n）分隔
 *   - 每个事件由若干字段行组成：event: / data: / id: / retry:
 *   - 同一个事件内的多行 data: 字段必须按 \n 拼接
 *   - 一次 reader.read() 可能返回多个完整事件，必须循环处理直到 buffer 中再无完整事件
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

  return new Promise((resolve) => {
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
        // 使用 utf-8 解码，避免多字节字符截断（中文/Emoji）
        const decoder = new TextDecoder('utf-8')
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              // 流正常结束 — 处理残留缓冲（兼容服务端最后一帧没有 \n\n 的情况）
              if (buffer.trim()) {
                // 强制以空行收尾，确保最后一帧能被解析出来
                buffer += '\n\n'
                buffer = drainEvents(buffer, onEvent)
              }
              if (onDone) onDone()
              resolve()
              break
            }

            // 累加新片段
            buffer += decoder.decode(value, { stream: true })
            // 把已经成型的事件全部消费掉，剩下的不完整片段继续留在 buffer
            buffer = drainEvents(buffer, onEvent)
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
 * 从 buffer 中反复抽取所有"以空行结束"的完整事件并交给 onEvent 处理。
 * 返回剩余的、尚不完整的 buffer 片段。
 *
 * SSE 协议：
 *   一个事件 = 若干字段行 + 一个空行（"\n\n" 或 "\r\n\r\n"）
 *   字段行：event: <type> / data: <payload> / id: <id> / retry: <ms>
 *   注意：data 可以出现多次，按 "\n" 拼接成最终 payload
 *
 * @param {string} buffer  - 当前缓冲区
 * @param {function} onEvent - 事件回调 (eventType, parsedData) => void
 * @returns {string} 剩余未处理的缓冲区片段
 */
function drainEvents(buffer, onEvent) {
  // 兼容 \r\n\r\n 与 \n\n 两种分隔
  // 先把 \r\n 统一为 \n，简化后续处理
  let working = buffer.replace(/\r\n/g, '\n')

  // 循环抽取以 \n\n 结尾的完整事件
  while (true) {
    const sepIdx = working.indexOf('\n\n')
    if (sepIdx === -1) break

    const rawEvent = working.slice(0, sepIdx)
    working = working.slice(sepIdx + 2)

    parseAndEmit(rawEvent, onEvent)
  }

  return working
}

/**
 * 解析单个 SSE 事件文本块，并触发 onEvent 回调。
 *
 * @param {string} rawEvent - 单个事件的原始文本（不含末尾空行）
 * @param {function} onEvent - 事件回调
 */
function parseAndEmit(rawEvent, onEvent) {
  if (!rawEvent || !rawEvent.trim()) return

  let eventType = 'message' // SSE 默认事件名
  let dataLines = []

  const lines = rawEvent.split('\n')
  for (const line of lines) {
    if (line === '' || line.startsWith(':')) {
      // 空行/注释行：跳过（SSE 中以 ':' 开头是注释）
      continue
    }

    // SSE 字段格式：<field>: <value>，冒号后允许有一个空格
    const colonIdx = line.indexOf(':')
    let field
    let value
    if (colonIdx === -1) {
      // 没有冒号：整行视为字段名，value 空
      field = line
      value = ''
    } else {
      field = line.slice(0, colonIdx)
      value = line.slice(colonIdx + 1)
      // 去掉冒号后的第一个空格（SSE 规范）
      if (value.startsWith(' ')) value = value.slice(1)
    }

    if (field === 'event') {
      eventType = value
    } else if (field === 'data') {
      // data 可以多行，按 \n 拼接
      dataLines.push(value)
    }
    // id / retry 字段在本场景中不使用，忽略
  }

  if (dataLines.length === 0) {
    // 没有 data 字段：无意义事件，跳过
    return
  }

  const dataStr = dataLines.join('\n')

  let parsed
  try {
    parsed = JSON.parse(dataStr)
  } catch (e) {
    // JSON 解析失败时不要静默丢弃，保留原始字符串作为兜底，便于排查
    console.warn('[SSE] JSON 解析失败，原始 data:', dataStr, e)
    parsed = dataStr
  }

  if (onEvent) {
    try {
      onEvent(eventType, parsed)
    } catch (cbErr) {
      console.error('[SSE] onEvent 回调抛出异常:', cbErr)
    }
  }
}

export default sseRequest
