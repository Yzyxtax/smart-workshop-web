<template>
  <div class="page">
    <h1 class="page-title">计划管理</h1>
  </div>
  <div class="master-detail-container">
    <!-- 左侧列表面板 -->
    <div class="left-panel">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索计划编号/名称"
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

      <!-- 状态快速筛选 -->
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

      <!-- 可展开的更多筛选 -->
      <el-collapse v-model="advancedFilterExpanded">
        <el-collapse-item title="更多筛选" name="1">
          <el-select v-model="priorityFilter" placeholder="全部优先级" size="small" clearable>
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-collapse-item>
      </el-collapse>

      <!-- 计划列表 -->
      <div class="list-items">
        <div
          v-for="plan in filteredPlanList"
          :key="plan.planNo"
          class="list-item"
          :class="{ active: selectedPlan?.planNo === plan.planNo }"
          @click="selectPlan(plan)"
        >
          <div class="list-item-top">
            <span class="list-item-no">{{ plan.planNo }}</span>
            <el-tag :type="getStatusType(plan.status)" size="small">
              {{ STATUS_LABELS[plan.status] }}
            </el-tag>
          </div>
          <div class="list-item-name">{{ plan.planName }}</div>
          <div class="list-item-meta">
            数量: {{ plan.completedNum || 0 }}/{{ plan.planNum }}
            · {{ plan.priority || '-' }}
          </div>
        </div>
        <el-empty v-if="filteredPlanList.length === 0" description="暂无计划" />
      </div>

      <!-- 底栏：新建按钮 + 分页 -->
      <div class="panel-footer">
        <el-button type="primary" @click="openCreateDialog">+ 新建计划</el-button>
      </div>
    </div>

    <!-- 右侧详情面板 -->
    <div class="right-panel">
      <div v-if="selectedPlan" class="detail-content">
        <!-- 详情头部 + 操作按钮 -->
        <div class="detail-header">
          <div class="detail-title">
            <h2>{{ selectedPlan.planName }}</h2>
            <span class="detail-no">{{ selectedPlan.planNo }}</span>
          </div>
          <div class="detail-actions">
            <!-- 状态操作按钮 — 按设计文档 Section 3.1 规范 -->
            <el-button
              v-for="btn in availableButtons"
              :key="btn.action"
              :type="btn.type"
              :disabled="btn.disabled"
              :style="btn.disabled ? 'opacity:0.4;cursor:not-allowed;' : ''"
              @click="handleAction(btn.action)"
            >
              {{ btn.label }}
            </el-button>
            <el-button
              v-if="canEdit"
              type="info"
              plain
              @click="openEditDialog"
            >✏️ 编辑</el-button>
          </div>
        </div>

        <!-- 状态提示条 -->
        <el-alert
          :title="statusHint.text"
          :type="statusHint.type"
          :closable="false"
          show-icon
          style="margin-bottom: 12px;"
        />

        <!-- 状态流转步骤条 -->
        <div class="lifecycle-steps">
          <el-steps :active="currentStepIndex" finish-status="success" align-center>
            <el-step
              v-for="step in lifecycleSteps"
              :key="step.status"
              :title="step.label"
              :status="step.stepStatus"
            />
          </el-steps>
        </div>

        <!-- 信息卡片区域 -->
        <div class="info-cards">
          <el-card class="info-card">
            <template #header>基本信息</template>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="计划编号">{{ selectedPlan.planNo }}</el-descriptions-item>
              <el-descriptions-item label="计划名称">{{ selectedPlan.planName }}</el-descriptions-item>
              <el-descriptions-item label="BOM ID">{{ selectedPlan.bomId }}</el-descriptions-item>
              <el-descriptions-item label="优先级">
                <el-tag :type="priorityTagType(selectedPlan.priority)" size="small">
                  {{ selectedPlan.priority }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="计划数量">{{ selectedPlan.planNum }}</el-descriptions-item>
              <el-descriptions-item label="已完成数量">{{ selectedPlan.completedNum }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ selectedPlan.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
          <el-card class="info-card">
            <template #header>时间信息</template>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="计划开始">{{ selectedPlan.startTime }}</el-descriptions-item>
              <el-descriptions-item label="计划结束">{{ selectedPlan.endTime }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ selectedPlan.createTime }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ selectedPlan.updateTime }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>

        <!-- 关联数据 Tab -->
        <el-tabs v-model="activeTab">
          <el-tab-pane label="关联订单" name="orders">
            <el-table :data="relatedOrders" size="small" style="width:100%">
              <el-table-column prop="orderNo" label="订单编号" width="240" />
              <el-table-column prop="orderName" label="订单名称" />
              <el-table-column prop="lineNo" label="产线" width="100" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">
                    {{ STATUS_LABELS[row.status] }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="产量" width="120">
                <template #default="{ row }">
                  {{ row.quantityProduced || 0 }}/{{ row.quantity }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openOrderDrawer(row.orderNo)">
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
      <el-empty v-else description="请选择左侧计划查看详情" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePlanStore } from '@/stores/plan'
import {
  addPlanApi,
  updatePlanApi,
  deletePlanApi,
  executePlanActionApi,
  getOrdersByPlanApi
} from '@/api/plan'

// ===== 状态常量 =====
const STATUS = {
  CREATED: 'CREATED',
  RELEASED: 'RELEASED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  TERMINATED: 'TERMINATED'
}

const STATUS_LABELS = {
  CREATED: '已创建',
  RELEASED: '已发布',
  RUNNING: '执行中',
  PAUSED: '已暂停',
  COMPLETED: '已完成',
  TERMINATED: '已作废'
}

const STATUS_TYPE_MAP = {
  CREATED: 'info',
  RELEASED: 'info',
  RUNNING: 'success',
  PAUSED: 'warning',
  COMPLETED: 'success',
  TERMINATED: 'danger'
}

const getStatusType = (status) => STATUS_TYPE_MAP[status] || 'info'

const priorityTagType = (priority) => {
  if (priority === '高') return 'danger'
  if (priority === '中') return 'warning'
  return 'info'
}

// ===== Store =====
const planStore = usePlanStore()

// ===== 左侧面板状态 =====
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
  if (statusValue === 'ALL') return planStore.planList.length
  if (statusValue === 'TERMINAL') {
    return planStore.planList.filter(
      p => p.status === STATUS.COMPLETED || p.status === STATUS.TERMINATED
    ).length
  }
  return planStore.planList.filter(p => p.status === statusValue).length
}

const filteredPlanList = computed(() => {
  let list = planStore.planList
  // 关键字搜索
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(
      p =>
        p.planNo.toLowerCase().includes(kw) ||
        p.planName.toLowerCase().includes(kw)
    )
  }
  // 状态筛选
  if (activeStatusFilter.value === 'TERMINAL') {
    list = list.filter(
      p => p.status === STATUS.COMPLETED || p.status === STATUS.TERMINATED
    )
  } else if (activeStatusFilter.value !== 'ALL') {
    list = list.filter(p => p.status === activeStatusFilter.value)
  }
  // 优先级筛选
  if (priorityFilter.value) {
    list = list.filter(p => p.priority === priorityFilter.value)
  }
  return list
})

const handleSearch = () => { /* computed 已自动过滤 */ }

// ===== 右侧面板状态 =====
const selectedPlan = ref(null)
const activeTab = ref('orders')
const relatedOrders = ref([])

const selectPlan = async (plan) => {
  selectedPlan.value = plan
  activeTab.value = 'orders'
  // 加载关联订单
  try {
    const result = await getOrdersByPlanApi(plan.planNo)
    if (result.code === 200) {
      relatedOrders.value = result.data
    }
  } catch {
    relatedOrders.value = []
  }
}

// ===== 状态驱动按钮 =====
const availableButtons = computed(() => {
  const status = selectedPlan.value?.status
  if (!status) return []

  const buttonDefs = {
    PUBLISH:       { action: 'PUBLISH', label: '📋 发布', type: 'primary' },
    CANCEL_PUBLISH:{ action: 'CANCEL_PUBLISH', label: '↩ 取消发布', type: 'warning' },
    PAUSE:         { action: 'PAUSE', label: '⏸ 暂停', type: 'warning' },
    RESUME:        { action: 'RESUME', label: '▶ 恢复', type: 'success' },
    TERMINATE:     { action: 'TERMINATE', label: '✕ 作废', type: 'danger' }
  }

  const allowed = {
    CREATED:    ['PUBLISH'],
    RELEASED:   ['CANCEL_PUBLISH', 'TERMINATE'],
    RUNNING:    ['PAUSE'],
    PAUSED:     ['RESUME'],
    COMPLETED:  [],
    TERMINATED: []
  }

  const allowedActions = allowed[status] || []
  return allowedActions.map(a => ({
    ...buttonDefs[a],
    disabled: false
  }))
})

const canEdit = computed(() => {
  const status = selectedPlan.value?.status
  return status === STATUS.CREATED || status === STATUS.RELEASED
})

const statusHint = computed(() => {
  const status = selectedPlan.value?.status
  if (!status) return { text: '', type: 'info' }
  const hints = {
    CREATED:    { text: '📝 草稿状态 — 可编辑全部字段，点击"发布"后下发订单', type: 'info' },
    RELEASED:   { text: '📋 已发布 — 仅可修改数量/时间/优先级/备注。可取消发布或作废', type: 'info' },
    RUNNING:    { text: '🏭 执行中 — 状态由订单联动驱动，不可编辑。可暂停计划', type: 'success' },
    PAUSED:     { text: '⏸ 已暂停 — 状态由订单联动驱动。可恢复执行', type: 'warning' },
    COMPLETED:  { text: '✅ 已完成 — 终态，全部操作禁用。数据仅可查看', type: 'success' },
    TERMINATED: { text: '✕ 已作废 — 终态，全部操作禁用。数据仅可查看', type: 'danger' }
  }
  return hints[status] || { text: '', type: 'info' }
})

// ===== 生命周期步骤条（主流程） =====
const mainSteps = [
  { status: STATUS.CREATED, label: '已创建' },
  { status: STATUS.RELEASED, label: '已发布' },
  { status: STATUS.RUNNING, label: '执行中' },
  { status: STATUS.COMPLETED, label: '已完成' }
]

const lifecycleSteps = computed(() => {
  const currentStatus = selectedPlan.value?.status
  return mainSteps.map(step => ({
    ...step,
    stepStatus: getStepStatus(step.status, currentStatus)
  }))
})

const currentStepIndex = computed(() => {
  const s = selectedPlan.value?.status
  if (s === STATUS.CREATED) return 0
  if (s === STATUS.RELEASED) return 1
  if (s === STATUS.RUNNING || s === STATUS.PAUSED) return 2
  if (s === STATUS.COMPLETED) return 3
  return 3
})

const getStepStatus = (stepStatus, currentStatus) => {
  const order = [STATUS.CREATED, STATUS.RELEASED, STATUS.RUNNING, STATUS.PAUSED, STATUS.COMPLETED, STATUS.TERMINATED]
  const stepIdx = order.indexOf(stepStatus)
  const curIdx = order.indexOf(currentStatus)
  if (stepIdx < curIdx || (stepStatus === STATUS.COMPLETED && currentStatus === STATUS.COMPLETED)) return 'success'
  if (stepIdx === curIdx) return 'process'
  return 'wait'
}

// ===== 新建/编辑对话框 =====
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingPlanNo = ref('')

// 表单数据
const formData = ref({
  planNo: '',
  planName: '',
  bomId: null,
  planNum: null,
  startTime: '',
  endTime: '',
  priority: '',
  remark: ''
})

const getEditableFields = (status) => {
  if (status === STATUS.CREATED) return ['planNo', 'planName', 'bomId', 'planNum', 'startTime', 'endTime', 'priority', 'remark']
  if (status === STATUS.RELEASED) return ['planNum', 'startTime', 'endTime', 'priority', 'remark']
  return []
}

const openCreateDialog = () => {
  isEdit.value = false
  editingPlanNo.value = ''
  formData.value = {
    planNo: '', planName: '', bomId: null, planNum: null,
    startTime: '', endTime: '', priority: '', remark: ''
  }
  dialogVisible.value = true
}

const openEditDialog = () => {
  if (!selectedPlan.value) return
  isEdit.value = true
  editingPlanNo.value = selectedPlan.value.planNo
  formData.value = { ...selectedPlan.value }
  dialogVisible.value = true
}

const handleFormSubmit = async () => {
  try {
    if (isEdit.value) {
      const result = await updatePlanApi(editingPlanNo.value, formData.value)
      if (result.code === 200) {
        ElMessage.success('修改成功')
        planStore.updatePlan({ ...formData.value, planNo: editingPlanNo.value })
        selectedPlan.value = planStore.planList.find(p => p.planNo === editingPlanNo.value)
        dialogVisible.value = false
      } else {
        ElMessage.error(result.message || '修改失败')
      }
    } else {
      const result = await addPlanApi(formData.value)
      if (result.code === 200) {
        ElMessage.success('新增成功')
        await planStore.loadAllPlans()
        dialogVisible.value = false
      } else {
        ElMessage.error(result.message || '新增失败')
      }
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

// ===== 状态动作处理 =====
const handleAction = (action) => {
  if (action === 'TERMINATE' || action === 'PAUSE' || action === 'RESUME' || action === 'CANCEL_PUBLISH') {
    openCascadePreview(action)
  } else if (action === 'PUBLISH') {
    openGateCheck()
  }
}

// 门禁检查面板（Task 8 详细实现）
const gateDialogVisible = ref(false)
const gateChecks = ref([])

const openGateCheck = () => { gateDialogVisible.value = true }

// 级联预览弹窗（Task 8 详细实现）
const cascadeDialogVisible = ref(false)
const pendingAction = ref('')
const cascadeImpactData = ref([])

const openCascadePreview = (action) => {
  pendingAction.value = action
  const actionLabel = { PAUSE: '暂停', RESUME: '恢复', TERMINATE: '作废', CANCEL_PUBLISH: '取消发布' }[action]
  cascadeImpactData.value = [
    {
      level: '本计划',
      entity: selectedPlan.value.planNo,
      currentStatus: selectedPlan.value.status,
      targetStatus: action === 'CANCEL_PUBLISH' ? 'CREATED'
        : action === 'PAUSE' ? 'PAUSED'
        : action === 'RESUME' ? 'RUNNING'
        : 'TERMINATED',
      count: 1
    },
    { level: '关联订单', entity: '—', currentStatus: '待查询', targetStatus: '联动变化', count: relatedOrders.value.length },
    { level: '关联工单', entity: '—', currentStatus: '待查询', targetStatus: '联动变化', count: '待确认' }
  ]
  cascadeDialogVisible.value = true
}

const confirmCascadeAction = async () => {
  try {
    const result = await executePlanActionApi(selectedPlan.value.planNo, pendingAction.value)
    if (result.code === 200) {
      ElMessage.success(result.message || '操作成功')
      await planStore.loadAllPlans()
      const refreshed = planStore.planList.find(p => p.planNo === selectedPlan.value.planNo)
      if (refreshed) selectedPlan.value = refreshed
      cascadeDialogVisible.value = false
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

// ===== 跨模块 Drawer（Task 10 详细实现） =====
const orderDrawerVisible = ref(false)
const drawerOrderData = ref(null)
const drawerWorkOrders = ref([])

const openOrderDrawer = (orderNo) => { /* 在 Task 10 实现 */ }

// ===== 初始化 =====
onMounted(async () => {
  await planStore.loadAllPlans()
})
</script>

<style scoped>
.page-title { padding: 0; margin: 0 0 16px 0; font-size: 20px; font-weight: 600; }
.master-detail-container {
  display: flex; gap: 16px; height: calc(100vh - 180px);
}
.left-panel {
  width: 380px; min-width: 380px; display: flex; flex-direction: column;
  border: 1px solid #e4e7ed; border-radius: 8px; background: #fff; overflow: hidden;
}
.search-bar { padding: 12px; border-bottom: 1px solid #ebeef5; }
.status-filters { padding: 8px 12px; display: flex; gap: 6px; flex-wrap: wrap; border-bottom: 1px solid #ebeef5; }
.list-items { flex: 1; overflow-y: auto; }
.list-item {
  padding: 10px 16px; border-bottom: 1px solid #ebeef5; cursor: pointer; transition: background 0.2s;
}
.list-item:hover { background: #f5f7fa; }
.list-item.active { background: #ecf5ff; border-left: 3px solid #409eff; }
.list-item-top { display: flex; justify-content: space-between; align-items: center; }
.list-item-no { font-weight: 600; font-size: 13px; }
.list-item-name { font-size: 12px; color: #606266; margin-top: 3px; }
.list-item-meta { font-size: 11px; color: #909399; margin-top: 2px; }
.panel-footer { padding: 8px 16px; border-top: 1px solid #e4e7ed; display: flex; justify-content: space-between; }
.right-panel { flex: 1; border: 1px solid #e4e7ed; border-radius: 8px; background: #fff; overflow-y: auto; padding: 16px; }
.detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0; }
.detail-title h2 { margin: 0; font-size: 18px; display: inline; margin-right: 10px; }
.detail-no { font-size: 12px; color: #909399; }
.detail-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.info-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
.lifecycle-steps { margin: 16px 0; }
</style>
