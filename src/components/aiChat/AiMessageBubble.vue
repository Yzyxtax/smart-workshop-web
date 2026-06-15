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
import { renderMarkdown } from '@/utils/markdown'

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

// Markdown 渲染后的 HTML 内容
const renderedContent = computed(() => {
  const raw = props.message.content
  if (!raw) return '&nbsp;'
  return renderMarkdown(raw)
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
        v-html="renderedContent"
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

/* ========== Markdown 渲染内容样式 ========== */
/* v-html 动态插入的 DOM 需要 :deep() 穿透 scoped */
.ai-bubble__content--md :deep(p) {
  margin: 0 0 8px;
  line-height: 1.7;
}
.ai-bubble__content--md :deep(p:last-child) {
  margin-bottom: 0;
}

/* 标题 */
.ai-bubble__content--md :deep(h1),
.ai-bubble__content--md :deep(h2),
.ai-bubble__content--md :deep(h3),
.ai-bubble__content--md :deep(h4),
.ai-bubble__content--md :deep(h5),
.ai-bubble__content--md :deep(h6) {
  margin: 12px 0 6px;
  font-weight: 600;
  line-height: 1.4;
  color: #1f2937;
}
.ai-bubble__content--md :deep(h1) { font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
.ai-bubble__content--md :deep(h2) { font-size: 16px; }
.ai-bubble__content--md :deep(h3) { font-size: 15px; }
.ai-bubble__content--md :deep(h4) { font-size: 14px; }

/* 无序 / 有序列表 */
.ai-bubble__content--md :deep(ul),
.ai-bubble__content--md :deep(ol) {
  margin: 4px 0 8px;
  padding-left: 20px;
}
.ai-bubble__content--md :deep(li) {
  margin-bottom: 2px;
  line-height: 1.6;
}

/* 行内代码 */
.ai-bubble__content--md :deep(code):not(pre code) {
  background: #eef1f5;
  color: #d63384;
  font-size: 13px;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
}

/* 代码块（highlight.js 渲染后的 <pre><code>） */
.ai-bubble__content--md :deep(pre) {
  background: #f6f8fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
  margin: 8px 0;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.55;
}
.ai-bubble__content--md :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #24292f;
  font-size: inherit;
  border-radius: 0;
}

/* 引用块 */
.ai-bubble__content--md :deep(blockquote) {
  margin: 8px 0;
  padding: 6px 12px;
  border-left: 3px solid #6366f1;
  background: #f0f1ff;
  color: #4b5563;
}
.ai-bubble__content--md :deep(blockquote p) {
  margin: 4px 0;
}

/* 表格 */
.ai-bubble__content--md :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 13px;
}
.ai-bubble__content--md :deep(th),
.ai-bubble__content--md :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  text-align: left;
}
.ai-bubble__content--md :deep(th) {
  background: #f3f4f6;
  font-weight: 600;
  color: #374151;
}
.ai-bubble__content--md :deep(tr:nth-child(even)) {
  background: #fafbfc;
}

/* 链接 */
.ai-bubble__content--md :deep(a) {
  color: #6366f1;
  text-decoration: underline;
}
.ai-bubble__content--md :deep(a:hover) {
  color: #4f46e5;
}

/* 分割线 */
.ai-bubble__content--md :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 12px 0;
}

/* 图片 */
.ai-bubble__content--md :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 6px 0;
}

/* 加粗 / 斜体 */
.ai-bubble__content--md :deep(strong) {
  font-weight: 700;
  color: #1f2937;
}
.ai-bubble__content--md :deep(em) {
  font-style: italic;
}

/* 任务列表（GFM checkbox） */
.ai-bubble__content--md :deep(input[type="checkbox"]) {
  margin-right: 6px;
  accent-color: #6366f1;
}
</style>
