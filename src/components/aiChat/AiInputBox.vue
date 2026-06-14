<script setup>
/**
 * 输入区组件
 *
 * 功能：
 * - 多行自适应输入框（min 40px / max 160px）
 * - 字符计数（0/4000，> 3800 黄色警告，> 4000 红色 + 禁用发送）
 * - 按钮状态切换（发送 / 停止 / 清空）
 * - 键盘交互（Enter 发送，Shift+Enter 换行，Ctrl+L 清空）
 *
 * Props:
 *   disabled: Boolean  — 是否禁用（如未选中会话）
 *   streaming: Boolean — 是否正在流式接收
 *
 * Emits:
 *   send  — (content: string) 发送消息
 *   stop  — 停止当前 SSE 流
 *   clear — 清空输入框
 */
import { ref, computed, watch } from 'vue'

const props = defineProps({
  disabled: { type: Boolean, default: false },
  streaming: { type: Boolean, default: false }
})

const emit = defineEmits(['send', 'stop', 'clear'])

const MAX_LENGTH = 4000
const WARN_LENGTH = 3800

const inputText = ref('')
const textareaRef = ref(null)

// 字符计数
const charCount = computed(() => inputText.value.length)

// 是否超长
const isOverLimit = computed(() => charCount.value > MAX_LENGTH)

// 是否接近上限
const isNearLimit = computed(() => charCount.value > WARN_LENGTH && charCount.value <= MAX_LENGTH)

// 是否能发送
const canSend = computed(() =>
  !props.disabled && !props.streaming && !isOverLimit.value && inputText.value.trim().length > 0
)

// 发送处理
const handleSend = () => {
  if (!canSend.value) return
  const content = inputText.value
  inputText.value = ''
  emit('send', content)
}

// 停止处理
const handleStop = () => {
  emit('stop')
}

// 清空处理
const handleClear = () => {
  inputText.value = ''
  emit('clear')
}

// 键盘事件
const handleKeydown = (e) => {
  // Enter 发送（Shift+Enter 换行）
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (canSend.value) {
      handleSend()
    }
  }
  // Ctrl+L 清空
  if (e.ctrlKey && e.key === 'l') {
    e.preventDefault()
    handleClear()
  }
}

// 监听外部 clear 请求（通过 expose）
const clearInput = () => {
  inputText.value = ''
}

defineExpose({ clearInput })
</script>

<template>
  <div class="ai-input">
    <!-- 文本框 -->
    <div class="ai-input__wrapper" :class="{
      'ai-input__wrapper--over': isOverLimit,
      'ai-input__wrapper--warn': isNearLimit
    }">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="ai-input__textarea"
        :disabled="disabled"
        :placeholder="disabled ? '请先选择或创建会话' : '输入您的问题，例如：查询所有运行中的计划...'"
        rows="1"
        @keydown="handleKeydown"
      />
    </div>

    <!-- 底部操作栏 -->
    <div class="ai-input__footer">
      <!-- 字符计数 -->
      <div class="ai-input__counter" :class="{
        'ai-input__counter--warn': isNearLimit,
        'ai-input__counter--over': isOverLimit
      }">
        {{ charCount }}/{{ MAX_LENGTH }}
      </div>

      <!-- 按钮组 -->
      <div class="ai-input__actions">
        <!-- 流式传输中：停止按钮 -->
        <el-button
          v-if="streaming"
          type="warning"
          size="small"
          @click="handleStop"
        >
          <el-icon><VideoPause /></el-icon>
          停止
        </el-button>

        <!-- 空闲：发送按钮 -->
        <el-button
          v-else
          type="primary"
          size="small"
          :disabled="!canSend"
          @click="handleSend"
        >
          <el-icon><Promotion /></el-icon>
          发送
        </el-button>

        <!-- 清空按钮 -->
        <el-button
          size="small"
          :disabled="streaming || inputText.length === 0"
          @click="handleClear"
        >
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-input {
  border-top: 1px solid #e5e7eb;
  padding: 12px;
  background: #fff;
}

/* ========== 输入框容器 ========== */
.ai-input__wrapper {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 12px;
  transition: border-color 150ms;
}

.ai-input__wrapper:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.ai-input__wrapper--warn {
  border-color: #f59e0b;
}

.ai-input__wrapper--warn:focus-within {
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1);
}

.ai-input__wrapper--over {
  border-color: #dc2626;
}

.ai-input__wrapper--over:focus-within {
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
}

/* ========== textarea ========== */
.ai-input__textarea {
  width: 100%;
  min-height: 40px;
  max-height: 160px;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
  background: transparent;
  overflow-y: auto;
}

.ai-input__textarea::placeholder {
  color: #9ca3af;
}

.ai-input__textarea:disabled {
  cursor: not-allowed;
  color: #9ca3af;
}

/* ========== 底部操作栏 ========== */
.ai-input__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

/* ========== 字符计数 ========== */
.ai-input__counter {
  font-size: 12px;
  color: #9ca3af;
  user-select: none;
}

.ai-input__counter--warn {
  color: #f59e0b;
}

.ai-input__counter--over {
  color: #dc2626;
  font-weight: 600;
}

/* ========== 按钮组 ========== */
.ai-input__actions {
  display: flex;
  gap: 8px;
}
</style>
