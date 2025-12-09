<template>
    <div class="page">
        <h1 class="page-title">工步管理</h1>
    </div>
    <!-- 搜索栏 -->
    <div class="search-area">
        <el-form :inline="true" :model="searchWorkStep" class="search-form">
            <el-form-item label="工步名称">
                <el-input v-model="searchWorkStep.stepName" placeholder="请输入工步名称" clearable />
            </el-form-item>
            <el-form-item label="设备名称">
                <el-input v-model="searchWorkStep.equipmentName" placeholder="请输入设备名称" clearable />
            </el-form-item>
            <el-form-item label="工序名称">
                <el-input v-model="searchWorkStep.processName" placeholder="请输入工序名称" clearable />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="search">查询</el-button>
                <el-button type="info" @click="clear">清空</el-button>
            </el-form-item>
        </el-form>
    </div>

    <!-- 操作按钮区 -->
    <div class="action-area">
        <el-button type="success" @click="handleAdd">新增工步</el-button>
        <el-button type="warning" @click="handleEdit">编辑工步</el-button>
        <el-button type="danger" @click="handleDelete">删除工步</el-button>
    </div>

    <!-- 结果展示区 -->
    <div class="result-area">
        <div v-for="step in workStepData" :key="step.id" class="card-wrapper">
            <StepCard :step="{
                id: step.id,
                name: step.name,
                equipment: step.equipmentName,
                model: step.equipmentModel,
                function: step.functionDescription,
                description: step.description,
                status: Array.isArray(step.processName)
                    ? step.processName.join(', ')
                    : step.processName
            }" @selectChange="onSelectChange" />
        </div>
    </div>

    <!-- 分页条 -->
    <div class="pagination-area">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 30, 50]"
            :background="background" layout="total, sizes, prev, pager, next, jumper" :total="total"
            @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </div>

    <!-- 引入 StepFormDialog 组件 -->
    <StepFormDialog v-model="dialogVisible" :form-data="formData" :equipment-list="equipmentList" :is-edit="isEdit"
        :on-submit="performSubmit" @submit-success="onSubmitSuccess" @cancel="onCancel" />
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { getStepByPageApi, deleteStepApi, updateStepApi, addStepApi } from '@/api/step'
import { ElMessage, ElMessageBox, stepProps } from 'element-plus'
import StepCard from '@/components/step/StepCard.vue'
import { useEquipmentStore } from '@/stores/equipment'
import { useStepStore } from '@/stores/step'
import { storeToRefs } from 'pinia'
// 导入新创建的 StepFormDialog 组件
import StepFormDialog from '@/components/step/StepFormDialog.vue';

//同步pinia仓库
const stepStore = useStepStore()
const { loadAllSteps, updateStep, deleteSteps } = stepStore

//所有设备信息
const equipmentStore = useEquipmentStore()
const { equipmentList } = storeToRefs(equipmentStore)
const { loadEquipmentData } = equipmentStore
// 搜索条件绑定
const searchWorkStep = reactive({
    stepName: '',
    equipmentName: '',
    processName: ''
})

// 搜索结果数据
const workStepData = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const background = ref(true)

// 选中项
const selectIds = ref([])

// 控制弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = reactive({
    id: null,
    name: '',
    description: '',
    equipmentId: null,
    functionId: null
})

// 搜索功能
const search = async () => {
    const result = await getStepByPageApi(
        searchWorkStep.stepName,
        searchWorkStep.equipmentName,
        searchWorkStep.processName,
        currentPage.value,
        pageSize.value
    )
    if (result.code === 200) {
        workStepData.value = result.data.rows
        total.value = result.data.total
    } else {
        ElMessage.error('搜索工步失败')
    }
}

//清空搜索条件
const clear = () => {
    searchWorkStep.stepName = ''
    searchWorkStep.equipmentName = ''
    searchWorkStep.processName = ''
    search()
}

//初始加载数据
onMounted(() => {
    search()
    loadEquipmentData()
    loadAllSteps()
})

//监听分页变化
const handleSizeChange = () => {
    selectIds.value = []
    search()
}
const handleCurrentChange = () => {
    selectIds.value = []
    search()
}

//处理选中项
const onSelectChange = ({ id, checked }) => {
    if (checked) {
        if (!selectIds.value.includes(id)) {
            selectIds.value.push(id)
        }
    } else {
        selectIds.value = selectIds.value.filter(item => item !== id)
    }
}

// 新增
const handleAdd = async () => {
    isEdit.value = false
    // 重置表单数据
    resetFormData();
    dialogVisible.value = true
}

// 编辑
const handleEdit = async () => {
    if (selectIds.value.length < 1) {
        return ElMessage.warning('请选中一条记录进行编辑')
    } else if (selectIds.value.length > 1) {
        return ElMessage.warning('只能选择一条记录进行编辑')
    }
    const target = workStepData.value.find(item => item.id === selectIds.value[0])
    if (target) {
        Object.assign(formData, target)
        isEdit.value = true
        dialogVisible.value = true
    } else {
        ElMessage.error('未找到选中的工步数据')
    }
}

// 删除
const handleDelete = async () => {
    if (selectIds.value.length === 0) {
        return ElMessage.warning('请至少选中一条记录进行删除')
    }
    try {
        await ElMessageBox.confirm('确认删除选中的工步吗？', '提示', {
            type: 'warning'
        })
        const result = await deleteStepApi(selectIds.value)
        if (result.code === 200) {
            ElMessage.success('删除成功')
            deleteSteps(selectIds.value)    //更新pinia仓库
            selectIds.value = []
            search()
        } else {
            ElMessage.error(`删除失败:${result.message}`)
        }
    } catch (e) {
        ElMessage.info('已取消删除')
    }
}

// 执行实际的 API 提交操作
const performSubmit = async (submitData) => {
    let result;
    if (submitData.isEdit) {
        result = await updateStepApi(submitData);
    } else {
        result = await addStepApi(submitData);
    }
    if (result.code !== 200) {
        throw new Error(result.message || '操作失败');
    }
    return result;
};

// 提交成功后的处理
const onSubmitSuccess = () => {
    const message = isEdit.value ? '修改成功' : '新增成功';
    ElMessage.success(message);
    if (isEdit.value) {
        // 更新缓存
        const newStep = {
            id: formData.id,
            name: formData.name,
            equipmentId: formData.equipmentId,
            functionId: formData.functionId,
            equipmentName: null,
            equipmentModel: null,
            functionDescription: null,
            description: formData.description,
            processName: stepStore.stepList.find(step => step.id === formData.id)?.processName || []
        }
        updateStep(newStep);
    } else {
        loadAllSteps(); // 重新加载所有工步数据
    }
    search(); // 刷新当前页面列表
    resetFormData(); // 重置表单数据
};

// 取消事件处理
const onCancel = () => {
    // 如果需要在取消时执行特定逻辑，可以在这里添加
    // 例如，可以重置 formData 到初始状态
    // resetFormData();
};

// 重置表单数据到初始状态
const resetFormData = () => {
    formData.id = null;
    formData.name = '';
    formData.equipmentId = null;
    formData.functionId = null;
    formData.description = '';
};

</script>

<style scoped>
.search-area {
    background: #ffffff;
    padding: 20px 25px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-bottom: 25px;
}

.search-form {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.result-area {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;

    /* 固定高度（可按需要调整） */
    max-height: 600px;
    overflow-y: auto;

    /* 让滚动条更美观 */
    padding-right: 8px;
    margin-bottom: 20px;
    background-color: #ffffff;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

/* 美化滚动条（现代浏览器） */
.result-area::-webkit-scrollbar {
    width: 8px;
}

.result-area::-webkit-scrollbar-thumb {
    background-color: rgba(144, 147, 153, 0.4);
    border-radius: 4px;
}

.result-area::-webkit-scrollbar-thumb:hover {
    background-color: rgba(144, 147, 153, 0.6);
}

.card-wrapper {
    display: flex;
    justify-content: center;
}

.pagination-area {
    display: flex;
    justify-content: center;
    margin-top: 15px;
}

/* 操作按钮区样式 */
.action-area {
    margin-bottom: 15px;
    display: flex;
    gap: 10px;
}

.result-area {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
    max-height: 600px;
    overflow-y: auto;
    padding-right: 8px;
    margin-bottom: 20px;
    background-color: #ffffff;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.result-area::-webkit-scrollbar {
    width: 8px;
}

.result-area::-webkit-scrollbar-thumb {
    background-color: rgba(144, 147, 153, 0.4);
    border-radius: 4px;
}

.result-area::-webkit-scrollbar-thumb:hover {
    background-color: rgba(144, 147, 153, 0.6);
}

.card-wrapper {
    display: flex;
    justify-content: center;
}

.pagination-area {
    display: flex;
    justify-content: center;
    margin-top: 15px;
}
</style>