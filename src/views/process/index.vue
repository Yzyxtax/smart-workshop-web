<template>
    <div class="page">
        <h1 class="page-title">工序管理</h1>
    </div>
    <!-- 搜索栏 -->
    <div class="search-area">
        <el-form :inline="true" :model="searchProcess" class="search-form">
            <el-form-item label="工序名称">
                <el-input v-model="searchProcess.processName" placeholder="请输入工序名称" clearable />
            </el-form-item>
            <el-form-item label="输入物料名称">
                <el-input v-model="searchProcess.inputBom" placeholder="请输入输入物料名称" clearable />
            </el-form-item>
            <el-form-item label="输出物料名称">
                <el-input v-model="searchProcess.outputBom" placeholder="请输入输出物料名称" clearable />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="search">查询</el-button>
                <el-button type="info" @click="clear">清空</el-button>
            </el-form-item>
        </el-form>
    </div>

    <!-- 操作按钮区 -->
    <div class="action-area">
        <el-button type="success" @click="handleAdd">新增工序</el-button>
        <el-button type="warning" @click="handleEdit">编辑工序</el-button>
        <el-button type="danger" @click="handleDelete">删除工序</el-button>
    </div>

    <!-- 结果展示区 -->
    <div class="result-area">
        <div v-for="process in processDataProcessed" :key="process.id" class="card-wrapper">
            <ProcessCard :process="{
                ...process,
                input: process.input,
                output: process.output,
                workStep: process.workStep
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
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑工序' : '新增工序'" width="820px" @close="resetForm">
        <el-form :model="formData" label-width="120px" class="process-form">
            <el-row :gutter="20">
                <el-col :xs="24" :sm="24" :md="14">
                    <div class="panel">
                        <div class="panel-title">基本信息</div>
                        <el-form-item label="工序名称">
                            <el-input v-model="formData.processName" placeholder="请输入工序名称" />
                        </el-form-item>
                        <el-form-item label="计划工时">
                            <el-input v-model="formData.plannedWorkingHours" placeholder="小时" />
                        </el-form-item>
                        <el-form-item label="包含工步">
                            <el-select v-model="formData.workStepId" multiple placeholder="请选择工步"
                                @change="onWorkStepChange">
                                <el-option v-for="item in stepStore.stepList" :key="item.id" :label="item.name"
                                    :value="item.id" />
                            </el-select>
                        </el-form-item>
                    </div>
                    <div class="panel mt">
                        <div class="panel-title">描述 / 质量检查点</div>
                        <el-form-item label="描述">
                            <el-input type="textarea" v-model="formData.description" :rows="4" placeholder="工序描述（可选）" />
                        </el-form-item>
                        <el-form-item label="质量检查点">
                            <el-input type="textarea" v-model="formData.qualityControlPoint" :rows="4"
                                placeholder="质量检查点（可选）" />
                        </el-form-item>
                    </div>
                </el-col>

                <el-col :xs="24" :sm="24" :md="10">
                    <div class="panel">
                        <div class="panel-title">物料选择</div>
                        <el-form-item label="输入物料">
                            <el-select v-model="formData.inputBomId" multiple placeholder="请选择输入物料"
                                @change="onInputChange">
                                <el-option v-for="item in bomStore.flattenedBomData" :key="item.id" :label="item.label"
                                    :value="item.id" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="输出物料">
                            <el-select v-model="formData.outputBomId" multiple placeholder="请选择输出物料"
                                @change="onOutputChange">
                                <el-option v-for="item in bomStore.flattenedBomData" :key="item.id" :label="item.label"
                                    :value="item.id" />
                            </el-select>
                        </el-form-item>
                    </div>

                    <div class="panel mt">
                        <div class="panel-title">操作</div>
                        <div class="dialog-actions">
                            <el-button @click="dialogVisible = false">取消</el-button>
                            <el-button type="primary" @click="submitForm">提交</el-button>
                        </div>
                    </div>
                </el-col>
            </el-row>

            <template #footer>
                <!-- 底部留空，操作按钮已放在右侧面板以增强 UX -->
            </template>
        </el-form>
    </el-dialog>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import {
    getProcessApi,
    addProcessApi,
    deleteProcessApi,
    updateProcessApi,
    getAllProcessApi
} from '@/api/process'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProcessCard from '@/components/process/ProcessCard.vue'
import { useStepStore } from '@/stores/step'
import { useBomStore } from '@/stores/bom'

// 引入工步和物料仓库
const stepStore = useStepStore()
const bomStore = useBomStore()
const { loadBomData } = bomStore
const { loadAllSteps } = stepStore

// 搜索条件绑定
const searchProcess = reactive({
    processName: '',
    inputBom: [],
    outputBom: []
})

// 搜索结果数据（原始从后端拿的数组）
const processData = ref([])

// 处理后的搜索数据（显示用）
const processDataProcessed = computed(() => {
    return (processData.value || []).map(process => {
        return {
            ...process,
            // 显示用：逗号分隔的名称
            input: (process.inputBomId || []).map(id => getBomNameById(bomStore.bomTreeData, id)).join(', '),
            output: (process.outputBomId || []).map(id => getBomNameById(bomStore.bomTreeData, id)).join(', '),
            workStep: (process.workStepId || []).map(id => getStepNameById(id)).join(', ')
        }
    })
})

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const background = ref(true)

// 选中项
const selectIds = ref([])

// 根据物料id获取物料名称
const getBomNameById = (tree, id) => {
    if (!tree || !Array.isArray(tree)) return '-';

    // 使用深度优先搜索
    const searchInTree = (nodes, targetId) => {
        for (const node of nodes) {
            if (node.id == targetId) {
                return node.label;
            }

            // 如果有子节点，递归搜索
            if (node.children && Array.isArray(node.children) && node.children.length > 0) {
                const result = searchInTree(node.children, targetId);
                if (result) return result;
            }
        }
        return null; // 没找到
    };

    const result = searchInTree(tree, id);
    return result || '-';
}

// 根据工步id获取工步名称
const getStepNameById = (id) => {
    const list = stepStore.stepList || []
    const target = list.find(step => step.id === id)
    return target ? target.name : '-'
}

// 根据物料名称获取所有匹配的物料ID（用于搜索）
const getBomIdsByName = (tree, name) => {
    const ids = [];
    if (!tree || !Array.isArray(tree)) return ids;

    const search = (nodes, searchName) => {
        for (const node of nodes) {
            if (node.label && node.label.includes(searchName)) {
                ids.push(node.id);
            }
            if (node.children?.length) {
                search(node.children, searchName);
            }
        }
    };

    search(tree, name);
    return ids;
};

// 搜索功能
const search = async () => {
    const inputBomId = getBomIdsByName(bomStore.bomTreeData, searchProcess.inputBom)
    const outputBomId = getBomIdsByName(bomStore.bomTreeData, searchProcess.outputBom)
    const result = await getProcessApi(
        searchProcess.processName,
        inputBomId,
        outputBomId,
        currentPage.value,
        pageSize.value
    )
    if (result && result.code === 200) {
        processData.value = result.data.rows
        total.value = result.data.total
    } else {
        ElMessage.error('搜索工序失败')
    }
}

// 清空搜索条件
const clear = () => {
    searchProcess.processName = ''
    searchProcess.inputBom = []
    searchProcess.outputBom = []
    search()
}

// 初始加载数据
onMounted(async () => {
    // 等待仓库数据加载完再搜索（如果仓库需要远端加载）
    try {
        if (loadBomData) await loadBomData()
        if (loadAllSteps) await loadAllSteps()
    } catch (e) {
        console.warn('load stores error', e)
    }
    search()
})

// 监听分页变化
const handleSizeChange = () => {
    selectIds.value = []
    currentPage.value = 1
    search()
}
const handleCurrentChange = () => {
    selectIds.value = []
    search()
}

// 处理选中项（来自子组件）
const onSelectChange = ({ id, checked }) => {
    if (checked) {
        if (!selectIds.value.includes(id)) {
            selectIds.value.push(id)
        }
    } else {
        selectIds.value = selectIds.value.filter(item => item !== id)
    }
}

// 控制弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = reactive({
    id: null,
    processName: '',
    plannedWorkingHours: null,
    description: '',
    qualityControlPoint: '',
    inputBomId: [], // 数组（multiple select）
    outputBomId: [], // 数组（multiple select）
    workStepId: [] // 数组（multiple select）
})

// 钩子：当 select 改变（占位，可做额外逻辑）
const onInputChange = (val) => {
    // val 为所选 id 数组
}
const onOutputChange = (val) => { }
const onWorkStepChange = (val) => { }

// 新增
const handleAdd = () => {
    isEdit.value = false
    resetForm()
    dialogVisible.value = true
}

// 编辑
const handleEdit = () => {
    if (selectIds.value.length < 1) {
        return ElMessage.warning('请选中一条记录进行编辑')
    } else if (selectIds.value.length > 1) {
        return ElMessage.warning('只能选择一条记录进行编辑')
    }
    const id = selectIds.value[0]
    // 从原始数据取回（包含 id 数组）
    const original = processData.value.find(item => item.id === id)
    if (original) {
        formData.id = original.id
        formData.processName = original.processName || ''
        formData.plannedWorkingHours = original.plannedWorkingHours || null
        formData.description = original.description || ''
        formData.qualityControlPoint = original.qualityControlPoint || ''
        formData.inputBomId = original.inputBomId ? [...original.inputBomId] : []
        formData.outputBomId = original.outputBomId ? [...original.outputBomId] : []
        formData.workStepId = original.workStepId ? [...original.workStepId] : []

        isEdit.value = true
        dialogVisible.value = true
    } else {
        ElMessage.error('未找到选中的工序数据')
    }
}

// 删除
const handleDelete = async () => {
    if (selectIds.value.length === 0) {
        return ElMessage.warning('请至少选中一条记录进行删除')
    }
    try {
        await ElMessageBox.confirm('确认删除选中的工序吗？', '提示', {
            type: 'warning'
        })
        const result = await deleteProcessApi(selectIds.value)
        if (result && result.code === 200) {
            ElMessage.success('删除成功')
            selectIds.value = []
            search()
        } else {
            ElMessage.error(`删除失败:${result && result.message ? result.message : '未知错误'}`)
        }
    } catch (e) {
        ElMessage.info('已取消删除')
    }
}

// 提交表单（新增/编辑复用）
const submitForm = async () => {
    // 提交前可以做必要的数据校验（此处简化）
    let payload = {
        id: formData.id,
        processName: formData.processName,
        plannedWorkingHours: formData.plannedWorkingHours,
        description: formData.description,
        qualityControlPoint: formData.qualityControlPoint,
        inputBomId: Array.isArray(formData.inputBomId) ? formData.inputBomId : formData.inputBomId ? [formData.inputBomId] : [],
        outputBomId: Array.isArray(formData.outputBomId) ? formData.outputBomId : formData.outputBomId ? [formData.outputBomId] : [],
        workStepId: Array.isArray(formData.workStepId) ? formData.workStepId : formData.workStepId ? [formData.workStepId] : []
    }

    let result
    console.log(payload);

    if (isEdit.value) {
        result = await updateProcessApi(payload)
    } else {
        result = await addProcessApi(payload)
    }

    if (result && result.code === 200) {
        ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
        dialogVisible.value = false
        resetForm()
        // 刷新数据（保持当前页）
        search()
    } else {
        ElMessage.error(`操作失败:${result && result.message ? result.message : '未知错误'}`)
    }
}

// 清空表单（恢复到初始状态）
const resetForm = () => {
    formData.id = null
    formData.processName = ''
    formData.plannedWorkingHours = null
    formData.description = ''
    formData.qualityControlPoint = ''
    formData.inputBomId = []
    formData.outputBomId = []
    formData.workStepId = []
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

/* 操作按钮区样式 */
.action-area {
    margin-bottom: 15px;
    display: flex;
    gap: 10px;
}

.process-form .el-form-item {
    margin-bottom: 12px;
}

.panel {
    background: #fff;
    border-radius: 8px;
    padding: 12px 14px;
    box-shadow: 0 1px 6px rgba(22, 27, 34, 0.06);
    border: 1px solid rgba(22, 27, 34, 0.04);
}

.panel-title {
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
    font-size: 14px;
}

.mt {
    margin-top: 12px;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 6px;
}

/* 响应式：较窄屏幕时面板垂直堆叠，dialog 变窄 */
@media (max-width: 768px) {
    .el-dialog {
        width: 92% !important;
    }

    .panel {
        padding: 10px;
    }
}
</style>
