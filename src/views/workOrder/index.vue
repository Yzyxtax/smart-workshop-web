<template>
    <div class="page">
        <h1>工单管理</h1>
    </div>
    <el-container class="main-container">
        <el-header class="plan-header">
            <div class="plan-header-left">
                <h2 class="plan-title">订单列表</h2>
            </div>
            <div class="plan-menu-container">
                <el-menu mode="horizontal" v-model:default-active="activeIndex" class="plan-horizontal-menu"
                    @select="handleSelect">
                    <el-sub-menu index="1">
                        <template #title><span>创建状态</span></template>
                        <el-menu-item v-for="orderItem in orders.created" :key="orderItem.orderNo"
                            :index="`CREATED||${orderItem.orderNo}`">{{
                                orderItem.orderName }}</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="2">
                        <template #title><span>发布状态</span></template>
                        <el-menu-item v-for="orderItem in orders.released" :key="orderItem.orderNo"
                            :index="`RELEASED||${orderItem.orderNo}`">{{
                                orderItem.orderName }}</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="3">
                        <template #title><span>执行状态</span></template>
                        <el-menu-item v-for="orderItem in orders.execute" :key="orderItem.orderNo"
                            :index="`RUNNING||${orderItem.orderNo}`">{{
                                orderItem.orderName }}</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="4">
                        <template #title><span>暂停状态</span></template>
                        <el-menu-item v-for="orderItem in orders.pause" :key="orderItem.orderNo"
                            :index="`PAUSED||${orderItem.orderNo}`">{{
                                orderItem.orderName }}</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="5">
                        <template #title><span>完成状态</span></template>
                        <el-menu-item v-for="orderItem in orders.completed" :key="orderItem.orderNo"
                            :index="`COMPLETED||${orderItem.orderNo}`">{{
                                orderItem.orderName }}</el-menu-item>
                    </el-sub-menu>
                </el-menu>
            </div>
        </el-header>
        <el-main class="main">
            <el-container style="height: 100%;">
                <el-header class="header">
                    <div class="search-form">
                        <div class="form-row">
                            <el-input v-model="query.orderNo" placeholder="所属订单编号"
                                style="width: 200px; margin-right: 15px;" />
                            <el-input v-model="query.name" placeholder="员工名称"
                                style="width: 200px; margin-right: 15px;" />
                            <el-date-picker v-model="query.dateRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期"
                                style="width: 240px; margin-right: 15px;" />
                            <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
                            <el-button icon="Refresh" @click="handleReset">重置</el-button>
                        </div>
                    </div>
                </el-header>
                <el-container>
                    <el-aside class="order-aside" width="250px">
                        <div class="aside-header">
                            <h2 class="aside-title">工单列表</h2>
                            <el-button type="primary" size="small" @click="openAddDialog">创建工单</el-button>
                        </div>
                        <div class="menu-wrapper">
                            <el-menu v-model:default-active="workOrderActiveIndex" class="team-menu"
                                @select="handleWorkOrderSelect">
                                <el-sub-menu index="1">
                                    <template #title><span>创建状态</span></template>
                                    <el-menu-item v-for="wo in workOrders.created" :key="wo.workOrderNo"
                                        :index="`CREATED||${wo.workOrderNo}`" class="team-menu-item">
                                        <span class="team-name">{{ wo.workOrderNo }}</span>
                                        <div class="team-actions">
                                            <el-button type="text" size="small" icon="Edit"
                                                @click.stop="openEditDialog(wo)" />
                                            <el-button type="text" size="small" icon="Delete"
                                                @click.stop="deleteWorkOrder(wo)" />
                                        </div>
                                    </el-menu-item>
                                </el-sub-menu>
                                <el-sub-menu index="2">
                                    <template #title><span>发布状态</span></template>
                                    <el-menu-item v-for="wo in workOrders.released" :key="wo.workOrderNo"
                                        :index="`RELEASED||${wo.workOrderNo}`" class="team-menu-item">
                                        <span class="team-name">{{ wo.workOrderName }}</span>
                                        <div class="team-actions">
                                            <el-button type="text" size="small" icon="Edit"
                                                @click.stop="openEditDialog(wo)" />
                                        </div>
                                    </el-menu-item>
                                </el-sub-menu>
                                <el-sub-menu index="3">
                                    <template #title><span>执行状态</span></template>
                                    <el-menu-item v-for="wo in workOrders.execute" :key="wo.workOrderNo"
                                        :index="`RUNNING||${wo.workOrderNo}`" class="team-menu-item">
                                        <span class="team-name">{{ wo.workOrderName }}</span>
                                    </el-menu-item>
                                </el-sub-menu>
                                <el-sub-menu index="4">
                                    <template #title><span>暂停状态</span></template>
                                    <el-menu-item v-for="wo in workOrders.pause" :key="wo.workOrderNo"
                                        :index="`PAUSED||${wo.workOrderNo}`" class="team-menu-item">
                                        <span class="team-name">{{ wo.workOrderName }}</span>
                                        <div class="team-actions">
                                            <el-button type="text" size="small" icon="Edit"
                                                @click.stop="openEditDialog(wo)" />
                                        </div>
                                    </el-menu-item>
                                </el-sub-menu>
                                <el-sub-menu index="5">
                                    <template #title><span>完成状态</span></template>
                                    <el-menu-item v-for="wo in workOrders.completed" :key="wo.workOrderNo"
                                        :index="`COMPLETED||${wo.workOrderNo}`" class="team-menu-item">
                                        <span class="team-name">{{ wo.workOrderName }}</span>
                                    </el-menu-item>
                                </el-sub-menu>
                            </el-menu>
                        </div>
                    </el-aside>
                    <el-main class="order-detail-main">
                        <div v-if="selectedWorkOrder" class="order-detail">
                            <el-card class="order-card">
                                <template #header>
                                    <div class="card-header">
                                        <h3>{{ selectedWorkOrder.workOrderNo }}</h3>
                                        <el-tag :type="getStatusTagType(selectedWorkOrder.status)" size="large">
                                            {{ getStatusLabel(selectedWorkOrder.status) }}
                                        </el-tag>
                                    </div>
                                </template>

                                <div class="plan-info">
                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>工单编号：</label>
                                            <span>{{ selectedWorkOrder.workOrderNo }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>所属订单编号：</label>
                                            <span>{{ selectedWorkOrder.orderNo }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>工序名称：</label>
                                            <span>{{ processName }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>用户名称：</label>
                                            <span>{{ userName }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>计划数量：</label>
                                            <span>{{ selectedWorkOrder.plannedQuantity || selectedWorkOrder.quantity
                                                }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>已生产数量：</label>
                                            <span>{{ selectedWorkOrder.actualQuantity ||
                                                selectedWorkOrder.quantityProduced
                                                }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>废品数量：</label>
                                            <span>{{ selectedWorkOrder.scrapQuantity ||
                                                selectedWorkOrder.defectiveProducts
                                                }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>是否关键：</label>
                                            <span>{{ selectedWorkOrder.isCritical ? '是' : '否' }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>计划开始时间：</label>
                                            <span>{{ selectedWorkOrder.startTime }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>计划结束时间：</label>
                                            <span>{{ selectedWorkOrder.endTime }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>实际开始时间：</label>
                                            <span>{{ selectedWorkOrder.actualStartTime }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>实际结束时间：</label>
                                            <span>{{ selectedWorkOrder.actualEndTime }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>创建时间：</label>
                                            <span>{{ selectedWorkOrder.createTime }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>更新时间：</label>
                                            <span>{{ selectedWorkOrder.updateTime }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="order-actions">
                                    <el-button type="primary" @click="handlePublishWorkOrder"
                                        v-if="selectedWorkOrder.status === 'CREATED'">
                                        发布工单
                                    </el-button>
                                    <el-button type="primary" @click="handleCancelPublish"
                                        v-if="selectedWorkOrder.status === 'RELEASED'">
                                        取消发布
                                    </el-button>
                                    <el-button type="warning" @click="handlePauseWorkOrder"
                                        v-if="selectedWorkOrder.status === 'RUNNING'">
                                        暂停执行
                                    </el-button>
                                    <el-button type="primary" @click="handleResumeWorkOrder"
                                        v-if="selectedWorkOrder.status === 'PAUSED'">
                                        恢复执行
                                    </el-button>
                                </div>
                            </el-card>
                        </div>

                        <div v-else class="empty-state">
                            <el-empty description="请选择一个工单查看详情" />
                        </div>
                    </el-main>
                </el-container>
            </el-container>
        </el-main>
    </el-container>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWorkOrderByOrderApi, addWorkOrderApi, deleteWorkOrderApi, updateWorkOrderApi, updateWorkOrderStateApi } from '@/api/workOrder'
import { getAllOrder } from '@/api/order'
import { getProcessNameApi } from '@/api/process'
import { queryInfoApi } from '@/api/emp'

//#region 元数据

const getStatusTagType = (status) => {
    switch (status) {
        case 'CREATED': return 'info'
        case 'RELEASED': return 'primary'
        case 'RUNNING': return 'success'
        case 'PAUSED': return 'warning'
        case 'COMPLETED': return 'danger'
        default: return 'info'
    }
}

const getStatusLabel = (status) => {
    switch (status) {
        case 'CREATED': return '创建'
        case 'RELEASED': return '发布'
        case 'RUNNING': return '执行'
        case 'PAUSED': return '暂停'
        case 'COMPLETED': return '完成'
        default: return status
    }
}

//#endregion

//#region 加载订单列表（作为父级）

const orders = ref({
    created: [],
    released: [],
    execute: [],
    pause: [],
    completed: []
})

const orderData = ref([])

const transformOrders = () => {
    orders.value.created = orderData.value.filter(o => o.status === 'CREATED')
    orders.value.released = orderData.value.filter(o => o.status === 'RELEASED')
    orders.value.execute = orderData.value.filter(o => o.status === 'RUNNING')
    orders.value.pause = orderData.value.filter(o => o.status === 'PAUSED')
    orders.value.completed = orderData.value.filter(o => o.status === 'COMPLETED')
}

const loadOrders = async () => {
    const response = await getAllOrder()
    if (response?.code === 200) {
        orderData.value = response.data
        transformOrders()
    }
}

onMounted(() => {
    loadOrders()
})

//#endregion

//#region 选择订单加载工单

const activeIndex = ref(null)

const handleSelect = (index) => {
    const [status, orderNo] = index.split('||')
    activeIndex.value = index
    loadWorkOrders(orderNo)
}

//#endregion

//#region 工单查询与过滤

const query = ref({
    orderNo: '',
    name: '',
    dateRange: []
})

const workOrders = ref({
    created: [],
    released: [],
    execute: [],
    pause: [],
    completed: []
})

const workOrderData = ref([])

const transformWorkOrders = () => {
    let filtered = workOrderData.value

    if (query.value.orderNo) {
        filtered = filtered.filter(wo =>
            wo.orderNo === query.value.orderNo
        )
    }

    if (query.value.name) {
        filtered = filtered.filter(wo => {
            const name = getUserName(wo.userId)?.name
            return name.toLowerCase().includes(query.value.name.toLowerCase())
        })
    }

    if (query.value.dateRange?.length === 2) {
        const [start, end] = query.value.dateRange
        filtered = filtered.filter(wo => {
            const date = new Date(wo.createTime)
            return date >= new Date(start) && date <= new Date(end)
        })
    }

    workOrders.value.created = filtered.filter(wo => wo.status === 'CREATED')
    workOrders.value.released = filtered.filter(wo => wo.status === 'RELEASED')
    workOrders.value.execute = filtered.filter(wo => wo.status === 'RUNNING')
    workOrders.value.pause = filtered.filter(wo => wo.status === 'PAUSED')
    workOrders.value.completed = filtered.filter(wo => wo.status === 'COMPLETED')
}

const loadWorkOrders = async (orderNo) => {
    const res = await getWorkOrderByOrderApi(orderNo)
    if (res?.code === 200) {
        workOrderData.value = res.data
        transformWorkOrders()
    } else {
        ElMessage.error('加载工单失败')
    }
}

const handleSearch = () => transformWorkOrders()

const handleReset = () => {
    query.value = { workOrderName: '', lineName: '', dateRange: [] }
    transformWorkOrders()
}

//#endregion

//#region 工单详情

const workOrderActiveIndex = ref(null)
const selectedWorkOrder = ref(null)

const handleWorkOrderSelect = (index) => {
    const [status, workOrderNo] = index.split('||')
    workOrderActiveIndex.value = index
    const wo = workOrderData.value.find(w => w.workOrderNo === workOrderNo)
    selectedWorkOrder.value = wo || null
}

//#endregion

//#region 查询工序名和用户名

//工序名称
const processName = ref('')
//用户名
const userName = ref('')
//根据id获取工序名称
const getProcessName = (processId) => {
    getProcessNameApi(processId)
        .then(response => {
            if (response?.code === 200) {
                processName.value = response.data
            }
        })
}

//根据id获取用户名
const getUserName = (userId) => {
    queryInfoApi(userId)
        .then(response => {
            if (response?.code === 200) {
                userName.value = response.data.userName
            }
        })
}

//侦听被选中的工单，每当工单变化，就更新一次工序名和用户名
watch(() => selectedWorkOrder, (order) => {
    if (order) {
        getProcessName(order.processId)
        getUserName(order.userId)
    }
})

//#endregion

//#region 操作方法（需你实现具体逻辑）

const openAddDialog = () => ElMessage.info('创建工单（待实现）')
const openEditDialog = (wo) => ElMessage.info(`编辑 ${wo.workOrderName}`)
const deleteWorkOrder = (wo) => ElMessage.info(`删除 ${wo.workOrderNo}`)

const handlePublishWorkOrder = () => updateWorkOrderState('PUBLISH')
const handleCancelPublish = () => updateWorkOrderState('CANCEL_PUBLISH')
const handlePauseWorkOrder = () => updateWorkOrderState('PAUSE')
const handleResumeWorkOrder = () => updateWorkOrderState('RESUME')

const updateWorkOrderState = async (action) => {
    if (!selectedWorkOrder.value) return
    const res = await updateWorkOrderStateApi(selectedWorkOrder.value.workOrderNo, action)
    if (res?.code === 200) {
        ElMessage.success('操作成功')
        loadWorkOrders(selectedWorkOrder.value.orderNo)
    }
}

//#endregion
</script>

<style scoped>
/* 完全复用原订单页面的样式，无需修改 */
.main-container {
    min-height: calc(100vh - 120px);
    display: flex;
    flex-direction: column;
}

.header {
    padding: 16px 20px;
    height: auto !important;
    background-color: #fff;
    border-bottom: 1px solid #e4e7ed;
    box-sizing: border-box;
}

.search-form {
    width: 100%;
}

.form-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}

.order-aside {
    background-color: #f9fafc;
    border-right: 1px solid #e4e7ed;
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
}

/* 侧边栏头部样式 */
.aside-header {
    padding: 16px;
    border-bottom: 1px solid #ebeef5;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.aside-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1a3c5a;
    flex: 1;
}

.menu-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}

.team-menu {
    border-right: none;
}

.team-menu-item {
    height: 48px;
    padding: 0 16px !important;
    margin: 2px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.team-menu-item:hover {
    background-color: rgba(255, 255, 255, 0.3) !important;
}

.team-menu-item.is-active {
    background: linear-gradient(90deg, #409eff, #66b1ff) !important;
    color: white !important;
}

.team-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.team-menu-item.is-active .team-name {
    color: white;
}

.team-actions {
    opacity: 0;
    transition: opacity 0.2s ease;
    display: flex;
    gap: 8px;
}

.team-menu-item:hover .team-actions {
    opacity: 1;
}

.team-actions .el-button {
    padding: 2px 6px;
    color: #606266;
}

.team-actions .el-button:hover {
    color: #409eff;
}

.team-menu-item.is-active .team-actions .el-button {
    color: rgba(255, 255, 255, 0.8);
}

.team-menu-item.is-active .team-actions .el-button:hover {
    color: white;
}

.order-detail-main {
    padding: 20px;
    background-color: #fff;
    overflow-y: auto;
    height: 100%;
    box-sizing: border-box;
}

.order-detail {
    max-width: 1200px;
    margin: 0 auto;
}

.order-card {
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header h3 {
    margin: 0;
    font-size: 18px;
    color: #303133;
}

.info-row {
    display: flex;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.info-item {
    flex: 1;
    min-width: 300px;
    margin-right: 20px;
    margin-bottom: 10px;
}

.info-item:last-child {
    margin-right: 0;
}

.info-item label {
    font-weight: bold;
    color: #606266;
    margin-right: 8px;
}

.info-item span {
    color: #303133;
}

.order-actions {
    margin-top: 20px;
    text-align: right;
}

.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.plan-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    height: 60px;
    background-color: #ffffff;
    border-bottom: 1px solid #e4e7ed;
    box-sizing: border-box;
}

.plan-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1a3c5a;
}

.plan-menu-container {
    flex: 1;
    margin-left: 20px;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    padding-bottom: 4px;
}

.plan-menu-container::-webkit-scrollbar {
    height: 6px;
}

.plan-menu-container::-webkit-scrollbar-thumb {
    background: #c1c9d0;
    border-radius: 3px;
}

.plan-menu-container::-webkit-scrollbar-track {
    background: #f0f2f5;
}
</style>