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
        >
          <template #append>
            <el-button>
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
            <el-button
              v-if="selectedWorkOrder?.status === 'RUNNING'"
              type="primary"
              plain
              size="small"
              @click="openReportDialog"
            >📊 上报产量</el-button>
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

    <!-- 产量上报弹窗 -->
    <el-dialog v-model="reportDialogVisible" title="📊 上报产量" width="540px" :close-on-click-modal="false">
      <div class="report-header">
        <span>工单 {{ selectedWorkOrder?.workOrderNo }}</span>
        <span>· 工序: {{ selectedWorkOrder?.processId }}</span>
        <span>· 当前累计 {{ selectedWorkOrder?.actualQuantity || 0 }}/{{ selectedWorkOrder?.plannedQuantity }}</span>
      </div>

      <el-divider />
      <div class="report-form">
        <h4>📝 本次上报</h4>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="本次完成数量">
              <el-input-number v-model="reportForm.quantity" :min="0" placeholder="输入本次产量" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="本次报废数量">
              <el-input-number v-model="reportForm.scrap" :min="0" placeholder="输入报废数" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="report-preview">
          上报后累计: 产量
          <strong>{{ selectedWorkOrder?.actualQuantity || 0 }} → {{ predictedQuantity }}</strong>
          | 报废
          <strong>{{ selectedWorkOrder?.scrapQuantity || 0 }} → {{ predictedScrap }}</strong>
          | 剩余计划: {{ remainingPlan }}
        </div>
      </div>

      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReport">确认上报</el-button>
      </template>
    </el-dialog>

    <!-- 新建/编辑工单对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑工单' : '新建工单'" width="580px">
      <div v-if="isEdit" class="current-status-bar">
        <span>当前状态:</span>
        <el-tag :type="getStatusType(selectedWorkOrder?.status)" size="small">{{ STATUS_LABELS[selectedWorkOrder?.status] }}</el-tag>
      </div>
      <el-form :model="formData" label-width="120px">
        <el-form-item label="所属订单">
          <template v-if="isFieldEditable('orderNo')">
            <el-input v-model="formData.orderNo" placeholder="订单编号" />
          </template>
          <template v-else>
            <span class="locked-field">{{ formData.orderNo }}</span><span class="locked-tag">🔒 已派工不可改</span>
          </template>
        </el-form-item>
        <el-form-item label="工序ID">
          <template v-if="isFieldEditable('processId')">
            <el-input-number v-model="formData.processId" :min="1" />
          </template>
          <template v-else>
            <span class="locked-field">{{ formData.processId }}</span><span class="locked-tag">🔒 已派工不可改</span>
          </template>
        </el-form-item>
        <el-form-item label="派工人员ID">
          <template v-if="isFieldEditable('userId')">
            <el-input-number v-model="formData.userId" :min="1" />
          </template>
          <template v-else>
            <span class="locked-field">{{ formData.userId }}</span><span class="locked-tag">🔒 已派工不可改</span>
          </template>
        </el-form-item>
        <el-form-item label="是否关键工单">
          <template v-if="isFieldEditable('isCritical')">
            <el-switch v-model="formData.isCritical" active-text="⭐ 是" inactive-text="否" />
          </template>
          <template v-else>
            <span class="locked-field">{{ formData.isCritical ? '⭐ 是' : '否' }}</span><span class="locked-tag">🔒 已派工不可改</span>
          </template>
        </el-form-item>
        <el-form-item label="计划数量">
          <el-input-number v-model="formData.plannedQuantity" :min="1" :disabled="!isFieldEditable('plannedQuantity')" />
        </el-form-item>
        <el-form-item v-if="selectedWorkOrder?.status === STATUS.RUNNING && isEdit" label="实际完成数量">
          <el-input-number v-model="formData.actualQuantity" :min="0" />
        </el-form-item>
        <el-form-item v-if="selectedWorkOrder?.status === STATUS.RUNNING && isEdit" label="报废数量">
          <el-input-number v-model="formData.scrapQuantity" :min="0" />
        </el-form-item>
        <el-form-item label="计划开始时间">
          <el-date-picker v-model="formData.startTime" type="datetime" :disabled="!isFieldEditable('startTime')" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="计划结束时间">
          <el-date-picker v-model="formData.endTime" type="datetime" :disabled="!isFieldEditable('endTime')" value-format="YYYY-MM-DD HH:mm:ss" />
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

    <!-- 工单级联预览（TERMINATE 时） -->
    <el-dialog v-model="cascadeDialogVisible" title="作废工单 — 影响确认" width="480px">
      <el-alert title="作废为终态操作，不可逆。确认作废该工单？" type="warning" :closable="false" show-icon style="margin-bottom:12px;" />
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="工单">{{ selectedWorkOrder?.workOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="getStatusType(selectedWorkOrder?.status)" size="small">{{ STATUS_LABELS[selectedWorkOrder?.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="目标状态">已作废（终态）</el-descriptions-item>
        <el-descriptions-item v-if="selectedWorkOrder?.isCritical" label="⚠ 注意">此工单为关键工单，作废将影响订单状态聚合</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="cascadeDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmTerminate">确认作废</el-button>
      </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWorkOrderStore } from '@/stores/workOrder'
import { executeWorkOrderActionApi, updateWorkOrderApi, addWorkOrderApi, deleteWorkOrderApi } from '@/api/workOrder'

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

const canEdit = computed(() =>
  [STATUS.CREATED, STATUS.RELEASED, STATUS.RUNNING, STATUS.PAUSED].includes(selectedWorkOrder.value?.status)
)

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

const STEP_INDEX = {
  [STATUS.CREATED]: 0,
  [STATUS.RELEASED]: 1,
  [STATUS.RUNNING]: 2,
  [STATUS.PAUSED]: 2,
  [STATUS.COMPLETED]: 3,
  [STATUS.TERMINATED]: 3
}

const currentStepIndex = computed(() =>
  STEP_INDEX[selectedWorkOrder.value?.status] ?? 0
)

const lifecycleSteps = computed(() => {
  const curIdx = currentStepIndex.value
  return mainSteps.map((step, i) => ({
    ...step,
    stepStatus: i < curIdx ? 'success' : i === curIdx ? 'process' : 'wait'
  }))
})

const handleWorkOrderAction = (action) => {
  if (action === 'TERMINATE') return openWOCascadePreview()
  executeAction(action)
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

// ===== 产量上报 =====
const reportDialogVisible = ref(false)
const reportForm = ref({ quantity: 0, scrap: 0 })

const predictedQuantity = computed(() =>
  (selectedWorkOrder.value?.actualQuantity || 0) + (reportForm.value.quantity || 0)
)
const predictedScrap = computed(() =>
  (selectedWorkOrder.value?.scrapQuantity || 0) + (reportForm.value.scrap || 0)
)
const remainingPlan = computed(() =>
  Math.max(0, (selectedWorkOrder.value?.plannedQuantity || 0) - predictedQuantity.value)
)

const openReportDialog = () => {
  reportForm.value = { quantity: 0, scrap: 0 }
  reportDialogVisible.value = true
}

const confirmReport = async () => {
  try {
    const wo = selectedWorkOrder.value
    const newActual = predictedQuantity.value
    const newScrap = predictedScrap.value
    const result = await updateWorkOrderApi(wo.workOrderNo, {
      actualQuantity: newActual,
      scrapQuantity: newScrap
    })
    if (result.code === 200) {
      ElMessage.success('产量上报成功')
      reportDialogVisible.value = false
      await workOrderStore.loadAllWorkOrders()
      const ref = workOrderStore.workOrderList.find(w => w.workOrderNo === wo.workOrderNo)
      if (ref) selectedWorkOrder.value = ref
    } else { ElMessage.error(result.message || '上报失败') }
  } catch { ElMessage.error('上报请求失败') }
}

// ===== 工单级联预览 =====
const cascadeDialogVisible = ref(false)

const openWOCascadePreview = () => {
  cascadeDialogVisible.value = true
}

const confirmTerminate = async () => {
  await executeAction('TERMINATE')
  cascadeDialogVisible.value = false
}

// ===== 表单编辑 =====
const DEFAULT_FORM = {
  orderNo: '', processId: null, userId: null, isCritical: false,
  plannedQuantity: null, actualQuantity: 0, scrapQuantity: 0,
  startTime: '', endTime: '', remark: ''
}

const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = ref({ ...DEFAULT_FORM })

const getEditableFields = (status) => {
  if (status === STATUS.CREATED) return ['orderNo', 'processId', 'userId', 'isCritical', 'plannedQuantity', 'startTime', 'endTime', 'remark']
  if (status === STATUS.RELEASED) return ['plannedQuantity', 'startTime', 'endTime', 'remark']
  if (status === STATUS.RUNNING) return ['actualQuantity', 'scrapQuantity', 'remark']
  if (status === STATUS.PAUSED) return ['remark']
  return []
}

const isFieldEditable = (field) => {
  if (!isEdit.value) return true
  return getEditableFields(selectedWorkOrder.value?.status).includes(field)
}

const openCreateDialog = () => {
  isEdit.value = false
  formData.value = { ...DEFAULT_FORM }
  dialogVisible.value = true
}

const openEditDialog = () => {
  if (!selectedWorkOrder.value) return
  isEdit.value = true
  formData.value = { ...selectedWorkOrder.value }
  dialogVisible.value = true
}

const handleFormSubmit = async () => {
  try {
    if (isEdit.value) {
      const result = await updateWorkOrderApi(selectedWorkOrder.value.workOrderNo, formData.value)
      if (result.code === 200) {
        ElMessage.success('修改成功')
        workOrderStore.updateWorkOrder({ ...selectedWorkOrder.value, ...formData.value })
        dialogVisible.value = false
      } else { ElMessage.error(result.message || '修改失败') }
    } else {
      const result = await addWorkOrderApi(formData.value)
      if (result.code === 200) {
        ElMessage.success('新增成功')
        await workOrderStore.loadAllWorkOrders()
        dialogVisible.value = false
      } else { ElMessage.error(result.message || '新增失败') }
    }
  } catch { ElMessage.error('操作失败') }
}

// 删除
const handleDelete = async () => {
  if (!selectedWorkOrder.value || selectedWorkOrder.value.status !== STATUS.CREATED) {
    ElMessage.warning('仅 CREATED 状态的工单可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除工单 ${selectedWorkOrder.value.workOrderNo}？`, '确认删除', { type: 'warning' })
    const result = await deleteWorkOrderApi(selectedWorkOrder.value.workOrderNo)
    if (result.code === 200) {
      ElMessage.success('删除成功')
      workOrderStore.deleteWorkOrders([selectedWorkOrder.value.workOrderNo])
      selectedWorkOrder.value = null
    } else { ElMessage.error(result.message || '删除失败') }
  } catch {}
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
.report-header { padding: 8px 12px; background: #f5f7fa; border-radius: 4px; font-size: 13px; color: #606266; }
.report-form h4 { margin: 0 0 12px 0; font-size: 14px; }
.report-preview { margin-top: 12px; padding: 8px 12px; background: #f5f7fa; border-radius: 4px; font-size: 12px; color: #606266; }
.current-status-bar { padding: 8px 12px; background: #f5f7fa; border-radius: 4px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.locked-field { font-size: 13px; }
.locked-tag { font-size: 10px; padding: 1px 6px; background: #f4f4f5; border-radius: 3px; color: #909399; margin-left: 8px; }
</style>
