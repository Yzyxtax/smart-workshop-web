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

    <!-- 复用的新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑工步' : '新增工步'" width="500px" @close="resetForm">
        <el-form :model="formData" label-width="100px">
            <el-form-item label="工步名称">
                <el-input v-model="formData.name" />
            </el-form-item>
            <el-form-item label="设备">
                <el-select v-model="formData.equipmentId" placeholder="请选择设备" @change="onEquipmentChange">
                    <el-option v-for="item in equipmentList" :key="item.id" :label="item.name + item.model"
                        :value="item.id" />
                </el-select>
            </el-form-item>
            <el-form-item label="功能">
                <el-select v-model="formData.functionId" placeholder="请选择设备功能">
                    <el-option v-for="func in getFunctionList(formData.equipmentId)" :key="func.id"
                        :label="func.functionDescription" :value="func.id" />
                </el-select>
            </el-form-item>
            <el-form-item label="描述">
                <el-input type="textarea" v-model="formData.description" :rows="5" />
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitForm">提交</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { getStepByPageApi, deleteStepApi, updateStepApi, addStepApi } from '@/api/step'
import { getAllEquipmentApi } from '@/api/equipment'
import { ElMessage, ElMessageBox } from 'element-plus'
import StepCard from '@/components/step/StepCard.vue'

//所有设备信息
const equipmentList = ref([])

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
onMounted(async () => {
    search()
    //获取所有设备信息
    const result = await getAllEquipmentApi()
    if (result.code === 200) {
        equipmentList.value = result.data
    }
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

//控制弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = reactive({
    id: null,
    name: '',
    description: '',
    equipmentId: null,
    functionId: null
})

// 新增
const handleAdd = () => {
    isEdit.value = false
    dialogVisible.value = true
}

// 编辑
const handleEdit = () => {
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
            selectIds.value = []
            search()
        } else {
            ElMessage.error(`删除失败:${result.message}`)
        }
    } catch (e) {
        ElMessage.info('已取消删除')
    }
}

// 提交表单（新增/编辑复用）
const submitForm = async () => {
    let result
    if (isEdit.value) {
        result = await updateStepApi(formData)
    } else {
        result = await addStepApi(formData)
    }

    if (result.code === 200) {
        ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
        dialogVisible.value = false
        resetForm()
        search()
    } else {
        ElMessage.error(`操作失败:${result.message}`)
    }
}

//清空表单
const resetForm = () => {
    formData.id = null
    formData.name = ''
    formData.equipmentId = null
    formData.functionId = null
    formData.description = ''
}

//查找设备功能
const getFunctionList = (equipmentId) => {
    const equipment = equipmentList.value.find(e => e.id === equipmentId)
    return equipment && equipment.description ? equipment.description : []
}

//设备改变时，清空功能选择
const onEquipmentChange = () => {
    formData.functionId = null
}
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
