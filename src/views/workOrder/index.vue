<template>
  <div class="page">
    <h1 class="page-title">工单管理</h1>
  </div>
  <div class="master-detail-container">
    <!-- 左侧列表面板 -->
    <div class="left-panel">
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索工单编号"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>

      <div class="status-filters">
        <el-button
          v-for="filter in statusFilters"
          :key="filter.value"
          :type="filter.value === activeStatusFilter ? 'primary' : ''"
          size="small"
          :plain="filter.value !== activeStatusFilter"
          @click="activeStatusFilter = filter.value"
        >
          {{ filter.label }} ({{ getStatusCount(filter.value) }})
        </el-button>
      </div>

      <el-collapse v-model="advancedFilterExpanded">
        <el-collapse-item title="更多筛选" name="1">
          <el-select v-model="priorityFilter" placeholder="全部优先级" size="small" clearable>
            <el-option label="高" value="高" /><el-option label="中" value="中" /><el-option label="低" value="低" />
          </el-select>
        </el-collapse-item>
      </el-collapse>

      <div class="list-items">
        <div
          v-for="wo in filteredWorkOrderList"
          :key="wo.workOrderNo"
          class="list-item"
          :class="{ active: selectedWorkOrder?.workOrderNo === wo.workOrderNo }"
          @click="selectWorkOrder(wo)"
        >
          <div class="list-item-top">
            <span class="list-item-no">
              <el-tooltip
                v-if="wo.isCritical"
                content="关键工单 — 状态变更将影响订单状态聚合"
                placement="top"
              >
                <span style="color:#f56c6c; margin-right:2px;">⭐</span>
              </el-tooltip>
              {{ wo.workOrderNo }}
            </span>
            <el-tag :type="getStatusType(wo.status)" size="small">
              {{ STATUS_LABELS[wo.status] }}
            </el-tag>
          </div>
          <div class="list-item-name">订单: {{ wo.orderNo }} · 工序: {{ wo.processId }}</div>
          <div class="list-item-meta">
            人员: {{ wo.userId }} · 产量 {{ wo.actualQuantity || 0 }}/{{ wo.plannedQuantity }}
            <span v-if="wo.scrapQuantity"> · 报废 {{ wo.scrapQuantity }}</span>
          </div>
        </div>
        <el-empty v-if="filteredWorkOrderList.length === 0" description="暂无工单" />
      </div>

      <div class="panel-footer">
        <el-button type="primary" @click="openCreateDialog">+ 新建工单</el-button>
      </div>
    </div>

    <!-- 右侧详情面板 -->
    <div class="right-panel">
      <div v-if="selectedWorkOrder" class="detail-content">
        <div class="detail-header">
          <div class="detail-title">
            <h2>
              <span v-if="selectedWorkOrder.isCritical" style="color:#f56c6c;">⭐ </span>
              {{ selectedWorkOrder.workOrderNo }}
            </h2>
            <span v-if="selectedWorkOrder.isCritical" class="critical-tag">⭐ 关键工单 · 影响订单状态聚合</span>
          </div>
          <div class="detail-actions">
            <el-button
              v-for="btn in availableButtons"
              :key="btn.action"
              :type="btn.type"
              :disabled="btn.disabled"
              :style="btn.disabled ? 'opacity:0.4;cursor:not-allowed;' : ''"
              @click="handleWorkOrderAction(btn.action)"
              size="small"
            >
              {{ btn.label }}
            </el-button>
            <el-button v-if="canEdit" size="small" type="info" plain @click="openEditDialog">✏️ 编辑</el-button>
          </div>
        </div>

        <!-- 双角色权限提示 -->
        <el-alert :title="statusHint.text" :type="statusHint.type" :closable="false" show-icon style="margin-bottom: 8px;" />

        <!-- 状态流转步骤条 -->
        <el-steps :active="currentStepIndex" finish-status="success" align-center>
          <el-step v-for="step in lifecycleSteps" :key="step.status" :title="step.label" :status="step.stepStatus" />
        </el-steps>

        <!-- 信息卡片 -->
        <div class="info-cards">
          <el-card><template #header>基本信息</template>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="工单编号">{{ selectedWorkOrder.workOrderNo }}</el-descriptions-item>
              <el-descriptions-item label="所属订单">{{ selectedWorkOrder.orderNo }}</el-descriptions-item>
              <el-descriptions-item label="工序ID">{{ selectedWorkOrder.processId }}</el-descriptions-item>
              <el-descriptions-item label="派工人员ID">{{ selectedWorkOrder.userId }}</el-descriptions-item>
              <el-descriptions-item label="是否关键工单">
                <el-tag :type="selectedWorkOrder.isCritical ? 'danger' : 'info'" size="small">
                  {{ selectedWorkOrder.isCritical ? '⭐ 是' : '否' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="计划数量">{{ selectedWorkOrder.plannedQuantity }}</el-descriptions-item>
              <el-descriptions-item label="实际产量">{{ selectedWorkOrder.actualQuantity }}</el-descriptions-item>
              <el-descriptions-item label="报废数量">{{ selectedWorkOrder.scrapQuantity }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ selectedWorkOrder.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
          <el-card><template #header>时间信息</template>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="计划开始">{{ selectedWorkOrder.startTime }}</el-descriptions-item>
              <el-descriptions-item label="计划结束">{{ selectedWorkOrder.endTime }}</el-descriptions-item>
              <el-descriptions-item label="实际开始">{{ selectedWorkOrder.actualStartTime || '-' }}</el-descriptions-item>
              <el-descriptions-item label="实际结束">{{ selectedWorkOrder.actualEndTime || '-' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ selectedWorkOrder.createTime }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ selectedWorkOrder.updateTime }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>
      </div>
      <el-empty v-else description="请选择左侧工单查看详情" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWorkOrderStore } from '@/stores/workOrder'
import { executeWorkOrderActionApi } from '@/api/workOrder'

// ===== 状态常量 =====
const STATUS = {
  CREATED: 'CREATED', RELEASED: 'RELEASED', RUNNING: 'RUNNING',
  PAUSED: 'PAUSED', COMPLETED: 'COMPLETED', TERMINATED: 'TERMINATED'
}

const STATUS_LABELS = {
  CREATED: '已创建', RELEASED: '已派工', RUNNING: '作业中',
  PAUSED: '已暂停', COMPLETED: '已完成', TERMINATED: '已作废'
}

const STATUS_TYPE_MAP = {
  CREATED: 'info', RELEASED: 'info', RUNNING: 'success',
  PAUSED: 'warning', COMPLETED: 'success', TERMINATED: 'danger'
}

const getStatusType = (s) => STATUS_TYPE_MAP[s] || 'info'

// ===== Store =====
const workOrderStore = useWorkOrderStore()

// ===== 左侧面板 =====
const searchKeyword = ref('')
const activeStatusFilter = ref('ALL')
const advancedFilterExpanded = ref([])
const priorityFilter = ref('')

const statusFilters = [
  { label: '全部', value: 'ALL' },
  { label: 'RUNNING', value: 'RUNNING' },
  { label: 'PAUSED', value: 'PAUSED' },
  { label: 'CREATED', value: 'CREATED' },
  { label: '终态', value: 'TERMINAL' }
]

const getStatusCount = (sv) => {
  if (sv === 'ALL') return workOrderStore.workOrderList.length
  if (sv === 'TERMINAL') return workOrderStore.workOrderList.filter(
    w => w.status === STATUS.COMPLETED || w.status === STATUS.TERMINATED
  ).length
  return workOrderStore.workOrderList.filter(w => w.status === sv).length
}

const filteredWorkOrderList = computed(() => {
  let list = workOrderStore.workOrderList
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(w => w.workOrderNo.toLowerCase().includes(kw))
  }
  if (activeStatusFilter.value === 'TERMINAL') {
    list = list.filter(w => w.status === STATUS.COMPLETED || w.status === STATUS.TERMINATED)
  } else if (activeStatusFilter.value !== 'ALL') {
    list = list.filter(w => w.status === activeStatusFilter.value)
  }
  return list
})

const handleSearch = () => {}

// ===== 右侧面板 =====
const selectedWorkOrder = ref(null)

const selectWorkOrder = (wo) => {
  selectedWorkOrder.value = wo
}

// ===== 状态驱动按钮 =====
const availableButtons = computed(() => {
  const status = selectedWorkOrder.value?.status
  if (!status) return []

  const defs = {
    START_WORK:  { action: 'START_WORK',  label: '▶▶ 开始作业', type: 'primary' },
    FINISH_WORK: { action: 'FINISH_WORK', label: '✓ 完成作业', type: 'success' },
    PAUSE:       { action: 'PAUSE',       label: '⏸ 暂停', type: 'warning' },
    RESUME:      { action: 'RESUME',      label: '▶ 恢复', type: 'success' },
    TERMINATE:   { action: 'TERMINATE',   label: '✕ 作废', type: 'danger' }
  }

  const allowed = {
    CREATED:    [],
    RELEASED:   ['START_WORK', 'TERMINATE'],
    RUNNING:    ['PAUSE', 'FINISH_WORK'],
    PAUSED:     ['RESUME', 'TERMINATE'],
    COMPLETED:  [],
    TERMINATED: []
  }
  return (allowed[status] || []).map(a => ({ ...defs[a], disabled: false }))
})

const canEdit = computed(() => {
  const s = selectedWorkOrder.value?.status
  return s === STATUS.CREATED || s === STATUS.RELEASED || s === STATUS.RUNNING || s === STATUS.PAUSED
})

const statusHint = computed(() => {
  const s = selectedWorkOrder.value?.status
  const hints = {
    CREATED:    { text: '📝 待派工 — 可编辑全部字段。发布由订单联动触发', type: 'info' },
    RELEASED:   { text: '👷 已派工 — 员工可开始作业；主管可作废（仅 RELEASED/PAUSED 可作废）', type: 'info' },
    RUNNING:    { text: '🏭 作业中 — 员工可上报产量/暂停/完成作业', type: 'success' },
    PAUSED:     { text: '⏸ 异常暂停 — 员工/主管可恢复；主管可作废', type: 'warning' },
    COMPLETED:  { text: '✅ 已完成 — 终态，全部操作禁用', type: 'success' },
    TERMINATED: { text: '✕ 已作废 — 终态，全部操作禁用', type: 'danger' }
  }
  return hints[s] || { text: '', type: 'info' }
})

// ===== 生命周期步骤条 =====
const mainSteps = [
  { status: STATUS.CREATED, label: '已创建' },
  { status: STATUS.RELEASED, label: '已派工' },
  { status: STATUS.RUNNING, label: '作业中' },
  { status: STATUS.COMPLETED, label: '已完成' }
]

const lifecycleSteps = computed(() => {
  const cur = selectedWorkOrder.value?.status
  const order = [STATUS.CREATED, STATUS.RELEASED, STATUS.RUNNING, STATUS.PAUSED, STATUS.COMPLETED, STATUS.TERMINATED]
  const curIdx = order.indexOf(cur)
  return mainSteps.map((step) => {
    const si = order.indexOf(step.status)
    let ss = 'wait'
    if (si < curIdx) ss = 'success'
    else if (si === curIdx) ss = 'process'
    return { ...step, stepStatus: ss }
  })
})

const currentStepIndex = computed(() => {
  const s = selectedWorkOrder.value?.status
  if (s === STATUS.CREATED) return 0
  if (s === STATUS.RELEASED) return 1
  if (s === STATUS.RUNNING || s === STATUS.PAUSED) return 2
  return 3
})

const handleWorkOrderAction = (action) => {
  // TERMINATE 需确认（级联预览在 Task 14 完善），其他直接执行
  if (action === 'TERMINATE') {
    ElMessageBox.confirm(
      '确认作废该工单？作废为终态操作不可逆。',
      '确认作废',
      { confirmButtonText: '确认作废', cancelButtonText: '取消', type: 'warning' }
    ).then(() => executeAction(action)).catch(() => {})
  } else {
    executeAction(action)
  }
}

const executeAction = async (action) => {
  try {
    const result = await executeWorkOrderActionApi(selectedWorkOrder.value.workOrderNo, action)
    if (result.code === 200) {
      ElMessage.success(result.message || '操作成功')
      await workOrderStore.loadAllWorkOrders()
      const ref = workOrderStore.workOrderList.find(
        w => w.workOrderNo === selectedWorkOrder.value.workOrderNo
      )
      if (ref) selectedWorkOrder.value = ref
    } else { ElMessage.error(result.message || '操作失败') }
  } catch { ElMessage.error('操作请求失败') }
}

// ===== 初始化 =====
onMounted(async () => {
  await workOrderStore.loadAllWorkOrders()
})
</script>

<style scoped>
.page-title { padding: 0; margin: 0 0 16px 0; font-size: 20px; font-weight: 600; }
.master-detail-container { display: flex; gap: 16px; height: calc(100vh - 180px); }
.left-panel { width: 380px; min-width: 380px; display: flex; flex-direction: column; border: 1px solid #e4e7ed; border-radius: 8px; background: #fff; overflow: hidden; }
.search-bar { padding: 12px; border-bottom: 1px solid #ebeef5; }
.status-filters { padding: 8px 12px; display: flex; gap: 6px; flex-wrap: wrap; border-bottom: 1px solid #ebeef5; }
.list-items { flex: 1; overflow-y: auto; }
.list-item { padding: 10px 16px; border-bottom: 1px solid #ebeef5; cursor: pointer; transition: background 0.2s; }
.list-item:hover { background: #f5f7fa; }
.list-item.active { background: #ecf5ff; border-left: 3px solid #409eff; }
.list-item-top { display: flex; justify-content: space-between; align-items: center; }
.list-item-no { font-weight: 600; font-size: 13px; }
.list-item-name { font-size: 12px; color: #606266; margin-top: 3px; }
.list-item-meta { font-size: 11px; color: #909399; margin-top: 2px; }
.panel-footer { padding: 8px 16px; border-top: 1px solid #e4e7ed; display: flex; justify-content: space-between; }
.right-panel { flex: 1; border: 1px solid #e4e7ed; border-radius: 8px; background: #fff; overflow-y: auto; padding: 16px; }
.detail-header { margin-bottom: 0; }
.detail-title h2 { margin: 0; font-size: 18px; display: inline; margin-right: 10px; }
.critical-tag { font-size: 12px; padding: 2px 8px; background: #fef0f0; border: 1px solid #f56c6c; border-radius: 4px; color: #f56c6c; margin-left: 8px; }
.detail-actions { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.info-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
</style>
