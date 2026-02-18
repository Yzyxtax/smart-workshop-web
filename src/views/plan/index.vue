<template>
    <div class="page">
        <h1>生产计划管理</h1>
    </div>
    <el-container class="main-container">
        <el-header class="header">
            <div class="search-form">
                <!-- 条件查询输入框区域 -->
                <div class="form-row">
                    <el-input v-model="query.planName" placeholder="计划名称" style="width: 200px; margin-right: 15px;" />
                    <el-input v-model="query.productName" placeholder="产品名称"
                        style="width: 200px; margin-right: 15px;" />
                    <el-date-picker v-model="query.dateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px; margin-right: 15px;" />
                    <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
                    <el-button icon="Refresh" @click="handleReset">重置</el-button>
                </div>
            </div>
        </el-header>
        <el-container>
            <el-aside class="aside" width="250px">
                <!-- 标题、按钮区域 -->
                <div class="aside-header">
                    <h2 class="aside-title">计划列表</h2>
                    <el-button type="primary" size="small" @click="openAddDialog">新增计划</el-button>
                </div>
                <!-- 菜单区域 -->
                <div class="menu-wrapper">
                    <el-menu v-model:default-active="activeIndex" class="team-menu" @select="handleSelect">
                        <el-sub-menu index="1">
                            <template #title>
                                <span>创建状态</span>
                            </template>
                            <el-menu-item v-for="planItem in plans.created" :key="planItem.planNo"
                                :index="`CREATED||${planItem.planNo}`" class="team-menu-item">
                                <span class="team-name">{{ planItem.planName }}</span>
                                <div class="team-actions">
                                    <el-button type="text" size="small" icon="Edit"
                                        @click.stop="openEditDialog(planItem)" />
                                    <el-button type="text" size="small" icon="Delete"
                                        @click.stop="deleteTeam(planItem)" />
                                </div>
                            </el-menu-item>
                        </el-sub-menu>
                        <el-sub-menu index="2">
                            <template #title>
                                <span>发布状态</span>
                            </template>
                            <el-menu-item v-for="planItem in plans.released" :key="planItem.planNo"
                                :index="`RELEASED||${planItem.planNo}`" class="team-menu-item">
                                <span class="team-name">{{ planItem.planName }}</span>
                                <div class="team-actions">
                                    <el-button type="text" size="small" icon="Edit"
                                        @click.stop="openEditDialog(planItem)" />
                                </div>
                            </el-menu-item>
                        </el-sub-menu>
                        <el-sub-menu index="3">
                            <template #title>
                                <span>执行状态</span>
                            </template>
                            <el-menu-item v-for="planItem in plans.execute" :key="planItem.planNo"
                                :index="`RUNNING||${planItem.planNo}`" class="team-menu-item">
                                <span class="team-name">{{ planItem.planName }}</span>
                            </el-menu-item>
                        </el-sub-menu>
                        <el-sub-menu index="4">
                            <template #title>
                                <span>暂停状态</span>
                            </template>
                            <el-menu-item v-for="planItem in plans.pause" :key="planItem.planNo"
                                :index="`PAUSED||${planItem.planNo}`" class="team-menu-item">
                                <span class="team-name">{{ planItem.planName }}</span>
                                <div class="team-actions">
                                    <el-button type="text" size="small" icon="Edit"
                                        @click.stop="openEditDialog(planItem)" />
                                </div>
                            </el-menu-item>
                        </el-sub-menu>
                        <el-sub-menu index="5">
                            <template #title>
                                <span>完成状态</span>
                            </template>
                            <el-menu-item v-for="planItem in plans.completed" :key="planItem.planNo"
                                :index="`COMPLETED||${planItem.planNo}`" class="team-menu-item">
                                <span class="team-name">{{ planItem.planName }}</span>
                            </el-menu-item>
                        </el-sub-menu>
                    </el-menu>
                </div>
            </el-aside>
            <el-main class="main">
                <!-- 计划详情区域 -->
                <div v-if="selectedPlan" class="plan-detail">
                    <el-card class="plan-card">
                        <template #header>
                            <div class="card-header">
                                <h3>{{ selectedPlan.planName }}</h3>
                                <el-tag :type="getStatusTagType(selectedPlan.status)" size="large">
                                    {{ getStatusLabel(selectedPlan.status) }}
                                </el-tag>
                            </div>
                        </template>

                        <div class="plan-info">
                            <div class="info-row">
                                <div class="info-item">
                                    <label>计划编号：</label>
                                    <span>{{ selectedPlan.planNo }}</span>
                                </div>
                                <div class="info-item">
                                    <label>产品名称：</label>
                                    <span>{{ getProductLabel(selectedPlan.bomId) }}</span>
                                </div>
                            </div>

                            <div class="info-row">
                                <div class="info-item">
                                    <label>计划数量：</label>
                                    <span>{{ selectedPlan.planNum }}</span>
                                </div>
                                <div class="info-item">
                                    <label>已生产数量：</label>
                                    <span>{{ selectedPlan.completedNum }}</span>
                                </div>
                            </div>

                            <div class="info-row">
                                <div class="info-item">
                                    <label>计划开始时间：</label>
                                    <span>{{ selectedPlan.startTime }}</span>
                                </div>
                                <div class="info-item">
                                    <label>计划结束时间：</label>
                                    <span>{{ selectedPlan.endTime }}</span>
                                </div>
                            </div>

                            <div class="info-row">
                                <div class="info-item">
                                    <label>优先级：</label>
                                    <span>{{ selectedPlan.priority }}</span>
                                </div>
                                <div class="info-item">
                                    <label>备注：</label>
                                    <span v-if="selectedPlan.remark">{{ selectedPlan.remark }}</span>
                                    <span v-else>无</span>
                                </div>
                            </div>

                            <div class="info-row">
                                <div class="info-item">
                                    <label>创建者：</label>
                                    <span>{{ creatorName || '--' }}</span>
                                </div>
                                <div class="info-item">
                                    <label>发布者：</label>
                                    <span>{{ publisherName || '--' }}</span>
                                </div>
                            </div>

                            <div class="info-row">
                                <div class="info-item">
                                    <label>创建时间：</label>
                                    <span>{{ selectedPlan.createTime }}</span>
                                </div>
                                <div class="info-item">
                                    <label>更新时间：</label>
                                    <span>{{ selectedPlan.updateTime }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- 操作按钮 -->
                        <div class="plan-actions">
                            <el-button type="primary" @click="handlePublishPlan"
                                v-if="selectedPlan.status === 'CREATED'">
                                发布计划
                            </el-button>
                            <el-button type="primary" @click="handleCancelPlan"
                                v-if="selectedPlan.status === 'RELEASED'">
                                取消发布
                            </el-button>
                            <el-button type="warning" @click="handlePausePlan" v-if="selectedPlan.status === 'RUNNING'">
                                暂停执行
                            </el-button>
                            <el-button type="primary" @click="handleResumePlan" v-if="selectedPlan.status === 'PAUSED'">
                                恢复执行
                            </el-button>
                        </div>
                    </el-card>

                    <!-- 相关订单信息（可选，如果需要展示） -->
                    <!-- <el-card class="orders-card" v-if="selectedPlanOrders.length > 0">
                        <template #header>
                            <h4>关联生产订单</h4>
                        </template>
                        <el-table :data="selectedPlanOrders" style="width: 100%">
                            <el-table-column prop="orderNo" label="订单编号" />
                            <el-table-column prop="orderName" label="订单名称" />
                            <el-table-column prop="orderNum" label="订单数量" />
                            <el-table-column prop="status" label="状态" />
                            <el-table-column prop="createTime" label="创建时间" />
                        </el-table>
                    </el-card> -->
                </div>

                <div v-else class="empty-state">
                    <el-empty description="请选择一个计划查看详情" />
                </div>
            </el-main>
        </el-container>
    </el-container>
    <!-- 新增/修改计划对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑计划' : '新增计划'" width="600px" @close="handleCancel">
        <el-form :rules="rules" ref="planFormRef" :model="formData" label-width="120px">
            <el-form-item label="计划编号" prop="planNo">
                <el-input v-model="formData.planNo" placeholder="请输入计划编号"
                    :disabled="isEdit && !isEditable('planNo', formData.status)" />
            </el-form-item>
            <el-form-item label="计划名称" prop="planName">
                <el-input v-model="formData.planName" placeholder="请输入计划名称"
                    :disabled="isEdit && !isEditable('planName', formData.status)" />
            </el-form-item>
            <el-form-item label="产品" prop="bomId">
                <el-select v-model="formData.bomId" placeholder="请选择产品" style="width: 100%"
                    :disabled="isEdit && !isEditable('bomId', formData.status)">
                    <el-option v-for="item in bomStore.productList" :key="item.id" :label="item.name"
                        :value="item.id" />
                </el-select>
            </el-form-item>
            <el-form-item label="计划数量" prop="planNum">
                <el-input-number v-model="formData.planNum" :min="1" placeholder="请输入计划数量" style="width: 100%"
                    :disabled="isEdit && !isEditable('planNum', formData.status)" />
            </el-form-item>
            <el-form-item label="开始时间" prop="startTime">
                <el-date-picker v-model="formData.startTime" type="date" placeholder="请选择开始时间" format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD" style="width: 100%"
                    :disabled="isEdit && !isEditable('startTime', formData.status)" />
            </el-form-item>
            <el-form-item label="结束时间" prop="endTime">
                <el-date-picker v-model="formData.endTime" type="date" placeholder="请选择结束时间" format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD" style="width: 100%"
                    :disabled="isEdit && !isEditable('endTime', formData.status)" />
            </el-form-item>
            <el-form-item label="优先级" prop="priority">
                <el-select v-model="formData.priority" placeholder="请选择优先级" style="width: 100%"
                    :disabled="isEdit && !isEditable('priority', formData.status)">
                    <el-option label="强" value="强" />
                    <el-option label="中" value="中" />
                    <el-option label="弱" value="弱" />
                </el-select>
            </el-form-item>
            <el-form-item label="备注" prop="remark">
                <el-input type="textarea" v-model="formData.remark" :rows="3" placeholder="请输入备注"
                    :disabled="isEdit && !isEditable('remark', formData.status)" />
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" @click="submitForm" :loading="submitLoading">提交</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, onMounted, watchEffect } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAllPlanApi, deletePlanApi, updatePlanApi, addPlanApi, updatePlanStateApi } from '@/api/plan'
import { useBomStore } from '@/stores/bom'
import { queryInfoApi } from '@/api/emp'

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

const bomStore = useBomStore()
const { loadBomData } = bomStore

//#region 条件查询计划列表
const query = ref({
    planName: '',
    productName: '',
    dateRange: []
})

//条件过滤以及分类后的计划列表，也是显示用的列表
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
    // 先根据查询条件过滤数据
    let filteredData = planData.value

    // 按计划名称过滤
    if (query.value.planName) {
        filteredData = filteredData.filter(plan =>
            plan.planName.toLowerCase().includes(query.value.planName.toLowerCase())
        )
    }

    // 按产品名称过滤
    if (query.value.productName) {
        filteredData = filteredData.filter(plan => {
            const bomItem = bomStore.getBomById(plan.bomId)
            const productName = bomItem?.label
            return productName && productName.toLowerCase().includes(query.value.productName.toLowerCase())
        })
    }

    // 按日期范围过滤
    if (query.value.dateRange && query.value.dateRange.length === 2) {
        const [startDate, endDate] = query.value.dateRange
        filteredData = filteredData.filter(plan => {
            const planDate = new Date(plan.createTime)
            return planDate >= new Date(startDate) && planDate <= new Date(endDate)
        })
    }

    // 按状态分类
    plans.value.created = filteredData.filter(plan => plan.status === 'CREATED')
    plans.value.released = filteredData.filter(plan => plan.status === 'RELEASED')
    plans.value.execute = filteredData.filter(plan => plan.status === 'RUNNING')
    plans.value.pause = filteredData.filter(plan => plan.status === 'PAUSED')
    plans.value.completed = filteredData.filter(plan => plan.status === 'COMPLETED')
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
    await loadBomData()
    loadPlans()
})

// 查询方法
const handleSearch = () => {
    transformPlans()
}

// 重置方法
const handleReset = () => {
    query.value = {
        planName: '',
        productName: '',
        dateRange: []
    }
    transformPlans()
}
//#endregion

//#region 计划详情
//当前选中的计划编号
const activeIndex = ref(null)

//当前选中的计划
const selectedPlan = ref(null)

//当前选中的计划的订单信息（如果需要展示）
const selectedPlanOrders = ref([])

//选中计划
const handleSelect = (index) => {
    // index 是状态-计划编号的组合格式（如 "CREATED||PLAN-01", "RELEASED||PLAN-02"）
    const [status, planNo] = index.split('||');
    activeIndex.value = index;
    loadPlanDetails(planNo); // 只传入计划编号
}

// 加载计划详情方法
const loadPlanDetails = async (planNo) => {
    const allPlans = [...planData.value]
    const plan = allPlans.find(p => p.planNo === planNo)
    if (plan) {
        selectedPlan.value = plan
        // 这里可以加载关联的订单信息
        // loadPlanOrders(planNo)
    }
}

// 获取产品名称
const getProductLabel = (bomId) => {
    const bomItem = bomStore.getBomById(bomId)
    return bomItem?.label || '未知产品'
}

const creatorName = ref('')
const publisherName = ref('')

// 获取用户名称
const getUserLabel = async (userId) => {
    let userName = '未知用户'
    try {
        const response = await queryInfoApi(userId)
        if (response && response.code === 200) {
            userName = response.data.name
        } else {
            ElMessage.error('加载用户信息失败:' + (response?.message || '未知错误'))
        }
    } catch (error) {
        ElMessage.error('加载用户信息失败:' + error.message)
    }
    return userName
}

// 自动响应 selectedPlan 的变化
watchEffect(async () => {
    if (selectedPlan.value?.creatorId) {
        creatorName.value = await getUserLabel(selectedPlan.value.creatorId)
    }

    if (selectedPlan.value?.publisherId) {
        publisherName.value = await getUserLabel(selectedPlan.value.publisherId)
    }
})
//#endregion

//#region 对计划的增删改
const dialogVisible = ref(false)
const isEdit = ref(false)
const planFormRef = ref(null)
const formData = ref({
    planNo: '',
    planName: '',
    bomId: '',
    planNum: 1,
    startTime: '',
    endTime: '',
    priority: '弱',
    remark: '',
    creatorId: JSON.parse(localStorage.getItem('user')).id,
    status: 'CREATED'  // 修改默认状态为英文枚举值
})
const rules = ref({
    planNo: [
        { required: true, message: '请输入计划编号', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    planName: [
        { required: true, message: '请输入计划名称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    bomId: [
        { required: true, message: '请选择产品', trigger: 'change' }
    ],
    planNum: [
        { required: true, message: '请输入计划数量', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                const num = Number(value);
                if (!value && value !== 0) {
                    callback(new Error('计划数量不能为空'));
                } else if (isNaN(num)) {
                    callback(new Error('请输入有效数字'));
                } else if (!Number.isInteger(num)) {
                    callback(new Error('必须为整数'));
                } else if (num < 1) {
                    callback(new Error('计划数量不能小于1'));
                } else {
                    callback();
                }
            },
            trigger: 'blur'
        }
    ],
    startTime: [
        { required: true, message: '请选择计划开始时间', trigger: 'change' }
    ],
    endTime: [
        { required: true, message: '请选择计划结束时间', trigger: 'change' }
    ],
})
const submitLoading = ref(false)
// 保存原始的计划编号字段
const primitivePlanNo = ref('')

//修改字段白名单映射
const PLAN_FIELD_WHITELIST = {
    'CREATED': ['planNo', 'planName', 'bomId', 'planNum', 'startTime', 'endTime', 'priority', 'remark'],
    'RELEASED': ['planNo', 'planName', 'startTime', 'endTime', 'priority', 'remark'],
    'PAUSED': ['remark'],
    'RUNNING': [],
    'COMPLETED': []
}
// 判断字段是否可编辑
function isEditable(field, status) {
    return PLAN_FIELD_WHITELIST[status]?.includes(field);
}

//取消按钮
const handleCancel = () => {
    dialogVisible.value = false
    // 清空表单数据
    formData.value = {
        planNo: '',
        planName: '',
        bomId: '',
        planNum: 1,
        startTime: '',
        endTime: '',
        priority: '弱',
        remark: '',
        creatorId: JSON.parse(localStorage.getItem('user')).id,
        status: 'CREATED'  // 修改默认状态为英文枚举值
    }
    // 重置表单验证
    planFormRef.value.resetFields()
}

//提交按钮
const submitForm = async () => {
    //表单校验
    planFormRef.value.validate(async (valid) => {
        if (valid) {
            submitLoading.value = true
            if (isEdit.value) {
                //使用status字段查找允许修改的字段，只将这些字段传给后端
                const { status, ...remainFields } = formData.value
                const submitFields = PLAN_FIELD_WHITELIST[status]
                const payload = submitFields.reduce((acc, field) => {
                    acc[field] = remainFields[field]
                    return acc
                }, {})
                const result = await updatePlanApi(payload, primitivePlanNo.value)
                if (result && result.code == 200) {
                    ElMessage.success('保存成功')
                    dialogVisible.value = false
                    await loadPlans()
                    //跳转到更新的计划详情页面
                    if (status === 'PAUSED') {
                        selectedPlan.value = planData.value.find(item => item.planNo === primitivePlanNo.value)
                        activeIndex.value = status + '||' + primitivePlanNo.value
                    } else {
                        selectedPlan.value = planData.value.find(item => item.planNo === payload.planNo)
                        activeIndex.value = status + '||' + payload.planNo
                    }
                } else {
                    ElMessage.error('保存信息失败:' + (result?.message || '未知错误'))
                }
            } else {
                //剔除掉status字段
                const { status, ...payload } = formData.value
                const result = await addPlanApi(payload)
                if (result.code == 200) {
                    ElMessage.success('保存成功')
                    dialogVisible.value = false
                    loadPlans()
                } else {
                    ElMessage.error('保存信息失败:' + (response?.message || '未知错误'))
                }
            }
            submitLoading.value = false
        } else {
            // 表单验证失败
            ElMessage.error('表单数据填写不完整或格式不正确')
        }
    })
}

//添加计划按钮
const openAddDialog = () => {
    isEdit.value = false
    dialogVisible.value = true
}

// 修改计划按钮
const openEditDialog = (planItem) => {
    isEdit.value = true
    primitivePlanNo.value = planItem.planNo
    Object.assign(formData.value, {
        planNo: planItem.planNo,
        planName: planItem.planName,
        bomId: planItem.bomId,
        planNum: planItem.planNum,
        startTime: planItem.startTime,
        endTime: planItem.endTime,
        priority: planItem.priority,
        remark: planItem.remark,
        status: planItem.status
    })
    dialogVisible.value = true
}

// 删除计划按钮
const deleteTeam = (planItem) => {
    ElMessageBox.confirm('确定要删除计划吗？该操作不可恢复！', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        const result = await deletePlanApi(planItem.planNo)
        if (result && result.code === 200) {
            ElMessage.success('删除成功')
            loadPlans()
        } else {
            ElMessage.error('删除计划失败:' + (result?.message || '未知错误'))
        }
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}
//#endregion

//#region 更改计划状态

// 统一的跳转与更新逻辑
const syncUIAfterStateChange = async (planNo, newStatus) => {
    // 1. 重新拉取后端最新列表数据
    await loadPlans();

    // 2. 构造新的菜单索引 (例如: RUNNING||PLAN-001)
    const nextIndex = `${newStatus}||${planNo}`;

    // 3. 调用 handleSelect 触发侧边栏高亮和详情页更新
    handleSelect(nextIndex);
};

// 发布计划
const handlePublishPlan = async () => {
    const planNo = selectedPlan.value.planNo
    const result = await updatePlanStateApi(planNo, 'PUBLISH', JSON.parse(localStorage.getItem('user')).id)
    if (result && result.code === 200) {
        ElMessage.success('发布成功')
        await syncUIAfterStateChange(planNo, 'RELEASED');
    } else {
        ElMessage.error('发布计划失败:' + (result?.message || '未知错误'))
    }
}

// 取消发布计划
const handleCancelPlan = async () => {
    const planNo = selectedPlan.value.planNo
    const result = await updatePlanStateApi(planNo, 'CANCEL_PUBLISH', JSON.parse(localStorage.getItem('user')).id)
    if (result && result.code === 200) {
        ElMessage.success('取消发布成功')
        await syncUIAfterStateChange(planNo, 'CREATED');
    } else {
        ElMessage.error('取消发布计划失败:' + (result?.message || '未知错误'))
    }
}

// 暂停计划
const handlePausePlan = async () => {
    const planNo = selectedPlan.value.planNo
    const result = await updatePlanStateApi(planNo, 'PAUSE', JSON.parse(localStorage.getItem('user')).id)
    if (result && result.code === 200) {
        ElMessage.success('暂停成功')
        await syncUIAfterStateChange(planNo, 'PAUSED');
    } else {
        ElMessage.error('暂停计划失败:' + (result?.message || '未知错误'))
    }
}

// 恢复执行计划
const handleResumePlan = async () => {
    const planNo = selectedPlan.value.planNo
    const result = await updatePlanStateApi(planNo, 'RESUME', JSON.parse(localStorage.getItem('user')).id)
    if (result && result.code === 200) {
        ElMessage.success('恢复成功')
        await syncUIAfterStateChange(planNo, 'RUNNING');
    } else {
        ElMessage.error('恢复计划失败:' + (result?.message || '未知错误'))
    }
}
//#endregion
</script>

<style scoped>
.main-container {
    min-height: calc(100vh - 120px);
}

.header {
    background-color: #fff;
    border-bottom: 1px solid #e4e7ed;
    padding: 20px;
    height: 70px !important;
    display: flex;
    align-items: flex-start;
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
    background-color: #f0f2f5;
    border-right: 1px solid #e4e7ed;
    padding: 15px;
    overflow-y: auto;
}

.main {
    background-color: #fafafa;
    padding: 20px;
    overflow-y: auto;
}

/* 侧边栏头部样式 */
.aside-header {
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.2);
}

.aside-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1a3c5a;
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
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px !important;
    margin: 4px 8px;
    border-radius: 6px;
    transition: all 0.3s ease;
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
    font-size: 14px;
    font-weight: 500;
    color: #1a3c5a;
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

/* 计划详情样式 */
.plan-detail {
    max-width: 1200px;
    margin: 0 auto;
}

.plan-card {
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

.plan-info {
    margin-top: 20px;
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

.plan-actions {
    margin-top: 20px;
    text-align: right;
}

.orders-card {
    margin-top: 20px;
}

.orders-card h4 {
    margin: 0;
    font-size: 16px;
    color: #303133;
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
</style>