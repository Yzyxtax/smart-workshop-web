<script setup>
/**
 * 会话列表组件
 *
 * 展示所有 AI 对话会话，支持：
 * - 选中态（左侧蓝色条 + 浅蓝背景）
 * - hover 显示删除按钮
 * - 新建会话按钮
 * - 三态卡片（空态 / 加载中 skeleton / 加载失败）
 *
 * Props:
 *   sessions: Array    — 会话列表
 *   currentId: number  — 当前选中会话 ID
 *   loading: Boolean   — 是否加载中
 *   error: String      — 错误信息
 *
 * Emits:
 *   select — 选中会话 (sessionId)
 *   create — 新建会话
 *   delete — 删除会话 (sessionId)
 *   retry  — 重试加载
 */
import { ElMessageBox } from 'element-plus'
import { computed } from 'vue'

const props = defineProps({
  sessions: { type: Array, default: () => [] },
  currentId: { type: [Number, String], default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits(['select', 'create', 'delete', 'retry'])

/**
 * 格式化相对时间
 * < 1min → "刚刚"
 * < 1h   → "X 分钟前"
 * < 24h  → "X 小时前"
 * < 7d   → "昨天 HH:mm"
 * else   → "YYYY-MM-DD"
 */
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return ''
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHour < 24) return `${diffHour} 小时前`
  if (diffDay < 7) {
    const d = new Date(dateStr)
    return `昨天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 截断标题
const truncateTitle = (title) => {
  const t = title || '新对话'
  return t.length > 20 ? t.slice(0, 20) + '...' : t
}

// 状态文本
const statusText = computed(() => {
  return (status) => status === 'ARCHIVED' ? '○ 已归档' : '● 活跃'
})

const handleDelete = (e, session) => {
  e.stopPropagation()
  ElMessageBox.confirm(
    '确定删除此会话？删除后无法恢复',
    '删除会话',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    emit('delete', session.id)
  }).catch(() => {
    // 取消删除
  })
}
</script>

<template>
  <div class="session-list">
    <!-- ===== 新建会话按钮 ===== -->
    <div class="session-list__create" @click="emit('create')">
      <el-icon><Plus /></el-icon>
      <span>新建会话</span>
    </div>

    <!-- ===== 加载中 skeleton ===== -->
    <div v-if="loading" class="session-list__skeleton">
      <div v-for="i in 3" :key="i" class="skeleton-item">
        <div class="skeleton-line skeleton-line--long" />
        <div class="skeleton-line skeleton-line--short" />
      </div>
    </div>

    <!-- ===== 加载失败 ===== -->
    <div v-else-if="error" class="session-list__error">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ error }}</span>
      <el-button size="small" type="primary" text @click="emit('retry')">重试</el-button>
    </div>

    <!-- ===== 空态 ===== -->
    <div v-else-if="sessions.length === 0" class="session-list__empty">
      <span class="session-list__empty-icon">🤖</span>
      <p>还没有对话</p>
      <p class="session-list__empty-hint">点击上方按钮开启第一次交流</p>
    </div>

    <!-- ===== 会话列表 ===== -->
    <div v-else class="session-list__items">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="session-item"
        :class="{ 'session-item--active': session.id === currentId }"
        @click="emit('select', session.id)"
      >
        <!-- 左侧选中条 -->
        <div class="session-item__bar" />

        <div class="session-item__content">
          <div class="session-item__title" :title="session.title || '新对话'">
            {{ truncateTitle(session.title) }}
          </div>
          <div class="session-item__meta">
            <span class="session-item__time">
              {{ formatRelativeTime(session.updatedAt || session.createdAt) }}
            </span>
            <span class="session-item__status">
              {{ statusText(session.status) }}
            </span>
          </div>
        </div>

        <!-- 删除按钮（hover 显示） -->
        <el-icon
          class="session-item__delete"
          @click="(e) => handleDelete(e, session)"
        >
          <Delete />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<style scoped>
.session-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ========== 新建按钮 ========== */
.session-list__create {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  margin: 8px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  font-size: 13px;
  transition: all 150ms;
}

.session-list__create:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.04);
}

/* ========== skeleton 加载态 ========== */
.session-list__skeleton {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  border-radius: 4px;
}

.skeleton-line--long  { width: 80%; }
.skeleton-line--short { width: 50%; }

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ========== 错误态 ========== */
.session-list__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  color: #dc2626;
  font-size: 13px;
  text-align: center;
}

/* ========== 空态 ========== */
.session-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  text-align: center;
  color: #9ca3af;
}

.session-list__empty-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.session-list__empty p {
  margin: 0;
  font-size: 14px;
}

.session-list__empty-hint {
  font-size: 12px;
  color: #d1d5db;
  margin-top: 4px;
}

/* ========== 列表项 ========== */
.session-list__items {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  position: relative;
  transition: background 150ms;
  border-bottom: 1px solid #f3f4f6;
}

.session-item:hover {
  background: #f9fafb;
}

.session-item--active {
  background: #e8efff;
}

.session-item--active:hover {
  background: #e8efff;
}

/* 选中态左侧蓝条 */
.session-item__bar {
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: transparent;
  transition: background 150ms;
}

.session-item--active .session-item__bar {
  background: #2c5aa0;
}

/* 内容 */
.session-item__content {
  flex: 1;
  min-width: 0;
  padding-left: 4px;
}

.session-item__title {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  font-size: 11px;
  color: #9ca3af;
}

.session-item__status {
  color: #6366f1;
}

/* 删除按钮 */
.session-item__delete {
  opacity: 0;
  color: #9ca3af;
  font-size: 14px;
  flex-shrink: 0;
  padding: 4px;
  border-radius: 4px;
  transition: opacity 150ms, color 150ms;
}

.session-item:hover .session-item__delete {
  opacity: 1;
}

.session-item__delete:hover {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
}
</style>
