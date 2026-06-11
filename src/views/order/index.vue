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

    <!-- 订单级联预览弹窗 -->
    <el-dialog v-model="cascadeDialogVisible" :title="`${getActionLabel(pendingAction)} — 级联影响预览`" width="520px">
      <el-alert :title="getCascadeWarning(pendingAction)" type="warning" :closable="false" show-icon style="margin-bottom:12px;" />
      <el-table :data="cascadeImpactData" size="small">
        <el-table-column prop="level" label="层级" width="100" />
        <el-table-column prop="entity" label="实体" />
        <el-table-column prop="currentStatus" label="当前状态" width="110" />
        <el-table-column prop="targetStatus" label="目标状态" width="110" />
        <el-table-column prop="count" label="影响数量" width="80" align="center" />
      </el-table>
      <template #footer>
        <el-button @click="cascadeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCascadeAction">确认执行</el-button>
      </template>
    </el-dialog>

    <!-- 新建/编辑订单对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑订单' : '新建订单'" width="580px" @close="resetForm">
      <div v-if="isEdit" class="current-status-bar">
        <span>当前状态:</span>
        <el-tag :type="getStatusType(selectedOrder?.status)" size="small">{{ STATUS_LABELS[selectedOrder?.status] }}</el-tag>
      </div>
      <el-form :model="formData" label-width="120px">
        <el-form-item label="订单名称">
          <template v-if="isFieldEditable('orderName')">
            <el-input v-model="formData.orderName" placeholder="请输入订单名称" />
          </template>
          <template v-else>
            <span class="locked-field">{{ formData.orderName }}</span><span class="locked-tag">🔒 已排产不可改</span>
          </template>
        </el-form-item>
        <el-form-item label="所属计划">
          <template v-if="isFieldEditable('planNo')">
            <el-input v-model="formData.planNo" placeholder="计划编号" />
          </template>
          <template v-else>
            <span class="locked-field">{{ formData.planNo }}</span><span class="locked-tag">🔒 已排产不可改</span>
          </template>
        </el-form-item>
        <el-form-item label="产线编号">
          <template v-if="isFieldEditable('lineNo')">
            <el-input v-model="formData.lineNo" placeholder="产线编号" />
          </template>
          <template v-else>
            <span class="locked-field">{{ formData.lineNo }}</span><span class="locked-tag">🔒 已排产不可改</span>
          </template>
        </el-form-item>
        <el-form-item label="计划数量">
          <el-input-number v-model="formData.quantity" :min="1" :disabled="!isFieldEditable('quantity')" />
        </el-form-item>
        <el-form-item label="计划开始时间">
          <el-date-picker v-model="formData.startTime" type="datetime" placeholder="选择开始时间" :disabled="!isFieldEditable('startTime')" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="计划结束时间">
          <el-date-picker v-model="formData.endTime" type="datetime" placeholder="选择结束时间" :disabled="!isFieldEditable('endTime')" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="3" :disabled="!isFieldEditable('remark')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFormSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 工单 Drawer -->
    <el-drawer v-model="workOrderDrawerVisible" title="" direction="rtl" size="520px">
      <template #header>
        <div><span style="font-weight:600;">📋 工单详情</span><span style="font-size:12px;color:#909399;margin-left:8px;">{{ drawerWorkOrderData?.workOrderNo }}</span></div>
      </template>
      <div v-if="drawerWorkOrderData">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="工单编号">{{ drawerWorkOrderData.workOrderNo }}</el-descriptions-item>
          <el-descriptions-item label="工序ID">{{ drawerWorkOrderData.processId }}</el-descriptions-item>
          <el-descriptions-item label="人员ID">{{ drawerWorkOrderData.userId }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(drawerWorkOrderData.status)" size="small">{{ STATUS_LABELS[drawerWorkOrderData.status] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="实际产量">{{ drawerWorkOrderData.actualQuantity }}/{{ drawerWorkOrderData.plannedQuantity }}</el-descriptions-item>
          <el-descriptions-item label="报废">{{ drawerWorkOrderData.scrapQuantity }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="workOrderDrawerVisible = false">关闭</el-button>
        <el-button type="primary" @click="goToWorkOrderPage">🔗 打开完整页面</el-button>
      </template>
    </el-drawer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
import { getWorkOrderByNoApi } from '@/api/workOrder'

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

// 删除
const handleDelete = async () => {
  if (!selectedOrder.value || selectedOrder.value.status !== STATUS.CREATED) {
    ElMessage.warning('仅 CREATED 状态的订单可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除订单 ${selectedOrder.value.orderNo}？`, '确认删除', { type: 'warning' })
    const result = await deleteOrderApi(selectedOrder.value.orderNo)
    if (result.code === 200) {
      ElMessage.success('删除成功')
      orderStore.deleteOrders([selectedOrder.value.orderNo])
      selectedOrder.value = null
    } else { ElMessage.error(result.message || '删除失败') }
  } catch {}
}

const handleOrderAction = (action) => {
  openOrderCascadePreview(action)
}

// ===== 级联预览 =====
const cascadeDialogVisible = ref(false)
const pendingAction = ref('')
const cascadeImpactData = ref([])

const getActionLabel = (a) => ({ PAUSE: '暂停订单', RESUME: '恢复订单', TERMINATE: '作废订单' }[a] || a)
const getCascadeWarning = (a) => {
  return {
    PAUSE: '暂停将级联暂停所有关联的 RUNNING 工单。',
    RESUME: '恢复将级联恢复所有关联的 PAUSED 工单。',
    TERMINATE: '作废为终态操作，不可逆。将级联作废所有非终态的关联工单。'
  }[a] || ''
}

const openOrderCascadePreview = (action) => {
  pendingAction.value = action
  const order = selectedOrder.value
  cascadeImpactData.value = [
    { level: '本订单', entity: order.orderNo, currentStatus: STATUS_LABELS[order.status], targetStatus: STATUS_LABELS[{ PAUSE: 'PAUSED', RESUME: 'RUNNING', TERMINATE: 'TERMINATED' }[action]], count: 1 },
    { level: '关联工单', entity: `${relatedWorkOrders.value.length} 个工单`, currentStatus: '混合', targetStatus: '联动变化', count: relatedWorkOrders.value.length }
  ]
  cascadeDialogVisible.value = true
}

const confirmCascadeAction = async () => {
  try {
    const result = await executeOrderActionApi(selectedOrder.value.orderNo, pendingAction.value)
    if (result.code === 200) {
      ElMessage.success(result.message || '操作成功')
      cascadeDialogVisible.value = false
      await orderStore.loadAllOrders()
      const ref = orderStore.orderList.find(o => o.orderNo === selectedOrder.value.orderNo)
      if (ref) selectedOrder.value = ref
    } else { ElMessage.error(result.message || '操作失败') }
  } catch { ElMessage.error('操作请求失败') }
}

// ===== 表单 =====
const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = ref({ orderName: '', planNo: '', lineNo: '', quantity: null, startTime: '', endTime: '', remark: '' })

const getEditableFields = (status) => {
  if (status === STATUS.CREATED) return ['orderName', 'planNo', 'lineNo', 'quantity', 'startTime', 'endTime', 'remark']
  if (status === STATUS.RELEASED) return ['quantity', 'startTime', 'endTime', 'remark']
  if (status === STATUS.PAUSED) return ['remark']
  return []
}
const isFieldEditable = (field) => {
  if (!isEdit.value) return true
  return getEditableFields(selectedOrder.value?.status).includes(field)
}

const openCreateDialog = () => {
  isEdit.value = false
  formData.value = { orderName: '', planNo: '', lineNo: '', quantity: null, startTime: '', endTime: '', remark: '' }
  dialogVisible.value = true
}

const openEditDialog = () => {
  if (!selectedOrder.value) return
  isEdit.value = true
  formData.value = { ...selectedOrder.value }
  dialogVisible.value = true
}

const handleFormSubmit = async () => {
  try {
    if (isEdit.value) {
      const result = await updateOrderApi(selectedOrder.value.orderNo, formData.value)
      if (result.code === 200) {
        ElMessage.success('修改成功')
        orderStore.updateOrder({ ...selectedOrder.value, ...formData.value })
        dialogVisible.value = false
      } else { ElMessage.error(result.message || '修改失败') }
    } else {
      const result = await addOrderApi(formData.value)
      if (result.code === 200) {
        ElMessage.success('新增成功')
        await orderStore.loadAllOrders()
        dialogVisible.value = false
      } else { ElMessage.error(result.message || '新增失败') }
    }
  } catch { ElMessage.error('操作失败') }
}

const resetForm = () => {}

// ===== 工单 Drawer =====
const router = useRouter()
const workOrderDrawerVisible = ref(false)
const drawerWorkOrderData = ref(null)

const openWorkOrderDrawer = async (workOrderNo) => {
  try {
    const result = await getWorkOrderByNoApi(workOrderNo)
    if (result.code === 200) drawerWorkOrderData.value = result.data
    workOrderDrawerVisible.value = true
  } catch { ElMessage.error('获取工单详情失败') }
}

const goToWorkOrderPage = () => {
  workOrderDrawerVisible.value = false
  router.push('/workOrder')
}

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
.current-status-bar { padding: 8px 12px; background: #f5f7fa; border-radius: 4px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.locked-field { font-size: 13px; }
.locked-tag { font-size: 10px; padding: 1px 6px; background: #f4f4f5; border-radius: 3px; color: #909399; margin-left: 8px; }
</style>
