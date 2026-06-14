<script setup>
/**
 * 二次确认橙色卡片
 *
 * 当 AI 需要执行破坏性操作时展示此卡片，
 * 用户可选择「确认执行」或「取消」。
 *
 * 3 状态：待确认 / 已确认 / 已取消
 *
 * Props:
 *   summary: string — 操作摘要（如 "删除设备功能描述"）
 *   toolName: string — 工具名称
 *   params: Object  — 工具参数
 *
 * Emits:
 *   confirm — 用户点击「确认执行」
 *   cancel  — 用户点击「取消」
 */
import { ref } from 'vue'

const props = defineProps({
  summary: { type: String, default: '' },
  toolName: { type: String, default: '' },
  params: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['confirm', 'cancel'])

// 操作状态：null=待确认, 'confirmed'=已确认, 'cancelled'=已取消
const actionStatus = ref(null)

const handleConfirm = () => {
  actionStatus.value = 'confirmed'
  emit('confirm')
}

const handleCancel = () => {
  actionStatus.value = 'cancelled'
  emit('cancel')
}

const isDisabled = () => actionStatus.value !== null
</script>

<template>
  <div class="confirm-card" :class="{ 'confirm-card--done': isDisabled() }">
    <div class="confirm-card__header">
      <el-icon class="confirm-card__warn-icon">
        <Warning />
      </el-icon>
      <span>即将执行破坏性操作</span>
    </div>

    <div class="confirm-card__divider" />

    <div v-if="summary" class="confirm-card__summary">
      {{ summary }}
    </div>

    <div v-if="toolName" class="confirm-card__row">
      <span class="confirm-card__label">工具：</span>
      <code>{{ toolName }}</code>
    </div>

    <div v-if="Object.keys(params).length" class="confirm-card__row">
      <span class="confirm-card__label">参数：</span>
      <code>{{ JSON.stringify(params) }}</code>
    </div>

    <div class="confirm-card__actions">
      <el-button
        size="small"
        @click="handleCancel"
        :disabled="isDisabled()"
      >
        {{ actionStatus === 'cancelled' ? '已取消' : '取消' }}
      </el-button>
      <el-button
        size="small"
        type="warning"
        @click="handleConfirm"
        :disabled="isDisabled()"
      >
        {{ actionStatus === 'confirmed' ? '已确认' : '确认执行' }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.confirm-card {
  margin: 8px 0;
  padding: 12px;
  border: 2px solid #f59e0b;
  border-radius: 10px;
  background: #fff7ed;
}

.confirm-card--done {
  opacity: 0.6;
  pointer-events: none;
}

.confirm-card__header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  color: #92400e;
}

.confirm-card__warn-icon {
  color: #f59e0b;
  font-size: 18px;
}

.confirm-card__divider {
  height: 1px;
  background: #fde68a;
  margin: 8px 0;
}

.confirm-card__summary {
  font-size: 13px;
  color: #92400e;
  margin-bottom: 6px;
}

.confirm-card__row {
  font-size: 12px;
  color: #78350f;
  margin-bottom: 4px;
  word-break: break-all;
}

.confirm-card__label {
  font-weight: 500;
}

.confirm-card__row code {
  background: rgba(245, 158, 11, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 11px;
}

.confirm-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}
</style>
