<script setup>
/**
 * AI 审计日志页面 (/aiAudit)
 *
 * 功能：
 * - 筛选条件栏（用户 / 工具 / 时间范围 / 仅成功）
 * - 审计日志表格（时间 / 用户 / 工具 / 输入 / 成功 / 耗时 / 操作）
 * - 分页
 * - 详情抽屉（AiAuditDetailDrawer）
 *
 * 对应后端接口：GET /ai/audit
 */
import { ref, reactive, onMounted } from 'vue'
import { queryAuditApi } from '@/api/aiAudit'
import AiAuditDetailDrawer from '@/components/aiChat/AiAuditDetailDrawer.vue'

// ==================== 筛选条件 ====================
const filters = reactive({
  userId: '',
  toolName: '',
  startTime: '',
  endTime: '',
  success: null // null=全部, true=仅成功, false=仅失败
})

// 用户列表（用于下拉选择，实际应从 API 获取）
const userOptions = ref([])
const toolOptions = ref([
  { value: '', label: '全部工具' },
  { value: 'search_bom', label: 'search_bom' },
  { value: 'create_bom', label: 'create_bom' },
  { value: 'search_equipment', label: 'search_equipment' },
  { value: 'delete_equipment_function', label: 'delete_equipment_function' },
  { value: 'search_line', label: 'search_line' },
  { value: 'search_process', label: 'search_process' },
  { value: 'search_step', label: 'search_step' },
  { value: 'search_plan', label: 'search_plan' },
  { value: 'create_order', label: 'create_order' }
])

// ==================== 表格数据 ====================
const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

// ==================== 详情抽屉 ====================
const detailVisible = ref(false)
const currentLog = ref(null)

// ==================== 数据加载 ====================
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (filters.userId) params.userId = filters.userId
    if (filters.toolName) params.toolName = filters.toolName
    if (filters.startTime) params.startTime = filters.startTime
    if (filters.endTime) params.endTime = filters.endTime
    if (filters.success !== null) params.success = filters.success

    const result = await queryAuditApi(params)
    if (result.code === 200) {
      tableData.value = result.data?.rows ?? result.data ?? []
      total.value = result.data?.total ?? 0
    }
  } catch (e) {
    // 加载失败静默处理
  } finally {
    loading.value = false
  }
}

// 查询
const handleQuery = () => {
  page.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  filters.userId = ''
  filters.toolName = ''
  filters.startTime = ''
  filters.endTime = ''
  filters.success = null
  page.value = 1
  loadData()
}

// 分页变化
const handlePageChange = (newPage) => {
  page.value = newPage
  loadData()
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  page.value = 1
  loadData()
}

// 查看详情
const handleViewDetail = (row) => {
  currentLog.value = row
  detailVisible.value = true
}

// ==================== 工具列渲染 ====================
const categoryColorMap = {
  'BOM管理': { color: '#a855f7', bg: '#f3e8ff' },
  '设备管理': { color: '#10b981', bg: '#ecfdf5' },
  '产线管理': { color: '#0ea5e9', bg: '#e0f2fe' },
  '工序管理': { color: '#f59e0b', bg: '#fef3c7' },
  '工步管理': { color: '#eab308', bg: '#fef9c3' },
  '班组管理': { color: '#06b6d4', bg: '#cffafe' },
  '生产管理': { color: '#6366f1', bg: '#e0e7ff' }
}

const getCategoryStyle = (category) => {
  const cfg = categoryColorMap[category] || { color: '#6b7280', bg: '#f3f4f6' }
  return { backgroundColor: cfg.bg, color: cfg.color }
}

// 格式化时间
const formatTime = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 截断文本
const truncateText = (text, maxLen = 30) => {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

// ==================== 初始化 ====================
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="ai-audit-page">
    <h2 class="page-title">AI 审计日志</h2>

    <!-- ===== 筛选条件栏 ===== -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <div class="filter-item">
          <label>用户</label>
          <el-select v-model="filters.userId" placeholder="全部用户" clearable style="width: 160px;">
            <el-option
              v-for="u in userOptions"
              :key="u.id"
              :label="u.name"
              :value="u.id"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label>工具</label>
          <el-select v-model="filters.toolName" placeholder="全部工具" clearable style="width: 200px;">
            <el-option
              v-for="t in toolOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label>时间</label>
          <el-date-picker
            v-model="filters.startTime"
            type="datetime"
            placeholder="开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 180px;"
          />
          <span style="margin: 0 6px;">—</span>
          <el-date-picker
            v-model="filters.endTime"
            type="datetime"
            placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 180px;"
          />
        </div>

        <div class="filter-item">
          <el-checkbox
            v-model="filters.success"
            :true-value="true"
            :false-value="null"
          >
            仅成功
          </el-checkbox>
        </div>

        <div class="filter-actions">
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- ===== 表格 ===== -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="tableData"
        v-loading="loading"
        style="width: 100%;"
        stripe
        border
      >
        <el-table-column prop="createdAt" label="时间" width="170" :formatter="(row) => formatTime(row.createdAt)" />
        <el-table-column prop="userName" label="用户" width="100" />
        <el-table-column label="工具" width="200">
          <template #default="{ row }">
            <span
              class="tool-badge"
              :style="getCategoryStyle(row.category)"
            >
              {{ row.toolName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="自然语言输入" min-width="200">
          <template #default="{ row }">
            <el-tooltip
              :content="row.userNaturalInput"
              :disabled="!row.userNaturalInput || row.userNaturalInput.length <= 30"
              placement="top"
            >
              <span>{{ truncateText(row.userNaturalInput) || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="是否成功" width="90" align="center">
          <template #default="{ row }">
            <span :style="{ fontSize: '18px' }">{{ row.success ? '✅' : '❌' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.durationMs > 3000 ? '#dc2626' : '#1f2937' }">
              {{ row.durationMs }} ms
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleViewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- ===== 详情抽屉 ===== -->
    <AiAuditDetailDrawer
      v-model:visible="detailVisible"
      :log="currentLog"
    />
  </div>
</template>

<style scoped>
.ai-audit-page {
  padding: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 20px;
}

/* ========== 筛选栏 ========== */
.filter-card {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* ========== 表格卡片 ========== */
.table-card {
  overflow: visible;
}

/* ========== 工具徽标 ========== */
.tool-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Monaco', 'Consolas', monospace;
  white-space: nowrap;
}

/* ========== 分页 ========== */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
