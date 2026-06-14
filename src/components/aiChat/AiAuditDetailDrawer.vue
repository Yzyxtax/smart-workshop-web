<script setup>
/**
 * 审计日志详情抽屉（600px 宽）
 *
 * 展示单条审计日志的完整信息：
 * - 时间 / 用户 / 会话 / 消息 ID
 * - 工具名称 + category 染色
 * - 自然语言输入
 * - 参数 + 执行结果（JSON 展开/折叠 + 复制）
 * - 状态 + 耗时
 * - 失败时额外展示 errorMessage
 *
 * Props:
 *   visible: Boolean  — 抽屉可见
 *   log: Object|null  — 审计日志记录（null 时显示空态）
 *
 * Emits:
 *   update:visible — 关闭抽屉
 */
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: { type: Boolean, default: false },
  log: { type: Object, default: null }
})

const emit = defineEmits(['update:visible'])

// 详情标题
const title = computed(() =>
  props.log ? `审计日志详情 #${props.log.id}` : '审计日志详情'
)

// category 配色
const categoryColor = computed(() => {
  const map = {
    'BOM管理': '#a855f7', '设备管理': '#10b981', '产线管理': '#0ea5e9',
    '工序管理': '#f59e0b', '工步管理': '#eab308', '班组管理': '#06b6d4',
    '生产管理': '#6366f1'
  }
  return map[props.log?.category] || '#6b7280'
})

// 格式化 JSON
const formatJson = (obj) => {
  if (!obj) return ''
  try {
    if (typeof obj === 'string') {
      return JSON.stringify(JSON.parse(obj), null, 2)
    }
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

// 复制内容到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 折叠/展开 JSON
const paramsExpanded = ref(true)
const resultExpanded = ref(true)

const toggleParams = () => { paramsExpanded.value = !paramsExpanded.value }
const toggleResult = () => { resultExpanded.value = !resultExpanded.value }

// 时间格式化
const formatTime = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="title"
    size="600px"
    direction="rtl"
    @update:model-value="emit('update:visible', $event)"
  >
    <template v-if="log">
      <div class="audit-detail">
        <!-- 基础信息 -->
        <div class="audit-detail__section">
          <div class="audit-detail__row">
            <span class="audit-detail__label">时间</span>
            <span>{{ formatTime(log.createdAt) }}</span>
          </div>
          <div class="audit-detail__row">
            <span class="audit-detail__label">用户</span>
            <span>{{ log.userName || '-' }} (id={{ log.userId }})</span>
          </div>
          <div class="audit-detail__row">
            <span class="audit-detail__label">会话</span>
            <span>#{{ log.sessionId }}</span>
          </div>
          <div class="audit-detail__row">
            <span class="audit-detail__label">消息</span>
            <span>#{{ log.messageId }}</span>
          </div>
          <div class="audit-detail__row">
            <span class="audit-detail__label">工具</span>
            <span
              class="audit-detail__tool-badge"
              :style="{ backgroundColor: categoryColor + '18', color: categoryColor }"
            >
              🔧 {{ log.toolName }}
            </span>
          </div>
        </div>

        <!-- 自然语言输入 -->
        <div class="audit-detail__section">
          <div class="audit-detail__section-title">💬 自然语言输入</div>
          <div class="audit-detail__natural-input">
            {{ log.userNaturalInput || '-' }}
          </div>
        </div>

        <!-- 分隔线 -->
        <el-divider />

        <!-- 参数 -->
        <div class="audit-detail__section">
          <div class="audit-detail__section-title" style="display: flex; justify-content: space-between;">
            <span>📥 参数</span>
            <div>
              <el-button size="small" text @click="toggleParams">
                {{ paramsExpanded ? '折叠' : '展开' }}
              </el-button>
              <el-button size="small" text @click="copyToClipboard(formatJson(log.params))">
                复制
              </el-button>
            </div>
          </div>
          <pre v-if="paramsExpanded" class="audit-detail__json">{{ formatJson(log.params) || '（无参数）' }}</pre>
        </div>

        <!-- 执行结果 -->
        <div class="audit-detail__section">
          <div class="audit-detail__section-title" style="display: flex; justify-content: space-between;">
            <span>📤 执行结果</span>
            <div>
              <el-button size="small" text @click="toggleResult">
                {{ resultExpanded ? '折叠' : '展开' }}
              </el-button>
              <el-button size="small" text @click="copyToClipboard(formatJson(log.result))">
                复制
              </el-button>
            </div>
          </div>
          <pre v-if="resultExpanded" class="audit-detail__json">{{ formatJson(log.result) || '（无结果）' }}</pre>
        </div>

        <!-- 状态 + 耗时 -->
        <el-divider />
        <div class="audit-detail__row">
          <span class="audit-detail__label">状态</span>
          <span :style="{ color: log.success ? '#10b981' : '#dc2626' }">
            {{ log.success ? '✅ 成功' : '❌ 失败' }}
          </span>
        </div>
        <div class="audit-detail__row">
          <span class="audit-detail__label">耗时</span>
          <span :style="{ color: log.durationMs > 3000 ? '#dc2626' : '#1f2937' }">
            {{ log.durationMs }} ms
          </span>
        </div>

        <!-- 错误信息（失败时） -->
        <div v-if="!log.success && log.errorMessage" class="audit-detail__error">
          <div class="audit-detail__section-title" style="color: #dc2626;">❌ 错误信息</div>
          <div class="audit-detail__error-msg">{{ log.errorMessage }}</div>
        </div>
      </div>
    </template>

    <!-- 空态 -->
    <div v-else class="audit-detail__empty">
      请选择一条记录查看详情
    </div>
  </el-drawer>
</template>

<style scoped>
.audit-detail {
  padding: 8px;
}

.audit-detail__section {
  margin-bottom: 16px;
}

.audit-detail__section-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 8px;
}

.audit-detail__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.audit-detail__label {
  color: #6b7280;
  min-width: 50px;
  font-weight: 500;
}

.audit-detail__tool-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Monaco', 'Consolas', monospace;
}

.audit-detail__natural-input {
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: #1f2937;
}

.audit-detail__json {
  margin: 0;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: #1f2937;
  max-height: 300px;
  overflow-y: auto;
}

.audit-detail__error {
  margin-top: 8px;
}

.audit-detail__error-msg {
  padding: 10px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 13px;
}

.audit-detail__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #9ca3af;
  font-size: 14px;
}
</style>
