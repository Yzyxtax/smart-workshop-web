<script setup>
/**
 * 单条消息气泡组件
 *
 * 支持 3 种消息形态：
 *   - user: 用户气泡（蓝色实底，右对齐）
 *   - assistant: AI 助手气泡（白底边框，左对齐，支持 Markdown）
 *   - thinking: AI 三点呼吸态
 *
 * Props:
 *   message: Object — 消息对象 { role, content, thinking, tokenUsage, interrupted, error }
 */
import { computed } from 'vue'

const props = defineProps({
  message: { type: Object, required: true }
})

// 是否用户消息
const isUser = computed(() => props.message.role === 'user')

// 是否显示 thinking 三点动画
const showThinking = computed(() =>
  !isUser.value && props.message.thinking && !props.message.content
)

// 是否显示 token 信息
const showTokens = computed(() =>
  !isUser.value && props.message.tokenUsage && !props.message.thinking
)

// token 用量文本
const tokenText = computed(() => {
  const t = props.message.tokenUsage
  if (!t) return ''
  const parts = []
  if (t.inputTokens ?? t.prompt_tokens) parts.push(`↑${t.inputTokens ?? t.prompt_tokens}`)
  if (t.outputTokens ?? t.completion_tokens) parts.push(`↓${t.outputTokens ?? t.completion_tokens}`)
  if (t.totalTokens ?? t.total_tokens) parts.push(`总 ${t.totalTokens ?? t.total_tokens}`)
  return parts.join(' ') + ' tokens'
})

// 显示时间
const timeText = computed(() => {
  if (!props.message.createdAt) return ''
  const d = new Date(props.message.createdAt)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
})

// 用户头像首字母
const userInitial = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return (user.name || 'U').charAt(0).toUpperCase()
})
</script>

<template>
  <!-- ===== 用户气泡 ===== -->
  <div v-if="isUser" class="ai-bubble ai-bubble--user">
    <div class="ai-bubble__body ai-bubble__body--user">
      <div class="ai-bubble__content">{{ message.content }}</div>
    </div>
    <div class="ai-bubble__avatar ai-bubble__avatar--user">
      {{ userInitial }}
    </div>
    <div class="ai-bubble__time ai-bubble__time--user">{{ timeText }}</div>
  </div>

  <!-- ===== AI 助手气泡 ===== -->
  <div v-else class="ai-bubble ai-bubble--assistant">
    <div class="ai-bubble__avatar ai-bubble__avatar--assistant">
      ✦
    </div>
    <div class="ai-bubble__body ai-bubble__body--assistant">
      <!-- Thinking 三点呼吸 -->
      <div v-if="showThinking" class="ai-bubble__thinking">
        <span class="thinking-dot" />
        <span class="thinking-dot" />
        <span class="thinking-dot" />
      </div>

      <!-- 流式/完成文本 + 打字机光标 -->
      <div
        v-else
        class="ai-bubble__content ai-bubble__content--md"
        v-html="message.content || '&nbsp;'"
      />

      <!-- 打字机光标（流式中） -->
      <span
        v-if="message.thinking && message.content"
        class="ai-bubble__cursor"
      >▍</span>

      <!-- 已中断标记 -->
      <div v-if="message.interrupted" class="ai-bubble__interrupted">
        （已中断）
      </div>

      <!-- Token 信息 -->
      <div v-if="showTokens" class="ai-bubble__tokens">
        {{ tokenText }}
      </div>

      <!-- 时间 -->
      <div class="ai-bubble__time ai-bubble__time--assistant">
        {{ timeText }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 气泡容器 ========== */
.ai-bubble {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 16px;
  max-width: 80%;
}

/* 用户右对齐 */
.ai-bubble--user {
  margin-left: auto;
  flex-direction: row-reverse;
  max-width: 70%;
}

/* AI 左对齐 */
.ai-bubble--assistant {
  margin-right: auto;
}

/* ========== 气泡主体 ========== */
.ai-bubble__body {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

/* 用户气泡主体 */
.ai-bubble__body--user {
  background: #2c5aa0;
  color: #fff;
  border-radius: 12px 12px 4px 12px;
}

/* AI 气泡主体 */
.ai-bubble__body--assistant {
  background: #f7f8ff;
  border: 1px solid #e5e7eb;
  border-radius: 12px 12px 12px 4px;
  color: #1f2937;
}

/* ========== 头像 ========== */
.ai-bubble__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.ai-bubble__avatar--user {
  background: #2c5aa0;
  color: #fff;
}

.ai-bubble__avatar--assistant {
  background: linear-gradient(135deg, #6366f1, #06b6d4);
  color: #fff;
}

/* ========== Thinking 三点呼吸 ========== */
.ai-bubble__thinking {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.thinking-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  animation: thinking-breathe 1.4s ease-in-out infinite;
}

.thinking-dot:nth-child(1) { animation-delay: 0s; }
.thinking-dot:nth-child(2) { animation-delay: 0.2s; }
.thinking-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes thinking-breathe {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}

/* ========== 打字机光标 ========== */
.ai-bubble__cursor {
  display: inline;
  color: #6366f1;
  font-weight: bold;
  animation: cursor-blink 1s step-end infinite;
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ========== 已中断标记 ========== */
.ai-bubble__interrupted {
  color: #9ca3af;
  font-style: italic;
  font-size: 12px;
  margin-top: 4px;
}

/* ========== Token 信息 ========== */
.ai-bubble__tokens {
  color: #9ca3af;
  font-size: 12px;
  margin-top: 6px;
  user-select: none;
}

/* ========== 时间标签 ========== */
.ai-bubble__time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 150ms;
}

.ai-bubble:hover .ai-bubble__time {
  opacity: 1;
}

.ai-bubble__time--user {
  text-align: right;
}
</style>
