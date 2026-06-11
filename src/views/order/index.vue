<template>
  <div class="page">
    <h1 class="page-title">订单管理</h1>
  </div>
  <div class="master-detail-container">
    <!-- 左侧列表面板 -->
    <div class="left-panel">
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索订单编号/名称"
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
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-collapse-item>
      </el-collapse>

      <div class="list-items">
        <div
          v-for="order in filteredOrderList"
          :key="order.orderNo"
          class="list-item"
          :class="{ active: selectedOrder?.orderNo === order.orderNo }"
          @click="selectOrder(order)"
        >
          <div class="list-item-top">
            <span class="list-item-no">{{ order.orderNo }}</span>
            <el-tag :type="getStatusType(order.status)" size="small">
              {{ STATUS_LABELS[order.status] }}
            </el-tag>
          </div>
          <div class="list-item-name">{{ order.orderName }}</div>
          <div class="list-item-meta">
            产线: {{ order.lineNo }} · {{ order.quantityProduced || 0 }}/{{ order.quantity }}
          </div>
        </div>
        <el-empty v-if="filteredOrderList.length === 0" description="暂无订单" />
      </div>

      <div class="panel-footer">
        <el-button type="primary" @click="openCreateDialog">+ 新建订单</el-button>
      </div>
    </div>

    <!-- 右侧详情面板 -->
    <div class="right-panel">
      <div v-if="selectedOrder" class="detail-content">
        <!-- 详情头部 + 按钮分区 -->
        <div class="detail-header">
          <div class="detail-title">
            <h2>{{ selectedOrder.orderName }}</h2>
            <span class="detail-no">{{ selectedOrder.orderNo }}</span>
          </div>
          <div class="detail-actions">
            <!-- 人工可操作区 -->
            <div class="actions-group user-actions">
              <span class="actions-label">人工操作</span>
              <el-button
                v-for="btn in userAvailableButtons"
                :key="btn.action"
                :type="btn.type"
                @click="handleOrderAction(btn.action)"
                size="small"
              >
                {{ btn.label }}
              </el-button>
              <el-button
                v-if="canEdit"
                size="small"
                type="info"
                plain
                @click="openEditDialog"
              >✏️ 编辑</el-button>
            </div>
            <el-divider direction="vertical" />
            <!-- 系统驱动区 -->
            <div class="actions-group system-actions">
              <span class="actions-label">系统驱动</span>
              <span
                v-for="btn in systemDrivenButtons"
                :key="btn.action"
                class="system-btn disabled"
              >
                {{ btn.label }}
              </span>
            </div>
          </div>
        </div>

        <el-alert
          :title="statusHint.text"
          :type="statusHint.type"
          :closable="false"
          show-icon
          style="margin-bottom: 12px;"
        />

        <!-- 状态流转步骤条 -->
        <el-steps :active="currentStepIndex" finish-status="success" align-center>
          <el-step
            v-for="step in lifecycleSteps"
            :key="step.status"
            :title="step.label"
            :status="step.stepStatus"
          />
        </el-steps>

        <!-- 信息卡片 -->
        <div class="info-cards">
          <el-card><template #header>基本信息</template>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="订单编号">{{ selectedOrder.orderNo }}</el-descriptions-item>
              <el-descriptions-item label="订单名称">{{ selectedOrder.orderName }}</el-descriptions-item>
              <el-descriptions-item label="所属计划">{{ selectedOrder.planNo }}</el-descriptions-item>
              <el-descriptions-item label="产线">{{ selectedOrder.lineNo }}</el-descriptions-item>
              <el-descriptions-item label="计划数量">{{ selectedOrder.quantity }}</el-descriptions-item>
              <el-descriptions-item label="已生产">{{ selectedOrder.quantityProduced }}</el-descriptions-item>
              <el-descriptions-item label="合格品">{{ selectedOrder.qualifiedProducts }}</el-descriptions-item>
              <el-descriptions-item label="不良品">{{ selectedOrder.defectiveProducts }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ selectedOrder.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
          <el-card><template #header>时间信息</template>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="计划开始">{{ selectedOrder.startTime }}</el-descriptions-item>
              <el-descriptions-item label="计划结束">{{ selectedOrder.endTime }}</el-descriptions-item>
              <el-descriptions-item label="实际开始">{{ selectedOrder.actualStartTime || '-' }}</el-descriptions-item>
              <el-descriptions-item label="实际结束">{{ selectedOrder.actualEndTime || '-' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ selectedOrder.createTime }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ selectedOrder.updateTime }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>

        <!-- 关联工单 Tab -->
        <el-tabs v-model="activeTab">
          <el-tab-pane label="关联工单" name="workOrders">
            <el-table :data="relatedWorkOrders" size="small" style="width:100%">
              <el-table-column prop="workOrderNo" label="工单编号" width="200" />
              <el-table-column prop="processId" label="工序ID" width="80" />
              <el-table-column prop="userId" label="人员ID" width="80" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">
                    {{ STATUS_LABELS[row.status] }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="产量" width="120">
                <template #default="{ row }">
                  {{ row.actualQuantity || 0 }}/{{ row.plannedQuantity }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openWorkOrderDrawer(row.workOrderNo)">
                    查看详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="操作日志" name="logs">
            <el-empty description="操作日志（后续迭代）" />
          </el-tab-pane>
        </el-tabs>
      </div>
      <el-empty v-else description="请选择左侧订单查看详情" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOrderStore } from '@/stores/order'
import {
  addOrderApi,
  updateOrderApi,
  deleteOrderApi,
  executeOrderActionApi,
  getWorkOrdersByOrderApi
} from '@/api/order'

// ===== 状态常量 =====
const STATUS = {
  CREATED: 'CREATED', RELEASED: 'RELEASED', RUNNING: 'RUNNING',
  PAUSED: 'PAUSED', COMPLETED: 'COMPLETED', TERMINATED: 'TERMINATED'
}

const STATUS_LABELS = {
  CREATED: '已创建', RELEASED: '已发布', RUNNING: '执行中',
  PAUSED: '已暂停', COMPLETED: '已完成', TERMINATED: '已作废'
}

const STATUS_TYPE_MAP = {
  CREATED: 'info', RELEASED: 'info', RUNNING: 'success',
  PAUSED: 'warning', COMPLETED: 'success', TERMINATED: 'danger'
}

const getStatusType = (status) => STATUS_TYPE_MAP[status] || 'info'

// ===== Store =====
const orderStore = useOrderStore()

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

const getStatusCount = (statusValue) => {
  if (statusValue === 'ALL') return orderStore.orderList.length
  if (statusValue === 'TERMINAL') {
    return orderStore.orderList.filter(
      o => o.status === STATUS.COMPLETED || o.status === STATUS.TERMINATED
    ).length
  }
  return orderStore.orderList.filter(o => o.status === statusValue).length
}

const filteredOrderList = computed(() => {
  let list = orderStore.orderList
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(
      o => o.orderNo.toLowerCase().includes(kw) || o.orderName.toLowerCase().includes(kw)
    )
  }
  if (activeStatusFilter.value === 'TERMINAL') {
    list = list.filter(
      o => o.status === STATUS.COMPLETED || o.status === STATUS.TERMINATED
    )
  } else if (activeStatusFilter.value !== 'ALL') {
    list = list.filter(o => o.status === activeStatusFilter.value)
  }
  return list
})

const handleSearch = () => {}

// ===== 右侧面板 =====
const selectedOrder = ref(null)
const activeTab = ref('workOrders')
const relatedWorkOrders = ref([])

const selectOrder = async (order) => {
  selectedOrder.value = order
  activeTab.value = 'workOrders'
  try {
    const result = await getWorkOrdersByOrderApi(order.orderNo)
    if (result.code === 200) relatedWorkOrders.value = result.data
  } catch { relatedWorkOrders.value = [] }
}

// ===== 按钮分区 =====
const userAvailableButtons = computed(() => {
  const status = selectedOrder.value?.status
  if (!status) return []
  const buttonDefs = {
    PAUSE:     { action: 'PAUSE', label: '⏸ 暂停', type: 'warning' },
    RESUME:    { action: 'RESUME', label: '▶ 恢复', type: 'success' },
    TERMINATE: { action: 'TERMINATE', label: '✕ 作废', type: 'danger' }
  }
  const allowed = {
    CREATED: [], RELEASED: ['TERMINATE'], RUNNING: ['PAUSE'],
    PAUSED: ['RESUME'], COMPLETED: [], TERMINATED: []
  }
  return (allowed[status] || []).map(a => buttonDefs[a])
})

const systemDrivenButtons = computed(() => {
  return [
    { action: 'PUBLISH', label: '发布' },
    { action: 'CANCEL_PUBLISH', label: '取消发布' },
    { action: 'START_WORK', label: '开始作业' },
    { action: 'FINISH_WORK', label: '完成作业' }
  ]
})

const canEdit = computed(() => {
  const s = selectedOrder.value?.status
  return s === STATUS.CREATED || s === STATUS.RELEASED || s === STATUS.PAUSED
})

const statusHint = computed(() => {
  const s = selectedOrder.value?.status
  const hints = {
    CREATED:    { text: '📝 待排产 — 可编辑全部字段。发布由计划联动触发', type: 'info' },
    RELEASED:   { text: '📋 已排产 — 仅可修改数量/时间/备注。可作废', type: 'info' },
    RUNNING:    { text: '🏭 执行中 — 状态由工单联动驱动。可暂停', type: 'success' },
    PAUSED:     { text: '⏸ 已中断 — 仅备注可编辑。可恢复', type: 'warning' },
    COMPLETED:  { text: '✅ 已完成 — 终态，全部操作禁用', type: 'success' },
    TERMINATED: { text: '✕ 已作废 — 终态，全部操作禁用', type: 'danger' }
  }
  return hints[s] || { text: '', type: 'info' }
})

// ===== 生命周期步骤条 =====
const mainSteps = [
  { status: STATUS.CREATED, label: '已创建' },
  { status: STATUS.RELEASED, label: '已发布' },
  { status: STATUS.RUNNING, label: '执行中' },
  { status: STATUS.COMPLETED, label: '已完成' }
]

const lifecycleSteps = computed(() => {
  const cur = selectedOrder.value?.status
  const order = [STATUS.CREATED, STATUS.RELEASED, STATUS.RUNNING, STATUS.PAUSED, STATUS.COMPLETED, STATUS.TERMINATED]
  const curIdx = order.indexOf(cur)
  return mainSteps.map((step, i) => {
    const stepIdx = order.indexOf(step.status)
    let stepStatus = 'wait'
    if (stepIdx < curIdx) stepStatus = 'success'
    else if (stepIdx === curIdx) stepStatus = 'process'
    return { ...step, stepStatus }
  })
})

const currentStepIndex = computed(() => {
  const s = selectedOrder.value?.status
  if (s === STATUS.CREATED) return 0
  if (s === STATUS.RELEASED) return 1
  if (s === STATUS.RUNNING || s === STATUS.PAUSED) return 2
  return 3
})

const handleOrderAction = (action) => {
  openOrderCascadePreview(action)
}

// ===== 级联预览（占位，Task 12 完善） =====
const cascadeDialogVisible = ref(false)
const pendingAction = ref('')
const cascadeImpactData = ref([])
const openOrderCascadePreview = (action) => {
  ElMessage.info('级联预览功能将在下一步实现')
}

// ===== 表单（占位，Task 12 完善） =====
const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = ref({ orderName: '', planNo: '', lineNo: '', quantity: null, startTime: '', endTime: '', remark: '' })
const openCreateDialog = () => { dialogVisible.value = true }
const openEditDialog = () => { if (selectedOrder.value) { isEdit.value = true; formData.value = { ...selectedOrder.value }; dialogVisible.value = true } }
const handleFormSubmit = async () => { dialogVisible.value = false }

// ===== 工单 Drawer（占位，Task 12 完善） =====
const workOrderDrawerVisible = ref(false)
const drawerWorkOrderData = ref(null)
const openWorkOrderDrawer = (workOrderNo) => { ElMessage.info('工单详情功能将在下一步实现') }

// ===== 初始化 =====
onMounted(async () => {
  await orderStore.loadAllOrders()
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
.detail-no { font-size: 12px; color: #909399; }
.detail-actions { display: flex; gap: 8px; align-items: flex-start; margin-top: 8px; }
.actions-group { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.actions-label { font-size: 11px; color: #909399; margin-right: 4px; font-weight: bold; }
.system-btn.disabled {
  font-size: 11px; padding: 2px 8px; border: 1px solid #dcdfe6; border-radius: 4px;
  color: #c0c4cc; text-decoration: line-through; cursor: not-allowed; background: #f5f7fa;
}
.info-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
</style>
