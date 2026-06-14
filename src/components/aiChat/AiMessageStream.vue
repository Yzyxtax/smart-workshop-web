<script setup>
/**
 * 消息流容器组件
 *
 * 负责渲染消息列表，包含：
 * - 用户气泡 / AI 气泡（AiMessageBubble）
 * - 工具调用卡片（AiToolCallCard）
 * - 二次确认卡片（AiConfirmCard）
 * - 错误警示卡片（AiErrorCard）
 *
 * 自动滚动到底部。
 *
 * Props:
 *   messages: Array  — 消息列表
 *   streaming: Boolean — 是否正在流式接收（用于自动滚动）
 *
 * Emits:
 *   retry       — 重试某条消息
 *   confirm     — 确认破坏性操作
 *   cancel      — 取消破坏性操作
 *   toolExpand  — 展开工具卡片详情
 */
import { ref, watch, nextTick } from 'vue'
import AiMessageBubble from './AiMessageBubble.vue'
import AiToolCallCard from './AiToolCallCard.vue'
import AiConfirmCard from './AiConfirmCard.vue'
import AiErrorCard from './AiErrorCard.vue'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  streaming: { type: Boolean, default: false }
})

const emit = defineEmits(['retry', 'confirm', 'cancel', 'toolExpand'])

// 消息流容器 ref（用于自动滚动）
const streamRef = ref(null)

// 自动滚动到底部（新消息到来或流式更新时）
watch(
  () => [props.messages.length, props.messages[props.messages.length - 1]?.content],
  () => {
    nextTick(() => {
      if (streamRef.value) {
        streamRef.value.scrollTop = streamRef.value.scrollHeight
      }
    })
  },
  { deep: false }
)

// 处理工具确认
const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div ref="streamRef" class="message-stream">
    <!-- ===== 空态 ===== -->
    <div v-if="messages.length === 0" class="message-stream__empty">
      <span class="message-stream__empty-icon">🤖</span>
      <p>智能助手已就绪</p>
      <p class="message-stream__empty-hint">
        您可以询问生产计划、设备信息、BOM 物料等车间数据
      </p>
    </div>

    <!-- ===== 消息列表 ===== -->
    <template v-for="message in messages" :key="message.id">
      <!-- 消息气泡（用户 / AI / thinking） -->
      <AiMessageBubble :message="message" />

      <!-- 工具调用卡片列表（在 AI 消息内部） -->
      <template v-if="message.role === 'assistant' && message.toolCalls?.length">
        <AiToolCallCard
          v-for="toolCall in message.toolCalls"
          :key="toolCall.id"
          :tool-call="toolCall"
          :status="toolCall.status"
          @expand="emit('toolExpand', toolCall)"
        />
      </template>

      <!-- 二次确认卡片（在 AI 消息内部） -->
      <AiConfirmCard
        v-if="message.role === 'assistant' && message.confirmation"
        :summary="message.confirmation.summary"
        :tool-name="message.confirmation.toolName"
        :params="message.confirmation.params"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />

      <!-- 错误卡片 -->
      <AiErrorCard
        v-if="message.role === 'assistant' && message.error"
        :code="message.error.code"
        :message="message.error.message"
        @retry="emit('retry')"
      />
    </template>
  </div>
</template>

<style scoped>
.message-stream {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  scroll-behavior: smooth;
}

/* ========== 空态 ========== */
.message-stream__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: #9ca3af;
  text-align: center;
}

.message-stream__empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.message-stream__empty p {
  margin: 0;
  font-size: 14px;
}

.message-stream__empty-hint {
  font-size: 12px;
  margin-top: 6px;
  color: #d1d5db;
}
</style>
