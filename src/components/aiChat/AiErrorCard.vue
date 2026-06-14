<script setup>
/**
 * 错误警示卡片
 *
 * 展示 AI 调用过程中的错误信息，支持 5 种标准错误码 + 自定义消息。
 *
 * 错误码 → 文案映射（§A.4）：
 *   RATE_LIMIT       → 调用过于频繁，请稍后重试
 *   LLM_UNAVAILABLE  → AI 服务暂不可用
 *   LLM_EMPTY        → AI 未返回内容
 *   INTERNAL_ERROR   → 系统内部异常
 *
 * Props:
 *   code: String    — 错误码
 *   message: String — 错误消息
 *
 * Emits:
 *   retry — 点击重试按钮
 */
import { computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  code: { type: String, default: '' },
  message: { type: String, default: '' }
})

const emit = defineEmits(['retry'])

// 错误码本地化文案
const errorTextMap = {
  RATE_LIMIT: '调用过于频繁，请稍后重试（每分钟最多 10 次）',
  LLM_UNAVAILABLE: 'AI 服务暂不可用，请稍后再试',
  LLM_EMPTY: 'AI 未返回内容，请重新提问',
  INTERNAL_ERROR: '系统内部异常，请联系管理员',
  NETWORK_ERROR: '连接中断，请检查网络',
  TIMEOUT: '响应超时，请稍后重试',
  '403': '您没有权限执行此操作'
}

// 显示的文案
const displayMessage = computed(() => {
  return errorTextMap[props.code] || props.message || '发生未知错误'
})

// 是否显示重试按钮（部分错误可重试）
const showRetry = computed(() => {
  const noRetry = ['403']
  return !noRetry.includes(props.code)
})

const handleRetry = () => {
  emit('retry')
}

const handleCopy = () => {
  navigator.clipboard.writeText(`[${props.code}] ${displayMessage.value}`).then(() => {
    ElMessage.success('已复制错误信息')
  })
}
</script>

<template>
  <div class="error-card">
    <div class="error-card__header">
      <el-icon class="error-card__icon">
        <CircleCloseFilled />
      </el-icon>
      <span class="error-card__code">{{ code || 'ERROR' }}</span>
    </div>

    <div class="error-card__message">
      {{ displayMessage }}
    </div>

    <div class="error-card__actions">
      <el-button
        v-if="showRetry"
        size="small"
        type="danger"
        plain
        @click="handleRetry"
      >
        重试
      </el-button>
      <el-button
        size="small"
        text
        @click="handleCopy"
      >
        复制错误信息
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.error-card {
  margin: 8px 0;
  padding: 10px 14px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  font-size: 13px;
}

.error-card__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.error-card__icon {
  color: #dc2626;
  font-size: 16px;
}

.error-card__code {
  font-weight: 600;
  color: #dc2626;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
}

.error-card__message {
  color: #991b1b;
  line-height: 1.5;
}

.error-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
