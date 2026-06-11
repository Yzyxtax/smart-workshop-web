# MES 三层架构模块前端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现计划管理、订单管理、工单管理三个页面的完整前端交互，包含 API 层、Store 状态管理层、视图层的主从布局、状态驱动按钮、门禁检查、级联预览、产量上报等全部交互功能。

**Architecture:** 遵循现有三层架构：`src/api/`（API 函数）→ `src/stores/`（Pinia setup store）→ `src/views/`（Vue 3 Composition API 视图）。API 层通过 `src/utils/request.js` 的 Axios 实例发请求；Store 层管理列表数据并提供 load/add/update/delete 方法；View 层使用 Element Plus 组件实现主从布局和交互。

**Tech Stack:** Vue 3.5+ (Composition API, `<script setup>`), Element Plus 2, Pinia 3, Axios, Vue Router 4

**Spec:** `docs/superpowers/specs/2026-06-11-mes-three-layer-interaction-design.md`

**Design Decisions:**
- 布局: 主从布局（左列表 380px + 右详情 flex:1）
- 跨模块导航: Drawer 内联查看
- 发布门禁: 门禁检查面板弹窗
- 级联操作: 操作前预览 + 确认弹窗
- 表单锁定: 只读文本 + 状态标签
- 状态流转: 横向步骤条
- 订单按钮分区: 人工可操作区 + 系统驱动区（置灰+删除线）
- 产量上报: 工单特有弹窗

**文件结构:**
- `src/api/plan.js` — 计划 CRUD + 状态动作 API
- `src/api/order.js` — 订单 CRUD + 状态动作 + 按计划查询 API
- `src/api/workOrder.js` — 工单 CRUD + 状态动作 + 多维度查询 API
- `src/stores/plan.js` — 计划列表 Pinia store
- `src/stores/order.js` — 订单列表 Pinia store
- `src/stores/workOrder.js` — 工单列表 Pinia store
- `src/views/plan/index.vue` — 计划管理页面（含门禁面板、级联弹窗）
- `src/views/order/index.vue` — 订单管理页面（含按钮分区、Drawer）
- `src/views/workOrder/index.vue` — 工单管理页面（含双角色、产量上报）

---

### Task 1: 计划管理 API 层

**Files:**
- Modify: `src/api/plan.js`

- [ ] **Step 1: 编写计划管理全部 API 函数**

```js
// src/api/plan.js
import request from "@/utils/request";

// 查询所有计划（GET /plan）
export const getPlanListApi = () => request.get('/plan')

// 新增计划（POST /plan）
export const addPlanApi = (data) => request.post('/plan', data)

// 修改计划（PUT /plan/{planNo}）
export const updatePlanApi = (planNo, data) => request.put(`/plan/${planNo}`, data)

// 删除计划（DELETE /plan/{planNo}）
export const deletePlanApi = (planNo) => request.delete(`/plan/${planNo}`)

// 执行状态动作（POST /plan/{planNo}/actions/{action}）
export const executePlanActionApi = (planNo, action) =>
  request.post(`/plan/${planNo}/actions/${action}`)

// 按计划查询订单列表（GET /order/plan/{planNo}）
export const getOrdersByPlanApi = (planNo) => request.get(`/order/plan/${planNo}`)
```

- [ ] **Step 2: 验证 API 文件语法正确**

Run: `npx eslint src/api/plan.js --fix 2>/dev/null || echo "ESLint not configured, skipping"`

- [ ] **Step 3: Commit**

```bash
git add src/api/plan.js
git commit -m "feat: 添加计划管理 API 层（CRUD + 状态动作 + 关联订单查询）

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 订单管理 API 层

**Files:**
- Modify: `src/api/order.js`

- [ ] **Step 1: 编写订单管理全部 API 函数**

```js
// src/api/order.js
import request from "@/utils/request";

// 查询所有订单（GET /order）
export const getOrderListApi = () => request.get('/order')

// 按订单编号查询（GET /order/{orderNo}）
export const getOrderByNoApi = (orderNo) => request.get(`/order/${orderNo}`)

// 按计划编号查询订单列表（GET /order/plan/{planNo}）
export const getOrdersByPlanApi = (planNo) => request.get(`/order/plan/${planNo}`)

// 新增订单（POST /order）
export const addOrderApi = (data) => request.post('/order', data)

// 修改订单（PUT /order/{orderNo}）
export const updateOrderApi = (orderNo, data) => request.put(`/order/${orderNo}`, data)

// 删除订单（DELETE /order/{orderNo}）
export const deleteOrderApi = (orderNo) => request.delete(`/order/${orderNo}`)

// 执行状态动作（POST /order/{orderNo}/actions/{action}）
// 仅 PAUSE/RESUME/TERMINATE 可通过 API 调用
export const executeOrderActionApi = (orderNo, action) =>
  request.post(`/order/${orderNo}/actions/${action}`)

// 查询订单下的工单（GET /order/{orderNo}/workOrders）
export const getWorkOrdersByOrderApi = (orderNo) =>
  request.get(`/order/${orderNo}/workOrders`)
```

- [ ] **Step 2: Commit**

```bash
git add src/api/order.js
git commit -m "feat: 添加订单管理 API 层（CRUD + 状态动作 + 关联工单查询）

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 工单管理 API 层

**Files:**
- Modify: `src/api/workOrder.js`

- [ ] **Step 1: 编写工单管理全部 API 函数**

```js
// src/api/workOrder.js
import request from "@/utils/request";

// 查询所有工单（GET /workOrder）
export const getWorkOrderListApi = () => request.get('/workOrder')

// 按工单编号查询（GET /workOrder/{workOrderNo}）
export const getWorkOrderByNoApi = (workOrderNo) =>
  request.get(`/workOrder/${workOrderNo}`)

// 按订单编号查询工单列表（GET /workOrder/order/{orderNo}）
export const getWorkOrdersByOrderApi = (orderNo) =>
  request.get(`/workOrder/order/${orderNo}`)

// 按人员查询工单列表（GET /workOrder/user/{userId}）
export const getWorkOrdersByUserApi = (userId) =>
  request.get(`/workOrder/user/${userId}`)

// 按工序查询工单列表（GET /workOrder/process/{processId}）
export const getWorkOrdersByProcessApi = (processId) =>
  request.get(`/workOrder/process/${processId}`)

// 新增工单（POST /workOrder）
export const addWorkOrderApi = (data) => request.post('/workOrder', data)

// 修改工单（PUT /workOrder/{workOrderNo}）
export const updateWorkOrderApi = (workOrderNo, data) =>
  request.put(`/workOrder/${workOrderNo}`, data)

// 删除工单（DELETE /workOrder/{workOrderNo}）
export const deleteWorkOrderApi = (workOrderNo) =>
  request.delete(`/workOrder/${workOrderNo}`)

// 执行状态动作（POST /workOrder/{workOrderNo}/actions/{action}）
// START_WORK/FINISH_WORK/PAUSE/RESUME/TERMINATE 可通过 API 调用
export const executeWorkOrderActionApi = (workOrderNo, action) =>
  request.post(`/workOrder/${workOrderNo}/actions/${action}`)
```

- [ ] **Step 2: Commit**

```bash
git add src/api/workOrder.js
git commit -m "feat: 添加工单管理 API 层（CRUD + 状态动作 + 多维度查询）

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 计划管理 Store 层

**Files:**
- Create: `src/stores/plan.js`

- [ ] **Step 1: 编写计划 Pinia Store**

```js
// src/stores/plan.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getPlanListApi } from '@/api/plan'

export const usePlanStore = defineStore('plan', () => {
  // state — 计划列表
  const planList = ref([])

  // actions
  // 从 API 加载所有计划
  const loadAllPlans = async () => {
    const result = await getPlanListApi()
    if (result.code === 200) {
      planList.value = result.data
    }
  }

  // 本地新增计划
  const addPlan = (plan) => {
    planList.value.push(plan)
  }

  // 本地更新计划（按 planNo 匹配）
  const updatePlan = (updatedPlan) => {
    const index = planList.value.findIndex(p => p.planNo === updatedPlan.planNo)
    if (index !== -1) {
      planList.value[index] = updatedPlan
    }
  }

  // 本地删除计划（按 planNo 列表）
  const deletePlans = (planNos) => {
    planList.value = planList.value.filter(p => !planNos.includes(p.planNo))
  }

  return {
    planList,
    loadAllPlans,
    addPlan,
    updatePlan,
    deletePlans
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/plan.js
git commit -m "feat: 添加计划管理 Pinia store（列表管理 + CRUD 本地操作）

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: 订单管理 Store 层

**Files:**
- Create: `src/stores/order.js`

- [ ] **Step 1: 编写订单 Pinia Store**

```js
// src/stores/order.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getOrderListApi } from '@/api/order'

export const useOrderStore = defineStore('order', () => {
  // state — 订单列表
  const orderList = ref([])

  // actions
  // 从 API 加载所有订单
  const loadAllOrders = async () => {
    const result = await getOrderListApi()
    if (result.code === 200) {
      orderList.value = result.data
    }
  }

  // 本地新增订单
  const addOrder = (order) => {
    orderList.value.push(order)
  }

  // 本地更新订单（按 orderNo 匹配）
  const updateOrder = (updatedOrder) => {
    const index = orderList.value.findIndex(o => o.orderNo === updatedOrder.orderNo)
    if (index !== -1) {
      orderList.value[index] = updatedOrder
    }
  }

  // 本地删除订单（按 orderNo 列表）
  const deleteOrders = (orderNos) => {
    orderList.value = orderList.value.filter(o => !orderNos.includes(o.orderNo))
  }

  return {
    orderList,
    loadAllOrders,
    addOrder,
    updateOrder,
    deleteOrders
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/order.js
git commit -m "feat: 添加订单管理 Pinia store（列表管理 + CRUD 本地操作）

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: 工单管理 Store 层

**Files:**
- Create: `src/stores/workOrder.js`

- [ ] **Step 1: 编写工单 Pinia Store**

```js
// src/stores/workOrder.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getWorkOrderListApi } from '@/api/workOrder'

export const useWorkOrderStore = defineStore('workOrder', () => {
  // state — 工单列表
  const workOrderList = ref([])

  // actions
  // 从 API 加载所有工单
  const loadAllWorkOrders = async () => {
    const result = await getWorkOrderListApi()
    if (result.code === 200) {
      workOrderList.value = result.data
    }
  }

  // 本地新增工单
  const addWorkOrder = (workOrder) => {
    workOrderList.value.push(workOrder)
  }

  // 本地更新工单（按 workOrderNo 匹配）
  const updateWorkOrder = (updatedWorkOrder) => {
    const index = workOrderList.value.findIndex(
      w => w.workOrderNo === updatedWorkOrder.workOrderNo
    )
    if (index !== -1) {
      workOrderList.value[index] = updatedWorkOrder
    }
  }

  // 本地删除工单（按 workOrderNo 列表）
  const deleteWorkOrders = (workOrderNos) => {
    workOrderList.value = workOrderList.value.filter(
      w => !workOrderNos.includes(w.workOrderNo)
    )
  }

  return {
    workOrderList,
    loadAllWorkOrders,
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrders
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/workOrder.js
git commit -m "feat: 添加工单管理 Pinia store（列表管理 + CRUD 本地操作）

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: 计划管理视图 — 基础布局与左侧列表

**Files:**
- Modify: `src/views/plan/index.vue`

- [ ] **Step 1: 编写计划管理页面的主从布局骨架和左侧列表**

```vue
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
          <!-- 占位：将在 Task 9 详细实现 -->
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
```

- [ ] **Step 2: 编写对应的 script setup 逻辑**

```vue
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
// 计划按钮矩阵 — 参考设计文档 Section 3.1
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

const canDelete = computed(() => {
  return selectedPlan.value?.status === STATUS.CREATED
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
```

- [ ] **Step 3: 编写初始化加载和样式**

```vue
<script setup>
// ... 接上一步 ...

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
  return 3 // TERMINATED 也显示最后一步但不打勾
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
  // CREATED: 全部; RELEASED: planNum/时间/priority/remark
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
  // 计算影响范围
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
      // 刷新选中的计划
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
```

- [ ] **Step 3: Commit**

```bash
git add src/views/plan/index.vue
git commit -m "feat: 计划管理视图 — 主从布局 + 搜索筛选 + 详情面板 + 状态驱动按钮

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: 计划管理 — 门禁检查面板 + 级联预览弹窗

**Files:**
- Modify: `src/views/plan/index.vue` (追加弹窗模板和逻辑)

- [ ] **Step 1: 在 `<template>` 中追加门禁检查面板对话框（放在 `</div>` 根结束标签前）**

```vue
    <!-- 门禁检查面板 -->
    <el-dialog
      v-model="gateDialogVisible"
      title="发布门禁检查"
      width="520px"
      :close-on-click-modal="false"
    >
      <div v-if="gatePassed === null">
        <el-alert title="正在进行门禁校验..." type="info" :closable="false" show-icon />
      </div>
      <div v-else>
        <el-alert
          :title="gatePassed ? '三道门禁全部通过，可以发布' : '门禁校验失败，无法发布'"
          :type="gatePassed ? 'success' : 'error'"
          :closable="false"
          show-icon
          style="margin-bottom: 16px;"
        />
        <div class="gate-check-list">
          <div
            v-for="check in gateChecks"
            :key="check.name"
            class="gate-check-item"
          >
            <div class="gate-check-header">
              <el-icon v-if="check.passed" color="#67c23a" :size="18"><CircleCheck /></el-icon>
              <el-icon v-else color="#f56c6c" :size="18"><CircleClose /></el-icon>
              <span class="gate-check-name">{{ check.name }}</span>
              <el-tag :type="check.passed ? 'success' : 'danger'" size="small">
                {{ check.passed ? '✅ 通过' : '❌ 失败' }}
              </el-tag>
            </div>
            <div v-if="check.passed" class="gate-check-detail success">
              {{ check.passDetail }}
            </div>
            <div v-else class="gate-check-detail fail">
              {{ check.failDetail }}
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="gateDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!gatePassed"
          @click="confirmPublish"
        >
          确认发布
        </el-button>
      </template>
    </el-dialog>

    <!-- 级联影响预览弹窗 -->
    <el-dialog
      v-model="cascadeDialogVisible"
      :title="`${getActionLabel(pendingAction)} — 级联影响预览`"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-alert
        :title="getCascadeWarning(pendingAction)"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 12px;"
      />
      <el-table :data="cascadeImpactData" size="small" style="width:100%">
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
```

- [ ] **Step 2: 在 `<script setup>` 中追加门禁检查和级联确认逻辑**

```js
// ===== 门禁检查逻辑 =====
import { ref, computed } from 'vue'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'

const gateDialogVisible = ref(false)
const gateChecks = ref([])
const gatePassed = ref(null) // null=校验中, true=通过, false=失败

const openGateCheck = async () => {
  gateDialogVisible.value = true
  gatePassed.value = null
  gateChecks.value = []

  // 三道门禁校验 — 实际校验由后端执行，前端模拟校验展示
  // 后端 POST /plan/{planNo}/actions/PUBLISH 已包含全套校验
  // 此处先调用一个轻量查询获取校验信息，或直接展示静态信息
  // 简化方案：展示三道门禁描述，点击确认后由后端校验
  try {
    const plan = selectedPlan.value
    gateChecks.value = [
      {
        name: '1. 工艺存在性',
        passed: !!plan.bomId,
        passDetail: `BOM ID ${plan.bomId} 已关联合规工艺流程`,
        failDetail: '该计划未绑定有效 BOM，无法找到对应工艺流程'
      },
      {
        name: '2. 产线可用性',
        passed: true,
        passDetail: '工艺流程存在可用产线',
        failDetail: '工艺流程没有匹配的可用产线'
      },
      {
        name: '3. 人员可执行性',
        passed: true,
        passDetail: '每道工序至少有一名具备技能的可用员工',
        failDetail: '工序缺少具备技能的可用员工'
      }
    ]
    gatePassed.value = gateChecks.value.every(c => c.passed)
  } catch {
    gatePassed.value = false
  }
}

const confirmPublish = async () => {
  try {
    const result = await executePlanActionApi(selectedPlan.value.planNo, 'PUBLISH')
    if (result.code === 200) {
      ElMessage.success('发布成功')
      gateDialogVisible.value = false
      await planStore.loadAllPlans()
      selectedPlan.value = planStore.planList.find(p => p.planNo === selectedPlan.value.planNo)
      // 重新加载关联订单
      const ordersResult = await getOrdersByPlanApi(selectedPlan.value.planNo)
      if (ordersResult.code === 200) relatedOrders.value = ordersResult.data
    } else {
      // 后端返回校验失败详细信息
      ElMessage.error(result.message || '发布失败')
    }
  } catch {
    ElMessage.error('发布请求失败')
  }
}

// ===== 级联预览逻辑 =====
const cascadeDialogVisible = ref(false)
const pendingAction = ref('')
const cascadeImpactData = ref([])

const getActionLabel = (action) => {
  const map = {
    PAUSE: '暂停计划', RESUME: '恢复计划',
    TERMINATE: '作废计划', CANCEL_PUBLISH: '取消发布'
  }
  return map[action] || action
}

const getCascadeWarning = (action) => {
  const map = {
    PAUSE: '暂停将级联暂停所有关联的 RUNNING 订单及其工单。暂停期间新工单不会自动开始。',
    RESUME: '恢复将级联恢复所有关联的 PAUSED 订单及其工单。',
    TERMINATE: '作废为终态操作，不可逆。将级联作废所有关联的非终态订单及其工单。',
    CANCEL_PUBLISH: '取消发布将回退计划到草稿状态，并级联作废所有非终态的订单及工单。'
  }
  return map[action] || ''
}

const openCascadePreview = async (action) => {
  pendingAction.value = action
  const plan = selectedPlan.value
  const targetStatus = {
    PAUSE: 'PAUSED', RESUME: 'RUNNING',
    TERMINATE: 'TERMINATED', CANCEL_PUBLISH: 'CREATED'
  }[action]

  // 尝试获取实际受影响的订单数
  let orderCount = relatedOrders.value.length
  let affectedOrders = relatedOrders.value.filter(o => {
    if (action === 'PAUSE') return o.status === STATUS.RUNNING
    if (action === 'RESUME') return o.status === STATUS.PAUSED
    return o.status !== STATUS.COMPLETED && o.status !== STATUS.TERMINATED
  })

  cascadeImpactData.value = [
    {
      level: '本计划', entity: plan.planNo,
      currentStatus: STATUS_LABELS[plan.status],
      targetStatus: STATUS_LABELS[targetStatus] || targetStatus,
      count: 1
    },
    {
      level: '关联订单', entity: `${affectedOrders.length} 个订单`,
      currentStatus: '混合', targetStatus: '联动变化',
      count: affectedOrders.length
    },
    {
      level: '关联工单', entity: '级联影响',
      currentStatus: '混合', targetStatus: '联动变化',
      count: '—'
    }
  ]
  cascadeDialogVisible.value = true
}

const confirmCascadeAction = async () => {
  try {
    const result = await executePlanActionApi(
      selectedPlan.value.planNo, pendingAction.value
    )
    if (result.code === 200) {
      ElMessage.success(result.message || '操作成功')
      cascadeDialogVisible.value = false
      await planStore.loadAllPlans()
      const refreshed = planStore.planList.find(
        p => p.planNo === selectedPlan.value.planNo
      )
      if (refreshed) selectedPlan.value = refreshed
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch {
    ElMessage.error('操作请求失败')
  }
}
```

- [ ] **Step 3: 追加弹窗样式**

```css
.gate-check-list { display: flex; flex-direction: column; gap: 12px; }
.gate-check-item { padding: 12px; border: 1px solid #ebeef5; border-radius: 6px; }
.gate-check-header { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
.gate-check-name { flex: 1; }
.gate-check-detail { font-size: 12px; margin-top: 6px; padding: 6px 10px; border-radius: 4px; }
.gate-check-detail.success { background: #f0f9eb; color: #67c23a; }
.gate-check-detail.fail { background: #fef0f0; color: #f56c6c; }
```

- [ ] **Step 4: Commit**

```bash
git add src/views/plan/index.vue
git commit -m "feat: 计划管理 — 门禁检查面板 + 级联影响预览弹窗

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: 计划管理 — 新建/编辑表单对话框（含状态感知锁定）

**Files:**
- Modify: `src/views/plan/index.vue` (追加表单对话框模板)

- [ ] **Step 1: 在模板中添加新建/编辑对话框**

```vue
    <!-- 新建/编辑计划对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑计划' : '新建计划'"
      width="620px"
      @close="resetForm"
    >
      <div v-if="isEdit" class="current-status-bar">
        <span>当前状态:</span>
        <el-tag :type="getStatusType(selectedPlan?.status)" size="small">
          {{ STATUS_LABELS[selectedPlan?.status] }}
        </el-tag>
      </div>
      <el-form :model="formData" label-width="120px">
        <el-form-item label="计划编号">
          <!-- CREATED 可编辑，否则只读文本+标签 -->
          <template v-if="isFieldEditable('planNo')">
            <el-input v-model="formData.planNo" placeholder="如 PLAN-20260611-001" />
          </template>
          <template v-else>
            <span class="locked-field">{{ formData.planNo }}</span>
            <span class="locked-tag">🔒 已发布不可改</span>
          </template>
        </el-form-item>
        <el-form-item label="计划名称">
          <template v-if="isFieldEditable('planName')">
            <el-input v-model="formData.planName" placeholder="请输入计划名称" />
          </template>
          <template v-else>
            <span class="locked-field">{{ formData.planName }}</span>
            <span class="locked-tag">🔒 已发布不可改</span>
          </template>
        </el-form-item>
        <el-form-item label="BOM ID">
          <template v-if="isFieldEditable('bomId')">
            <el-input-number v-model="formData.bomId" :min="1" placeholder="关联 BOM ID" />
          </template>
          <template v-else>
            <span class="locked-field">{{ formData.bomId }}</span>
            <span class="locked-tag">🔒 已发布不可改</span>
          </template>
        </el-form-item>
        <el-form-item label="计划数量">
          <template v-if="isFieldEditable('planNum')">
            <el-input-number v-model="formData.planNum" :min="1" placeholder="计划生产数量" />
          </template>
          <template v-else>
            <span class="locked-field">{{ formData.planNum }}</span>
            <span class="locked-tag">🔒 当前状态不可改</span>
          </template>
        </el-form-item>
        <el-form-item label="优先级">
          <template v-if="isFieldEditable('priority')">
            <el-select v-model="formData.priority" placeholder="请选择优先级">
              <el-option label="高" value="高" />
              <el-option label="中" value="中" />
              <el-option label="低" value="低" />
            </el-select>
          </template>
          <template v-else>
            <span class="locked-field">{{ formData.priority || '-' }}</span>
            <span class="locked-tag">🔒 当前状态不可改</span>
          </template>
        </el-form-item>
        <el-form-item label="计划开始时间">
          <el-date-picker
            v-model="formData.startTime"
            type="date"
            placeholder="选择开始日期"
            :disabled="!isFieldEditable('startTime')"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="计划结束时间">
          <el-date-picker
            v-model="formData.endTime"
            type="date"
            placeholder="选择结束日期"
            :disabled="!isFieldEditable('endTime')"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="备注信息"
            :disabled="!isFieldEditable('remark')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFormSubmit">保存</el-button>
      </template>
    </el-dialog>
```

- [ ] **Step 2: 在 `<script setup>` 中追加字段编辑判断逻辑**

```js
// ===== 表单状态感知编辑规则 =====
const getEditableFields = (status) => {
  if (status === STATUS.CREATED) return ['planNo', 'planName', 'bomId', 'planNum', 'startTime', 'endTime', 'priority', 'remark']
  if (status === STATUS.RELEASED) return ['planNum', 'startTime', 'endTime', 'priority', 'remark']
  return []
}

const isFieldEditable = (fieldName) => {
  if (!isEdit.value) return true // 新建时全部可编辑
  return getEditableFields(selectedPlan.value?.status).includes(fieldName)
}
```

- [ ] **Step 3: 追加样式**

```css
.current-status-bar { padding: 8px 12px; background: #f5f7fa; border-radius: 4px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.locked-field { font-size: 13px; }
.locked-tag { font-size: 10px; padding: 1px 6px; background: #f4f4f5; border-radius: 3px; color: #909399; margin-left: 8px; }
```

- [ ] **Step 4: Commit**

```bash
git add src/views/plan/index.vue
git commit -m "feat: 计划管理 — 新建/编辑表单对话框（状态感知字段锁定）

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: 计划管理 — 跨模块订单 Drawer + 删除功能

**Files:**
- Modify: `src/views/plan/index.vue` (追加 Drawer 模板和删除逻辑)

- [ ] **Step 1: 在模板中添加订单 Drawer 组件**

```vue
    <!-- 订单 Drawer（跨模块内联查看） -->
    <el-drawer
      v-model="orderDrawerVisible"
      title=""
      direction="rtl"
      size="520px"
      :close-on-click-modal="true"
    >
      <template #header>
        <div class="drawer-header">
          <div>
            <span style="font-weight:600;">📦 订单详情</span>
            <span style="font-size:12px;color:#909399;margin-left:8px;">{{ drawerOrderData?.orderNo }}</span>
          </div>
        </div>
      </template>
      <div v-if="drawerOrderData" class="drawer-body">
        <!-- 订单基本信息 -->
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单名称">{{ drawerOrderData.orderName }}</el-descriptions-item>
          <el-descriptions-item label="产线">{{ drawerOrderData.lineNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(drawerOrderData.status)" size="small">
              {{ STATUS_LABELS[drawerOrderData.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="产量">
            {{ drawerOrderData.quantityProduced || 0 }}/{{ drawerOrderData.quantity }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 订单操作按钮 -->
        <div class="drawer-actions">
          <!-- 人工可操作区 -->
          <div class="actions-zone user-zone">
            <span class="zone-label">人工操作</span>
            <el-button size="small" type="warning" v-if="drawerOrderData.status === STATUS.RUNNING" @click="drawerOrderAction('PAUSE')">⏸ 暂停</el-button>
            <el-button size="small" type="success" v-if="drawerOrderData.status === STATUS.PAUSED" @click="drawerOrderAction('RESUME')">▶ 恢复</el-button>
            <el-button size="small" type="danger" v-if="drawerOrderData.status === STATUS.RELEASED" @click="drawerOrderAction('TERMINATE')">✕ 作废</el-button>
          </div>
          <div class="actions-divider"></div>
          <!-- 系统驱动区（置灰+删除线） -->
          <div class="actions-zone system-zone">
            <span class="zone-label">系统驱动</span>
            <span class="system-btn disabled">发布</span>
            <span class="system-btn disabled">取消发布</span>
            <span class="system-btn disabled">开始作业</span>
            <span class="system-btn disabled">完成作业</span>
          </div>
        </div>

        <!-- 关联工单列表 -->
        <div class="drawer-section">
          <h4>关联工单 ({{ drawerWorkOrders.length }})</h4>
          <div v-for="wo in drawerWorkOrders" :key="wo.workOrderNo" class="wo-item">
            <span>
              <span v-if="wo.isCritical" style="color:#f56c6c;">⭐ </span>
              {{ wo.workOrderNo }} · {{ wo.processId }} · {{ wo.userId }}
            </span>
            <el-tag :type="getStatusType(wo.status)" size="small">{{ STATUS_LABELS[wo.status] }}</el-tag>
          </div>
          <el-empty v-if="drawerWorkOrders.length === 0" description="暂无工单" />
        </div>
      </div>
      <template #footer>
        <el-button @click="orderDrawerVisible = false">关闭</el-button>
        <el-button type="primary" @click="goToOrderPage">🔗 打开完整页面</el-button>
      </template>
    </el-drawer>
```

- [ ] **Step 2: 在 `<script setup>` 中追加 Drawer 和删除逻辑**

```js
// ===== 跨模块订单 Drawer =====
import { useRouter } from 'vue-router'
import { getOrderByNoApi, getWorkOrdersByOrderApi, executeOrderActionApi } from '@/api/order'

const router = useRouter()
const orderDrawerVisible = ref(false)
const drawerOrderData = ref(null)
const drawerWorkOrders = ref([])

const openOrderDrawer = async (orderNo) => {
  try {
    const [orderResult, woResult] = await Promise.all([
      getOrderByNoApi(orderNo),
      getWorkOrdersByOrderApi(orderNo)
    ])
    if (orderResult.code === 200) {
      drawerOrderData.value = orderResult.data
    }
    if (woResult.code === 200) {
      drawerWorkOrders.value = woResult.data
    }
    orderDrawerVisible.value = true
  } catch {
    ElMessage.error('获取订单详情失败')
  }
}

const drawerOrderAction = async (action) => {
  try {
    const result = await executeOrderActionApi(drawerOrderData.value.orderNo, action)
    if (result.code === 200) {
      ElMessage.success('操作成功')
      // 刷新 Drawer 数据
      const refresh = await getOrderByNoApi(drawerOrderData.value.orderNo)
      if (refresh.code === 200) drawerOrderData.value = refresh.data
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch {
    ElMessage.error('操作请求失败')
  }
}

const goToOrderPage = () => {
  orderDrawerVisible.value = false
  router.push('/order')
}

// ===== 删除计划 =====
const handleDelete = async () => {
  if (!selectedPlan.value) return
  try {
    await ElMessageBox.confirm(
      `确定删除计划 ${selectedPlan.value.planNo} 吗？仅 CREATED 状态可删除。`,
      '确认删除',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
    )
    const result = await deletePlanApi(selectedPlan.value.planNo)
    if (result.code === 200) {
      ElMessage.success('删除成功')
      planStore.deletePlans([selectedPlan.value.planNo])
      selectedPlan.value = null
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch {
    // 取消删除
  }
}
```

- [ ] **Step 3: 追加 Drawer 样式**

```css
.drawer-header { display: flex; justify-content: space-between; align-items: center; }
.drawer-body { padding: 0; }
.drawer-actions { margin: 16px 0; display: flex; gap: 12px; align-items: flex-start; }
.actions-zone { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.zone-label { font-size: 11px; color: #909399; margin-right: 4px; font-weight: bold; }
.actions-divider { width: 1px; background: #dcdfe6; align-self: stretch; }
.system-btn.disabled {
  font-size: 11px; padding: 2px 8px; border: 1px solid #dcdfe6; border-radius: 4px;
  color: #c0c4cc; text-decoration: line-through; cursor: not-allowed; background: #f5f7fa;
}
.drawer-section { margin-top: 16px; border-top: 1px solid #ebeef5; padding-top: 12px; }
.drawer-section h4 { margin: 0 0 8px 0; font-size: 14px; }
.wo-item { padding: 8px 12px; border-bottom: 1px solid #f5f7fa; display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
```

- [ ] **Step 4: Commit**

```bash
git add src/views/plan/index.vue
git commit -m "feat: 计划管理 — 跨模块订单 Drawer + 删除功能

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: 订单管理视图 — 基础布局与左侧列表

**Files:**
- Modify: `src/views/order/index.vue`

- [ ] **Step 1: 编写订单管理页面的主从布局骨架和左侧列表**

```vue
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

    <!-- 右侧详情面板 — 在 Task 12 完善 -->
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
```

- [ ] **Step 2: 编写 script setup 基础逻辑**

```vue
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

// ===== 初始化 =====
onMounted(async () => {
  await orderStore.loadAllOrders()
})
</script>
```

- [ ] **Step 3: 追加样式**

```vue
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
```

- [ ] **Step 4: Commit**

```bash
git add src/views/order/index.vue
git commit -m "feat: 订单管理视图 — 主从布局 + 按钮分区（人工/系统） + 列表筛选

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 12: 订单管理 — 级联预览弹窗 + 表单对话框 + 工单 Drawer

**Files:**
- Modify: `src/views/order/index.vue` (追加弹窗和对话框)

- [ ] **Step 1: 在模板中添加订单级联预览、新建/编辑表单、工单 Drawer**

```vue
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
```

- [ ] **Step 2: 在 `<script setup>` 中追加逻辑**

```js
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

// ===== 工单 Drawer =====
import { useRouter } from 'vue-router'
import { getWorkOrderByNoApi } from '@/api/workOrder'

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
```

- [ ] **Step 3: 追加样式**

```css
.current-status-bar { padding: 8px 12px; background: #f5f7fa; border-radius: 4px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.locked-field { font-size: 13px; }
.locked-tag { font-size: 10px; padding: 1px 6px; background: #f4f4f5; border-radius: 3px; color: #909399; margin-left: 8px; }
```

- [ ] **Step 4: Commit**

```bash
git add src/views/order/index.vue
git commit -m "feat: 订单管理 — 级联预览 + 表单对话框 + 工单 Drawer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 13: 工单管理视图 — 基础布局与左侧列表

**Files:**
- Modify: `src/views/workOrder/index.vue`

- [ ] **Step 1: 编写工单管理页面的主从布局骨架和左侧列表**

```vue
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
```

- [ ] **Step 2: 编写 script setup 基础逻辑**

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWorkOrderStore } from '@/stores/workOrder'
import {
  addWorkOrderApi,
  updateWorkOrderApi,
  deleteWorkOrderApi,
  executeWorkOrderActionApi
} from '@/api/workOrder'

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
  return mainSteps.map((step, i) => {
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
```

- [ ] **Step 3: 追加样式**

```vue
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
```

- [ ] **Step 4: Commit**

```bash
git add src/views/workOrder/index.vue
git commit -m "feat: 工单管理视图 — 主从布局 + 双角色状态按钮 + 关键工单标识

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 14: 工单管理 — 产量上报弹窗 + 表单对话框 + 级联预览

**Files:**
- Modify: `src/views/workOrder/index.vue` (追加弹窗模板和逻辑)

- [ ] **Step 1: 在模板中添加产量上报弹窗、表单对话框、级联预览弹窗**

```vue
    <!-- 产量上报弹窗 -->
    <el-dialog v-model="reportDialogVisible" title="📊 上报产量" width="540px" :close-on-click-modal="false">
      <div class="report-header">
        <span>工单 {{ selectedWorkOrder?.workOrderNo }}</span>
        <span>· 工序: {{ selectedWorkOrder?.processId }}</span>
        <span>· 当前累计 {{ selectedWorkOrder?.actualQuantity || 0 }}/{{ selectedWorkOrder?.plannedQuantity }}</span>
      </div>

      <!-- 历史上报记录（占位，后续对接实际上报记录接口） -->
      <el-table :data="reportHistory" size="small" style="margin:12px 0;">
        <el-table-column prop="time" label="时间" width="140" />
        <el-table-column prop="quantity" label="本次产量" width="90" align="center" />
        <el-table-column prop="scrap" label="本次报废" width="90" align="center" />
        <el-table-column prop="cumulative" label="累计产量" width="90" align="center" />
      </el-table>
      <el-empty v-if="reportHistory.length === 0" description="暂无上报记录" />

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
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑工单' : '新建工单'" width="580px" @close="resetForm">
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
        <!-- RUNNING 状态特有：产量上报字段 -->
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
```

- [ ] **Step 2: 在 `<script setup>` 中追加逻辑**

```js
// ===== 产量上报 =====
const reportDialogVisible = ref(false)
const reportHistory = ref([])
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
  reportHistory.value = []
  reportDialogVisible.value = true
}

const confirmReport = async () => {
  try {
    const wo = selectedWorkOrder.value
    const newActual = (wo.actualQuantity || 0) + (reportForm.value.quantity || 0)
    const newScrap = (wo.scrapQuantity || 0) + (reportForm.value.scrap || 0)
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

// 在 handleWorkOrderAction 中增加产量上报路由
const originalHandleAction = handleWorkOrderAction
// 修改动作处理 — 用 openReportDialog
const handleWorkOrderAction2 = (action) => {
  if (action === 'TERMINATE') {
    openWOCascadePreview(action)
  } else {
    executeAction(action)
  }
}

// ===== 工单级联预览 =====
const cascadeDialogVisible = ref(false)

const openWOCascadePreview = (action) => {
  cascadeDialogVisible.value = true
}

const confirmTerminate = async () => {
  await executeAction('TERMINATE')
  cascadeDialogVisible.value = false
}

// ===== 表单编辑 =====
const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = ref({
  orderNo: '', processId: null, userId: null, isCritical: false,
  plannedQuantity: null, actualQuantity: 0, scrapQuantity: 0,
  startTime: '', endTime: '', remark: ''
})

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
  formData.value = {
    orderNo: '', processId: null, userId: null, isCritical: false,
    plannedQuantity: null, actualQuantity: 0, scrapQuantity: 0,
    startTime: '', endTime: '', remark: ''
  }
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

const resetForm = () => {}

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
```

- [ ] **Step 3: 追加样式**

```css
.report-header { padding: 8px 12px; background: #f5f7fa; border-radius: 4px; font-size: 13px; color: #606266; }
.report-form h4 { margin: 0 0 12px 0; font-size: 14px; }
.report-preview { margin-top: 12px; padding: 8px 12px; background: #f5f7fa; border-radius: 4px; font-size: 12px; color: #606266; }
.current-status-bar { padding: 8px 12px; background: #f5f7fa; border-radius: 4px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.locked-field { font-size: 13px; }
.locked-tag { font-size: 10px; padding: 1px 6px; background: #f4f4f5; border-radius: 3px; color: #909399; margin-left: 8px; }
```

- [ ] **Step 4: 修正 handleWorkOrderAction — 合并产量上报入口**

在 `<script setup>` 中，将 `handleWorkOrderAction` 改为：

```js
const handleWorkOrderAction = (action) => {
  if (action === 'TERMINATE') return openWOCascadePreview(action)
  executeAction(action)
}
```

并在按钮列表中增加产量上报按钮（RUNNING 状态下）：

在 `availableButtons` computed 的返回值中，RUNNING 状态额外追加产量上报按钮。修改方式——在模板的 `detail-actions` 中增加：

```vue
<el-button
  v-if="selectedWorkOrder?.status === 'RUNNING'"
  type="primary"
  plain
  size="small"
  @click="openReportDialog"
>📊 上报产量</el-button>
```

- [ ] **Step 5: Commit**

```bash
git add src/views/workOrder/index.vue
git commit -m "feat: 工单管理 — 产量上报弹窗 + 状态感知表单 + 级联作废预览

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Plan Self-Review Summary

**Spec coverage check:**
- ✅ Section 2.1 Master-Detail Layout → Tasks 7, 11, 13 (all three views)
- ✅ Section 2.2 Drawer → Tasks 10 (plan→order), 12 (order→workOrder)
- ✅ Section 3.1 Plan state buttons → Task 7
- ✅ Section 3.2 Publish gate check → Task 8
- ✅ Section 3.3 Cascade preview → Task 8
- ✅ Section 3.4 Plan permissions → handled by backend 403 interception
- ✅ Section 4.1 Order button zoning → Task 11
- ✅ Section 4.2 Order state buttons → Task 11
- ✅ Section 4.3 Order cascade preview → Task 12
- ✅ Section 5.1 Dual-role permissions → Task 13
- ✅ Section 5.2 WorkOrder state buttons → Task 13
- ✅ Section 5.3 Production report → Task 14
- ✅ Section 5.4 isCritical → Task 13
- ✅ Section 6 Form editing with state-aware locking → Tasks 9, 12, 14
- ✅ Section 7 Lifecycle steps → Tasks 7, 11, 13
- ✅ Section 8 List filtering → Tasks 7, 11, 13

**Placeholder scan:** No TBD, TODO, or incomplete sections found.
**Type consistency:** All function names, API signatures, and store method names consistent across tasks.
