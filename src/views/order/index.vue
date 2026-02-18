<template>
    <div class="page">
        <h1>生产订单管理</h1>
    </div>
    <el-container class="main-container">
        <el-header class="plan-header">
            <div class="plan-header-left">
                <h2 class="plan-title">计划列表</h2>
            </div>
            <div class="plan-menu-container">
                <el-menu mode="horizontal" v-model:default-active="activeIndex" class="plan-horizontal-menu"
                    @select="handleSelect">
                    <el-sub-menu index="1">
                        <template #title><span>创建状态</span></template>
                        <el-menu-item v-for="planItem in plans.created" :key="planItem.planNo"
                            :index="`CREATED||${planItem.planNo}`">{{
                                planItem.planName }}</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="2">
                        <template #title><span>发布状态</span></template>
                        <el-menu-item v-for="planItem in plans.released" :key="planItem.planNo"
                            :index="`RELEASED||${planItem.planNo}`">{{
                                planItem.planName }}</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="3">
                        <template #title><span>执行状态</span></template>
                        <el-menu-item v-for="planItem in plans.execute" :key="planItem.planNo"
                            :index="`RUNNING||${planItem.planNo}`">{{
                                planItem.planName }}</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="4">
                        <template #title><span>暂停状态</span></template>
                        <el-menu-item v-for="planItem in plans.pause" :key="planItem.planNo"
                            :index="`PAUSED||${planItem.planNo}`">{{
                                planItem.planName }}</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="5">
                        <template #title><span>完成状态</span></template>
                        <el-menu-item v-for="planItem in plans.completed" :key="planItem.planNo"
                            :index="`COMPLETED||${planItem.planNo}`">{{
                                planItem.planName }}</el-menu-item>
                    </el-sub-menu>
                </el-menu>
            </div>
        </el-header>
        <el-main class="main">
            <el-container style="height: 100%;">
                <el-header class="header">
                    <div class="search-form">
                        <!-- 条件查询输入框区域 -->
                        <div class="form-row">
                            <el-input v-model="query.orderName" placeholder="订单名称"
                                style="width: 200px; margin-right: 15px;" />
                            <el-input v-model="query.lineName" placeholder="产线名称"
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
                        <!-- 标题、按钮区域 -->
                        <div class="aside-header">
                            <h2 class="aside-title">订单列表</h2>
                            <el-button type="primary" size="small" @click="openAddDialog">创建订单</el-button>
                        </div>
                        <!-- 菜单区域 -->
                        <div class="menu-wrapper">
                            <el-menu v-model:default-active="orderActiveIndex" class="team-menu"
                                @select="handleOrderSelect">
                                <el-sub-menu index="1">
                                    <template #title>
                                        <span>创建状态</span>
                                    </template>
                                    <el-menu-item v-for="orderItem in orders.created" :key="orderItem.orderNo"
                                        :index="`CREATED||${orderItem.orderNo}`" class="team-menu-item">
                                        <span class="team-name">{{ orderItem.orderName }}</span>
                                        <div class="team-actions">
                                            <el-button type="text" size="small" icon="Edit"
                                                @click.stop="openEditDialog(orderItem)" />
                                            <el-button type="text" size="small" icon="Delete"
                                                @click.stop="deleteTeam(orderItem)" />
                                        </div>
                                    </el-menu-item>
                                </el-sub-menu>
                                <el-sub-menu index="2">
                                    <template #title>
                                        <span>发布状态</span>
                                    </template>
                                    <el-menu-item v-for="orderItem in orders.released" :key="orderItem.orderNo"
                                        :index="`RELEASED||${orderItem.orderNo}`" class="team-menu-item">
                                        <span class="team-name">{{ orderItem.orderName }}</span>
                                        <div class="team-actions">
                                            <el-button type="text" size="small" icon="Edit"
                                                @click.stop="openEditDialog(orderItem)" />
                                        </div>
                                    </el-menu-item>
                                </el-sub-menu>
                                <el-sub-menu index="3">
                                    <template #title>
                                        <span>执行状态</span>
                                    </template>
                                    <el-menu-item v-for="orderItem in orders.execute" :key="orderItem.orderNo"
                                        :index="`RUNNING||${orderItem.orderNo}`" class="team-menu-item">
                                        <span class="team-name">{{ orderItem.orderName }}</span>
                                    </el-menu-item>
                                </el-sub-menu>
                                <el-sub-menu index="4">
                                    <template #title>
                                        <span>暂停状态</span>
                                    </template>
                                    <el-menu-item v-for="orderItem in orders.pause" :key="orderItem.orderNo"
                                        :index="`PAUSED||${orderItem.orderNo}`" class="team-menu-item">
                                        <span class="team-name">{{ orderItem.orderName }}</span>
                                        <div class="team-actions">
                                            <el-button type="text" size="small" icon="Edit"
                                                @click.stop="openEditDialog(orderItem)" />
                                        </div>
                                    </el-menu-item>
                                </el-sub-menu>
                                <el-sub-menu index="5">
                                    <template #title>
                                        <span>完成状态</span>
                                    </template>
                                    <el-menu-item v-for="orderItem in orders.completed" :key="orderItem.orderNo"
                                        :index="`COMPLETED||${orderItem.orderNo}`" class="team-menu-item">
                                        <span class="team-name">{{ orderItem.orderName }}</span>
                                    </el-menu-item>
                                </el-sub-menu>
                            </el-menu>
                        </div>
                    </el-aside>
                    <el-main class="order-detail-main">
                        <!-- 订单详情区域 -->
                        <div v-if="selectedOrder" class="order-detail">
                            <el-card class="order-card">
                                <template #header>
                                    <div class="card-header">
                                        <h3>{{ selectedOrder.orderName }}</h3>
                                        <el-tag :type="getStatusTagType(selectedOrder.status)" size="large">
                                            {{ getStatusLabel(selectedOrder.status) }}
                                        </el-tag>
                                    </div>
                                </template>

                                <div class="plan-info">
                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>订单编号：</label>
                                            <span>{{ selectedOrder.orderNo }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>所属计划编号：</label>
                                            <span>{{ selectedOrder.planNo }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>产线编号：</label>
                                            <span>{{ selectedOrder.lineNo }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>订单名称：</label>
                                            <span>{{ selectedOrder.orderName }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>计划数量：</label>
                                            <span>{{ selectedOrder.quantity }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>已生产数量：</label>
                                            <span>{{ selectedOrder.quantityProduced }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>合格品数量：</label>
                                            <span>{{ selectedOrder.qualifiedProducts }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>废品数量：</label>
                                            <span>{{ selectedOrder.defectiveProducts }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>计划开始时间：</label>
                                            <span>{{ selectedOrder.startTime }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>计划结束时间：</label>
                                            <span>{{ selectedOrder.endTime }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>实际开始时间：</label>
                                            <span>{{ selectedOrder.actualStartTime }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>实际结束时间：</label>
                                            <span>{{ selectedOrder.actualEndTime }}</span>
                                        </div>
                                    </div>

                                    <div class="info-row">
                                        <div class="info-item">
                                            <label>创建时间：</label>
                                            <span>{{ selectedOrder.createTime }}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>更新时间：</label>
                                            <span>{{ selectedOrder.updateTime }}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- 操作按钮 -->
                                <div class="order-actions">
                                    <el-button type="primary" @click="handlePublishPlan"
                                        v-if="selectedOrder.status === 'CREATED'">
                                        发布订单
                                    </el-button>
                                    <el-button type="primary" @click="handleCancelPlan"
                                        v-if="selectedOrder.status === 'RELEASED'">
                                        取消发布
                                    </el-button>
                                    <el-button type="warning" @click="handlePausePlan"
                                        v-if="selectedOrder.status === 'RUNNING'">
                                        暂停执行
                                    </el-button>
                                    <el-button type="primary" @click="handleResumePlan"
                                        v-if="selectedOrder.status === 'PAUSED'">
                                        恢复执行
                                    </el-button>
                                </div>
                            </el-card>
                        </div>

                        <div v-else class="empty-state">
                            <el-empty description="请选择一个订单查看详情" />
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
import { getOrderByPlan, addOrderApi, deleteOrderApi, updateOrderApi, updateOrderStateApi } from '@/api/order'
import { getAllPlanApi } from '@/api/plan'
import { getLineApi } from '@/api/line'

//#region 元数据
// 获取状态标签类型
const getStatusTagType = (status) => {
    switch (status) {
        case 'CREATED':
            return 'info'
        case 'RELEASED':
            return 'primary'
        case 'RUNNING':
            return 'success'
        case 'PAUSED':
            return 'warning'
        case 'COMPLETED':
            return 'danger'
        default:
            return 'info'
    }
}

// 获取状态标签显示文本
const getStatusLabel = (status) => {
    switch (status) {
        case 'CREATED':
            return '创建'
        case 'RELEASED':
            return '发布'
        case 'RUNNING':
            return '执行'
        case 'PAUSED':
            return '暂停'
        case 'COMPLETED':
            return '完成'
        default:
            return status
    }
}

//动作
const actions = [
    { name: '发布计划', value: 'PUBLISH' },
    { name: '取消发布', value: 'CANCEL_PUBLISH' },
    { name: '暂停执行', value: 'PAUSE' },
    { name: '恢复执行', value: 'RESUME' },
]

//#endregion

//#region 查询计划列表
//分类后的计划列表，也是显示用的列表
const plans = ref({
    created: [],
    released: [],
    execute: [],
    pause: [],
    completed: []
})

//原始计划列表数据
const planData = ref([])

//将原始计划列表转化成最终展示用的计划列表
const transformPlans = () => {
    // 按状态分类
    plans.value.created = planData.value.filter(plan => plan.status === 'CREATED')
    plans.value.released = planData.value.filter(plan => plan.status === 'RELEASED')
    plans.value.execute = planData.value.filter(plan => plan.status === 'RUNNING')
    plans.value.pause = planData.value.filter(plan => plan.status === 'PAUSED')
    plans.value.completed = planData.value.filter(plan => plan.status === 'COMPLETED')
}

//加载所有计划
const loadPlans = async () => {
    const response = await getAllPlanApi()
    if (response && response.code === 200) {
        planData.value = response.data
        transformPlans()
    } else {
        ElMessage.error('加载计划失败')
    }
}

//组件加载完毕就数据加载
onMounted(async () => {
    loadPlans()
})
//#endregion

//#region 点击订单列表
//当前选中的计划编号
const activeIndex = ref(null)
//选中计划
const handleSelect = (index) => {
    // index 是状态-计划编号的组合格式（如 "CREATED||PLAN-01", "RELEASED||PLAN-02"）
    const [status, planNo] = index.split('||');
    activeIndex.value = index;
    loadOrders(planNo); // 只传入计划编号
}
//#endregion

//#region 条件查询订单列表
const query = ref({
    orderName: '',
    lineName: '',
    dateRange: []
})

//条件过滤以及分类后的订单列表，也是显示用的列表
const orders = ref({
    created: [],
    released: [],
    execute: [],
    pause: [],
    completed: []
})

//原始订单列表数据
const orderData = ref([])

//将原始订单列表转化成最终展示用的订单列表
const transformOrders = () => {
    // 先根据查询条件过滤数据
    let filteredData = orderData.value

    // 按订单名称过滤
    if (query.value.orderName) {
        filteredData = filteredData.filter(order =>
            order.orderName.toLowerCase().includes(query.value.orderName.toLowerCase())
        )
    }

    // 按产线名称过滤
    if (query.value.lineName) {
        filteredData = filteredData.filter(order => {
            const lineItem = getLine(order.lineNo)
            const lineName = lineItem?.lineName
            return lineName && lineName.toLowerCase().includes(query.value.lineName.toLowerCase())
        })
    }

    // 按日期范围过滤
    if (query.value.dateRange && query.value.dateRange.length === 2) {
        const [startDate, endDate] = query.value.dateRange
        filteredData = filteredData.filter(order => {
            const orderDate = new Date(order.createTime)
            return orderDate >= new Date(startDate) && orderDate <= new Date(endDate)
        })
    }

    // 按状态分类
    orders.value.created = filteredData.filter(order => order.status === 'CREATED')
    orders.value.released = filteredData.filter(order => order.status === 'RELEASED')
    orders.value.execute = filteredData.filter(order => order.status === 'RUNNING')
    orders.value.pause = filteredData.filter(order => order.status === 'PAUSED')
    orders.value.completed = filteredData.filter(order => order.status === 'COMPLETED')
}

//加载产线信息
const getLine = async (lineNo) => {
    const result = await getLineApi(lineNo)
    if (result && result.code === 200) {
        return result.data
    } else {
        ElMessage.error('加载产线信息失败')
        return null
    }
}

//加载某个计划的所有订单
const loadOrders = async (planNo) => {
    const response = await getOrderByPlan(planNo)
    if (response && response.code === 200) {
        orderData.value = response.data
        transformOrders()
    } else {
        ElMessage.error('加载计划失败')
    }
}

// 查询方法
const handleSearch = () => {
    transformOrders()
}

// 重置方法
const handleReset = () => {
    query.value = {
        planName: '',
        lineName: '',
        dateRange: []
    }
    transformOrders()
}
//#endregion

//#region 订单详情
//当前选中的订单编号
const orderActiveIndex = ref(null)

//当前选中的订单
const selectedOrder = ref(null)

//选中订单
const handleOrderSelect = (index) => {
    // index 是状态-订单编号的组合格式（如 "CREATED||order-01", "RELEASED||order-02"）
    const [status, orderNo] = index.split('||');
    orderActiveIndex.value = index;
    loadOrderDetails(orderNo); // 只传入订单编号
}

// 加载订单详情方法
const loadOrderDetails = async (orderNo) => {
    const order = orderData.value.find(p => p.orderNo === orderNo)
    if (order) {
        selectedOrder.value = order
    }
}
//#endregion
</script>

<style scoped>
.main-container {
    min-height: calc(100vh - 120px);
    display: flex;
    flex-direction: column;
}

.header {
    padding: 16px 20px;
    height: auto !important;
    /* 允许内容撑开 */
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

.aside {
    background-color: #f5f7fa;
    border-right: 1px solid #e4e7ed;
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.main {
    background-color: #fafafa;
    padding: 20px;
    overflow-y: auto;
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

/* 菜单包装器 */
.menu-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}

/* 菜单样式 */
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

/* 内层订单列表 aside */
.order-aside {
    background-color: #f9fafc;
    border-right: 1px solid #e4e7ed;
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.order-aside .aside-header {
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #ebeef5;
}

.order-aside .menu-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}

/* 订单详情主区域 */
.order-detail-main {
    padding: 20px;
    background-color: #fff;
    overflow-y: auto;
    height: 100%;
    box-sizing: border-box;
}

/* 订单详情样式 */
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

/* 顶部计划 header */
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

/* 横向菜单容器 - 支持滚动 */
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