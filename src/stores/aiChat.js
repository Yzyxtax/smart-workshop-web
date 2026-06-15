import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  createSessionApi,
  listSessionsApi,
  getSessionApi,
  deleteSessionApi,
  sendMessageSse
} from '@/api/aiChat'

/**
 * AI 聊天 Store (setup store 风格)
 *
 * 管理：
 * - 会话列表 + 当前选中会话
 * - 消息流（支持 SSE 流式追加）
 * - 抽屉 / 全屏 / 列表折叠 UI 状态
 * - 流式传输状态（streaming / abort）
 */
export const useAiChatStore = defineStore('aiChat', () => {
  // ==================== 会话状态 ====================
  /** 会话列表 */
  const sessions = ref([])
  /** 当前选中会话 ID */
  const currentSessionId = ref(null)
  /** 会话列表加载状态 */
  const sessionsLoading = ref(false)
  /** 会话列表错误信息 */
  const sessionsError = ref('')

  // ==================== 消息状态 ====================
  /** 当前会话的消息列表 */
  const messages = ref([])
  /** 消息加载状态 */
  const messagesLoading = ref(false)

  // ==================== 流式传输状态 ====================
  /** 是否正在接收 SSE 流 */
  const streaming = ref(false)
  /** AbortController 实例（用于中断 SSE） */
  const abortController = ref(null)

  // ==================== UI 状态 ====================
  /** 抽屉是否打开 */
  const drawerOpen = ref(false)
  /** 是否全屏 */
  const fullscreen = ref(false)
  /** 会话列表是否折叠 */
  const listCollapsed = ref(false)
  /** 抽屉宽度（px） */
  const drawerWidth = ref(480)

  // ==================== 计算属性 ====================
  /** 当前会话对象 */
  const currentSession = computed(() =>
    sessions.value.find(s => s.id === currentSessionId.value) ?? null
  )

  // ==================== 会话操作 ====================

  /**
   * 加载会话列表
   */
  const loadSessions = async () => {
    sessionsLoading.value = true
    sessionsError.value = ''
    try {
      const result = await listSessionsApi()
      if (result.code === 200) {
        sessions.value = result.data ?? []
      } else {
        sessionsError.value = result.message || '加载会话列表失败'
      }
    } catch (e) {
      sessionsError.value = '加载会话列表失败，请检查网络'
    } finally {
      sessionsLoading.value = false
    }
  }

  /**
   * 创建新会话
   * @returns {Promise<object|null>} 新创建的会话对象
   */
  const createSession = async () => {
    // 如果有正在进行的流，先中断
    if (streaming.value) {
      abortStream()
    }

    try {
      const result = await createSessionApi({})
      if (result.code === 200) {
        const newSession = result.data
        // 插入到列表头部
        sessions.value.unshift(newSession)
        currentSessionId.value = newSession.id
        // 清空消息流
        messages.value = []
        return newSession
      }
      return null
    } catch (e) {
      return null
    }
  }

  /**
   * 切换到指定会话
   * @param {number|string} sessionId - 会话 ID
   */
  const switchSession = async (sessionId) => {
    // 如果正在流式传输，先中断
    if (streaming.value) {
      abortStream()
    }

    currentSessionId.value = sessionId
    messagesLoading.value = true

    try {
      const result = await getSessionApi(sessionId)
      if (result.code === 200) {
        const session = result.data
        messages.value = session.messages ?? []
        // 同步更新会话列表中的 updatedAt 等信息
        const idx = sessions.value.findIndex(s => s.id === sessionId)
        if (idx !== -1 && session.updatedAt) {
          sessions.value[idx] = { ...sessions.value[idx], ...session, messages: undefined }
        }
      }
    } catch (e) {
      // 加载失败保持当前消息不变
    } finally {
      messagesLoading.value = false
    }
  }

  /**
   * 删除会话
   * @param {number|string} sessionId - 会话 ID
   */
  const deleteSession = async (sessionId) => {
    // 如果正在该会话中流式传输，先中断
    if (streaming.value && currentSessionId.value === sessionId) {
      abortStream()
    }

    try {
      const result = await deleteSessionApi(sessionId)
      if (result.code === 200) {
        // 从列表中移除
        sessions.value = sessions.value.filter(s => s.id !== sessionId)

        // 如果删除的是当前会话，选中第一个
        if (currentSessionId.value === sessionId) {
          if (sessions.value.length > 0) {
            await switchSession(sessions.value[0].id)
          } else {
            currentSessionId.value = null
            messages.value = []
          }
        }
        return true
      }
      return false
    } catch (e) {
      return false
    }
  }

  // ==================== 消息发送 / SSE 处理 ====================

  /**
   * 清空当前输入并重置状态
   */
  const clearInput = () => {
    // 具体清空逻辑由 AiInputBox 组件处理
    // store 层面不持有 inputText
  }

  /**
   * 发送消息
   * @param {string} content - 用户输入内容
   */
  const sendMessage = async (content) => {
    if (!currentSessionId.value || streaming.value) return

    // 构造用户消息
    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString()
    }

    // 添加用户消息到消息流
    messages.value.push(userMessage)

    // 创建 AI 助手消息占位（状态为 thinking）
    const assistantMessage = {
      id: `ai_${Date.now()}`,
      role: 'assistant',
      content: '',
      thinking: true,
      toolCalls: [],
      tokenUsage: null,
      createdAt: new Date().toISOString()
    }
    messages.value.push(assistantMessage)

    // 标记开始流式传输
    streaming.value = true
    const controller = new AbortController()
    abortController.value = controller

    // 发起 SSE 请求
    await sendMessageSse(
      currentSessionId.value,
      { content: content.trim() },
      {
        signal: controller.signal,
        onEvent(eventType, data) {
          handleSseEvent(eventType, data, assistantMessage)
        },
        onError(error) {
          streaming.value = false
          abortController.value = null
          assistantMessage.thinking = false
          assistantMessage.error = {
            code: 'NETWORK_ERROR',
            message: error.message || '连接中断，请检查网络'
          }
        },
        onDone() {
          streaming.value = false
          abortController.value = null
          assistantMessage.thinking = false
          // 刷新会话列表以更新时间
          loadSessions()
        }
      }
    )
  }

  /**
   * 处理 SSE 事件，更新对应的 assistantMessage
   */
  const handleSseEvent = (eventType, data, assistantMessage) => {
    switch (eventType) {
      case 'thinking':
        // 保持 thinking 状态
        assistantMessage.thinking = true
        break

      case 'text_delta':
        // 收到首个 text_delta 时退出 thinking 状态
        assistantMessage.thinking = false
        // 追加文本内容
        assistantMessage.content += (data.content ?? '')
        break

      case 'tool_call':
        // 退出 thinking 状态
        assistantMessage.thinking = false
        // 插入工具调用项
        // 后端契约：{ name: <toolName>, params: <object> }
        if (!assistantMessage.toolCalls) {
          assistantMessage.toolCalls = []
        }
        assistantMessage.toolCalls.push({
          // 由于后端 tool_call 事件不带 id，使用工具名 + 时间戳兜底
          id: data.id ?? `tool_${data.name ?? data.toolName ?? data.tool_name ?? 'unknown'}_${Date.now()}`,
          toolName: data.name ?? data.toolName ?? data.tool_name ?? '',
          category: data.category ?? '',
          params: data.params ?? data.arguments ?? {},
          status: 'pending',
          result: null,
          error: null
        })
        break

      case 'tool_result':
        // 更新对应的工具调用项
        // 后端契约：{ tool: <toolName>, result: <ToolResult.toMap()> }
        // ToolResult.toMap() 通常包含 success/data/message/error 等字段
        if (assistantMessage.toolCalls) {
          const resolvedToolName = data.tool ?? data.toolName ?? data.tool_name ?? data.name
          // 倒序找最近一个 pending 的同名工具调用，避免同名工具多次调用错配
          let tool = null
          for (let i = assistantMessage.toolCalls.length - 1; i >= 0; i--) {
            const t = assistantMessage.toolCalls[i]
            if (t.toolName === resolvedToolName && t.status === 'pending') {
              tool = t
              break
            }
          }
          // 兜底：找不到 pending 同名项时，更新最后一个同名项
          if (!tool) {
            for (let i = assistantMessage.toolCalls.length - 1; i >= 0; i--) {
              if (assistantMessage.toolCalls[i].toolName === resolvedToolName) {
                tool = assistantMessage.toolCalls[i]
                break
              }
            }
          }
          if (tool) {
            const resultPayload = data.result ?? data.output ?? null
            // ToolResult.toMap() 中 success 字段决定状态
            const success = resultPayload && typeof resultPayload === 'object'
              ? resultPayload.success !== false
              : data.success !== false
            tool.status = success ? 'success' : 'failure'
            tool.result = resultPayload
            tool.error = (resultPayload && typeof resultPayload === 'object' && resultPayload.error)
              ? resultPayload.error
              : (data.error ?? null)
          }
        }
        break

      case 'done':
        assistantMessage.thinking = false
        // 写入 messageId 和 token 用量
        assistantMessage.id = data.messageId ?? data.message_id ?? assistantMessage.id
        assistantMessage.tokenUsage = data.tokenUsage ?? data.token_usage ?? null
        break

      case 'error':
        assistantMessage.thinking = false
        assistantMessage.error = {
          code: data.code ?? 'UNKNOWN',
          message: data.message ?? 'AI 服务异常'
        }
        break

      default:
        // 未知事件类型 — 忽略
        break
    }
  }

  /**
   * 中断当前 SSE 流
   */
  const abortStream = () => {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    streaming.value = false
    // 给最后一条 AI 消息追加中断标记
    const lastAi = [...messages.value].reverse().find(m => m.role === 'assistant')
    if (lastAi) {
      lastAi.thinking = false
      lastAi.interrupted = true
    }
  }

  /**
   * 重试最后一条消息
   */
  const retryLastMessage = async () => {
    // 找到最后一条用户消息
    const lastUser = [...messages.value].reverse().find(m => m.role === 'user')
    if (!lastUser) return
    // 移除最后一条 AI 消息（失败的那条）
    const lastAiIndex = messages.value.findLastIndex(m => m.role === 'assistant')
    if (lastAiIndex !== -1) {
      messages.value.splice(lastAiIndex, 1)
    }
    // 重新发送
    await sendMessage(lastUser.content)
  }

  // ==================== UI 控制 ====================

  /** 切换抽屉开/关 */
  const toggleDrawer = () => {
    drawerOpen.value = !drawerOpen.value
  }

  /** 打开抽屉 */
  const openDrawer = () => {
    drawerOpen.value = true
    // 首次打开时加载会话列表
    if (sessions.value.length === 0) {
      loadSessions()
    }
  }

  /** 关闭抽屉 */
  const closeDrawer = () => {
    drawerOpen.value = false
    fullscreen.value = false
  }

  /** 切换全屏 */
  const toggleFullscreen = () => {
    fullscreen.value = !fullscreen.value
  }

  /** 切换会话列表折叠 */
  const toggleListCollapsed = () => {
    listCollapsed.value = !listCollapsed.value
  }

  /** 设置抽屉宽度 */
  const setDrawerWidth = (width) => {
    drawerWidth.value = Math.max(400, Math.min(width, window.innerWidth * 0.8))
  }

  return {
    // 会话
    sessions,
    currentSessionId,
    currentSession,
    sessionsLoading,
    sessionsError,
    // 消息
    messages,
    messagesLoading,
    // 流式
    streaming,
    // UI
    drawerOpen,
    fullscreen,
    listCollapsed,
    drawerWidth,
    // 操作
    loadSessions,
    createSession,
    switchSession,
    deleteSession,
    sendMessage,
    abortStream,
    retryLastMessage,
    toggleDrawer,
    openDrawer,
    closeDrawer,
    toggleFullscreen,
    toggleListCollapsed,
    setDrawerWidth
  }
})
