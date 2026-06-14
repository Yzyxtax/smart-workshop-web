<script setup>
/**
 * 工具调用卡片组件
 *
 * 展示 AI 调用后端工具的状态：
 *   - pending (🔄 调用中)
 *   - success (✅ 成功)
 *   - failure (❌ 失败)
 *
 * 支持折叠/展开参数和结果详情。
 * 工具 category 染色见 §A.3 配色表。
 *
 * Props:
 *   toolCall: Object — { toolName, category, params, result, status }
 *   status: 'pending' | 'success' | 'failure'
 */
import { ref, computed } from 'vue'

const props = defineProps({
  toolCall: { type: Object, required: true },
  status: { type: String, default: 'pending' }
})

const emit = defineEmits(['expand'])

// 是否展开详情
const expanded = ref(false)

const toggleExpand = () => {
  expanded.value = !expanded.value
  if (expanded.value) {
    emit('expand')
  }
}

// ==================== category 配色表 (§A.3) ====================
const categoryConfig = computed(() => {
  const map = {
    'BOM管理':     { color: '#a855f7', bg: '#f3e8ff', icon: 'Box' },
    '设备管理':    { color: '#10b981', bg: '#ecfdf5', icon: 'Tools' },
    '产线管理':    { color: '#0ea5e9', bg: '#e0f2fe', icon: 'Guide' },
    '工序管理':    { color: '#f59e0b', bg: '#fef3c7', icon: 'Histogram' },
    '工步管理':    { color: '#eab308', bg: '#fef9c3', icon: 'Brush' },
    '班组管理':    { color: '#06b6d4', bg: '#cffafe', icon: 'User' },
    '生产管理':    { color: '#6366f1', bg: '#e0e7ff', icon: 'Calendar' }
  }
  return map[props.toolCall.category] ?? { color: '#6b7280', bg: '#f3f4f6', icon: 'Setting' }
})

// 状态图标和文本
const statusInfo = computed(() => {
  switch (props.status) {
    case 'pending': return { icon: 'Loading', text: '调用中', class: 'tool-card--pending' }
    case 'success': return { icon: 'CircleCheck', text: '成功', class: 'tool-card--success' }
    case 'failure': return { icon: 'CircleClose', text: '失败', class: 'tool-card--failure' }
    default: return { icon: 'Loading', text: '调用中', class: 'tool-card--pending' }
  }
})

// JSON 格式化
const formatJson = (obj) => {
  if (!obj) return ''
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}
</script>

<template>
  <div class="tool-card" :class="statusInfo.class">
    <!-- 头部：工具信息 + 状态 -->
    <div class="tool-card__header" @click="toggleExpand">
      <div class="tool-card__info">
        <el-icon
          class="tool-card__tool-icon"
          :style="{ color: categoryConfig.color }"
        >
          <component :is="categoryConfig.icon" />
        </el-icon>
        <span class="tool-card__name">{{ toolCall.toolName }}</span>

        <!-- category 徽标 -->
        <span
          v-if="toolCall.category"
          class="tool-card__category"
          :style="{ backgroundColor: categoryConfig.bg, color: categoryConfig.color }"
        >
          {{ toolCall.category }}
        </span>
      </div>

      <div class="tool-card__status">
        <el-icon v-if="status === 'pending'" class="tool-card__spin">
          <Loading />
        </el-icon>
        <el-icon v-else>
          <component :is="statusInfo.icon" />
        </el-icon>
        <span>{{ statusInfo.text }}</span>
      </div>
    </div>

    <!-- 参数摘要（始终可见） -->
    <div class="tool-card__summary">
      {{ formatJson(toolCall.params).slice(0, 80) }}{{ formatJson(toolCall.params).length > 80 ? '...' : '' }}
    </div>

    <!-- 展开/折叠按钮 -->
    <div class="tool-card__toggle" @click="toggleExpand">
      <el-icon :class="{ 'tool-card__toggle-icon--open': expanded }">
        <ArrowDown />
      </el-icon>
      {{ expanded ? '收起详情' : '展开详情' }}
    </div>

    <!-- 详情区 -->
    <div v-if="expanded" class="tool-card__detail">
      <!-- 参数 -->
      <div class="tool-card__section">
        <div class="tool-card__section-label">📥 参数 (params)</div>
        <pre class="tool-card__json">{{ formatJson(toolCall.params) }}</pre>
      </div>

      <!-- 结果 -->
      <div v-if="toolCall.result" class="tool-card__section">
        <div class="tool-card__section-label">📤 结果 (result)</div>
        <pre class="tool-card__json">{{ formatJson(toolCall.result) }}</pre>
      </div>

      <!-- 错误信息 -->
      <div v-if="toolCall.error" class="tool-card__section">
        <div class="tool-card__section-label" style="color: #dc2626;">❌ 错误信息</div>
        <pre class="tool-card__json" style="color: #dc2626;">{{ toolCall.error }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 工具卡片容器 ========== */
.tool-card {
  margin: 8px 0;
  border-radius: 12px;
  border-left: 3px solid #6b7280;
  background: #fafafa;
  overflow: hidden;
  font-size: 13px;
}

/* 状态染色 */
.tool-card--pending {
  border-left-color: #6366f1;
  background: rgba(99, 102, 241, 0.04);
}

.tool-card--success {
  border-left-color: #10b981;
  background: rgba(16, 185, 129, 0.04);
}

.tool-card--failure {
  border-left-color: #dc2626;
  background: rgba(220, 38, 38, 0.04);
}

/* ========== 头部 ========== */
.tool-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
}

.tool-card__info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.tool-card__tool-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.tool-card__name {
  font-weight: 500;
  color: #1f2937;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
}

.tool-card__category {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tool-card__status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
  flex-shrink: 0;
}

/* ========== 旋转动画 ========== */
.tool-card__spin {
  animation: tool-spin 1s linear infinite;
}

@keyframes tool-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ========== 参数摘要 ========== */
.tool-card__summary {
  padding: 0 12px 6px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== 展开/折叠按钮 ========== */
.tool-card__toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px 8px;
  font-size: 11px;
  color: #6b7280;
  cursor: pointer;
  user-select: none;
  transition: color 150ms;
}

.tool-card__toggle:hover {
  color: #6366f1;
}

.tool-card__toggle .el-icon {
  font-size: 12px;
  transition: transform 240ms cubic-bezier(.4,0,.2,1);
}

.tool-card__toggle-icon--open {
  transform: rotate(180deg);
}

/* ========== 详情区 ========== */
.tool-card__detail {
  border-top: 1px solid #e5e7eb;
  padding: 8px 12px;
}

.tool-card__section {
  margin-bottom: 8px;
}

.tool-card__section-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
  font-weight: 500;
}

.tool-card__json {
  margin: 0;
  padding: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: #1f2937;
}
</style>
